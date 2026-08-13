#!/usr/bin/env node
import {
  criticalPath,
  failureEnvelope,
  loadGraph,
  successEnvelope,
} from './lib/execution-graph-gate.mjs';

const graphPath = process.argv[2] || '.graph/graph.json';

try {
  const loaded = loadGraph(graphPath);
  const result = successEnvelope(loaded, criticalPath(loaded.graph));
  const stream = result.ok ? process.stdout : process.stderr;
  stream.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.ok) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${JSON.stringify(failureEnvelope(error, graphPath), null, 2)}\n`);
  process.exitCode = 1;
}
