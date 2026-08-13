#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {changedFiles} from "./lib/git-changed-files.mjs";

const root = process.cwd();
const base = process.env.DESIGN_LINT_BASE || "origin/main";
const args = new Set(process.argv.slice(2));
const mode = args.has("--all") ? "all" : "changed";
const findings = [];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!["node_modules", ".next", "generated"].includes(entry.name)) walk(p, files);
    } else if (/\.(tsx?|jsx?|css)$/.test(entry.name)) files.push(p);
  }
  return files;
}

let files = [];
if (mode === "all") {
  files = ["src/app", "src/components", "src/views"].flatMap((p) => walk(path.join(root, p)));
} else {
  files = changedFiles(root, base)
    .map((p) => path.join(root, p))
    .filter((p) => fs.existsSync(p) && /\.(tsx?|jsx?|css)$/.test(p));
}

const rules = [
  ["error", "template-copy", /\b(elevate|unleash|unlock|revolutionize)\s+(your|the)\b/i,
    "Generic AI marketing phrase"],
  ["error", "purple-gradient", /(from|via|to)-(purple|violet|fuchsia)-\d{2,3}/i,
    "Generic AI purple gradient"],
  ["error", "transition-all", /\btransition-all\b/,
    "transition-all hides performance and interaction intent"],
  ["error", "fake-stat", /\b(99\.9%|10,000\+|100%\s+satisfaction)\b/i,
    "Unverified marketing statistic"],
  ["warning", "excessive-pill", /(rounded-full[^\n]*\b(px|py)-\d+){3,}/i,
    "Review excessive pill styling"],
  ["warning", "card-grid-default", /grid-cols-3[\s\S]{0,1200}<Card[\s\S]{0,1200}<Card[\s\S]{0,1200}<Card/i,
    "Review generic equal three-card layout"],
  ["warning", "decorative-blur", /blur-(2xl|3xl)[\s\S]{0,300}(absolute|fixed)/i,
    "Review decorative blurred orb"],
];

for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  for (const [severity, id, expression, message] of rules) {
    if (expression.test(text)) findings.push({severity, id, file: rel, message});
  }
}

const report = {
  ok: !findings.some((item) => item.severity === "error"),
  mode,
  base,
  checkedFiles: files.map((file) => path.relative(root, file).replaceAll("\\", "/")),
  findings,
};
const out = path.join(root, ".agents", "evidence", "design");
fs.mkdirSync(out, {recursive: true});
fs.writeFileSync(path.join(out, `anti-slop-${mode}.json`), JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report, null, 2));
if (!report.ok) process.exit(1);
