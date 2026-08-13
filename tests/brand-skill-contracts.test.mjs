import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

for (const bundle of ['.agents', '.github']) {
  test(`${bundle} brand skill references executable repository-root paths`, () => {
    const skillRoot = `${bundle}/skills/brand`;
    const skill = read(`${skillRoot}/SKILL.md`);

    for (const relative of [
      'scripts/inject-brand-context.cjs',
      'scripts/validate-asset.cjs',
      'scripts/extract-colors.cjs',
      'scripts/sync-brand-to-tokens.cjs',
      'references/update.md',
      'references/approval-checklist.md',
      'templates/brand-guidelines-starter.md',
    ]) {
      assert.equal(existsSync(new URL(`${skillRoot}/${relative}`, root)), true, relative);
      assert.match(skill, new RegExp(`${skillRoot.replaceAll('.', '\\.')}\\/${relative}`));
    }
    assert.doesNotMatch(skill, /node scripts\//);
    assert.doesNotMatch(skill, /`references\//);
    assert.doesNotMatch(skill, /`templates\//);
  });
}

test('brand runtime resolves the sibling design-system generator without .claude paths', () => {
  for (const bundle of ['.agents', '.github']) {
    const script = read(`${bundle}/skills/brand/scripts/sync-brand-to-tokens.cjs`);
    const checklist = read(`${bundle}/skills/brand/references/approval-checklist.md`);
    const update = read(`${bundle}/skills/brand/references/update.md`);
    assert.match(script, /__dirname/);
    assert.match(script, /design-system['"],\s*['"]scripts['"],\s*['"]generate-tokens\.cjs/);
    assert.doesNotMatch(script, /\.claude/);
    assert.match(checklist, new RegExp(`${bundle.replaceAll('.', '\\.')}\\/skills\\/brand\\/scripts\\/validate-asset\\.cjs`));
    assert.doesNotMatch(checklist, /\.claude/);
    assert.doesNotMatch(update, /\.claude/);
  }
});
