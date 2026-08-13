import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const requiredFiles = [
  'docs/design/wireframes/README.md',
  'docs/design/wireframes/conversion-flow.md',
  'docs/design/MOTION_SYSTEM.md',
  'docs/context/motion-context7.md',
  'src/design/motion/tokens.ts',
  'src/design/motion/variants.ts',
  'src/design/motion/reduced-motion.ts',
  'src/design/motion/Reveal.tsx',
  'src/design/motion/Stagger.tsx',
  'src/design/motion/Pressable.tsx',
  'src/design/motion/index.ts',
  '.agents/skills/wireframe-to-interface/SKILL.md',
  '.agents/skills/motion-system/SKILL.md',
  '.agents/skills/responsive-ui-verification/SKILL.md',
  '.agents/skills/accessibility-verification/SKILL.md',
];

const read = (path) => readFileSync(path, 'utf8');

test('design foundation files exist', () => {
  for (const path of requiredFiles) {
    assert.equal(existsSync(path), true, `${path} must exist`);
  }
});

test('Motion uses current package imports and reduced-motion handling', () => {
  const sources = [
    read('src/design/motion/Reveal.tsx'),
    read('src/design/motion/Stagger.tsx'),
    read('src/design/motion/Pressable.tsx'),
  ].join('\n');
  assert.match(sources, /from ['"]motion\/react['"]/);
  assert.match(sources, /useReducedMotion/);
  assert.doesNotMatch(sources, /framer-motion/);
});

test('wireframe contract covers the conversion path and responsive states', () => {
  const wireframes = `${read('docs/design/wireframes/README.md')}\n${read('docs/design/wireframes/conversion-flow.md')}`;
  for (const term of ['desktop', 'mobile', 'estimate', 'trust', 'Convex', 'accessibility']) {
    assert.match(wireframes, new RegExp(term, 'i'));
  }
});

test('starter skills include context, tests, stop conditions, and evidence', () => {
  for (const path of requiredFiles.filter((file) => file.endsWith('/SKILL.md'))) {
    const skill = read(path);
    for (const term of ['Trigger', 'Context7', 'Test', 'Stop conditions', 'Evidence']) {
      assert.match(skill, new RegExp(term, 'i'), `${path} must include ${term}`);
    }
  }
});

test('Context7 evidence records the selected official Motion library', () => {
  const context = read('docs/context/motion-context7.md');
  assert.match(context, /\/websites\/motion_dev/);
  assert.match(context, /motion\/react-client/);
  assert.match(context, /Next\.js App Router/i);
});
