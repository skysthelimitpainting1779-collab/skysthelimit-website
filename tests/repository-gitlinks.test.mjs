import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { test } from 'node:test';

test('repository contains no gitlink entries', () => {
  const index = execFileSync('git', ['ls-files', '--stage'], {
    encoding: 'utf8',
  });

  const gitlinks = index
    .split('\n')
    .filter((line) => line.startsWith('160000 '));

  assert.deepEqual(
    gitlinks,
    [],
    `Git submodule entries are not supported in this repository:\n${gitlinks.join('\n')}`,
  );
});
