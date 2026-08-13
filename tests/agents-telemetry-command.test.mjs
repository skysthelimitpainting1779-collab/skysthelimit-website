import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');

test('AGENTS documents an executable telemetry gate invocation', () => {
  assert.match(
    agents,
    /npm run telemetry:gate -- --input <absolute-request-path>/,
    'telemetry gate requires an explicit absolute request path',
  );

  const lifecycle = agents.match(
    /## Governed execution lifecycle(?<body>[\s\S]*?)\n---\n/,
  )?.groups?.body;
  assert.ok(lifecycle, 'governed execution lifecycle section must exist');
  assert.match(lifecycle, /lifecycle_record_telemetry_decision/);
  assert.match(lifecycle, /Stop on any nonzero exit/);

  const delivery = agents.match(
    /## Delivery acceptance(?<body>[\s\S]*?)\n---\n/,
  )?.groups?.body;
  assert.ok(delivery, 'delivery acceptance section must exist');
  assert.doesNotMatch(
    delivery,
    /^npm run telemetry:gate\s*$/m,
    'the generic delivery command list must not include an invocation that cannot run without --input',
  );
});
