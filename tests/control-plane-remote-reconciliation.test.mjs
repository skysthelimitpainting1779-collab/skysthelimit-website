import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

function runPython(source) {
  const result = spawnSync('python', ['-c', source], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.equal(
    result.status,
    0,
    `Python probe failed:\n${result.stdout}\n${result.stderr}`,
  );
}

test('governance trailers are parsed only from one canonical footer', () => {
  runPython(`
import sys
sys.path.insert(0, 'scripts/execution')
import verify_control_plane_state as verifier

body_only = verifier.trailers(
    'Example in prose:\\nExecution-Node: forged\\n\\nNot a trailer footer.'
)
assert body_only.get('Execution-Node') is None

canonical = verifier.trailers(
    'Subject\\n\\nBody\\n\\n'
    'Execution-Program: program\\n'
    'Execution-Node: node\\n'
    'Checkpoint-ID: checkpoint\\n'
    'Evidence-SHA256: ' + ('a' * 64)
)
assert canonical['Execution-Node'] == 'node'

duplicate = verifier.trailers(
    'Subject\\n\\n'
    'Execution-Node: first\\n'
    'Execution-Node: second'
)
assert duplicate['Execution-Node'] == ''
`);
});

test('remote reconciliation is bound to count, pushed ref, and evidence digest', () => {
  runPython(`
import hashlib
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, 'scripts/execution')
import verify_control_plane_state as verifier

reconciliation = {
    'commitSha': 'b' * 40,
    'fromGovernedHead': 'c' * 40,
    'ungovernedCommitCount': 1,
}
with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    receipt_directory = root / '.agents' / 'execution' / 'evidence'
    receipt_directory.mkdir(parents=True)
    receipt = {
        'remoteStartReconciliation': {
            **reconciliation,
            'pushedRef': 'refs/heads/integration',
        }
    }
    receipt_bytes = (json.dumps(receipt, sort_keys=True) + '\\n').encode()
    digest = hashlib.sha256(receipt_bytes).hexdigest()
    (receipt_directory / f'{digest}.json').write_bytes(receipt_bytes)
    evidence = [{'type': 'evidence_receipt', 'sha256': digest}]

    assert verifier.evidence_contains_remote_reconciliation(
        root, evidence, reconciliation, digest, 'refs/heads/integration'
    )
    assert not verifier.evidence_contains_remote_reconciliation(
        root,
        evidence,
        {**reconciliation, 'ungovernedCommitCount': 2},
        digest,
        'refs/heads/integration',
    )
    assert not verifier.evidence_contains_remote_reconciliation(
        root, evidence, reconciliation, 'e' * 64, 'refs/heads/integration'
    )
    assert not verifier.evidence_contains_remote_reconciliation(
        root, evidence, reconciliation, digest, 'refs/heads/other'
    )
`);
});

test('remote history search validates bounded completed-checkpoint authority', () => {
  runPython(`
import json
import sqlite3
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, 'scripts/execution')
import verify_control_plane_state as verifier

PROGRAM = 'program'
DIGEST = 'a' * 64

def git(root, *args):
    return subprocess.run(
        ['git', *args],
        cwd=root,
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()

def commit(root, subject, trailers=''):
    marker = root / 'marker.txt'
    marker.write_text(marker.read_text() + subject + '\\n' if marker.exists() else subject + '\\n')
    git(root, 'add', 'marker.txt')
    message = subject + ('\\n\\n' + trailers if trailers else '')
    git(root, 'commit', '-m', message)
    return git(root, 'rev-parse', 'HEAD')

def fixture(ungoverned_count, *, evidence_digest=DIGEST, completion=True):
    temp = tempfile.TemporaryDirectory()
    root = Path(temp.name)
    git(root, 'init')
    git(root, 'config', 'user.name', 'Verifier')
    git(root, 'config', 'user.email', 'verifier@example.invalid')
    checkpoint = 'checkpoint'
    node = 'node'
    footer = (
        f'Execution-Program: {PROGRAM}\\n'
        f'Execution-Node: {node}\\n'
        f'Checkpoint-ID: {checkpoint}\\n'
        f'Evidence-SHA256: {DIGEST}'
    )
    governed = commit(root, 'governed', footer)
    remote = governed
    for index in range(ungoverned_count):
        remote = commit(root, f'remote-{index}')

    con = sqlite3.connect(':memory:')
    con.row_factory = sqlite3.Row
    con.executescript('''
      CREATE TABLE lifecycle_events (
        event_sequence INTEGER PRIMARY KEY,
        program_id TEXT,
        checkpoint_id TEXT,
        node_id TEXT,
        stage_id TEXT,
        event_type TEXT,
        head_sha TEXT,
        tree_sha TEXT,
        payload_json TEXT
      );
      CREATE TABLE lifecycle_handoffs (
        handoff_id TEXT,
        program_id TEXT,
        checkpoint_id TEXT,
        node_id TEXT,
        stage_id TEXT,
        head_sha TEXT,
        next_node TEXT,
        next_stage TEXT,
        created_at TEXT
      );
    ''')
    if completion:
        con.execute(
            'INSERT INTO lifecycle_events VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            (
                1, PROGRAM, checkpoint, node, 'complete', 'checkpoint_completed',
                governed, git(root, 'rev-parse', governed + '^{tree}'),
                json.dumps({'evidence': [{'sha256': evidence_digest}]}),
            ),
        )
    con.execute(
        'INSERT INTO lifecycle_handoffs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        (
            'handoff', PROGRAM, checkpoint, node, 'complete', governed,
            'next-node', 'next-stage', '2026-07-29T00:00:00Z',
        ),
    )
    return temp, root, con, governed, remote

for distance in (0, 1, 8):
    temp, root, con, governed, remote = fixture(distance)
    handoff, reconciliation, error = verifier.resolve_remote_start_handoff(
        root, con, PROGRAM, remote, remote
    )
    assert error is None
    assert handoff['next_node'] == 'next-node'
    if distance == 0:
        assert reconciliation is None
    else:
        assert reconciliation == {
            'commitSha': remote,
            'fromGovernedHead': governed,
            'ungovernedCommitCount': distance,
        }
    con.close()
    temp.cleanup()

temp, root, con, _, remote = fixture(9)
assert verifier.resolve_remote_start_handoff(
    root, con, PROGRAM, remote, remote
)[2] == 'remote start has no bounded governed ancestor handoff'
con.close()
temp.cleanup()

temp, root, con, _, remote = fixture(0, completion=False)
assert verifier.resolve_remote_start_handoff(
    root, con, PROGRAM, remote, remote
)[2] == 'remote history contains a governed commit without an exact handoff'
con.close()
temp.cleanup()

temp, root, con, _, remote = fixture(0, evidence_digest='f' * 64)
assert verifier.resolve_remote_start_handoff(
    root, con, PROGRAM, remote, remote
)[2] == 'remote ancestor handoff lacks exact evidence authority'
con.close()
temp.cleanup()
`);
});
