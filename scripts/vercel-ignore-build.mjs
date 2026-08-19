#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

export const ALLOWED_VERCEL_PROJECT_IDS = new Set([
  'prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m',
  'prj_7kEe71sifWRNz7gGL4q2eYwsRibU',
]);

export function shouldIgnoreVercelBuild({ projectId, branch }) {
  const candidateProject = String(projectId || '').trim();
  const candidateBranch = String(branch || '').trim();

  if (candidateBranch.startsWith('entire/')) return true;
  if (!candidateProject) return false;
  return !ALLOWED_VERCEL_PROJECT_IDS.has(candidateProject);
}

function main() {
  const projectId = process.env.VERCEL_PROJECT_ID || '';
  const branch = process.env.VERCEL_GIT_COMMIT_REF || '';
  const ignored = shouldIgnoreVercelBuild({ projectId, branch });

  if (ignored) {
    console.log(
      `[vercel-ignore] skipping project=${projectId || '<missing>'} branch=${branch || '<missing>'}`
    );
    return 0;
  }
  console.log(
    `[vercel-ignore] proceeding project=${projectId || '<missing>'} branch=${branch || '<missing>'}`
  );
  return 1;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.exitCode = main();
}
