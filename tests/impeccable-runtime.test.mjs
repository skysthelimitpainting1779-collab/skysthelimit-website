import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('../', import.meta.url);

function relativeFiles(directory, prefix = '') {
  return readdirSync(new URL(directory, root), { withFileTypes: true })
    .flatMap((entry) => {
      const relative = `${prefix}${entry.name}`;
      if (!entry.isDirectory()) return [relative];
      return relativeFiles(`${directory}${entry.name}/`, `${relative}/`);
    })
    .sort();
}

test('Codex and GitHub skill bundles expose the same Impeccable runtime', () => {
  const agentFiles = relativeFiles('.agents/skills/impeccable/scripts/');
  const githubFiles = relativeFiles('.github/skills/impeccable/scripts/');
  assert.deepEqual(agentFiles, githubFiles);
  for (const relative of agentFiles) {
    assert.equal(
      readFileSync(new URL(`../.agents/skills/impeccable/scripts/${relative}`, import.meta.url), 'utf8'),
      readFileSync(new URL(`../.github/skills/impeccable/scripts/${relative}`, import.meta.url), 'utf8'),
      `${relative} differs between skill bundles`,
    );
  }
});

test('the restored agent runtime libraries are included in governed commits', () => {
  const result = spawnSync(
    'git',
    [
      'check-ignore',
      '--quiet',
      '--',
      '.agents/skills/impeccable/scripts/lib/impeccable-paths.mjs',
    ],
    {
      cwd: fileURLToPath(root),
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 1, result.stderr);
});

test('Impeccable live target resolves without a missing local module', async () => {
  const { resolveLiveTarget } = await import(
    new URL('../.agents/skills/impeccable/scripts/live-target.mjs', import.meta.url)
  );

  assert.deepEqual(resolveLiveTarget(process.cwd(), []), {
    originalCwd: process.cwd(),
    projectRoot: process.cwd(),
    targetPath: null,
    absoluteTargetPath: null,
    targetOptions: {},
  });
});

test('Impeccable surface brief CLI loads its local runtime', () => {
  const script = fileURLToPath(
    new URL('../.agents/skills/impeccable/scripts/surface-brief.mjs', import.meta.url),
  );
  const projectRoot = mkdtempSync(join(tmpdir(), 'impeccable-runtime-'));
  try {
    const result = spawnSync(process.execPath, [script, 'list'], {
      cwd: projectRoot,
      encoding: 'utf8',
      timeout: 5_000,
    });

    assert.equal(result.status, 0, result.stderr);
    assert.doesNotThrow(() => JSON.parse(result.stdout));
  } finally {
    rmSync(projectRoot, { recursive: true, force: true });
  }
});
