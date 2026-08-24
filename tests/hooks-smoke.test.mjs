import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const exists = (rel) => existsSync(join(ROOT, rel));
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');

// ---------------------------------------------------------------------------
// Core hook scripts must exist on a fresh checkout
// ---------------------------------------------------------------------------

test('hook entry-point scripts exist', () => {
  const required = [
    'scripts/hooks/run.mjs',
    'scripts/hooks/graphify-pre-bash.mjs',
    'scripts/hooks/entire-if-present.mjs',
    'scripts/hooks/status.mjs',
    'scripts/active-prevention.mjs',
    'scripts/entire-to-agentos.mjs',
  ];
  for (const rel of required) {
    assert.ok(exists(rel), `missing: ${rel}`);
  }
});

// ---------------------------------------------------------------------------
// Hook config files parse and reference reachable node scripts
// ---------------------------------------------------------------------------

test('hook configs parse and node commands resolve', () => {
  const configs = [
    '.claude/settings.json',
    '.agents/hooks.json',
    '.cursor/hooks.json',
    '.codex/hooks.json',
  ];
  for (const rel of configs) {
    assert.ok(exists(rel), `config missing: ${rel}`);
    const json = JSON.parse(read(rel));

    // Collect all commands from any hook shape
    const commands = [];
    const roots = json.hooks ? [json.hooks] : [json];
    for (const root of roots) {
      for (const entries of Object.values(root)) {
        if (!Array.isArray(entries)) continue;
        for (const entry of entries) {
          for (const h of entry.hooks || []) {
            if (h.command) commands.push(h.command);
          }
        }
      }
    }

    // Every `node <script>` command must resolve
    for (const cmd of commands) {
      const m = cmd.match(/^node\s+(.+?)(\s|$)/);
      if (!m) continue; // sh -c / entire are external
      const script = m[1];
      assert.ok(
        exists(script),
        `${rel}: command references missing script: ${script}`,
      );
    }
  }
});

// ---------------------------------------------------------------------------
// Main runner executes in status mode without error
// ---------------------------------------------------------------------------

test('run.mjs status executes without path errors', () => {
  const out = execFileSync(
    process.execPath,
    [join(ROOT, 'scripts/hooks/run.mjs'), 'status'],
    { cwd: ROOT, encoding: 'utf8', timeout: 10_000, windowsHide: true },
  );
  const parsed = JSON.parse(out);
  assert.ok(parsed.state_path, 'status output has state_path');
  assert.equal(typeof parsed.has_graph, 'boolean');
});

// ---------------------------------------------------------------------------
// hooks:status script runs end-to-end and reports all reachable
// ---------------------------------------------------------------------------

test('hooks:status reports all checks reachable', () => {
  const out = execFileSync(
    process.execPath,
    [join(ROOT, 'scripts/hooks/status.mjs')],
    { cwd: ROOT, encoding: 'utf8', timeout: 15_000, windowsHide: true },
  );
  const summary = JSON.parse(out);
  assert.ok(summary.ok, `hooks:status reported ${summary.failures} failure(s): ${JSON.stringify(summary.results.filter((r) => !r.reachable))}`);
  assert.equal(summary.failures, 0);
});

// ---------------------------------------------------------------------------
// No absolute paths in hook configs (portable across checkouts)
// ---------------------------------------------------------------------------

test('hook configs use no absolute paths', () => {
  const configs = [
    '.claude/settings.json',
    '.agents/hooks.json',
    '.cursor/hooks.json',
    '.codex/hooks.json',
  ];
  const ABS_RE = /(?:^|\s)(?:[A-Z]:\\|\/(?:home|Users|root|tmp)\/)/i;
  for (const rel of configs) {
    const raw = read(rel);
    assert.ok(
      !ABS_RE.test(raw),
      `${rel} contains an absolute path — must be relative for fresh-checkout portability`,
    );
  }
});
