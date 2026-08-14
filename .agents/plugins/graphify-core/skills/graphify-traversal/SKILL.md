---
name: graphify-traversal
description: Traverses repository structure, dependency neighborhoods, and blast radius using the Graphify knowledge graph.
---

# Graphify Traversal Skill

## Workflow
1. Execute query via Graphify:
   `npm run graph:query -- "<task or symbol>"`
2. Check node connections and neighborhood:
   `node scripts/graph-context.mjs explain "<node-name>"`
3. Calculate path between interacting components:
   `node scripts/graph-context.mjs path "<source-node>" "<target-node>"`
4. Identify blast radius and affected tests.
