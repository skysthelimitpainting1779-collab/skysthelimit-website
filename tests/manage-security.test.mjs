import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const root = process.cwd();
const read = (relativePath) => readFileSync(join(root, relativePath), 'utf8');

test('legacy management route is retired rather than rendering browser-side owner initialization', () => {
  const managePage = 'src/app/manage/page.tsx';
  assert.ok(existsSync(managePage), 'manage route must have an explicit retired-route implementation');

  const source = read(managePage);
  assert.doesNotMatch(source, /supabase\.auth\.signUp/, 'owner initialization must never be available in browser code');
  assert.doesNotMatch(source, /Init Owner/, 'legacy owner-bootstrap UI must not be rendered');
  assert.match(source, /redirect\(['"]\/contact['"]\)/, 'retired route must redirect to a safe public destination');
});

test('proxy intercepts every legacy management path before application rendering', () => {
  const source = read('src/proxy.ts');
  assert.match(source, /isRetiredManagePath\(pathname\)/, 'proxy must enforce legacy management retirement server-side');
  assert.match(source, /['"]\/manage['"]/, 'proxy matcher must include the legacy management root path');
  assert.match(source, /['"]\/manage\/:path\*['"]/, 'proxy matcher must include legacy management subpaths');
});

test('production integrations do not use predictable secret or endpoint fallback values', () => {
  const payloadConfig = read('src/payload.config.ts');
  const supabaseClient = read('src/lib/supabase/client.ts');
  const supabaseServer = read('src/lib/supabase/server.ts');

  assert.doesNotMatch(payloadConfig, /CHANGE_ME_IN_ENV|payload_placeholder/, 'Payload must require real secret and database configuration');
  assert.doesNotMatch(supabaseClient, /dummy\.supabase\.co|['"]dummy['"]/, 'browser Supabase client must not silently target a dummy endpoint');
  assert.doesNotMatch(supabaseServer, /dummy\.supabase\.co|['"]dummy['"]/, 'server Supabase client must not silently target a dummy endpoint');
});
