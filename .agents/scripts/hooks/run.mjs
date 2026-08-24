#!/usr/bin/env node
/**
 * Unified Agent OS hook runner — one brain for every host (Husky, Gemini, Claude, Cursor).
 *
 * Events:
 *   pre-explore          Soft guidance: prefer graphify / codebase-memory before raw grep
 *   post-edit            Debounced `graphify update .` after code mutations
 *   post-session         Codify Entire → skills/workflows/rules (entire-to-agentos)
 *   post-commit          Alias used by git hooks (post-session + optional metrics)
 *   claude-pre-tool      Claude PreToolUse: deny known-bad + additionalContext
 *   claude-post-tool     Claude PostToolUse: trigger post-edit when write tools fire
 *   gemini-before-tool   Gemini BeforeTool: stderr reminder for search tools
 *   gemini-after-tool    Gemini AfterTool: post-edit when write-like tools fire
 *   session-start        Inject ACTIVE_CONTEXT + ontology (stdout JSON for Claude)
 *   status               Print debounce / last-run state
 *
 * Env:
 *   HOOKS_SKIP=1                 no-op all hooks
 *   GRAPHIFY_SKIP_HOOK=1         skip graphify update
 *   ENTIRE_SYNC_SKIP=1           skip entire-to-agentos
 *   HOOKS_GRAPHIFY_DEBOUNCE_MS   default 90000
 *   HOOKS_SESSION_DEBOUNCE_MS    default 120000
 *   SESSION_LEARN_AUTO=1         run session-learn close after post-session (debounced)
 *   SESSION_LEARN_SKIP=1         disable session-learn
 *   ACTIVE_PREVENTION_SKIP=1     skip deny/inject prevention
 *   ACTIVE_PREVENTION_SOFT=1     advise only (no deny)
 */

import { execFileSync, execSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import {
  buildInjectText,
  preToolHookOutput,
  rebuildActiveContext,
  sessionInjectHookOutput,
} from '../active-prevention.mjs';

const ROOT = process.cwd();
const STATE_PATH = join(ROOT, '.agents', 'hooks-state.json');
const GRAPH_JSON = join(ROOT, 'graphify-out', 'graph.json');

const GRAPHIFY_DEBOUNCE = Number(process.env.HOOKS_GRAPHIFY_DEBOUNCE_MS || 90_000);
const SESSION_DEBOUNCE = Number(process.env.HOOKS_SESSION_DEBOUNCE_MS || 120_000);
const SESSION_LEARN_DEBOUNCE = Number(process.env.SESSION_LEARN_DEBOUNCE_MS || 300_000);

const WRITE_TOOL_RE =
  /write|edit|replace|create|delete|apply_patch|search_replace|str_replace|notebook|file_edit|write_to_file|replace_file/i;
const EXPLORE_TOOL_RE =
  /grep|glob|read|search|find|list_dir|bash|shell|run_terminal|run_shell|execute/i;
const RAW_SEARCH_CMD_RE = /\b(grep|rg|ripgrep|find|fd|ack|ag)\b/i;

function loadState() {
  try {
    if (existsSync(STATE_PATH)) return JSON.parse(readFileSync(STATE_PATH, 'utf8'));
  } catch {
    /* ignore */
  }
  return { last_graphify: 0, last_session_sync: 0, last_events: [] };
}

function saveState(state) {
  try {
    mkdirSync(dirname(STATE_PATH), { recursive: true });
    state.last_events = (state.last_events || []).slice(-30);
    writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    /* ignore */
  }
}

function logEvent(state, name, detail = {}) {
  state.last_events = state.last_events || [];
  state.last_events.push({ at: new Date().toISOString(), name, ...detail });
}

function shouldSkipAll() {
  return process.env.HOOKS_SKIP === '1' || process.env.HOOKS_SKIP === 'true';
}

function readStdinSync() {
  try {
    if (process.stdin.isTTY) return '';
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseClaudePayload(raw) {
  if (!raw || !raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function toolNameFromPayload(d) {
  return (
    d.tool_name ||
    d.toolName ||
    d.name ||
    d.tool ||
    d.hook_event_name ||
    ''
  ).toString();
}

function toolInputFromPayload(d) {
  return d.tool_input || d.toolInput || d.input || d.parameters || {};
}

/** Ontology + graph pre-explore guidance (injected into Claude/Gemini/Cursor-facing hooks) */
function ontologyKernelMessage() {
  return [
    'ONTOLOGY v2 (mandatory): .agents/ONTOLOGY.md · kernel .agents/AGENTS.md · npm run agentos:health',
    'Domain agents: npm run domain:route -- <path> then domain:prompt -- <id>; enforce before done.',
    'Each domain folder has own rules/MCPs/skills/learnings — do not cross jurisdiction.',
    'Cold start: AGENTS.md → domain prompt → graph:query → 1–3 files in jurisdiction.',
    'Never: GRAPH_REPORT dump, bulk wiki, git→fake skills, archives, editing foreign domains.',
  ].join(' ');
}

/** Soft pre-explore guidance text */
function preExploreMessage() {
  const hasGraph = existsSync(GRAPH_JSON);
  if (!hasGraph) {
    return [
      ontologyKernelMessage(),
      'graphify-out/graph.json missing — run `npm run graph:update` when practical.',
    ].join(' ');
  }
  return [
    ontologyKernelMessage(),
    'REQUIRED first: `npm run graph:query -- "<question>"` (budget 1500),',
    'or `npm run graph:path -- A B` / `npm run graph:explain -- concept`.',
    'Raw Grep/Glob/Read only after graph orientation, or for exact line edits.',
  ].join(' ');
}

function runGraphifyUpdate(state, { force = false } = {}) {
  if (process.env.GRAPHIFY_SKIP_HOOK === '1') {
    return { ok: true, skipped: 'GRAPHIFY_SKIP_HOOK' };
  }
  const now = Date.now();
  if (!force && now - (state.last_graphify || 0) < GRAPHIFY_DEBOUNCE) {
    return {
      ok: true,
      skipped: 'debounce',
      wait_ms: GRAPHIFY_DEBOUNCE - (now - state.last_graphify),
    };
  }

  try {
    // Non-blocking preferred for tool hooks; use sync with short timeout for reliability in CI/hooks
    execSync('graphify update .', {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 120_000,
      windowsHide: true,
      env: { ...process.env, PYTHONHASHSEED: '0' },
    });
    state.last_graphify = Date.now();
    logEvent(state, 'graphify_update', { ok: true });
    saveState(state);
    return { ok: true };
  } catch (err) {
    logEvent(state, 'graphify_update', { ok: false, error: err.message });
    saveState(state);
    return { ok: false, error: err.message };
  }
}

function runSessionSync(state, { force = false } = {}) {
  if (process.env.ENTIRE_SYNC_SKIP === '1') {
    return { ok: true, skipped: 'ENTIRE_SYNC_SKIP' };
  }
  const now = Date.now();
  if (!force && now - (state.last_session_sync || 0) < SESSION_DEBOUNCE) {
    return { ok: true, skipped: 'debounce' };
  }

  const script = join(ROOT, 'scripts', 'entire-to-agentos.mjs');
  if (!existsSync(script)) {
    return { ok: false, error: 'entire-to-agentos.mjs missing' };
  }

  try {
    execFileSync(process.execPath, [script], {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 180_000,
      windowsHide: true,
      env: { ...process.env, ENTIRE_SYNC_SKIP: '0' },
    });
    state.last_session_sync = Date.now();
    logEvent(state, 'entire_to_agentos', { ok: true });
    saveState(state);
    return { ok: true };
  } catch (err) {
    logEvent(state, 'entire_to_agentos', { ok: false, error: err.message });
    saveState(state);
    return { ok: false, error: err.message };
  }
}

/** Full learn/evaluate close — optional, debounced. Root automation for session knowledge. */
function runSessionLearn(state, { force = false } = {}) {
  if (process.env.SESSION_LEARN_SKIP === '1') {
    return { ok: true, skipped: 'SESSION_LEARN_SKIP' };
  }
  // Default ON for project sessions unless SESSION_LEARN_AUTO=0
  if (process.env.SESSION_LEARN_AUTO === '0' && !force) {
    return { ok: true, skipped: 'SESSION_LEARN_AUTO=0' };
  }
  const now = Date.now();
  if (!force && now - (state.last_session_learn || 0) < SESSION_LEARN_DEBOUNCE) {
    return {
      ok: true,
      skipped: 'debounce',
      wait_ms: SESSION_LEARN_DEBOUNCE - (now - (state.last_session_learn || 0)),
    };
  }
  // session-learn theater removed — rebuild prevention only
  try {
    rebuildActiveContext();
    state.last_session_learn = Date.now();
    logEvent(state, 'session_learn', { ok: true, mode: 'prevent-only' });
    saveState(state);
    return { ok: true, mode: 'prevent-only' };
  } catch (err) {
    logEvent(state, 'session_learn', { ok: false, error: err.message });
    saveState(state);
    return { ok: false, error: err.message };
  }
}

const EPISODE_DEBOUNCE = Number(process.env.EPISODE_DEBOUNCE_MS || 60_000);

/**
 * Automatic episode recording — fires on post-commit, debounced.
 * Detects task from latest git commit, derives pattern/friction, syncs to Turso.
 */
function runEpisodeRecord(state, { force = false } = {}) {
  if (process.env.EPISODE_SKIP === '1') {
    return { ok: true, skipped: 'EPISODE_SKIP' };
  }
  const now = Date.now();
  if (!force && now - (state.last_episode || 0) < EPISODE_DEBOUNCE) {
    return { ok: true, skipped: 'debounce' };
  }
  try {
    // Fire-and-forget async episode recording (non-blocking for git hook)
    const script = join(ROOT, 'scripts', 'learning-loop.mjs');
    spawnSync(process.execPath, [script, 'episode'], {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 30_000,
      windowsHide: true,
    });
    state.last_episode = Date.now();
    logEvent(state, 'episode_record', { ok: true });
    saveState(state);
    return { ok: true };
  } catch (err) {
    logEvent(state, 'episode_record', { ok: false, error: err.message });
    saveState(state);
    return { ok: false, error: err.message };
  }
}

/**
 * Sync hook telemetry to Turso (best-effort, fire-and-forget).
 * Gives cross-device visibility into what automation actually fires.
 */
function runTelemetrySync(state) {
  if (process.env.TELEMETRY_SKIP === '1') return { ok: true, skipped: 'TELEMETRY_SKIP' };
  try {
    const script = join(ROOT, 'scripts', 'hooks', 'telemetry-sync.mjs');
    if (!existsSync(script)) return { ok: false, error: 'telemetry-sync.mjs missing' };
    spawnSync(process.execPath, [script], {
      cwd: ROOT,
      stdio: 'ignore',
      timeout: 20_000,
      windowsHide: true,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function claudePreTool(payload) {
  const tool = toolNameFromPayload(payload);
  const input = toolInputFromPayload(payload);
  const cmd = String(input.command || '');
  const pathish = [
    input.file_path,
    input.path,
    input.pattern,
    input.glob,
    input.target_directory,
    input.target_file,
    input.filePath,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/\\/g, '/');

  // 1) Active prevention: hard DENY — SKIP alone is ignored (break-glass needs ALLOW_PREVENTION_BYPASS=1)
  let preventOut = null;
  try {
    preventOut = preToolHookOutput(tool, input);
  } catch {
    preventOut = null;
  }
  if (preventOut?.hookSpecificOutput?.permissionDecision === 'deny') {
    return preventOut;
  }

  // 2) Graph explore soft guidance
  const contexts = [];
  if (preventOut?.hookSpecificOutput?.additionalContext) {
    contexts.push(preventOut.hookSpecificOutput.additionalContext);
  }

  const hasGraph = existsSync(GRAPH_JSON);
  let needExplore = false;
  if (hasGraph) {
    if (/Bash|Shell|Terminal/i.test(tool) && RAW_SEARCH_CMD_RE.test(cmd)) needExplore = true;
    if (/Read|Glob|Grep|Search/i.test(tool) && !pathish.includes('graphify-out/')) {
      if (
        /\.(py|js|ts|tsx|jsx|go|rs|java|md|mjs|cjs|css|json|sql)$/i.test(pathish) ||
        /src\/|\.agents\/|scripts\//.test(pathish) ||
        tool === 'Grep' ||
        tool === 'Glob'
      ) {
        needExplore = true;
      }
    }
  }
  if (needExplore) contexts.push(preExploreMessage());

  if (!contexts.length) return null;

  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: contexts.join('\n\n'),
    },
    systemMessage: `\n\n${ontologyKernelMessage()}\n`,
  };
}

function shouldPostEditFromTool(tool, input = {}) {
  const name = String(tool || '');
  if (WRITE_TOOL_RE.test(name)) return true;
  // Bash that writes files (heuristic)
  const cmd = String(input.command || '');
  if (/Bash|Shell|Terminal/i.test(name) && /\b(sed|tee|cp|mv|rm|echo\s*>|>>|npm\s+run\s+build)\b/i.test(cmd)) {
    return true;
  }
  return false;
}

function main() {
  const event = process.argv[2] || 'status';
  if (shouldSkipAll() && event !== 'status') {
    process.exit(0);
  }

  const state = loadState();
  const stdinRaw = readStdinSync();
  const payload = parseClaudePayload(stdinRaw);

  switch (event) {
    case 'pre-explore': {
      // stderr so hosts that surface stderr as hints can show it; always exit 0
      console.error(`[hooks] ${preExploreMessage()}`);
      logEvent(state, 'pre-explore');
      saveState(state);
      break;
    }
    case 'post-edit': {
      const r = runGraphifyUpdate(state);
      if (process.env.HOOKS_VERBOSE === '1') {
        console.error('[hooks] post-edit', r);
      }
      break;
    }
    case 'post-session':
    case 'post-commit': {
      // After commit/session: codify Entire → Agent OS (debounced)
      const r = runSessionSync(state, { force: event === 'post-commit' });
      // Optional full learn close when SESSION_LEARN_AUTO=1
      const learn = runSessionLearn(state, { force: false });
      // Automatic episode recording (debounced, syncs to Turso)
      const ep = runEpisodeRecord(state, { force: event === 'post-commit' });
      // Telemetry: push hook event log to Turso
      runTelemetrySync(state);
      if (process.env.HOOKS_VERBOSE === '1') {
        console.error('[hooks] post-session', r, learn, ep);
      }
      break;
    }
    case 'post-commit-full': {
      // Git post-commit: force session sync; graphify left to chained graphify hook
      runSessionSync(state, { force: true });
      runSessionLearn(state, { force: false });
      runEpisodeRecord(state, { force: true });
      runTelemetrySync(state);
      break;
    }
    case 'session-learn': {
      // Explicit: node scripts/hooks/run.mjs session-learn
      const r = runSessionLearn(state, { force: true });
      if (process.env.HOOKS_VERBOSE === '1') console.error('[hooks] session-learn', r);
      break;
    }
    case 'pre-invocation': {
      // Pre-invocation hook: check circuit breaker state & graph health
      const circuitFile = join(ROOT, '.learnings', 'CIRCUIT_STATE.json');
      let circuitOpen = false;
      if (existsSync(circuitFile)) {
        try {
          const circuit = JSON.parse(readFileSync(circuitFile, 'utf8'));
          if (circuit.state === 'OPEN') circuitOpen = true;
        } catch {}
      }
      const injectSteps = [];
      if (circuitOpen) {
        injectSteps.push({
          ephemeralMessage: '[CIRCUIT_BREAKER_OPEN]: Automated retries are currently paused. Escalating to A0 Commander for strategy reconciliation.',
        });
      }
      process.stdout.write(JSON.stringify({ injectSteps }));
      logEvent(state, 'pre-invocation', { circuit_open: circuitOpen });
      saveState(state);
      break;
    }
    case 'pre-tool-use': {
      // Pre-tool-use hook: enforce Git discipline, Graphify-first, and safety policies
      const toolCall = payload.toolCall || payload;
      const toolName = toolNameFromPayload(toolCall) || toolCall.name || '';
      const args = toolInputFromPayload(toolCall) || toolCall.args || {};
      let decision = 'allow';
      let reason = '';

      if (toolName === 'run_command' && args.CommandLine) {
        const cmd = String(args.CommandLine).trim();
        if (/(?:git\s+add\s+\.|\bgit\s+add\s+-A\b)/i.test(cmd)) {
          decision = 'deny';
          reason = 'HARD DENIAL: "git add ." and "git add -A" are prohibited. Use explicit, surgical file staging.';
        } else if (/(?:git\s+push\s+.*--force|\bgit\s+push\s+.*-f\b)/i.test(cmd)) {
          decision = 'deny';
          reason = 'HARD DENIAL: Force pushing is strictly prohibited to preserve git history integrity.';
        } else if (/--no-verify\b/i.test(cmd)) {
          decision = 'deny';
          reason = 'HARD DENIAL: Bypassing git verification hooks (--no-verify) is prohibited.';
        } else if (/(?:git\s+reset\s+--hard|\bgit\s+clean\s+-fd)/i.test(cmd)) {
          decision = 'deny';
          reason = 'HARD DENIAL: Unscoped hard reset and aggressive clean are prohibited.';
        } else if (/(?:vercel\s+--prod|deploy-production|convex\s+deploy\s+--prod)/i.test(cmd)) {
          decision = 'deny';
          reason = 'HARD DENIAL: Autonomous production deployment/promotion is prohibited. Must flow through Pull Request gate.';
        }
      }

      if (toolName === 'grep_search') {
        const searchPath = String(args.SearchPath || '');
        const query = String(args.Query || '');
        const isCodeDir = /(?:src|convex|pages|components|app)/i.test(searchPath) && !searchPath.endsWith('.json') && !searchPath.endsWith('.md');
        if (isCodeDir && (query === '*' || query.length < 3)) {
          decision = 'deny';
          reason = 'GRAPHIFY MANDATE: Broad repository code scans via grep are prohibited. Use Graphify semantic query (npm run graph:query) first.';
        }
      }

      process.stdout.write(JSON.stringify({ decision, reason }));
      logEvent(state, 'pre-tool-use', { tool: toolName, decision });
      saveState(state);
      break;
    }
    case 'claude-pre-tool': {
      const out = claudePreTool(payload);
      if (out) process.stdout.write(JSON.stringify(out));
      logEvent(state, 'claude-pre-tool', { tool: toolNameFromPayload(payload) });
      saveState(state);
      break;
    }
    case 'claude-post-tool': {
      const tool = toolNameFromPayload(payload);
      const input = toolInputFromPayload(payload);
      if (shouldPostEditFromTool(tool, input)) {
        // background-ish: still sync but debounce protects thrash
        runGraphifyUpdate(state);
      }
      break;
    }
    case 'gemini-before-tool': {
      // Gemini doesn't always pass rich stdin; always emit soft explore guidance on search-like env
      const tool = process.env.HOOK_TOOL_NAME || toolNameFromPayload(payload) || '';
      if (!tool || EXPLORE_TOOL_RE.test(tool) || tool === '*') {
        console.error(`[hooks:gemini] ${preExploreMessage()}`);
      }
      logEvent(state, 'gemini-before-tool', { tool });
      saveState(state);
      break;
    }
    case 'gemini-after-tool': {
      const tool = process.env.HOOK_TOOL_NAME || toolNameFromPayload(payload) || '';
      const input = toolInputFromPayload(payload);
      if (shouldPostEditFromTool(tool, input) || WRITE_TOOL_RE.test(tool) || tool === '*') {
        // For matcher=* we only graphify if env says write — check HOOK_TOOL_NAME
        if (tool === '*' || WRITE_TOOL_RE.test(tool) || shouldPostEditFromTool(tool, input)) {
          if (tool === '*') {
            // Avoid graphify on every AfterTool * — only when HOOK_IS_WRITE=1
            if (process.env.HOOK_IS_WRITE === '1') runGraphifyUpdate(state);
          } else {
            runGraphifyUpdate(state);
          }
        }
      }
      break;
    }
    case 'session-start': {
      // Rebuild compact ACTIVE_CONTEXT so inject is fresh from index.json
      try {
        if (process.env.ACTIVE_PREVENTION_SKIP !== '1') {
          rebuildActiveContext();
        }
      } catch {
        /* non-fatal */
      }

      console.error(`[hooks] session-start: ${preExploreMessage()}`);
      console.error('[hooks] zero-theater: npm run goal · ship:eval · agents:zero-theater · learn:prevent');
      try {
        const injectPreview = buildInjectText().slice(0, 400);
        console.error(`[hooks] active-prevention: ${injectPreview}${injectPreview.length >= 400 ? '…' : ''}`);
      } catch {
        /* non-fatal */
      }

      // Claude SessionStart: stdout JSON additionalContext (model-visible)
      try {
        if (process.env.ACTIVE_PREVENTION_SKIP !== '1') {
          const inject = sessionInjectHookOutput('SessionStart');
          // Merge graph/ontology into the same additionalContext
          inject.hookSpecificOutput.additionalContext = [
            inject.hookSpecificOutput.additionalContext,
            preExploreMessage(),
          ]
            .filter(Boolean)
            .join('\n\n');
          process.stdout.write(JSON.stringify(inject));
        }
      } catch (err) {
        console.error('[hooks] session-start inject failed:', err.message);
      }

      logEvent(state, 'session-start', { active_prevention: true });
      saveState(state);
      break;
    }
    case 'user-prompt-submit': {
      // Lightweight re-inject of top lessons (Claude UserPromptSubmit)
      try {
        if (process.env.ACTIVE_PREVENTION_SKIP !== '1') {
          process.stdout.write(JSON.stringify(sessionInjectHookOutput('UserPromptSubmit')));
        }
      } catch {
        /* non-fatal */
      }
      logEvent(state, 'user-prompt-submit');
      saveState(state);
      break;
    }
    case 'session-end': {
      runSessionSync(state, { force: false });
      break;
    }
    case 'status': {
      console.log(
        JSON.stringify(
          {
            state_path: STATE_PATH,
            has_graph: existsSync(GRAPH_JSON),
            debounce: { graphify_ms: GRAPHIFY_DEBOUNCE, session_ms: SESSION_DEBOUNCE },
            state,
          },
          null,
          2
        )
      );
      break;
    }
    default:
      console.error(`[hooks] unknown event: ${event}`);
      process.exitCode = 1;
  }
}

main();
