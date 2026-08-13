import { execFileSync } from 'node:child_process';

function gitLines(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

export function changedFiles(root, base = 'origin/main') {
  const files = new Set([
    ...gitLines(root, ['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]),
    ...gitLines(root, ['diff', '--name-only', '--diff-filter=ACMR', '--cached']),
    ...gitLines(root, ['diff', '--name-only', '--diff-filter=ACMR']),
    ...gitLines(root, ['ls-files', '--others', '--exclude-standard']),
  ]);
  return [...files].sort((a, b) => a.localeCompare(b));
}
