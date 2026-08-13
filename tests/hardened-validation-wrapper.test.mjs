import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const python = process.env.PYTHON ?? 'python';
const agentWrapper = join(
  root,
  '.agents',
  'skills',
  'hardened-validation',
  'scripts',
  'run.py',
);
const githubWrapper = join(
  root,
  '.github',
  'skills',
  'hardened-validation',
  'scripts',
  'run.py',
);

const runWrapper = (args, options = {}) =>
  spawnSync(python, [agentWrapper, ...args], {
    cwd: root,
    encoding: 'utf8',
    timeout: 10_000,
    env: {
      ...process.env,
      HARDENED_TEST_TIMEOUT_SECONDS: '5',
    },
    ...options,
  });

const diagnostic = (result) =>
  [
    `status=${result.status}`,
    `signal=${result.signal ?? ''}`,
    `error=${result.error?.message ?? ''}`,
    `stdout=${result.stdout ?? ''}`,
    `stderr=${result.stderr ?? ''}`,
  ].join('\n');

test('hardened-validation skill bundles stay byte-for-byte identical', () => {
  assert.equal(readFileSync(agentWrapper, 'utf8'), readFileSync(githubWrapper, 'utf8'));
});

test('wrapper preserves separate arguments without shell reinterpretation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'hardened-validation-argv-'));
  const helper = join(directory, 'capture_args.py');
  const output = join(directory, 'args.json');
  const expected = ['plain', '&', '|', '^', '%PATH%', 'two words', '"quoted"'];

  writeFileSync(
    helper,
    [
      'import json',
      'import pathlib',
      'import sys',
      'pathlib.Path(sys.argv[1]).write_text(json.dumps(sys.argv[2:]), encoding="utf-8")',
      '',
    ].join('\n'),
  );

  try {
    const result = runWrapper([python, helper, output, ...expected]);

    assert.equal(result.status, 0, diagnostic(result));
    assert.ok(existsSync(output), diagnostic(result));
    assert.deepEqual(JSON.parse(readFileSync(output, 'utf8')), expected);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('wrapper resolves a bare package-manager executable without a shell', () => {
  const result = runWrapper(['npm', '--version'], {
    timeout: 30_000,
    env: {
      ...process.env,
      HARDENED_TEST_TIMEOUT_SECONDS: '20',
    },
  });

  assert.equal(result.status, 0, diagnostic(result));
  assert.match(result.stdout, /^\d+\.\d+\.\d+\s*$/);
});

test('wrapper terminates descendants after the command leader exits', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'hardened-validation-tree-'));
  const descendant = join(directory, 'descendant.py');
  const leader = join(directory, 'leader.py');
  const marker = join(directory, 'descendant-survived.txt');

  writeFileSync(
    descendant,
    [
      'import pathlib',
      'import sys',
      'import time',
      'time.sleep(1.5)',
      'pathlib.Path(sys.argv[1]).write_text("survived", encoding="utf-8")',
      '',
    ].join('\n'),
  );
  writeFileSync(
    leader,
    [
      'import subprocess',
      'import sys',
      'import time',
      'subprocess.Popen(',
      '    [sys.executable, sys.argv[1], sys.argv[2]],',
      '    stdout=subprocess.DEVNULL,',
      '    stderr=subprocess.DEVNULL,',
      ')',
      'time.sleep(0.25)',
      '',
    ].join('\n'),
  );

  try {
    const result = runWrapper([python, leader, descendant, marker]);

    assert.equal(result.status, 0, diagnostic(result));
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    assert.equal(
      existsSync(marker),
      false,
      'background descendant outlived the hardened-validation wrapper',
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
