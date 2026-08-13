import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SCENARIO_NUMBER_FIELDS = [
  'aiUsdLow',
  'aiUsdExpected',
  'aiUsdHigh',
  'laborHoursLow',
  'laborHoursExpected',
  'laborHoursHigh',
  'infrastructureUsd',
  'externalUsd',
  'contingencyPercent',
];

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonNegativeFinite(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 1_000_000) / 1_000_000;
}

function insertSorted(items, value) {
  let index = 0;
  while (index < items.length && items[index].localeCompare(value) < 0) index += 1;
  items.splice(index, 0, value);
}

function dependencyTopology(graph) {
  const nodes = [...graph.nodes].sort((a, b) => a.id.localeCompare(b.id));
  const indegree = new Map(nodes.map((node) => [node.id, node.dependsOn.length]));
  const outgoing = new Map(nodes.map((node) => [node.id, []]));

  for (const node of nodes) {
    for (const dependency of node.dependsOn) {
      if (outgoing.has(dependency)) outgoing.get(dependency).push(node.id);
    }
  }
  for (const dependents of outgoing.values()) dependents.sort((a, b) => a.localeCompare(b));

  const ready = nodes.filter((node) => indegree.get(node.id) === 0).map((node) => node.id);
  const order = [];
  while (ready.length) {
    const id = ready.shift();
    order.push(id);
    for (const dependent of outgoing.get(id) || []) {
      const next = indegree.get(dependent) - 1;
      indegree.set(dependent, next);
      if (next === 0) insertSorted(ready, dependent);
    }
  }

  return {
    hasCycle: order.length !== nodes.length,
    order,
    outgoing,
  };
}

export function loadGraph(graphPath = '.graph/graph.json') {
  const absolutePath = resolve(graphPath);
  const raw = readFileSync(absolutePath, 'utf8');
  const document = JSON.parse(raw);
  if (!isRecord(document) || !isRecord(document.graph)) {
    throw new Error('Execution graph must have a top-level graph object');
  }
  return {
    absolutePath,
    graph: document.graph,
    graphSha256: createHash('sha256').update(raw).digest('hex'),
  };
}

export function validateGraph(graph) {
  const errors = [];
  const warnings = [];

  if (!isRecord(graph)) {
    return { ok: false, errors: ['graph must be an object'], warnings };
  }
  if (typeof graph.id !== 'string' || !graph.id.trim()) errors.push('graph.id must be a non-empty string');
  if (typeof graph.version !== 'string' || !graph.version.trim()) {
    errors.push('graph.version must be a non-empty string');
  }
  if (!Array.isArray(graph.nodes)) errors.push('graph.nodes must be an array');
  if (!Array.isArray(graph.edges)) errors.push('graph.edges must be an array');
  if (!isRecord(graph.budgets)) errors.push('graph.budgets must be an object');
  if (!isRecord(graph.executionPolicy)) errors.push('graph.executionPolicy must be an object');

  if (errors.length) return { ok: false, errors, warnings };

  const nodeIds = new Set();
  for (const [index, node] of graph.nodes.entries()) {
    const label = typeof node?.id === 'string' && node.id ? node.id : `nodes[${index}]`;
    if (!isRecord(node)) {
      errors.push(`nodes[${index}] must be an object`);
      continue;
    }
    if (typeof node.id !== 'string' || !node.id.trim()) {
      errors.push(`nodes[${index}].id must be a non-empty string`);
    } else if (nodeIds.has(node.id)) {
      errors.push(`duplicate node id: ${node.id}`);
    } else {
      nodeIds.add(node.id);
    }
    if (!Array.isArray(node.dependsOn)) errors.push(`${label}.dependsOn must be an array`);
    if (!isRecord(node.execution) || !isNonNegativeFinite(node.execution.durationMinutes)) {
      errors.push(`${label}.execution.durationMinutes must be a non-negative finite number`);
    }
    if (!isRecord(node.cost) || !isRecord(node.cost.scenarios)) {
      errors.push(`${label}.cost.scenarios must be an object`);
      continue;
    }
    for (const [scenarioName, scenario] of Object.entries(node.cost.scenarios).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (!isRecord(scenario)) {
        errors.push(`${label}.cost.scenarios.${scenarioName} must be an object`);
        continue;
      }
      for (const field of SCENARIO_NUMBER_FIELDS) {
        if (!isNonNegativeFinite(scenario[field])) {
          errors.push(`${label}.cost.scenarios.${scenarioName}.${field} must be a non-negative finite number`);
        }
      }
    }
    if (!isNonNegativeFinite(node.cost.retryReservePercent)) {
      errors.push(`${label}.cost.retryReservePercent must be a non-negative finite number`);
    }
  }

  for (const node of graph.nodes) {
    if (!isRecord(node) || !Array.isArray(node.dependsOn) || typeof node.id !== 'string') continue;
    const dependencies = new Set();
    for (const dependency of node.dependsOn) {
      if (typeof dependency !== 'string' || !dependency.trim()) {
        errors.push(`${node.id}.dependsOn contains a non-string or blank id`);
      } else if (dependency === node.id) {
        errors.push(`${node.id} depends on itself`);
      } else if (dependencies.has(dependency)) {
        errors.push(`${node.id} has duplicate dependency: ${dependency}`);
      } else if (!nodeIds.has(dependency)) {
        errors.push(`${node.id} depends on unknown node: ${dependency}`);
      }
      dependencies.add(dependency);
    }
  }

  const edgeIds = new Set();
  for (const [index, edge] of graph.edges.entries()) {
    if (!isRecord(edge)) {
      errors.push(`edges[${index}] must be an object`);
      continue;
    }
    if (typeof edge.id !== 'string' || !edge.id.trim()) {
      errors.push(`edges[${index}].id must be a non-empty string`);
    } else if (edgeIds.has(edge.id)) {
      errors.push(`duplicate edge id: ${edge.id}`);
    } else {
      edgeIds.add(edge.id);
    }
    if (!nodeIds.has(edge.from)) errors.push(`${edge.id || `edges[${index}]`} has unknown from node: ${edge.from}`);
    if (!nodeIds.has(edge.to)) errors.push(`${edge.id || `edges[${index}]`} has unknown to node: ${edge.to}`);
  }

  const requiredEdgePairs = new Set(
    graph.edges
      .filter((edge) => isRecord(edge) && edge.required === true)
      .map((edge) => `${edge.from}\0${edge.to}`),
  );
  const dependencyPairs = new Set(
    graph.nodes.flatMap((node) =>
      isRecord(node) && Array.isArray(node.dependsOn)
        ? node.dependsOn.map((dependency) => `${dependency}\0${node.id}`)
        : [],
    ),
  );
  for (const pair of dependencyPairs) {
    if (!requiredEdgePairs.has(pair)) {
      const [from, to] = pair.split('\0');
      errors.push(`${to} depends on ${from} without a required graph edge`);
    }
  }
  for (const edge of graph.edges) {
    if (isRecord(edge) && edge.required === true && edge.kind === 'control') {
      const pair = `${edge.from}\0${edge.to}`;
      if (!dependencyPairs.has(pair)) {
        errors.push(`required control edge ${edge.id} is missing from ${edge.to}.dependsOn`);
      }
    }
  }

  const recommendedScenario = graph.recommendedScenario;
  if (typeof recommendedScenario !== 'string' || !recommendedScenario.trim()) {
    errors.push('graph.recommendedScenario must be a non-empty string');
  } else {
    for (const node of graph.nodes) {
      if (isRecord(node?.cost?.scenarios) && !isRecord(node.cost.scenarios[recommendedScenario])) {
        errors.push(`${node.id}.cost.scenarios is missing recommended scenario: ${recommendedScenario}`);
      }
    }
    if (!isRecord(graph.budgets.scenarios?.[recommendedScenario])) {
      errors.push(`graph.budgets.scenarios is missing recommended scenario: ${recommendedScenario}`);
    }
  }

  if (!isNonNegativeFinite(graph.budgets.softWarningPercent)) {
    errors.push('graph.budgets.softWarningPercent must be a non-negative finite number');
  }
  if (!isNonNegativeFinite(graph.budgets.hardStopPercent)) {
    errors.push('graph.budgets.hardStopPercent must be a non-negative finite number');
  }
  if (
    isNonNegativeFinite(graph.budgets.softWarningPercent) &&
    isNonNegativeFinite(graph.budgets.hardStopPercent) &&
    graph.budgets.softWarningPercent >= graph.budgets.hardStopPercent
  ) {
    errors.push('graph.budgets.softWarningPercent must be less than hardStopPercent');
  }
  if (!isRecord(graph.budgets.scenarios)) {
    errors.push('graph.budgets.scenarios must be an object');
  } else {
    for (const [scenarioName, budget] of Object.entries(graph.budgets.scenarios).sort(([a], [b]) =>
      a.localeCompare(b),
    )) {
      if (!isRecord(budget)) {
        errors.push(`graph.budgets.scenarios.${scenarioName} must be an object`);
        continue;
      }
      for (const field of ['aiUsdCap', 'laborHoursCap', 'otherUsdCap']) {
        if (!isNonNegativeFinite(budget[field])) {
          errors.push(`graph.budgets.scenarios.${scenarioName}.${field} must be a non-negative finite number`);
        }
      }
    }
  }

  const structurallySafeForTopology = graph.nodes.every(
    (node) =>
      isRecord(node) &&
      typeof node.id === 'string' &&
      node.id.trim() &&
      Array.isArray(node.dependsOn) &&
      node.dependsOn.every((dependency) => typeof dependency === 'string' && nodeIds.has(dependency)),
  );
  if (structurallySafeForTopology && dependencyTopology(graph).hasCycle) {
    errors.push('node dependency graph contains a cycle');
  }

  return { ok: errors.length === 0, errors, warnings };
}

export function criticalPath(graph) {
  const validation = validateGraph(graph);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, warnings: validation.warnings };
  }

  const topology = dependencyTopology(graph);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const duration = new Map();
  const previous = new Map();

  for (const id of topology.order) {
    const node = byId.get(id);
    let bestDependency = null;
    let bestDuration = 0;
    for (const dependency of [...node.dependsOn].sort((a, b) => a.localeCompare(b))) {
      const dependencyDuration = duration.get(dependency);
      if (
        dependencyDuration > bestDuration ||
        (dependencyDuration === bestDuration &&
          bestDependency !== null &&
          dependency.localeCompare(bestDependency) < 0)
      ) {
        bestDuration = dependencyDuration;
        bestDependency = dependency;
      }
    }
    duration.set(id, bestDuration + node.execution.durationMinutes);
    previous.set(id, bestDependency);
  }

  const endId = [...topology.order].sort((a, b) => {
    const difference = duration.get(b) - duration.get(a);
    return difference || a.localeCompare(b);
  })[0];
  const nodeIds = [];
  for (let id = endId; id !== null && id !== undefined; id = previous.get(id)) nodeIds.push(id);
  nodeIds.reverse();

  return {
    ok: true,
    totalMinutes: round(duration.get(endId) || 0),
    nodeIds,
    warnings: validation.warnings,
  };
}

export function estimateCost(graph, requestedScenario) {
  const validation = validateGraph(graph);
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, warnings: validation.warnings };
  }

  const scenario = requestedScenario || graph.recommendedScenario;
  const budget = graph.budgets.scenarios[scenario];
  const errors = [];
  const warnings = [];
  if (!isRecord(budget)) {
    return {
      ok: false,
      scenario,
      errors: [`unknown budget scenario: ${scenario}`],
      warnings,
    };
  }

  let aiUsdBase = 0;
  let otherUsdBase = 0;
  let aiUsdContingency = 0;
  let otherUsdContingency = 0;
  let aiUsdRetryReserve = 0;
  let otherUsdRetryReserve = 0;
  let laborHoursExpected = 0;

  for (const node of graph.nodes) {
    const item = node.cost.scenarios[scenario];
    if (!isRecord(item)) {
      errors.push(`${node.id}.cost.scenarios is missing scenario: ${scenario}`);
      continue;
    }
    const contingencyRate = item.contingencyPercent / 100;
    const retryRate = node.cost.retryReservePercent / 100;
    const nodeAiContingency = item.aiUsdExpected * contingencyRate;
    const nodeOtherBase = item.infrastructureUsd + item.externalUsd;
    const nodeOtherContingency = nodeOtherBase * contingencyRate;

    aiUsdBase += item.aiUsdExpected;
    otherUsdBase += nodeOtherBase;
    aiUsdContingency += nodeAiContingency;
    otherUsdContingency += nodeOtherContingency;
    aiUsdRetryReserve += (item.aiUsdExpected + nodeAiContingency) * retryRate;
    otherUsdRetryReserve += (nodeOtherBase + nodeOtherContingency) * retryRate;
    laborHoursExpected += item.laborHoursExpected;
  }

  if (errors.length) return { ok: false, scenario, errors, warnings };

  const aiUsdAdjusted = aiUsdBase + aiUsdContingency + aiUsdRetryReserve;
  const otherUsdAdjusted = otherUsdBase + otherUsdContingency + otherUsdRetryReserve;
  const totals = {
    aiUsd: {
      base: round(aiUsdBase),
      contingency: round(aiUsdContingency),
      retryReserve: round(aiUsdRetryReserve),
      adjusted: round(aiUsdAdjusted),
    },
    otherUsd: {
      base: round(otherUsdBase),
      contingency: round(otherUsdContingency),
      retryReserve: round(otherUsdRetryReserve),
      adjusted: round(otherUsdAdjusted),
    },
    laborHoursExpected: round(laborHoursExpected),
    laborUsd: isNonNegativeFinite(graph.budgets.hourlyRateUsd)
      ? round(laborHoursExpected * graph.budgets.hourlyRateUsd)
      : null,
  };

  const utilization = {
    aiUsdPercent: budget.aiUsdCap === 0 ? null : round((aiUsdBase / budget.aiUsdCap) * 100),
    laborHoursPercent:
      budget.laborHoursCap === 0 ? null : round((laborHoursExpected / budget.laborHoursCap) * 100),
    otherUsdPercent:
      budget.otherUsdCap === 0 ? null : round((otherUsdBase / budget.otherUsdCap) * 100),
  };
  const exposureWithReserves = {
    aiUsdPercent: budget.aiUsdCap === 0 ? null : round((aiUsdAdjusted / budget.aiUsdCap) * 100),
    otherUsdPercent:
      budget.otherUsdCap === 0 ? null : round((otherUsdAdjusted / budget.otherUsdCap) * 100),
  };

  for (const [label, percent] of Object.entries(utilization)) {
    if (percent === null) continue;
    if (percent >= graph.budgets.hardStopPercent) {
      errors.push(`${label} reached hard-stop threshold: ${percent}%`);
    } else if (percent >= graph.budgets.softWarningPercent) {
      warnings.push(`${label} reached soft-warning threshold: ${percent}%`);
    }
  }
  for (const [label, percent] of Object.entries(exposureWithReserves)) {
    if (percent !== null && percent > 100) {
      warnings.push(`${label} exposure including contingency and retry reserves exceeds the cap: ${percent}%`);
    }
  }

  return {
    ok: errors.length === 0,
    scenario,
    totals,
    caps: {
      aiUsd: budget.aiUsdCap,
      laborHours: budget.laborHoursCap,
      otherUsd: budget.otherUsdCap,
    },
    thresholds: {
      softWarningPercent: graph.budgets.softWarningPercent,
      hardStopPercent: graph.budgets.hardStopPercent,
    },
    utilization,
    exposureWithReserves,
    errors,
    warnings,
  };
}

export function successEnvelope(loaded, result) {
  return {
    ...result,
    graphPath: loaded.absolutePath,
    graphSha256: loaded.graphSha256,
    nodeCount: loaded.graph.nodes.length,
    edgeCount: loaded.graph.edges.length,
  };
}

export function failureEnvelope(error, graphPath) {
  return {
    ok: false,
    graphPath: resolve(graphPath || '.graph/graph.json'),
    errors: [error instanceof Error ? error.message : String(error)],
    warnings: [],
  };
}
