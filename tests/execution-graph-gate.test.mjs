import assert from 'node:assert/strict';
import test from 'node:test';

import {
  criticalPath,
  estimateCost,
  validateGraph,
} from '../scripts/lib/execution-graph-gate.mjs';

function scenario(overrides = {}) {
  return {
    aiUsdLow: 1,
    aiUsdExpected: 2,
    aiUsdHigh: 3,
    laborHoursLow: 1,
    laborHoursExpected: 2,
    laborHoursHigh: 3,
    infrastructureUsd: 1,
    externalUsd: 1,
    contingencyPercent: 10,
    ...overrides,
  };
}

function node(id, dependsOn = [], durationMinutes = 1, scenarioOverrides = {}) {
  return {
    id,
    dependsOn,
    execution: { durationMinutes },
    cost: {
      scenarios: {
        expected: scenario(scenarioOverrides),
      },
      retryReservePercent: 10,
    },
  };
}

function graph(overrides = {}) {
  return {
    id: 'fixture',
    version: '1.0.0',
    recommendedScenario: 'expected',
    nodes: [node('A', [], 2), node('B', ['A'], 3), node('C', ['A'], 4)],
    edges: [
      { id: 'e1', from: 'A', to: 'B', kind: 'control', required: true },
      { id: 'e2', from: 'A', to: 'C', kind: 'control', required: true },
    ],
    budgets: {
      hourlyRateUsd: null,
      softWarningPercent: 70,
      hardStopPercent: 95,
      scenarios: {
        expected: {
          aiUsdCap: 100,
          laborHoursCap: 100,
          otherUsdCap: 100,
        },
      },
    },
    executionPolicy: {},
    ...overrides,
  };
}

test('validates a well-formed execution graph', () => {
  assert.deepEqual(validateGraph(graph()), { ok: true, errors: [], warnings: [] });
});

test('rejects duplicate node IDs and unknown dependencies', () => {
  const fixture = graph({
    nodes: [node('A'), node('A'), node('B', ['MISSING'])],
  });
  const result = validateGraph(fixture);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('duplicate node id: A'));
  assert.ok(result.errors.includes('B depends on unknown node: MISSING'));
});

test('rejects dependency cycles without requiring edge parity', () => {
  const fixture = graph({
    nodes: [node('A', ['B']), node('B', ['A'])],
    edges: [],
  });
  const result = validateGraph(fixture);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes('node dependency graph contains a cycle'));
  assert.equal(result.errors.some((error) => error.includes('edge parity')), false);
});

test('requires dependency edges and mirrors required control edges', () => {
  const missingEdge = graph({
    nodes: [node('A'), node('B', ['A'])],
    edges: [],
  });
  assert.ok(
    validateGraph(missingEdge).errors.includes('B depends on A without a required graph edge'),
  );

  const missingDependency = graph({
    nodes: [node('A'), node('B')],
    edges: [{ id: 'e1', from: 'A', to: 'B', kind: 'control', required: true }],
  });
  assert.ok(
    validateGraph(missingDependency).errors.includes(
      'required control edge e1 is missing from B.dependsOn',
    ),
  );
});

test('computes a deterministic dependency critical path', () => {
  const result = criticalPath(graph());
  assert.equal(result.ok, true);
  assert.equal(result.totalMinutes, 6);
  assert.deepEqual(result.nodeIds, ['A', 'C']);
});

test('rejects a missing requested cost scenario', () => {
  const result = estimateCost(graph(), 'lean');
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ['unknown budget scenario: lean']);
});

test('reports reserves separately and fails at the hard budget threshold', () => {
  const fixture = graph({
    nodes: [node('A', [], 1, { aiUsdExpected: 96, infrastructureUsd: 0, externalUsd: 0 })],
    edges: [],
  });
  const result = estimateCost(fixture, 'expected');
  assert.equal(result.ok, false);
  assert.equal(result.totals.aiUsd.base, 96);
  assert.equal(result.totals.aiUsd.contingency, 9.6);
  assert.equal(result.totals.aiUsd.retryReserve, 10.56);
  assert.equal(result.totals.laborUsd, null);
  assert.equal(result.utilization.aiUsdPercent, 96);
  assert.equal(result.exposureWithReserves.aiUsdPercent, 116.16);
  assert.ok(result.errors.some((error) => error.startsWith('aiUsdPercent reached hard-stop threshold:')));
});
