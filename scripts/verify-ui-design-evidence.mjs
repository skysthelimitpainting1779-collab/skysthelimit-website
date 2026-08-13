#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const evidenceRoot = path.join(root, ".agents", "evidence", "design");
const requiredNodesPath = path.join(root, "design", "UI_IMPLEMENTATION_NODES.json");
const errors = [];

if (!fs.existsSync(requiredNodesPath)) {
  console.log(JSON.stringify({ok: true, skipped: true, reason: "UI node registry not installed yet"}, null, 2));
  process.exit(0);
}

const nodes = JSON.parse(fs.readFileSync(requiredNodesPath, "utf8")).nodes;
for (const node of nodes) {
  if (node.status && !["implemented", "verification", "complete"].includes(node.status)) continue;
  const file = path.join(evidenceRoot, `${node.id}.json`);
  if (!fs.existsSync(file)) {
    errors.push(`${node.id}: evidence file missing`);
    continue;
  }
  const item = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const field of [
    "nodeId", "surface", "routes", "designSha256", "templateIds",
    "skillsLoaded", "impeccablePasses", "tasteDisposition",
    "designLint", "antiSlopLint", "screenshots", "accessibility"
  ]) {
    if (item[field] === undefined || item[field] === null) errors.push(`${node.id}: missing ${field}`);
  }
  const requiredSkills = node.requiredSkills || [];
  for (const skill of requiredSkills) {
    if (!item.skillsLoaded?.includes(skill)) errors.push(`${node.id}: missing required skill evidence ${skill}`);
  }
  for (const pass of ["shape", "audit", "harden", "polish"]) {
    if (!item.impeccablePasses?.includes(pass)) errors.push(`${node.id}: missing Impeccable ${pass}`);
  }
  if (!item.designLint?.passed) errors.push(`${node.id}: design lint not passed`);
  if (!item.antiSlopLint?.passed) errors.push(`${node.id}: anti-slop lint not passed`);
  if (!item.screenshots?.desktop || !item.screenshots?.mobile) errors.push(`${node.id}: desktop/mobile screenshots missing`);
}

if (errors.length) {
  console.error(JSON.stringify({ok: false, errors}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ok: true, verifiedNodes: nodes.length}, null, 2));
