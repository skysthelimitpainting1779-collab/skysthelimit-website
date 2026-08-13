#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const config = JSON.parse(
  readFileSync(resolve(root, '.agents/governance/development-lifecycle.json'), 'utf8')
);
const reconciliationPolicies = Array.isArray(config.remoteStartReconciliations)
  ? config.remoteStartReconciliations
  : [];
const remoteName = process.argv[2] || '';
const expectedRemoteRef = `refs/heads/${config.integrationBranch}`;
const zeroSha = '0'.repeat(40);
const input = readFileSync(0, 'utf8').trim();
const errors = [];

if (remoteName !== 'origin') {
  errors.push(`governed pushes must use origin, not ${remoteName || '<missing>'}`);
}
if (!input) {
  errors.push('pre-push did not receive any ref updates');
}

const head = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8',
  windowsHide: true,
}).trim();

for (const [index, line] of input.split(/\r?\n/).filter(Boolean).entries()) {
  const [localRef, localSha, remoteRef, remoteSha] = line.trim().split(/\s+/);
  if (!localRef || !localSha || !remoteRef || !remoteSha) {
    errors.push(`push update ${index + 1} is malformed`);
    continue;
  }
  if (remoteRef !== expectedRemoteRef) {
    errors.push(
      `push update ${index + 1} targets ${remoteRef}; use HEAD:${config.integrationBranch}`
    );
  }
  if (localSha === zeroSha) {
    errors.push(`push update ${index + 1} attempts to delete ${remoteRef}`);
    continue;
  }
  if (localSha !== head) {
    errors.push(`push update ${index + 1} is not the checked-out HEAD`);
  }
  let isFastForward = remoteSha === zeroSha;
  if (remoteSha !== zeroSha) {
    try {
      execFileSync('git', ['merge-base', '--is-ancestor', remoteSha, localSha], {
        cwd: root,
        env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
        stdio: 'ignore',
        windowsHide: true,
      });
      isFastForward = true;
    } catch {
      errors.push(`push update ${index + 1} is not a fast-forward`);
    }
  }
  for (const policy of reconciliationPolicies) {
    if (!/^[a-f0-9]{40}$/.test(policy?.mergeCommitSha || '')) continue;
    let reconciliationIsOutgoing = false;
    if (remoteSha === zeroSha) {
      try {
        execFileSync(
          'git',
          ['merge-base', '--is-ancestor', policy.mergeCommitSha, localSha],
          {
            cwd: root,
            env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
            stdio: 'ignore',
            windowsHide: true,
          }
        );
        reconciliationIsOutgoing = true;
      } catch {
        reconciliationIsOutgoing = false;
      }
    } else if (isFastForward) {
      const outgoing = execFileSync(
        'git',
        ['rev-list', `${remoteSha}..${localSha}`],
        {
          cwd: root,
          encoding: 'utf8',
          env: { ...process.env, GIT_NO_REPLACE_OBJECTS: '1' },
          windowsHide: true,
        }
      )
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
      reconciliationIsOutgoing = outgoing.includes(policy.mergeCommitSha);
    }
    if (
      reconciliationIsOutgoing &&
      (remoteSha !== policy.remoteStartSha || remoteRef !== policy.pushedRef)
    ) {
      errors.push(
        `push update ${index + 1} does not match the exact reconciliation remote tip and ref`
      );
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `[Push Target] ${error}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`[Push Target] OK: origin HEAD:${config.integrationBranch}`);
}
