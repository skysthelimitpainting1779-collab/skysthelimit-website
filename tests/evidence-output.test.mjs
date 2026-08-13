import assert from 'node:assert/strict';
import test from 'node:test';

import {
  redactEvidenceOutput,
  sensitiveEnvironmentValues,
} from '../scripts/lib/evidence-output.mjs';

test('evidence output redacts workspace and home paths across separator styles', () => {
  const value = [
    'C:\\Users\\Developer Name\\DEV\\repo\\public\\sitemap.xml',
    'c:/users/developer name/dev/repo/research.md',
    'C:\\Users\\Developer Name\\.npm\\_logs\\debug.log',
    String.raw`{"path":"C:\\Users\\Developer Name\\DEV\\repo\\artifact.json"}`,
  ].join('\n');

  const redacted = redactEvidenceOutput(value, {
    workspaceRoot: 'C:\\Users\\Developer Name\\DEV\\repo',
    homeDirectory: 'C:\\Users\\Developer Name',
  });

  assert.equal(
    redacted,
    [
      '<workspace>\\public\\sitemap.xml',
      '<workspace>/research.md',
      '<home>\\.npm\\_logs\\debug.log',
      String.raw`{"path":"<workspace>\\artifact.json"}`,
    ].join('\n'),
  );
  assert.doesNotMatch(redacted, /Developer Name/i);
});

test('evidence output redacts sensitive environment values in raw and encoded forms', () => {
  const secret = 'whsec_sensitive value/with+symbols';
  const serviceRoleKey = 'supabase-service-role-value';
  const databaseUrl = 'postgresql://user:password@example.com/database';
  const sensitiveValues = sensitiveEnvironmentValues({
    CLERK_WEBHOOK_SIGNING_SECRET: secret,
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    SUPABASE_DB_URL: databaseUrl,
    NEXT_PUBLIC_SITE_URL: 'https://example.com',
    SHORT_TOKEN: 'short',
  });
  const lowerCaseEncoding = encodeURIComponent(secret)
    .replace(/%[0-9A-F]{2}/g, (value) => value.toLowerCase());
  const formEncoding = lowerCaseEncoding.replaceAll('%20', '+');
  const value = [
    `secret=${secret}`,
    JSON.stringify({ secret }),
    `url=https://example.com/?token=${encodeURIComponent(secret)}`,
    `lower=${lowerCaseEncoding}`,
    `form=${formEncoding}`,
    `serviceRole=${serviceRoleKey}`,
    `database=${databaseUrl}`,
  ].join('\n');

  const redacted = redactEvidenceOutput(value, { sensitiveValues });

  assert.equal(sensitiveValues.length, 3);
  assert.doesNotMatch(redacted, /sensitive value|sensitive%20value|sensitive\+value|whsec_|service-role|user:password/);
  assert.equal((redacted.match(/<redacted>/g) || []).length, 7);
  assert.match(redacted, /https:\/\/example\.com/);
});
