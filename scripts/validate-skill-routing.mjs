#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const handoff = '.agents/handoffs/skys-limit-convex-production-os';
const matrix = JSON.parse(readFileSync(join(handoff, 'TASK_SKILL_MATRIX.json'), 'utf8'));
const bindings = JSON.parse(readFileSync(join(handoff, 'NODE_BINDINGS.json'), 'utf8')).bindings;
const errors = [];
const ids = new Set();
const pluginRequirements = new Set();

for (const route of matrix.routes) {
  if (ids.has(route.nodeId)) errors.push(`duplicate route: ${route.nodeId}`);
  ids.add(route.nodeId);

  if (!bindings[route.nodeId]) errors.push(`missing node binding: ${route.nodeId}`);
  if (!route.primarySkill) errors.push(`missing primary skill: ${route.nodeId}`);
  if (!existsSync(join('.agents', 'skills', route.primarySkill, 'SKILL.md'))) {
    errors.push(`uninstalled primary skill for ${route.nodeId}: ${route.primarySkill}`);
  }
  if (!route.readyRule) errors.push(`missing ready rule: ${route.nodeId}`);

  for (const skill of route.supportingSkills || []) {
    const catalog = matrix.skillCatalog[skill];
    if (!catalog) {
      errors.push(`unknown supporting skill for ${route.nodeId}: ${skill}`);
      continue;
    }
    if (catalog.source === 'repository-or-install') {
      if (!catalog.path || !existsSync(catalog.path)) {
        errors.push(`missing repository supporting skill for ${route.nodeId}: ${skill}`);
      }
    } else if (catalog.source === 'installed-plugin') {
      if (!catalog.plugin) errors.push(`plugin source missing for supporting skill: ${skill}`);
      else pluginRequirements.add(`${catalog.plugin}:${skill}`);
    }
  }
}

if (matrix.routes.length !== 66) errors.push(`expected 66 routes, found ${matrix.routes.length}`);
if (ids.size !== 66) errors.push(`expected 66 unique routes, found ${ids.size}`);

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      routes: ids.size,
      primarySkillsInstalled: [...new Set(matrix.routes.map((route) => route.primarySkill))].length,
      pluginRequirements: [...pluginRequirements].sort(),
    },
    null,
    2,
  ),
);
