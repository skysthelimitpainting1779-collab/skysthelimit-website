#!/usr/bin/env node

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

function listWorkflowFiles(workflowsDir) {
  if (!existsSync(workflowsDir)) return [];
  return readdirSync(workflowsDir)
    .map((name) => resolve(workflowsDir, name))
    .filter((path) => statSync(path).isFile() && /\.ya?ml$/i.test(path))
    .sort();
}

function unquote(value) {
  const text = String(value || '').trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function collectNpmScripts(workflowText) {
  const names = new Set();
  for (const match of workflowText.matchAll(/\bnpm\s+run\s+([A-Za-z0-9:_-]+)/g)) {
    names.add(match[1]);
  }
  if (/\bnpm\s+test\b/.test(workflowText)) names.add('test');
  return [...names].sort();
}

function collectLocalPaths(workflowText) {
  const paths = new Set();

  for (const match of workflowText.matchAll(/\b(?:node|bash|sh)\s+((?:"[^"]+"|'[^']+'|[^\s|;&]+))/g)) {
    const path = unquote(match[1]);
    if (!path || path.startsWith('-')) continue;
    if (path.startsWith('.') || path.startsWith('scripts/')) paths.add(path);
  }

  for (const match of workflowText.matchAll(/^\s*(?:-\s*)?uses:\s*['"]?(\.\/[^\s'"]+)['"]?\s*$/gm)) {
    paths.add(match[1]);
  }

  return [...paths].sort();
}

function collectActionRefs(workflowText) {
  const refsByRepository = new Map();
  const usesPattern = /^\s*(?:-\s*)?uses:\s*['"]?([^@\s'"]+)@([^\s'"]+)['"]?(?:\s+#.*)?$/gm;

  for (const match of workflowText.matchAll(usesPattern)) {
    const action = match[1];
    const ref = match[2];
    if (action.startsWith('./') || action.startsWith('docker://')) continue;

    const parts = action.split('/');
    if (parts.length < 2) continue;
    const repository = parts.slice(0, 2).join('/');
    const refs = refsByRepository.get(repository) || new Set();
    refs.add(ref);
    refsByRepository.set(repository, refs);
  }

  return refsByRepository;
}

function collectMutableActions(workflowText) {
  const mutableActions = [];
  const usesPattern = /^\s*(?:-\s*)?uses:\s*['"]?([^@\s'"]+)@([^\s'"]+)['"]?(?:\s+#.*)?$/gm;

  for (const match of workflowText.matchAll(usesPattern)) {
    const action = match[1];
    const ref = match[2];
    if (action.startsWith('./') || action.startsWith('docker://')) continue;
    if (!/^[0-9a-f]{40}$/i.test(ref)) mutableActions.push(`${action}@${ref}`);
  }

  return mutableActions;
}

export function findWorkflowContractErrors({ root = process.cwd() } = {}) {
  const packagePath = resolve(root, 'package.json');
  const workflowsDir = resolve(root, '.github', 'workflows');
  const errors = [];

  if (!existsSync(packagePath)) {
    return ['package.json is missing'];
  }

  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const scripts = packageJson.scripts || {};

  for (const workflowPath of listWorkflowFiles(workflowsDir)) {
    const displayPath = relative(root, workflowPath).replaceAll('\\', '/');
    const workflowText = readFileSync(workflowPath, 'utf8');

    for (const scriptName of collectNpmScripts(workflowText)) {
      if (!Object.hasOwn(scripts, scriptName)) {
        errors.push(
          `${displayPath}: npm script "${scriptName}" is not defined in package.json`
        );
      }
    }

    for (const localPath of collectLocalPaths(workflowText)) {
      const normalized = localPath.startsWith('./') ? localPath.slice(2) : localPath;
      if (!existsSync(resolve(root, normalized))) {
        errors.push(`${displayPath}: missing local file ${normalized}`);
      }
    }

    for (const action of collectMutableActions(workflowText)) {
      errors.push(`${displayPath}: action must be pinned to a 40-character commit SHA: ${action}`);
    }

    for (const [repository, refs] of collectActionRefs(workflowText)) {
      if (refs.size > 1) {
        errors.push(
          `${displayPath}: ${repository} actions use inconsistent refs: ${[...refs].sort().join(', ')}`
        );
      }
    }
  }

  return errors.sort();
}

export function runWorkflowContractCheck({ root = process.cwd() } = {}) {
  const errors = findWorkflowContractErrors({ root });
  if (errors.length > 0) {
    console.error('[ci-contract] Workflow contract validation failed:');
    for (const error of errors) console.error(`- ${error}`);
    return 1;
  }

  console.log(
    '[ci-contract] Workflow commands, local files, and shared action refs are consistent.'
  );
  return 0;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  process.exitCode = runWorkflowContractCheck();
}
