// One-off repair: align Better Loop's Qoder workspace slug with Qoder's
// on-disk slug on Windows (drive colon stripped, drive letter lowercased).
// Finding: workspace session store never discovered -> session observability off.
import { readFileSync, writeFileSync } from "node:fs";

const targets = [
  {
    path: "C:/Users/Johnny Cage/.qoder/plugins/cache/qoder-bundler/better-loop/scripts/session-analysis/platforms/qoder.mjs",
    old: 'export function workspaceToQoderSlug(workspace) {\n  const normalized = normalizeWorkspace(workspace);\n  return normalized.replace(/[\\\\/]+/g, "-");\n}',
    next: 'export function workspaceToQoderSlug(workspace) {\n  const normalized = normalizeWorkspace(workspace);\n  return normalized\n    .replace(/^([A-Za-z]):/u, (m, drive) => drive.toLowerCase())\n    .replace(/[\\\\/]+/g, "-");\n}',
  },
  {
    path: "C:/Users/Johnny Cage/.qoder/plugins/cache/qoder-bundler/better-loop/scripts/agent-customize/providers/qoder.mjs",
    old: 'function qoderWorkspaceSlug(workspace) {\n  return normalizeWorkspace(workspace).replace(/[\\\\/]+/gu, "-");\n}',
    next: 'function qoderWorkspaceSlug(workspace) {\n  return normalizeWorkspace(workspace)\n    .replace(/^([A-Za-z]):/u, (m, drive) => drive.toLowerCase())\n    .replace(/[\\\\/]+/gu, "-");\n}',
  },
];

for (const target of targets) {
  const source = readFileSync(target.path, "utf8");
  if (source.includes(target.next)) {
    console.log(`already patched: ${target.path}`);
    continue;
  }
  if (!source.includes(target.old)) {
    console.error(`pattern not found: ${target.path}`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(target.path, source.replace(target.old, target.next));
  console.log(`patched: ${target.path}`);
}
