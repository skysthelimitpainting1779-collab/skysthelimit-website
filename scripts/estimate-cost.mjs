#!/usr/bin/env node
import {
  estimateCost,
  failureEnvelope,
  loadGraph,
  successEnvelope,
} from './lib/execution-graph-gate.mjs';

const args = process.argv.slice(2);
const scenarioIndex = args.indexOf('--scenario');
const scenario = scenarioIndex === -1 ? undefined : args[scenarioIndex + 1];
const positional = args.filter((argument, index) => {
  if (argument === '--scenario') return false;
  if (scenarioIndex !== -1 && index === scenarioIndex + 1) return false;
  return !argument.startsWith('--');
});
const graphPath = positional[0] || '.graph/graph.json';

if (scenarioIndex !== -1 && !scenario) {
  process.stderr.write(
    `${JSON.stringify(failureEnvelope(new Error('--scenario requires a value'), graphPath), null, 2)}\n`,
  );
  process.exitCode = 1;
} else {
  try {
    const loaded = loadGraph(graphPath);
    const result = successEnvelope(loaded, estimateCost(loaded.graph, scenario));
    const stream = result.ok ? process.stdout : process.stderr;
    stream.write(`${JSON.stringify(result, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${JSON.stringify(failureEnvelope(error, graphPath), null, 2)}\n`);
    process.exitCode = 1;
  }
}
