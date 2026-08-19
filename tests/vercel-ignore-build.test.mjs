import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ALLOWED_VERCEL_PROJECT_IDS,
  shouldIgnoreVercelBuild,
} from '../scripts/vercel-ignore-build.mjs';

test('allows builds only for approved Vercel projects', () => {
  for (const projectId of ALLOWED_VERCEL_PROJECT_IDS) {
    assert.equal(
      shouldIgnoreVercelBuild({ projectId, branch: 'fix/p0-legacy-manage-containment-clean' }),
      false,
      `${projectId} must be permitted to build`
    );
  }

  assert.equal(
    shouldIgnoreVercelBuild({ projectId: 'prj_untrusted', branch: 'fix/p0-legacy-manage-containment-clean' }),
    true,
    'unapproved projects must stay ignored'
  );
});

test('always ignores entire-agent branches', () => {
  assert.equal(
    shouldIgnoreVercelBuild({
      projectId: [...ALLOWED_VERCEL_PROJECT_IDS][0],
      branch: 'entire/agent-generated-work',
    }),
    true
  );
});
