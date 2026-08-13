import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('integration worktree creation stops before mutation when the audit is stale', () => {
  const script = read(
    '.agents/handoffs/skys-limit-convex-production-os/scripts/create-integration-worktree.sh',
  );
  const staleGate = script.indexOf('if [[ "$AUDIT_IS_ANCESTOR" != true ]]');
  const worktreeAdd = script.indexOf('git -C "$REPO_ROOT" worktree add');

  assert.ok(staleGate >= 0);
  assert.ok(worktreeAdd > staleGate);
  assert.match(script.slice(staleGate, worktreeAdd), /"ok": false/);
  assert.match(script.slice(staleGate, worktreeAdd), /exit 2/);
  assert.match(script, /worktree add[^]*?>&2/);
  assert.match(script, /refresh_graphify\.py/);
  assert.match(script, /graphify-out\/graph\.json/);
});

test('Vercel baseline uses one requiredNodes array schema', () => {
  const baseline = JSON.parse(
    read('.agents/handoffs/skys-limit-convex-production-os/VERCEL_PLATFORM_BASELINE.json'),
  );
  for (const error of baseline.runtimeErrorsLast7Days) {
    assert.equal(Array.isArray(error.requiredNodes), true);
    assert.equal('requiredNode' in error, false);
  }
});

test('detector findings return a safe fallback for unknown registry IDs', async () => {
  const { finding } = await import(
    new URL('../.agents/skills/impeccable/scripts/detector/findings.mjs', import.meta.url)
  );
  assert.deepEqual(finding('not-registered', 'example.ts', 'sample', 4), {
    antipattern: 'not-registered',
    name: 'Unknown antipattern: not-registered',
    description: 'The detector emitted an unregistered antipattern identifier.',
    severity: 'warning',
    category: 'detector-integrity',
    file: 'example.ts',
    line: 4,
    snippet: 'sample',
  });
});

test('CSV validation is strict and rejects empty JSON decision rules', () => {
  for (const bundle of ['.agents', '.github']) {
    const validator = read(`${bundle}/skills/ui-ux-pro-max/scripts/validate_data.py`);
    assert.match(validator, /csv\.DictReader\(f,\s*strict=True\)/);
    assert.match(validator, /if col in row:/);
    assert.doesNotMatch(validator, /if col in row and row\[col\]/);
  }
});

test('reviewed design references use current contracts', () => {
  for (const bundle of ['.agents', '.github']) {
    assert.match(
      read(`${bundle}/skills/design-system/data/slide-color-logic.csv`),
      /^urgency,gradient,primary-foreground,/m,
    );
    const layouts = read(`${bundle}/skills/design-system/data/slide-layout-logic.csv`);
    assert.equal((layouts.match(/,evaluation,/g) || []).length, 1);
    assert.match(layouts, /^pricing,decision,/m);

    const guide = read(`${bundle}/skills/design/references/cip-deliverable-guide.md`);
    assert.match(guide, /300 DPI/);
    assert.match(guide, /CMYK/);
    assert.match(guide, /3-5mm bleed/);

    const cip = read(`${bundle}/skills/design/references/cip-design.md`);
    assert.match(cip, /gemini-3-pro-image\b/);
    assert.doesNotMatch(cip, /gemini-3-pro-image-preview/);

    const palette = read(`${bundle}/skills/brand/references/color-palette-management.md`);
    assert.match(palette, /\| AAA \| 7:1 \| 4\.5:1 \| N\/A \|/);
  }
});

test('user-hook maintenance points to its bundled verifier', () => {
  for (const bundle of ['.agents', '.github']) {
    const skill = read(`${bundle}/skills/codex-user-hook-maintenance/SKILL.md`);
    assert.match(
      skill,
      new RegExp(`${bundle.replaceAll('.', '\\.')}\\/skills\\/codex-user-hook-maintenance\\/scripts\\/verify-user-hooks\\.ps1`),
    );
  }
});
