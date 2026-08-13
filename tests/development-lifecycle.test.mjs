import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  findForbiddenPaths,
  resolveDeploymentCommit,
  validateCheckpointEnvelope,
  validateEvidenceReceipt,
  validateGovernedCommit,
} from '../scripts/lib/development-lifecycle.mjs';
import { canonicalSha256 } from '../scripts/lib/canonical-text.mjs';
import {
  collectCommitPaths,
  validateRemoteMergeReconciliation,
} from '../scripts/verify-development-lifecycle.mjs';

const governedMessage = `fix(ci): enforce lifecycle contract

Execution-Program: stl-post-g20-sequential-tdd-v1
Execution-Node: AUDIT-REPOSITORY-HYGIENE
Checkpoint-ID: cp-20260728-001
Evidence-SHA256: ${'a'.repeat(64)}
`;

const rootUrl = new URL('../', import.meta.url);

test('governed commits require conventional subjects and lifecycle trailers', () => {
  assert.deepEqual(validateGovernedCommit(governedMessage), []);
  assert.deepEqual(validateGovernedCommit('updated lifecycle'), [
    'subject must follow Conventional Commits',
    'missing Execution-Program trailer',
    'missing Execution-Node trailer',
    'missing Checkpoint-ID trailer',
    'missing or invalid Evidence-SHA256 trailer',
  ]);
});

test('runtime databases, logs, and generated graphs cannot enter governed commits', () => {
  assert.deepEqual(
    findForbiddenPaths([
      'src/app/page.tsx',
      'dev/graphify.db',
      'graphify-out/graph.json',
      '.agents/checkpoints/runtime.json',
      'output/build.log',
    ]),
    [
      '.agents/checkpoints/runtime.json',
      'dev/graphify.db',
      'graphify-out/graph.json',
      'output/build.log',
    ]
  );
});

test('checkpoint envelopes bind execution state to exact Git and evidence hashes', () => {
  assert.deepEqual(
    validateCheckpointEnvelope({
      checkpointId: 'cp-20260728-001',
      programId: 'stl-post-g20-sequential-tdd-v1',
      nodeId: 'AUDIT-REPOSITORY-HYGIENE',
      stageId: 'stage:AUDIT-REPOSITORY-HYGIENE:verify_green',
      repository: 'owner/repo',
      branch: 'agent/development-lifecycle',
      headSha: 'a'.repeat(40),
      treeSha: 'b'.repeat(40),
      evidenceSha256: 'c'.repeat(64),
      clean: true,
      nextNode: 'G26-AUDIT-REMEDIATION-READY',
      nextStage: 'stage:G26-AUDIT-REMEDIATION-READY:collect_evidence',
    }),
    []
  );

  assert.deepEqual(
    validateCheckpointEnvelope({
      checkpointId: 'cp-bad',
      headSha: 'short',
      treeSha: '',
      evidenceSha256: 'bad',
      clean: false,
    }),
    [
      'programId is required',
      'nodeId is required',
      'stageId is required',
      'repository is required',
      'branch is required',
      'headSha must be a 40-character Git SHA',
      'treeSha must be a 40-character Git SHA',
      'evidenceSha256 must be a 64-character SHA-256',
      'checkpoint requires a clean worktree',
      'nextNode is required',
      'nextStage is required',
    ]
  );
});

test('commit evidence is bound to the configured program, audited node, and verification', () => {
  const receiptSha256 = 'd'.repeat(64);
  assert.deepEqual(
    validateEvidenceReceipt({
      message: governedMessage.replace('a'.repeat(64), receiptSha256),
      config: {
        programId: 'stl-post-g20-sequential-tdd-v1',
        executionGraph: { sha256: 'e'.repeat(64) },
      },
      nodeIds: new Set(['AUDIT-REPOSITORY-HYGIENE']),
      receiptSha256,
      receipt: {
        schemaVersion: 1,
        programId: 'stl-post-g20-sequential-tdd-v1',
        nodeId: 'AUDIT-REPOSITORY-HYGIENE',
        checkpointId: 'cp-20260728-001',
        graphSha256: 'e'.repeat(64),
        baseHeadSha: 'f'.repeat(40),
        verification: [{ command: 'npm test', status: 'passed' }],
        reviews: [{ reviewer: 'independent-reviewer', status: 'approved' }],
      },
    }),
    []
  );
});

test('independent approval comes from GitHub at the exact head, not receipt claims', async () => {
  const { approvedReviewers } = await import(
    new URL('../scripts/verify-pr-review.mjs', import.meta.url)
  );
  const headSha = 'a'.repeat(40);
  const reviews = [
    {
      id: 1,
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-07-28T20:00:00Z',
      author_association: 'MEMBER',
      user: { login: 'independent-reviewer' },
    },
    {
      id: 2,
      state: 'APPROVED',
      commit_id: headSha,
      submitted_at: '2026-07-28T20:01:00Z',
      author_association: 'OWNER',
      user: { login: 'commit-author' },
    },
    {
      id: 3,
      state: 'APPROVED',
      commit_id: 'b'.repeat(40),
      submitted_at: '2026-07-28T20:02:00Z',
      author_association: 'MEMBER',
      user: { login: 'stale-reviewer' },
    },
  ];
  assert.deepEqual(
    approvedReviewers(reviews, { headSha, author: 'commit-author' }),
    ['independent-reviewer']
  );
});

test('deployment verification resolves the deployed commit instead of default branch HEAD', () => {
  assert.equal(
    resolveDeploymentCommit({
      eventName: 'repository_dispatch',
      clientPayload: { git: { sha: 'a'.repeat(40) } },
    }),
    'a'.repeat(40)
  );
  assert.equal(
    resolveDeploymentCommit({
      eventName: 'deployment_status',
      deployment: { sha: 'b'.repeat(40) },
    }),
    'b'.repeat(40)
  );
  assert.equal(
    resolveDeploymentCommit({
      eventName: 'workflow_dispatch',
      githubSha: 'c'.repeat(40),
    }),
    null
  );
  assert.equal(
    resolveDeploymentCommit({
      eventName: 'deployment_status',
      deployment: {},
    }),
    null
  );
});

test('repository pins one audited execution graph as lifecycle authority', () => {
  const config = JSON.parse(
    readFileSync(new URL('.agents/governance/development-lifecycle.json', rootUrl), 'utf8')
  );
  const graph = readFileSync(new URL(config.executionGraph.path, rootUrl));
  const digest = createHash('sha256').update(graph).digest('hex');

  assert.equal(config.version, 1);
  assert.equal(config.programId, 'stl-post-g20-sequential-tdd-v1');
  assert.equal(
    config.enforceAfter,
    '5eb385d33976503cdac81e982ed74fbbc7f6839c'
  );
  assert.equal(digest, config.executionGraph.sha256);
  assert.equal(config.executionGraph.authoritative, true);
  assert.equal(config.integrationBranch, 'agent/skys-limit-convex-os');
  assert.equal(config.evidenceReceipts.directory, '.agents/execution/evidence');
  assert.deepEqual(config.remoteStartReconciliations, [
    {
      mergeCommitSha: '1693afff2c3e44f08baa5debf87ba81238227cc2',
      mergeTreeSha: 'ac5be24f851515642249b8f210250e9098471b0f',
      evidenceSha256:
        'f02ef467a4f161e62e9b5fb1a70735612b5bc6d58bba85018367c2e38e890bf1',
      firstParentSha: '82b182d9d4bc2f75b213ff4eee6c9cbb3f4ac08a',
      remoteStartSha: '9c10da6e5d15151a6fb4367f004d268c6245d71d',
      mergeBaseSha: 'fb4a8f154b32a3337be444159c80c9183eeb4f9c',
      pushedRef: 'refs/heads/agent/skys-limit-convex-os',
      ungovernedCommitCount: 1,
    },
  ]);
  assert.doesNotMatch(graph.toString('utf8'), /\/mnt\/data\//);
  const validation = readFileSync(
    new URL(config.executionGraph.validationPath, rootUrl),
    'utf8'
  );
  assert.doesNotMatch(validation, /\/mnt\/data\//);
  const manifest = JSON.parse(
    readFileSync(new URL(config.executionGraph.manifestPath, rootUrl), 'utf8')
  );
  const retainedBundle = readFileSync(
    new URL(manifest.retainedSourceBundle.path, rootUrl)
  );
  assert.equal(
    createHash('sha256').update(retainedBundle).digest('hex'),
    manifest.retainedSourceBundle.sha256
  );
});

test('text contract hashes are stable across Git checkout line endings', () => {
  assert.equal(canonicalSha256('one\ntwo\n'), canonicalSha256('one\r\ntwo\r\n'));
});

test('agent tooling discovers the shared control plane without tracked machine paths', () => {
  for (const relativePath of [
    '.agents/mcp_config.json',
    '.agents/sidecars.json',
    '.codex/config.toml',
    'docs/DEVELOPMENT_LIFECYCLE.md',
    '.husky/post-commit',
  ]) {
    const content = readFileSync(new URL(relativePath, rootUrl), 'utf8');
    assert.doesNotMatch(content, /[A-Za-z]:[\\/]Users[\\/]/);
  }

  const launcher = new URL(
    'scripts/execution/start_agentgraph_mcp.py',
    rootUrl,
  );
  const fixture = mkdtempSync(join(tmpdir(), 'sky-dev-control-plane-'));
  const controlPlane = join(fixture, 'dev');
  const server = join(controlPlane, 'mcp_server.py');
  mkdirSync(controlPlane);
  writeFileSync(server, '# control-plane fixture\n');
  for (const filename of [
    'sync-graphify-db.ps1',
    'graphify_sqlite.py',
    'execution_graph_sqlite.py',
  ]) {
    writeFileSync(join(controlPlane, filename), '');
  }
  try {
    const result = spawnSync(
      'python',
      [fileURLToPath(launcher), '--print-path'],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          SKY_DEV_CONTROL_PLANE: fixture,
        },
      },
    );
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(result.stdout.trim()), true);
    assert.equal(readFileSync(result.stdout.trim(), 'utf8'), '# control-plane fixture\n');

    const nestedWorktree = join(fixture, 'worktrees', 'app');
    mkdirSync(nestedWorktree, { recursive: true });
    const discoveryEnv = { ...process.env };
    delete discoveryEnv.SKY_DEV_CONTROL_PLANE;
    const discovered = spawnSync(
      'python',
      [fileURLToPath(launcher), '--print-path'],
      {
        cwd: nestedWorktree,
        encoding: 'utf8',
        env: discoveryEnv,
      },
    );
    assert.equal(discovered.status, 0, discovered.stderr);
    assert.equal(
      readFileSync(discovered.stdout.trim(), 'utf8'),
      '# control-plane fixture\n'
    );

    rmSync(join(controlPlane, 'execution_graph_sqlite.py'));
    const incomplete = spawnSync(
      'python',
      [fileURLToPath(launcher), '--print-path'],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          SKY_DEV_CONTROL_PLANE: fixture,
        },
      },
    );
    assert.notEqual(incomplete.status, 0);
    assert.match(
      incomplete.stderr,
      /SKY_DEV_CONTROL_PLANE is not a control-plane workspace/
    );
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }

  const launcherText = readFileSync(launcher, 'utf8');
  assert.match(launcherText, /AGENTGRAPH_SOURCE_ROOT/);
  const syncText = readFileSync(
    new URL('scripts/execution/sync_graphify_control_plane.py', rootUrl),
    'utf8'
  );
  assert.match(syncText, /graphify_sqlite_script/);
  assert.match(syncText, /execution_sqlite_script/);
  assert.match(syncText, /"import"/);
  assert.doesNotMatch(syncText, /sync-graphify-db\.ps1/);
});

test('pre-push accepts only the exact integration ref and gates SQLite state', () => {
  const root = fileURLToPath(rootUrl);
  const reconciliationRemote =
    '9c10da6e5d15151a6fb4367f004d268c6245d71d';
  const head = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).stdout.trim();
  const verifier = fileURLToPath(new URL('scripts/verify-push-target.mjs', rootUrl));
  const accepted = spawnSync(
    'node',
    [verifier, 'origin'],
    {
      cwd: root,
      encoding: 'utf8',
      input: `HEAD ${head} refs/heads/agent/skys-limit-convex-os ${reconciliationRemote}\n`,
    }
  );
  assert.equal(accepted.status, 0, accepted.stderr);

  const rejected = spawnSync(
    'node',
    [verifier, 'origin'],
    {
      cwd: root,
      encoding: 'utf8',
      input: `refs/heads/agent/audit-security-remediation ${head} refs/heads/agent/audit-security-remediation ${'0'.repeat(40)}\n`,
    }
  );
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /HEAD:agent\/skys-limit-convex-os/);

  const deletion = spawnSync(
    'node',
    [verifier, 'origin'],
    {
      cwd: root,
      encoding: 'utf8',
      input: `delete ${'0'.repeat(40)} refs/heads/main ${head}\n`,
    }
  );
  assert.equal(deletion.status, 1);
  assert.match(deletion.stderr, /attempts to delete/);

  const nonFastForward = spawnSync(
    'node',
    [verifier, 'origin'],
    {
      cwd: root,
      encoding: 'utf8',
      input: `HEAD ${head} refs/heads/agent/skys-limit-convex-os ${'f'.repeat(40)}\n`,
    }
  );
  assert.equal(nonFastForward.status, 1);
  assert.match(nonFastForward.stderr, /not a fast-forward/);

  const exactReconciliation = spawnSync(
    'node',
    [verifier, 'origin'],
    {
      cwd: root,
      encoding: 'utf8',
      input: `HEAD ${head} refs/heads/agent/skys-limit-convex-os ${reconciliationRemote}\n`,
    }
  );
  assert.equal(exactReconciliation.status, 0, exactReconciliation.stderr);

  const wrongReconciliationRemote = spawnSync(
    'node',
    [verifier, 'origin'],
    {
      cwd: root,
      encoding: 'utf8',
      input: `HEAD ${head} refs/heads/agent/skys-limit-convex-os fb4a8f154b32a3337be444159c80c9183eeb4f9c\n`,
    }
  );
  assert.equal(wrongReconciliationRemote.status, 1);
  assert.match(
    wrongReconciliationRemote.stderr,
    /exact reconciliation remote tip and ref/
  );

  const hook = readFileSync(new URL('.husky/pre-push', rootUrl), 'utf8');
  assert.match(hook, /verify-push-target\.mjs/);
  assert.match(hook, /lifecycle:verify -- --require-clean/);
  assert.match(hook, /verify_control_plane_state\.py/);
});

test('Graphify hooks bootstrap fresh worktrees and pre-push enforces freshness', () => {
  const checkoutHook = readFileSync(new URL('.husky/post-checkout', rootUrl), 'utf8');
  const commitHook = readFileSync(new URL('.husky/post-commit', rootUrl), 'utf8');
  const refresher = readFileSync(
    new URL('scripts/execution/refresh_graphify.py', rootUrl),
    'utf8'
  );
  const stateGate = readFileSync(
    new URL('scripts/execution/verify_control_plane_state.py', rootUrl),
    'utf8'
  );

  assert.doesNotMatch(checkoutHook, /Only run if graphify-out/);
  assert.match(checkoutHook, /refresh_graphify\.py/);
  assert.match(commitHook, /refresh_graphify\.py/);
  assert.match(checkoutHook, /Path\.home\(\)/);
  assert.match(commitHook, /Path\.home\(\)/);
  assert.doesNotMatch(checkoutHook, /r'\$_GRAPHIFY_LOG'/);
  assert.doesNotMatch(commitHook, /r'\$_GRAPHIFY_LOG'/);
  assert.match(refresher, /if graph_path\.is_file\(\):/);
  assert.match(refresher, /sync_graphify_control_plane\.py/);
  assert.match(stateGate, /Graphify output was not built at HEAD/);
  assert.match(stateGate, /SQLite has no Graphify import for this worktree at HEAD/);
  assert.match(stateGate, /execution_graph_imports/);
  assert.match(stateGate, /SQLite execution authority digest does not match the governed graph/);
  assert.match(stateGate, /checkpoint does not continue the execution cursor/);
  assert.match(stateGate, /requires exactly one exact-head handoff/);
  assert.match(stateGate, /execution_dependencies/);
  assert.match(stateGate, /source terminal stage/);
  assert.match(stateGate, /next sequential rank/);
  assert.match(stateGate, /handoff destination dependency is incomplete/);
  assert.doesNotMatch(stateGate, /if node_id not in dependencies/);
  assert.match(stateGate, /historical_complete_do_not_replay/);
  assert.match(stateGate, /checkpoint stage span is missing required edge/);
});

test('pre-push stops independently on lifecycle and SQLite gate failures', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'sky-pre-push-gates-'));
  const bin = join(fixture, 'bin');
  const log = join(fixture, 'calls.log');
  mkdirSync(bin);
  const shim = (name, body) => {
    const path = join(bin, name);
    writeFileSync(path, `#!/bin/sh\n${body}\n`);
    chmodSync(path, 0o755);
  };
  shim('node', `printf 'node\\n' >> "$MOCK_GATE_LOG"; exit 0`);
  shim(
    'npm',
    `printf 'npm\\n' >> "$MOCK_GATE_LOG"; exit "\${MOCK_NPM_STATUS:-0}"`
  );
  shim(
    'python',
    `printf 'python\\n' >> "$MOCK_GATE_LOG"; exit "\${MOCK_PYTHON_STATUS:-0}"`
  );
  shim('entire', `printf 'entire\\n' >> "$MOCK_GATE_LOG"; exit 0`);
  const hook = fileURLToPath(new URL('.husky/pre-push', rootUrl));
  const input = `HEAD ${'a'.repeat(40)} refs/heads/agent/skys-limit-convex-os ${'b'.repeat(40)}\n`;
  const runHook = ({ npmStatus, pythonStatus }) =>
    spawnSync('sh', [hook, 'origin'], {
      cwd: fileURLToPath(rootUrl),
      encoding: 'utf8',
      input,
      env: {
        ...process.env,
        PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}`,
        MOCK_GATE_LOG: log,
        MOCK_NPM_STATUS: String(npmStatus),
        MOCK_PYTHON_STATUS: String(pythonStatus),
      },
    });

  try {
    let result = runHook({ npmStatus: 7, pythonStatus: 0 });
    assert.equal(result.status, 7, result.stderr);
    assert.equal(readFileSync(log, 'utf8'), 'node\nnpm\n');

    writeFileSync(log, '');
    result = runHook({ npmStatus: 0, pythonStatus: 9 });
    assert.equal(result.status, 9, result.stderr);
    assert.equal(readFileSync(log, 'utf8'), 'node\nnpm\npython\n');

    writeFileSync(log, '');
    result = runHook({ npmStatus: 0, pythonStatus: 0 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(log, 'utf8'), 'node\nnpm\npython\nentire\n');
  } finally {
    rmSync(fixture, { force: true, recursive: true });
  }
});

test('per-commit path inspection catches a transient forbidden file', () => {
  const outputs = new Map([
    ['commit-add', 'dev/graphify.db\nsrc/app/page.tsx'],
    ['commit-remove', 'dev/graphify.db'],
  ]);
  const paths = collectCommitPaths(
    [...outputs.keys()],
    (args) => outputs.get(args.at(-2))
  );
  assert.deepEqual(findForbiddenPaths(paths), ['dev/graphify.db']);
});

test('the lifecycle gate permits only an exact bounded reconciled remote merge', () => {
  const baseline = 'a'.repeat(40);
  const governedHead = 'b'.repeat(40);
  const localParent = 'c'.repeat(40);
  const remoteStart = 'd'.repeat(40);
  const merge = 'e'.repeat(40);
  const config = {
    enforceAfter: baseline,
    integrationBranch: 'agent/integration',
    remoteStartReconciliations: [
      {
        mergeCommitSha: merge,
        mergeTreeSha: 'f'.repeat(40),
        evidenceSha256: '1'.repeat(64),
        firstParentSha: localParent,
        remoteStartSha: remoteStart,
        mergeBaseSha: governedHead,
        pushedRef: 'refs/heads/agent/integration',
        ungovernedCommitCount: 1,
      },
    ],
  };
  const receipt = {
    baseHeadSha: localParent,
    remoteStartReconciliation: {
      commitSha: remoteStart,
      fromGovernedHead: governedHead,
      pushedRef: 'refs/heads/agent/integration',
      ungovernedCommitCount: 1,
    },
  };
  const ancestorPairs = new Set([
    `${baseline}:${governedHead}`,
    `${governedHead}:${localParent}`,
    `${governedHead}:${remoteStart}`,
  ]);
  const gitRun = (args) => {
    if (args[0] === 'merge-base') {
      if (args.length === 3) return governedHead;
      if (!ancestorPairs.has(`${args[2]}:${args[3]}`)) throw new Error('not ancestor');
      return '';
    }
    if (args[0] === 'rev-list') return remoteStart;
    if (args[0] === 'show' && args.includes('--format=%T')) return 'f'.repeat(40);
    if (args[0] === 'show' && args.at(-1) === remoteStart) return governedHead;
    throw new Error(`unexpected git probe: ${args.join(' ')}`);
  };

  assert.deepEqual(
    validateRemoteMergeReconciliation({
      commit: merge,
      parents: [localParent, remoteStart],
      receipt,
      receiptSha256: '1'.repeat(64),
      config,
      gitRun,
    }),
    { errors: [], reconciledCommits: [remoteStart] }
  );

  for (const invalidReceipt of [
    null,
    {
      remoteStartReconciliation: {
        ...receipt.remoteStartReconciliation,
        pushedRef: 'refs/heads/main',
      },
    },
    {
      remoteStartReconciliation: {
        ...receipt.remoteStartReconciliation,
        ungovernedCommitCount: 9,
      },
    },
    {
      ...receipt,
      baseHeadSha: '2'.repeat(40),
    },
    {
      remoteStartReconciliation: receipt.remoteStartReconciliation,
    },
  ]) {
    assert.notEqual(
      validateRemoteMergeReconciliation({
        commit: merge,
        parents: [localParent, remoteStart],
        receipt: invalidReceipt,
        receiptSha256: '1'.repeat(64),
        config,
        gitRun,
      }).errors.length,
      0
    );
  }

  assert.notEqual(
    validateRemoteMergeReconciliation({
      commit: merge,
      parents: [remoteStart, localParent],
      receipt,
      receiptSha256: '1'.repeat(64),
      config,
      gitRun,
    }).errors.length,
    0
  );

  for (const mutation of [
    { receiptSha256: '2'.repeat(64) },
    {
      config: {
        ...config,
        remoteStartReconciliations: [
          {
            ...config.remoteStartReconciliations[0],
            mergeTreeSha: '2'.repeat(40),
          },
        ],
      },
    },
    { commit: '2'.repeat(40) },
    {
      commit: merge.slice(0, 12),
      config: {
        ...config,
        remoteStartReconciliations: [
          {
            ...config.remoteStartReconciliations[0],
            mergeCommitSha: merge.slice(0, 12),
          },
        ],
      },
    },
  ]) {
    assert.notEqual(
      validateRemoteMergeReconciliation({
        commit: merge,
        parents: [localParent, remoteStart],
        receipt,
        receiptSha256: '1'.repeat(64),
        config,
        gitRun,
        ...mutation,
      }).errors.length,
      0
    );
  }

  const sideCommit = '3'.repeat(40);
  const sideHistoryGit = (args) => {
    if (args[0] === 'rev-list' && !args.includes('--first-parent')) {
      return `${remoteStart}\n${sideCommit}`;
    }
    return gitRun(args);
  };
  assert.match(
    validateRemoteMergeReconciliation({
      commit: merge,
      parents: [localParent, remoteStart],
      receipt,
      receiptSha256: '1'.repeat(64),
      config,
      gitRun: sideHistoryGit,
    }).errors.join('\n'),
    /side history/
  );

  const nestedMergeGit = (args) => {
    if (
      args[0] === 'show' &&
      args.includes('--format=%P') &&
      args.at(-1) === remoteStart
    ) {
      return `${governedHead} ${sideCommit}`;
    }
    return gitRun(args);
  };
  assert.match(
    validateRemoteMergeReconciliation({
      commit: merge,
      parents: [localParent, remoteStart],
      receipt,
      receiptSha256: '1'.repeat(64),
      config,
      gitRun: nestedMergeGit,
    }).errors.join('\n'),
    /contains a merge commit/
  );

  const wrongBaseGit = (args) => {
    if (args[0] === 'merge-base' && args.length === 3) {
      return '4'.repeat(40);
    }
    return gitRun(args);
  };
  assert.match(
    validateRemoteMergeReconciliation({
      commit: merge,
      parents: [localParent, remoteStart],
      receipt,
      receiptSha256: '1'.repeat(64),
      config,
      gitRun: wrongBaseGit,
    }).errors.join('\n'),
    /exact merge base/
  );
});

test('the exact committed reconciliation passes against real Git topology', () => {
  const result = spawnSync(
    'node',
    [
      fileURLToPath(
        new URL('scripts/verify-development-lifecycle.mjs', rootUrl)
      ),
      '--head',
      '1693afff2c3e44f08baa5debf87ba81238227cc2',
      '--json',
    ],
    {
      cwd: fileURLToPath(rootUrl),
      encoding: 'utf8',
    }
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const report = JSON.parse(result.stdout);
  assert.equal(report.ok, true);
  assert.equal(report.reconciliationsChecked, 1);
  assert.equal(report.reconciledCommitsChecked, 1);
});
