#!/usr/bin/env node
/**
 * Portable Workspace Root Resolver
 * Resolves repository top-level root across main checkout, Antigravity worktrees, and secondary worktrees.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';

export function getWorkspaceRoot() {
  try {
    const toplevel = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    return toplevel;
  } catch {
    return process.env.ANTIGRAVITY_WORKSPACE_ROOT || process.cwd();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1'))) {
  process.stdout.write(getWorkspaceRoot());
}
