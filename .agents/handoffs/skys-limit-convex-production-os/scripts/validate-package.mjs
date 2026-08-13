import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));

const required = [
  "EXECUTE.md",
  "README-FIRST.md",
  "SAY_THIS.txt",
  "BRANCH_AND_WORKTREE_POLICY.md",
  "CURRENT_DECISIONS.md",
  "CURRENT_DECISIONS.json",
  "VERCEL_PLATFORM_POLICY.md",
  "VERCEL_PLATFORM_BASELINE.json",
  "SKILL_ROUTING_POLICY.md",
  "TASK_SKILL_MATRIX.json",
  "AUDIT_SNAPSHOT.md",
  "REPO_BASELINE.json",
  "REPO_MAP.json",
  "EXECUTION_BATCHES.json",
  "NODE_BINDINGS.json",
  "CONTROL_PLANE_PATCH.json",
  "OFFICIAL_DOCS_CONTEXT7.md",
  "VERIFICATION_GATES.md",
  "EXTERNAL_ACCESS_AND_APPROVALS.md",
  "compiled/.graph/graph.json",
  "compiled/.graph/execution-log.jsonl",
  "compiled/.graph/RUNTIME_POLICY.md",
  "scripts/create-integration-worktree.ps1",
  "scripts/create-integration-worktree.sh"
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) errors.push(`Missing: ${rel}`);
}

const graph = readJson("compiled/.graph/graph.json").graph;
const nodeIds = new Set(graph.nodes.map((node) => node.id));
const implementation = new Set([...nodeIds].filter((id) => id.startsWith("STL-")));

const branch = readJson("BRANCH_AND_WORKTREE_POLICY.json");
if (!branch.mandatory || branch.baseRef !== "origin/main") {
  errors.push("Mandatory origin/main integration worktree policy missing");
}

const skillDoc = readJson("TASK_SKILL_MATRIX.json");
const catalog = skillDoc.skillCatalog;
const routes = skillDoc.routes;
const routeByNode = new Map(routes.map((route) => [route.nodeId, route]));

for (const id of nodeIds) {
  const route = routeByNode.get(id);
  if (!route) {
    errors.push(`Missing skill route: ${id}`);
    continue;
  }
  if (!route.primarySkill) errors.push(`Missing primary skill: ${id}`);
  if (!catalog[route.primarySkill]) errors.push(`Unknown primary skill for ${id}: ${route.primarySkill}`);
  for (const skill of route.supportingSkills || []) {
    if (!catalog[skill]) errors.push(`Unknown supporting skill for ${id}: ${skill}`);
  }
  if (graph.nodes.find((node) => node.id === id).risk.tier === "high" &&
      !route.independentVerifierSkill) {
    errors.push(`High-risk node lacks independent verifier skill: ${id}`);
  }
  if (route.vercelPluginRequired &&
      !(route.requiredTools || []).includes("Vercel plugin")) {
    errors.push(`Vercel task lacks plugin requirement: ${id}`);
  }
}

for (const [name, meta] of Object.entries(catalog)) {
  if (meta.source === "package-domain-skill") {
    const rel = meta.path;
    if (!fs.existsSync(path.join(root, rel))) errors.push(`Missing packaged skill ${name}: ${rel}`);
  }
}

const batches = readJson("EXECUTION_BATCHES.json").batches;
const covered = [];
for (const batch of batches) {
  for (const id of batch.graphNodes || []) {
    covered.push(id);
    if (!nodeIds.has(id)) errors.push(`Unknown batched node: ${id}`);
  }
}
for (const id of implementation) {
  if (!covered.includes(id)) errors.push(`Uncovered implementation node: ${id}`);
}
for (const id of new Set(covered)) {
  if (covered.filter((x) => x === id).length !== 1) errors.push(`Duplicate implementation node: ${id}`);
}

const bindings = readJson("NODE_BINDINGS.json").bindings;
for (const id of nodeIds) {
  if (!bindings[id]) errors.push(`Missing node binding: ${id}`);
  else if (!bindings[id].skillRoute?.primarySkill) errors.push(`Binding lacks primary skill: ${id}`);
}

const vercel = readJson("VERCEL_PLATFORM_BASELINE.json");
if (vercel.project.id !== "prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m") errors.push("Wrong Vercel project");
if (vercel.project.framework !== "nextjs") errors.push("Unexpected current Vercel framework baseline");

const say = fs.readFileSync(path.join(root, "SAY_THIS.txt"), "utf8").trim();
if (say !== "Execute") errors.push("Invocation must remain exactly Execute");

if (errors.length) {
  console.error(JSON.stringify({ ok: false, errors }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  invocation: say,
  mandatoryIntegrationWorktree: true,
  vercelProject: vercel.project.id,
  currentVercelFramework: vercel.project.framework,
  targetVercelTopology: "services:web+integrations",
  vercelPluginRequiredNodes: routes.filter((route) => route.vercelPluginRequired).length,
  graphNodes: graph.nodes.length,
  nodesWithPrimaryDomainSkill: routes.filter((route) => route.primarySkill).length,
  packagedDomainSkills: Object.values(catalog).filter((meta) => meta.source === "package-domain-skill").length,
  implementationNodesCoveredExactlyOnce: implementation.size
}, null, 2));
