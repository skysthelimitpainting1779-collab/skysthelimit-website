#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {changedFiles} from "./lib/git-changed-files.mjs";
import {canonicalSha256} from "./lib/canonical-text.mjs";

const root = process.cwd();
const configPath = path.join(root, "design-lint.config.json");
const fail = [];
const warn = [];
const report = {mode: "spec", checkedFiles: [], errors: fail, warnings: warn};

const args = new Set(process.argv.slice(2));
if (args.has("--all")) report.mode = "all";
else if (args.has("--changed")) report.mode = "changed";

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const config = readJson("design-lint.config.json");
const designPath = path.join(root, config.designFile);

if (!fs.existsSync(designPath)) fail.push(`Missing ${config.designFile}`);

let design = "";
if (fs.existsSync(designPath)) {
  design = fs.readFileSync(designPath, "utf8");
  report.designSha256 = canonicalSha256(design);
  for (const heading of config.requiredHeadings) {
    const expression = new RegExp(`^##\\s+\\d*\\.?\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im");
    if (!expression.test(design)) fail.push(`DESIGN.md missing heading: ${heading}`);
  }
  if (/\b(TODO|TBD|FIXME|PLACEHOLDER)\b/i.test(design)) {
    fail.push("DESIGN.md contains unresolved placeholders");
  }
  if (report.designSha256 !== config.baselineSha256) {
    const changelogPath = path.join(root, config.designChangelog);
    const changelog = fs.existsSync(changelogPath) ? fs.readFileSync(changelogPath, "utf8") : "";
    for (const marker of [
      `${config.allowedDesignChangeProtocol.hashMarker} ${report.designSha256}`,
      config.allowedDesignChangeProtocol.approverMarker,
      config.allowedDesignChangeProtocol.reasonMarker,
    ]) {
      if (!changelog.includes(marker)) {
        fail.push(`DESIGN.md changed without approved changelog marker: ${marker}`);
      }
    }
  }
}

let routes;
let specs;
try {
  routes = readJson(config.routeInventory).routes;
  specs = readJson(config.pageSpecs).templates;
  if (specs.length !== config.requiredTemplateCount) {
    fail.push(`Expected ${config.requiredTemplateCount} page specs, found ${specs.length}`);
  }
  const ids = new Set(specs.map((item) => item.id));
  if (ids.size !== specs.length) fail.push("Duplicate page-spec IDs");
  for (const route of routes) {
    if (route.surface !== "legacy" && !ids.has(route.templateId)) {
      fail.push(`Route ${route.route} maps to unknown template ${route.templateId}`);
    }
  }
  for (const spec of specs) {
    for (const key of ["routes", "desktopRegions", "mobileOrder", "states", "components", "marketingSkills"]) {
      if (!Array.isArray(spec[key]) || spec[key].length === 0) fail.push(`${spec.id} missing ${key}`);
    }
  }
} catch (error) {
  fail.push(`Design JSON invalid: ${error.message}`);
}

function allUiFiles() {
  const output = [];
  const extensions = new Set([".tsx", ".jsx", ".ts", ".js", ".css"]);
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const next = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (["node_modules", ".next", "generated"].includes(entry.name)) continue;
        walk(next);
      } else if (extensions.has(path.extname(entry.name))) {
        output.push(next);
      }
    }
  };
  for (const rel of config.uiRoots) walk(path.join(root, rel));
  return output;
}

function changedUiFiles() {
  const base = process.env.DESIGN_LINT_BASE || "origin/main";
  try {
    return changedFiles(root, base)
      .map((rel) => path.join(root, rel))
      .filter((file) => fs.existsSync(file) && /\.(tsx?|jsx?|css)$/.test(file));
  } catch (error) {
    fail.push(`Unable to calculate changed UI files from ${base}: ${error.message}`);
    return [];
  }
}

const files = report.mode === "all" ? allUiFiles() : report.mode === "changed" ? changedUiFiles() : [];
for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const source = fs.readFileSync(file, "utf8");
  report.checkedFiles.push(rel);
  for (const phrase of config.bannedCopyPhrases) {
    if (source.toLowerCase().includes(phrase.toLowerCase())) {
      fail.push(`${rel}: banned generic copy phrase "${phrase}"`);
    }
  }
  for (const rule of config.bannedCodePatterns) {
    const regex = new RegExp(rule.pattern, "ims");
    if (regex.test(source)) {
      const message = `${rel}: [${rule.id}] ${rule.message}`;
      (rule.severity === "error" ? fail : warn).push(message);
    }
  }
}

const outputDir = path.join(root, ".agents", "evidence", "design");
fs.mkdirSync(outputDir, {recursive: true});
fs.writeFileSync(path.join(outputDir, `design-lint-${report.mode}.json`), JSON.stringify(report, null, 2) + "\n");

if (fail.length) {
  console.error(JSON.stringify({ok: false, ...report}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ok: true, ...report}, null, 2));
