import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const convexTsconfig = JSON.parse(
  readFileSync('convex/tsconfig.json', 'utf8')
);

test('Convex typechecking includes the ES2022 library used by backend code', () => {
  const libraries = convexTsconfig.compilerOptions?.lib ?? [];

  assert.ok(
    libraries.includes('ES2022'),
    'convex/tsconfig.json must include ES2022 so Object.hasOwn is type-safe during Convex deployment'
  );
});
