import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('manage is a Convex-only staff foundation with current-session MFA authorization', async () => {
  const [manage, crm, authz] = await Promise.all([
    readFile(new URL('../src/app/(protected)/manage/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../convex/crm.ts', import.meta.url), 'utf8'),
    readFile(new URL('../convex/lib/authz.ts', import.meta.url), 'utf8'),
  ]);

  assert.doesNotMatch(manage, /supabase/i);
  assert.match(manage, /useQuery\(api\.crm\.staffOverview\)/);
  assert.match(crm, /export const staffOverview = query/);
  assert.match(crm, /requireActiveUser\(ctx\)/);
  assert.match(crm, /requireCompanyMembership\(ctx/);
  assert.match(crm, /roles:\s*\[['"]staff['"], ['"]admin['"]\]/);
  assert.match(authz, /requireCurrentSessionMfa\(identity/);
  assert.match(authz, /identity\?\.fva\?\.\[1\]/);
});
