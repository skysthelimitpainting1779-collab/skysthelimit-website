import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const convexCli = fileURLToPath(
  new URL('../../node_modules/convex/bin/main.js', import.meta.url),
);

export function runConvexCli(args, options = {}) {
  return spawnSync(process.execPath, [convexCli, ...args], {
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
    ...options,
  });
}
