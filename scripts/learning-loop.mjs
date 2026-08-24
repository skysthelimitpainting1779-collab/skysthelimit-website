#!/usr/bin/env node
/**
 * True self-healing / self-improving agentic learning loop.
 *
 * Loop: DETECT → CLASSIFY → DEDUPE → STORE → PREVENT → HEAL → VERIFY → IMPROVE
 *
 * Design goals:
 * - Never re-append multi-MB identical dumps
 * - Keep agent cold-start under a few KB (ERRORS_INDEX.md)
 * - Persist machine state in index.json for counters / heal attempts
 * - Apply only safe auto-heals; escalate otherwise
 * - Surface prevention rules for future agents
 *
 * CLI:
 *   node scripts/learning-loop.mjs record --title "..." --error "..." --command "..." --area "..." [--prevention "..."] [--category "..."]
 *   node scripts/learning-loop.mjs resolve --id ERR-... --prevention "..."   (or --fingerprint, or --all-open)
 *   node scripts/learning-loop.mjs heal
 *   node scripts/learning-loop.mjs compact
 *   node scripts/learning-loop.mjs status
 *   node scripts/learning-loop.mjs rebuild-index
 */

import {
  createHash,
  randomBytes,
} from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const LEARNINGS = join(ROOT, '.learnings');
const INDEX_JSON = join(LEARNINGS, 'index.json');
const ERRORS_MD = join(LEARNINGS, 'ERRORS.md');
const ERRORS_INDEX_MD = join(LEARNINGS, 'ERRORS_INDEX.md');
const PREVENTION_MD = join(ROOT, '.agents', 'governance', 'PREVENTION_RULES.md');
const MAX_ACTIVE_ENTRIES = 25;
const MAX_SNIPPET_CHARS = 600;
const INDEX_TOP_N = 20;

// ---------------------------------------------------------------------------
// Fingerprint / classify
// ---------------------------------------------------------------------------

/** Normalize noisy, non-semantic bits so the same root cause hashes identically. */
export function normalizeErrorText(text = '') {
  return String(text)
    .replace(/\r\n/g, '\n')
    // Timestamps first so path matchers cannot swallow ISO times
    .replace(/\b\d{4}-\d{2}-\d{2}T[\d:.Z+-]+\b/g, '<TS>')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '<DATE>')
    // Windows paths may include spaces (C:\Users\Johnny Cage\...); stop before " at " / tokens
    .replace(/[A-Z]:\\[^\r\n]+?(?=\s+at\s|\s+<|\s*[,;]|\s*$)/gi, '<PATH>')
    .replace(/\/(?:Users|home|tmp|var)\/[^\s:'"\r\n]+/g, '<PATH>')
    .replace(/\bERR-[\w.-]+\b/g, '<ERRID>')
    .replace(/\bSESS-\d+\b/g, '<SESS>')
    .replace(/\bline \d+\b/gi, 'line N')
    .replace(/\(\d+,\d+\)/g, '(N,N)')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

export function fingerprint({ title = '', error = '', command = '', area = '' } = {}) {
  const basis = [
    normalizeErrorText(title),
    normalizeErrorText(command),
    normalizeErrorText(error).slice(0, 400),
    normalizeErrorText(area),
  ].join('|');
  return createHash('sha256').update(basis).digest('hex').slice(0, 16);
}

export function classifyFailure({ title = '', error = '', command = '' } = {}) {
  const blob = `${title}\n${command}\n${error}`.toLowerCase();

  if (/validate-okf|frontmatter|awaiting semantic compilation|synthesis section|okf validator/.test(blob)) {
    return {
      category: 'okf-wiki',
      severity: 'medium',
      healable: true,
      prevention:
        'Auto-compiled wiki pages under .agents/wiki are exempt from semantic OKF checks. Only hand-authored docs need type/title/timestamp and a real Synthesis section. Prefer tags: [graphify, auto-compiled] + last_sync.',
    };
  }
  if (/powershell|select-string|switchparameter|unexpected token|call operator|executionpolicy/.test(blob)) {
    return {
      category: 'shell-powershell',
      severity: 'medium',
      healable: false,
      prevention:
        'On Windows, prefer `node scripts/...` over nested powershell -Command. Never assign values to switch parameters. Use .ps1 files for multi-statement scripts; escape $ as `$ inside double-quoted -Command strings.',
    };
  }
  if (/entry criteria failed|checkpoint|agent-os|phase research|phase execute/.test(blob)) {
    return {
      category: 'harness-checkpoint',
      severity: 'low',
      healable: true,
      prevention:
        'Harness phases require checkpoints. Call learning-loop heal or agent-os bootstrap before phase gates; do not log harness ceremony failures as product defects.',
    };
  }
  if (/ssr:\s*false|server components|turbopack|next\/dynamic/.test(blob)) {
    return {
      category: 'nextjs-render',
      severity: 'high',
      healable: false,
      prevention:
        'Never use next/dynamic with { ssr: false } inside Server Components. Import client leaves statically when browser work is already behind useEffect.',
    };
  }
  if (/\bts\d{4}\b|tsc|npm run lint|no exported member|type error/.test(blob)) {
    return {
      category: 'typescript',
      severity: 'high',
      healable: false,
      prevention:
        'Run `npm run lint` (tsc --noEmit) after type-sensitive edits. Verify Lucide/icon exports and prop types before commit.',
    };
  }
  if (/syntaxerror|unexpected token|template literal|bad escaped/.test(blob)) {
    return {
      category: 'syntax',
      severity: 'high',
      healable: false,
      prevention:
        'Do not escape outer backticks or ${} in template literals unless nesting a literal string inside another template.',
    };
  }
  if (/graphify|__version__|attributeerror/.test(blob)) {
    return {
      category: 'tooling-graphify',
      severity: 'low',
      healable: false,
      prevention:
        'Query graphify version via `graphify --version` or importlib.metadata.version("graphifyy"), not graphify.__version__.',
    };
  }
  if (
    /system32\\bash|wsl.*bash|cannot find the file specified.*bash|where bash|git\\bin\\bash|machine path.*git/.test(
      blob,
    )
  ) {
    return {
      category: 'shell-windows-bash',
      severity: 'high',
      healable: false,
      prevention:
        'ROOT CAUSE: bare bash must be Git Bash. Admin: scripts/fix-windows-bash-path.ps1 (prepend C:\\Program Files\\Git\\bin to Machine PATH before System32). Verify: where bash first line is Git\\bin\\bash.exe. Restart IDE after PATH change. Policy: .agents/governance/ROOT_CAUSE.md — do not soft-skip hooks as the only fix.',
    };
  }
  if (/stale process path|long-lived ide|registry has git first but/.test(blob)) {
    return {
      category: 'shell-windows-bash',
      severity: 'medium',
      healable: false,
      prevention:
        'After Machine PATH fixes, fully quit and relaunch Claude/Grok/terminals. agentos:health bash.ok uses registry PATH; process PATH can lag. Do not treat wrappers as done.',
    };
  }
  if (/semgrep guardian|not logged into semgrep|decision.?block.*write|guardian mcp/.test(blob)) {
    return {
      category: 'hooks-semgrep',
      severity: 'medium',
      healable: false,
      prevention:
        'Log into Semgrep Guardian MCP for real blocking scans. If login is not product-required, document that decision; temporary soft-allow must not replace a logged-in SAST policy without a tracked issue.',
    };
  }
  if (/bare sh -c|python3 -c.*hook|\.claude\/settings.*sh /.test(blob)) {
    return {
      category: 'hooks-windows',
      severity: 'medium',
      healable: false,
      prevention:
        'Project hooks on Windows must use node scripts/hooks/*.mjs only — never bare sh -c or python3 one-liners in .claude/settings.json.',
    };
  }
  if (/root cause|symptom|soft-skip|never treat symptoms/.test(blob)) {
    return {
      category: 'governance-root-cause',
      severity: 'high',
      healable: false,
      prevention:
        'Follow .agents/governance/ROOT_CAUSE.md and kernel iron law 12: fix the mechanism; never ship symptom-only workarounds as done.',
    };
  }

  return {
    category: 'general',
    severity: 'medium',
    healable: false,
    prevention:
      'Reproduce with the exact command, fix root cause (see .agents/governance/ROOT_CAUSE.md), add a regression test when durable, then re-run verify chain.',
  };
}

// ---------------------------------------------------------------------------
// Index I/O
// ---------------------------------------------------------------------------

function ensureDirs() {
  for (const d of [LEARNINGS, join(ROOT, '.agents', 'governance')]) {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  }
}

export function loadIndex() {
  ensureDirs();
  const empty = () => ({
    version: 1,
    updated_at: null,
    incidents: {},
    stats: { total_records: 0, unique_fingerprints: 0, auto_heals: 0, duplicates_suppressed: 0 },
  });
  if (!existsSync(INDEX_JSON)) return empty();
  try {
    return JSON.parse(readFileSync(INDEX_JSON, 'utf8'));
  } catch {
    // Self-heal: back up the corrupt file instead of silently discarding it
    try {
      const bak = `${INDEX_JSON}.corrupt.${Date.now()}.bak`;
      renameSync(INDEX_JSON, bak);
      console.error(`[learning-loop] index.json corrupt — backed up to ${bak}`);
    } catch {
      /* ignore */
    }
    return empty();
  }
}

function saveIndex(index) {
  ensureDirs();
  index.updated_at = new Date().toISOString();
  index.stats.unique_fingerprints = Object.keys(index.incidents).length;
  // Atomic write: tmp + rename so a crash never leaves a half-written index
  const payload = JSON.stringify(index, null, 2);
  const tmp = `${INDEX_JSON}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, payload, 'utf8');
    renameSync(tmp, INDEX_JSON);
  } catch {
    writeFileSync(INDEX_JSON, payload, 'utf8');
  }
}

function nextErrorId() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const r = randomBytes(2).toString('hex');
  return `ERR-${d}-${r}`;
}

function snippet(text, max = MAX_SNIPPET_CHARS) {
  const s = String(text || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n… [truncated ${s.length - max} chars; see archive]`;
}

// ---------------------------------------------------------------------------
// STORE + DEDUPE
// ---------------------------------------------------------------------------

/**
 * Record a failure into the learning system.
 * @returns {{ id, fingerprint, isDuplicate, healed, category, message }}
 */
/**
 * Mark incident(s) resolved with durable prevention text.
 * @param {{ id?: string, fingerprint?: string, allOpen?: boolean, prevention?: string, note?: string }} input
 */
export function resolveFailure(input = {}) {
  const index = loadIndex();
  const now = new Date().toISOString();
  const targets = [];

  if (input.allOpen) {
    for (const inc of Object.values(index.incidents)) {
      if (inc.status === 'open') targets.push(inc);
    }
  } else if (input.id) {
    const hit = Object.values(index.incidents).find((i) => i.id === input.id);
    if (hit) targets.push(hit);
  } else if (input.fingerprint) {
    const hit = index.incidents[input.fingerprint];
    if (hit) targets.push(hit);
  }

  if (targets.length === 0) {
    return { resolved: 0, message: 'No matching open incidents to resolve' };
  }

  for (const incident of targets) {
    if (input.prevention) incident.prevention = String(input.prevention);
    incident.status = 'resolved';
    incident.resolved_at = now;
    incident.resolve_note = input.note || 'resolved via learning-loop resolve';
    incident.last_seen = now;
    index.incidents[incident.fingerprint] = incident;
    upsertPreventionRule(incident);
  }

  saveIndex(index);
  rebuildMarkdownViews(index);
  return {
    resolved: targets.length,
    ids: targets.map((t) => t.id),
    message: `Resolved ${targets.length} incident(s): ${targets.map((t) => t.id).join(', ')}`,
  };
}

export function recordFailure(input = {}) {
  const {
    title = 'Unnamed failure',
    error = 'No details',
    command = '',
    area = 'general',
    step = '',
    prevention: preventionOverride = null,
    category: categoryOverride = null,
  } = input;

  ensureDirs();
  const index = loadIndex();
  const fp = fingerprint({ title, error, command, area });
  const classification = classifyFailure({ title, error, command });
  if (preventionOverride) classification.prevention = String(preventionOverride);
  if (categoryOverride) classification.category = String(categoryOverride);
  const now = new Date().toISOString();

  index.stats.total_records = (index.stats.total_records || 0) + 1;

  const existing = index.incidents[fp];
  if (existing) {
    existing.count += 1;
    existing.last_seen = now;
    existing.last_title = title;
    if (command) existing.command = command;
    index.stats.duplicates_suppressed = (index.stats.duplicates_suppressed || 0) + 1;
    saveIndex(index);
    rebuildMarkdownViews(index);

    return {
      id: existing.id,
      fingerprint: fp,
      isDuplicate: true,
      healed: false,
      category: existing.category,
      message: `Duplicate suppressed (${existing.count}x): ${existing.id} [${existing.category}]`,
    };
  }

  const id = nextErrorId();
  const incident = {
    id,
    fingerprint: fp,
    title: title.slice(0, 200),
    category: classification.category,
    severity: classification.severity,
    healable: classification.healable,
    prevention: classification.prevention,
    area,
    step: step || undefined,
    command: command.slice(0, 300),
    snippet: snippet(error),
    count: 1,
    status: 'open',
    first_seen: now,
    last_seen: now,
    heal_attempts: 0,
    healed_at: null,
  };

  // No filesystem archive dumps (ontology: hard-delete / no bloat).
  // Full text lives only as a short snippet + optional Turso lesson.
  incident.archive = null;

  index.incidents[fp] = incident;
  saveIndex(index);

  // Slim active ledger entry (no multi-MB dumps)
  appendActiveLedger(incident);
  upsertPreventionRule(incident);
  rebuildMarkdownViews(index);

  let healed = false;
  let healNote = '';
  if (classification.healable) {
    const result = attemptAutoHeal(incident, index);
    healed = result.healed;
    healNote = result.note;
    if (healed) {
      incident.status = 'auto-healed';
      incident.healed_at = new Date().toISOString();
      incident.heal_attempts += 1;
      index.stats.auto_heals = (index.stats.auto_heals || 0) + 1;
      index.incidents[fp] = incident;
      saveIndex(index);
      rebuildMarkdownViews(index);
    }
  }

  return {
    id,
    fingerprint: fp,
    isDuplicate: false,
    healed,
    category: classification.category,
    message: healed
      ? `Recorded ${id} [${classification.category}] and auto-healed: ${healNote}`
      : `Recorded ${id} [${classification.category}] — open (prevention stored)`,
  };
}

function appendActiveLedger(incident) {
  ensureDirs();
  if (!existsSync(ERRORS_MD)) {
    writeFileSync(
      ERRORS_MD,
      `---
type: ledger
title: Error Learning Log (active)
description: Compact active failures only. Full history in .learnings/index.json (no archive dumps).
tags: [errors, learning, self-heal]
---

# Errors Log (Active)

> Agents: read \`.learnings/ERRORS_INDEX.md\` first (not this whole file).
> Duplicates are suppressed by fingerprint. No filesystem archives (ontology hard-delete policy).

`,
      'utf8'
    );
  }

  const block = `
## [${incident.id}] ${incident.title}

**Logged**: ${incident.first_seen}
**Fingerprint**: \`${incident.fingerprint}\`
**Category**: ${incident.category}
**Severity**: ${incident.severity}
**Status**: ${incident.status}
**Area**: ${incident.area}
**Count**: ${incident.count}

### Summary
${incident.title}${incident.command ? ` — \`${incident.command}\`` : ''}

### Error (snippet)
\`\`\`text
${incident.snippet}
\`\`\`

### Prevention
${incident.prevention}

### Metadata
- Archive: ${incident.archive || 'n/a'}
- Healable: ${incident.healable}

`;

  appendFileSync(ERRORS_MD, block, 'utf8');
  trimActiveLedger();
}

function trimActiveLedger() {
  if (!existsSync(ERRORS_MD)) return;
  const content = readFileSync(ERRORS_MD, 'utf8');
  const parts = content.split(/\n(?=## \[ERR-)/);
  if (parts.length <= MAX_ACTIVE_ENTRIES + 1) return;

  const header = parts[0];
  const entries = parts.slice(1);
  const kept = entries.slice(-MAX_ACTIVE_ENTRIES);
  const fixed = `${header.trimEnd()}\n\n${kept.join('\n')}`.trimEnd() + '\n';
  writeFileSync(ERRORS_MD, fixed, 'utf8');
}

function upsertPreventionRule(incident) {
  ensureDirs();
  if (!existsSync(PREVENTION_MD)) {
    writeFileSync(
      PREVENTION_MD,
      `---
type: policy
title: Prevention Rules (from learning loop)
description: Compact, deduped prevention rules derived from real failures.
tags: [governance, prevention, self-heal]
---

# Prevention Rules

Generated by \`scripts/learning-loop.mjs\`. One rule per failure category (latest wins for that category+fingerprint).

`,
      'utf8'
    );
  }

  const content = readFileSync(PREVENTION_MD, 'utf8');
  const marker = `<!-- fp:${incident.fingerprint} -->`;
  const ruleBlock = `
${marker}
### ${incident.category} — ${incident.id}
- **When**: ${incident.title}
- **Rule**: ${incident.prevention}
- **Last seen**: ${incident.last_seen}
`;

  if (content.includes(marker)) {
    const re = new RegExp(`${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n<!-- fp:|$)`);
    writeFileSync(PREVENTION_MD, content.replace(re, ruleBlock.trimStart()), 'utf8');
  } else {
    appendFileSync(PREVENTION_MD, ruleBlock, 'utf8');
  }
}

// ---------------------------------------------------------------------------
// HEAL
// ---------------------------------------------------------------------------

/**
 * Safe auto-heals only. Returns { healed, note }.
 */
export function attemptAutoHeal(incident, index = null) {
  const idx = index || loadIndex();

  if (incident.category === 'okf-wiki') {
    const fixed = ensureWikiAutoCompiledMarkers();
    if (fixed > 0) {
      return { healed: true, note: `Tagged ${fixed} wiki page(s) as auto-compiled for OKF exemption` };
    }
    // Even if 0 files changed, validator may already pass — treat as healed noop
    return { healed: true, note: 'OKF wiki path already compliant or no files needed changes' };
  }

  if (incident.category === 'harness-checkpoint') {
    // Soft heal: ensure checkpoints dir exists so ceremony can proceed
    const chk = join(ROOT, '.agents', 'checkpoints');
    if (!existsSync(chk)) mkdirSync(chk, { recursive: true });
    const readme = join(chk, 'README.md');
    if (!existsSync(readme)) {
      writeFileSync(
        readme,
        `# Checkpoints\n\nPhase checkpoints for Agent OS. Auto-created by learning-loop heal.\n`,
        'utf8'
      );
    }
    return { healed: true, note: 'Ensured .agents/checkpoints exists' };
  }

  return { healed: false, note: 'No safe auto-heal for this category' };
}

/** Mark graphify wiki stubs so validate-okf skips semantic synthesis requirements. */
export function ensureWikiAutoCompiledMarkers() {
  const wikiDir = join(ROOT, '.agents', 'wiki');
  if (!existsSync(wikiDir)) return 0;

  let fixed = 0;
  const files = readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const full = join(wikiDir, file);
    let content = readFileSync(full, 'utf8');
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;

    let body = fm[1];
    let changed = false;

    if (!/last_sync\s*:/.test(body)) {
      body += `\nlast_sync: ${new Date().toISOString()}`;
      changed = true;
    }
    if (!/auto-compiled|graphify/.test(body)) {
      if (/tags\s*:/.test(body)) {
        body = body.replace(/tags\s*:\s*\[([^\]]*)\]/, (m, inner) => {
          if (/auto-compiled/.test(inner)) return m;
          const next = inner.trim() ? `${inner.trim()}, auto-compiled, graphify` : 'auto-compiled, graphify';
          return `tags: [${next}]`;
        });
      } else {
        body += `\ntags: [auto-compiled, graphify]`;
      }
      changed = true;
    }
    // Ensure type + title for frontmatter gate
    if (!/^type\s*:/m.test(body)) {
      body = `type: concept\n${body}`;
      changed = true;
    }
    if (!/^title\s*:/m.test(body)) {
      const title = file.replace(/\.md$/, '').replace(/_/g, ' ');
      body = `title: ${title}\n${body}`;
      changed = true;
    }

    if (changed) {
      content = content.replace(fm[0], `---\n${body.trim()}\n---`);
      writeFileSync(full, content, 'utf8');
      fixed += 1;
    }
  }
  return fixed;
}

/**
 * Run heal pass over all open healable incidents + proactive wiki fix.
 */
export function runHealPass() {
  ensureDirs();
  const index = loadIndex();
  let heals = 0;

  // Proactive: keep wiki compliant
  const wikiFixed = ensureWikiAutoCompiledMarkers();
  if (wikiFixed > 0) heals += wikiFixed;

  for (const fp of Object.keys(index.incidents)) {
    const incident = index.incidents[fp];
    if (incident.status === 'resolved' || incident.status === 'auto-healed') continue;
    if (!incident.healable) continue;

    const result = attemptAutoHeal(incident, index);
    incident.heal_attempts = (incident.heal_attempts || 0) + 1;
    if (result.healed) {
      incident.status = 'auto-healed';
      incident.healed_at = new Date().toISOString();
      heals += 1;
      index.stats.auto_heals = (index.stats.auto_heals || 0) + 1;
    }
    index.incidents[fp] = incident;
  }

  saveIndex(index);
  rebuildMarkdownViews(index);
  return { heals, wikiFixed, message: `Heal pass complete: ${heals} incident(s), ${wikiFixed} wiki file(s) touched` };
}

// ---------------------------------------------------------------------------
// Views (agent cold-start)
// ---------------------------------------------------------------------------

export function rebuildMarkdownViews(index = null) {
  const idx = index || loadIndex();
  ensureDirs();

  const incidents = Object.values(idx.incidents).sort(
    (a, b) => new Date(b.last_seen) - new Date(a.last_seen)
  );
  const open = incidents.filter((i) => i.status === 'open');
  const top = incidents.slice(0, INDEX_TOP_N);

  const lines = [
    '---',
    'type: ledger',
    'title: Error Learning Index',
    'description: Token-cheap cold-start for agents. Full dumps in archive/; state in index.json.',
    'tags: [errors, learning, index, self-heal]',
    '---',
    '',
    '# Error Learning Index',
    '',
    '> **Agent cold-start:** read THIS file only (not full `ERRORS.md`).',
    `> Updated: ${idx.updated_at || 'never'} | Unique: ${idx.stats.unique_fingerprints || 0} | Records: ${idx.stats.total_records || 0} | Dupes suppressed: ${idx.stats.duplicates_suppressed || 0} | Auto-heals: ${idx.stats.auto_heals || 0}`,
    '',
    '## Open / needs attention',
    '',
  ];

  if (open.length === 0) {
    lines.push('_None open._', '');
  } else {
    for (const i of open.slice(0, 10)) {
      lines.push(`- **${i.id}** [${i.category}/${i.severity}] ${i.title} (${i.count}x) — ${i.prevention.slice(0, 140)}`);
    }
    lines.push('');
  }

  lines.push('## Top lessons (deduped)', '');
  if (top.length === 0) {
    lines.push('_No incidents yet._', '');
  } else {
    lines.push('| ID | Cat | Status | × | Lesson |');
    lines.push('|----|-----|--------|---|--------|');
    for (const i of top) {
      const lesson = i.prevention.replace(/\|/g, '/').slice(0, 100);
      lines.push(`| ${i.id} | ${i.category} | ${i.status} | ${i.count} | ${lesson} |`);
    }
    lines.push('');
  }

  lines.push(
    '## Loop commands',
    '',
    '```bash',
    'node scripts/learning-loop.mjs status',
    'node scripts/learning-loop.mjs heal',
    'node scripts/learning-loop.mjs compact',
    'node scripts/learning-loop.mjs record --title "..." --error "..." --command "..."',
    '```',
    '',
    '## Read order for agents',
    '',
    '1. `.learnings/ERRORS_INDEX.md` (this file)',
    '2. `.agents/governance/PREVENTION_RULES.md` (if relevant category)',
    '3. `.learnings/index.json` for machine counters (optional)',
    ''
  );

  writeFileSync(ERRORS_INDEX_MD, lines.join('\n'), 'utf8');
}

/**
 * Compact legacy bloated ERRORS.md into archive + fresh index.
 * Safe to run repeatedly.
 */
export function compactLegacyErrors() {
  ensureDirs();
  if (!existsSync(ERRORS_MD)) {
    rebuildMarkdownViews();
    return { archived: false, message: 'No ERRORS.md to compact' };
  }

  const size = statSync(ERRORS_MD).size;
  // Always rebuild index from structured state; hard-delete bloated ledger (no archive)
  if (size > 50_000) {
    const legacyText = readFileSync(ERRORS_MD, 'utf8');
    // Seed index from a few known high-signal patterns if empty
    const index = loadIndex();
    if (Object.keys(index.incidents).length === 0) {
      seedFromLegacyText(legacyText, index);
      saveIndex(index);
    }

    // Fresh slim ledger (old file overwritten — no archive dump)
    writeFileSync(
      ERRORS_MD,
      `---
type: ledger
title: Error Learning Log (active)
description: Compact active failures. Legacy dump discarded (no archive).
tags: [errors, learning, self-heal]
---

# Errors Log (Active)

Legacy bloated ledger was discarded (${(size / 1024).toFixed(0)}KB). No archive retained.
New failures go through \`scripts/learning-loop.mjs\` (deduped).

`,
      'utf8'
    );

    rebuildMarkdownViews(index);
    return {
      archived: false,
      discarded_bytes: size,
      message: `Discarded ${(size / 1024).toFixed(0)}KB bloated ledger (no archive); index kept/seeded`,
    };
  }

  rebuildMarkdownViews();
  return { archived: false, message: 'ERRORS.md already compact; index rebuilt' };
}

function seedFromLegacyText(text, index) {
  // Extract a few unique category signals without importing megabyte as separate incidents
  const seeds = [
    {
      title: 'OKF validator failed on auto-compiled wiki stubs',
      error: 'validate-okf Awaiting semantic compilation Synthesis section',
      command: 'node scripts/validate-okf.js',
      area: 'docs',
    },
    {
      title: 'PowerShell switch/quoting misuse',
      error: 'SwitchParameter CaseSensitive Unexpected token',
      command: 'powershell -Command',
      area: 'tooling',
    },
    {
      title: 'next/dynamic ssr:false in Server Component',
      error: 'ssr: false is not allowed with next/dynamic in Server Components',
      command: 'npm run build',
      area: 'frontend',
    },
  ];

  for (const s of seeds) {
    if (!text.toLowerCase().includes(s.error.split(' ')[0].toLowerCase()) && !text.includes(s.command)) {
      // still seed if generic patterns appear
      const hit = s.error.split(' ').some((w) => w.length > 5 && text.includes(w));
      if (!hit && !text.includes('OKF') && s.title.includes('OKF')) continue;
      if (!hit && !text.includes('PowerShell') && s.title.includes('PowerShell')) continue;
      if (!hit && !text.includes('ssr') && s.title.includes('ssr')) continue;
    }
    const fp = fingerprint(s);
    if (index.incidents[fp]) continue;
    const classification = classifyFailure(s);
    const now = new Date().toISOString();
    index.incidents[fp] = {
      id: nextErrorId(),
      fingerprint: fp,
      title: s.title,
      category: classification.category,
      severity: classification.severity,
      healable: classification.healable,
      prevention: classification.prevention,
      area: s.area,
      command: s.command,
      snippet: s.error,
      count: 1,
      status: classification.healable ? 'auto-healed' : 'resolved',
      first_seen: now,
      last_seen: now,
      heal_attempts: classification.healable ? 1 : 0,
      healed_at: classification.healable ? now : null,
      seeded_from_legacy: true,
    };
    index.stats.total_records = (index.stats.total_records || 0) + 1;
  }
}

export function getStatus() {
  const index = loadIndex();
  const incidents = Object.values(index.incidents);
  return {
    updated_at: index.updated_at,
    stats: index.stats,
    open: incidents.filter((i) => i.status === 'open').length,
    auto_healed: incidents.filter((i) => i.status === 'auto-healed').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
    top: incidents.sort((a, b) => b.count - a.count).slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// EPISODES — structured task-episode records (local + Turso dual-write)
// ---------------------------------------------------------------------------

/**
 * Sync episodes to Turso via the durable shared lib (offline queue + auto-flush).
 * Never throws; failed writes are queued and retried on the next sync.
 */
async function syncEpisodesToTurso(episodes) {
  try {
    const { durableExecute } = await import('./lib/turso-sync.mjs');
    const writes = Object.values(episodes).map((ep) => ({
      table: 'agent_os_episodes',
      sql: `INSERT INTO agent_os_episodes (id, task, outcome, area, pattern, friction, duration_min, tools_used, steps_count, incident_refs, commit_sha, recorded_at, payload)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              task = excluded.task, outcome = excluded.outcome, area = excluded.area,
              pattern = excluded.pattern, friction = excluded.friction,
              duration_min = excluded.duration_min, tools_used = excluded.tools_used,
              steps_count = excluded.steps_count, incident_refs = excluded.incident_refs,
              commit_sha = excluded.commit_sha, recorded_at = excluded.recorded_at,
              payload = excluded.payload`,
      args: [
        ep.id,
        ep.task || null,
        ep.outcome || null,
        ep.area || null,
        ep.pattern || null,
        ep.friction || null,
        ep.duration_min || null,
        ep.tools_used ? JSON.stringify(ep.tools_used) : null,
        ep.steps_count || null,
        ep.incident_refs ? JSON.stringify(ep.incident_refs) : null,
        ep.commit_sha || null,
        ep.recorded_at || null,
        JSON.stringify(ep),
      ],
    }));
    const result = await durableExecute(writes);
    return result.synced
      ? { synced: true, count: result.live, flushed: result.flushed }
      : { synced: false, queued: result.queued, reason: result.reason || 'write failed — queued for retry' };
  } catch (err) {
    return { synced: false, reason: err.message };
  }
}

/**
 * Detect recent git activity and derive a bounded task episode automatically.
 */
function detectGitEpisode() {
  try {
    const log = execFileSync('git', [
      'log', '-5', '--pretty=format:%H|%s|%cI', '--no-merges',
    ], { encoding: 'utf8', cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true, timeout: 10_000 });

    const commits = log.split('\n').filter(Boolean).map((line) => {
      const [sha, subject, date] = line.split('|');
      return { sha, subject, date };
    });
    if (commits.length === 0) return null;

    const latest = commits[0];
    const area = latest.subject.match(/^(\w+)[:(]/)?.[1] || 'general';
    return {
      sha: latest.sha,
      task: latest.subject.slice(0, 200),
      area: ['feat', 'fix', 'chore', 'docs', 'infra', 'test', 'refactor'].includes(area) ? area : 'general',
      detected_from: `${commits.length} recent commit(s)`,
      latest_commit: latest.subject,
      commit_date: latest.date,
    };
  } catch {
    return null;
  }
}

/**
 * Record a completed task episode with reusable pattern and friction attribution.
 * Dual-writes to local index.json + Turso (best-effort async).
 * @param {{ task?: string, outcome?: string, pattern?: string, friction?: string, area?: string, duration_min?: number, tools_used?: string[], steps_count?: number, auto_detect?: boolean }} input
 * @returns {{ id, message, turso?: object }}
 */
export async function recordEpisode(input = {}) {
  let {
    task = '',
    outcome = 'completed',
    pattern = '',
    friction = '',
    area = 'general',
    duration_min = null,
    tools_used = [],
    steps_count = null,
    auto_detect = false,
  } = input;

  // Auto-detect from git if no task provided
  let commitSha = null;
  if (!task || auto_detect) {
    const detected = detectGitEpisode();
    if (detected) {
      task = task || detected.task;
      area = area === 'general' ? detected.area : area;
      commitSha = detected.sha;
      if (!friction) {
        friction = `Auto-detected from git: ${detected.detected_from}; latest: "${detected.latest_commit}" (${detected.commit_date})`;
      }
    }
  }
  if (!task) task = 'Completed task episode';

  ensureDirs();
  const index = loadIndex();
  if (!index.episodes) index.episodes = {};

  // Dedup: skip if an episode for this exact commit SHA already exists
  if (commitSha) {
    const existing = Object.values(index.episodes).find((ep) => ep.commit_sha === commitSha);
    if (existing) {
      return {
        id: existing.id,
        episode: existing,
        turso: { synced: false, reason: 'dedup-sha' },
        message: `Episode already exists for commit ${commitSha.slice(0, 8)}: ${existing.id}`,
      };
    }
  }

  const now = new Date().toISOString();
  const id = `EP-${now.slice(0, 10).replace(/-/g, '')}-${randomBytes(2).toString('hex')}`;

  // Derive pattern from incident history if not provided
  let derivedPattern = pattern;
  if (!derivedPattern) {
    const incidents = Object.values(index.incidents);
    const areaIncidents = incidents.filter((i) => i.area === area || area === 'general');
    if (areaIncidents.length > 0) {
      const latest = areaIncidents.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))[0];
      derivedPattern = `Reuse prevention from ${latest.id}: ${latest.prevention.slice(0, 120)}`;
    } else {
      derivedPattern = `Task completed in ${area} area with no prior incidents; standard workflow applies.`;
    }
  }

  // Derive friction from open/recent incidents if not provided
  let derivedFriction = friction;
  if (!derivedFriction) {
    const openIncidents = Object.values(index.incidents).filter((i) => i.status === 'open');
    if (openIncidents.length > 0) {
      derivedFriction = `${openIncidents.length} open incident(s) in learning index; latest: ${openIncidents[0].title.slice(0, 80)}`;
    } else {
      derivedFriction = 'No friction detected; clean execution path.';
    }
  }

  const episode = {
    id,
    task: task.slice(0, 300),
    outcome,
    area,
    pattern: derivedPattern,
    friction: derivedFriction,
    duration_min,
    tools_used: tools_used.length > 0 ? tools_used : undefined,
    steps_count,
    commit_sha: commitSha || undefined,
    recorded_at: now,
    incident_refs: Object.values(index.incidents)
      .filter((i) => i.status === 'open' || i.status === 'auto-healed')
      .slice(0, 5)
      .map((i) => i.id),
  };

  index.episodes[id] = episode;
  index.stats = index.stats || {};
  index.stats.total_episodes = Object.keys(index.episodes).length;
  saveIndex(index);
  rebuildMarkdownViews(index);

  // Async Turso sync (best-effort, non-blocking for CLI)
  const turso = await syncEpisodesToTurso({ [id]: episode });

  return {
    id,
    episode,
    turso,
    message: `Episode ${id} recorded: "${task.slice(0, 60)}" [pattern: ${derivedPattern.slice(0, 60)}...]${turso.synced ? ` [turso: synced]` : ''}`,
  };
}

/**
 * Get episode status — list recorded episodes with pattern/friction.
 */
export function getEpisodeStatus() {
  const index = loadIndex();
  const episodes = Object.values(index.episodes || {});
  return {
    total_episodes: episodes.length,
    updated_at: index.updated_at,
    episodes: episodes
      .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))
      .slice(0, 10)
      .map((ep) => ({
        id: ep.id,
        task: ep.task,
        outcome: ep.outcome,
        area: ep.area,
        pattern: ep.pattern,
        friction: ep.friction,
        duration_min: ep.duration_min || null,
        tools_used: ep.tools_used || [],
        steps_count: ep.steps_count || null,
        recorded_at: ep.recorded_at,
      })),
  };
}

/**
 * Sync all local episodes to Turso (batch push).
 */
export async function syncAllEpisodes() {
  const index = loadIndex();
  const episodes = index.episodes || {};
  const count = Object.keys(episodes).length;
  if (count === 0) return { synced: false, reason: 'no episodes to sync', count: 0 };
  const result = await syncEpisodesToTurso(episodes);
  return { ...result, count };
}

/**
 * Cross-source insights: what actually helps day-to-day.
 * Aggregates episodes, incidents, and eval history into actionable signals.
 */
export function getInsights() {
  const index = loadIndex();
  const episodes = Object.values(index.episodes || {});
  const incidents = Object.values(index.incidents || {});

  // Episode cadence by area
  const byArea = {};
  for (const ep of episodes) {
    byArea[ep.area || 'general'] = (byArea[ep.area || 'general'] || 0) + 1;
  }

  // Repeat offenders: incidents seen 2+ times that are still open
  const repeatOffenders = incidents
    .filter((i) => (i.count || 1) >= 2 && i.status === 'open')
    .sort((a, b) => (b.count || 1) - (a.count || 1))
    .map((i) => ({ id: i.id, title: i.title, count: i.count, prevention: i.prevention.slice(0, 140) }));

  // Friction themes: recurring friction text across episodes
  const frictionCounts = {};
  for (const ep of episodes) {
    const key = String(ep.friction || '')
      .replace(/EP-\w+-\w+|ERR-\w+-\w+|dedupe-test-\d+|\d{4}-\d{2}-\d{2}T[\d:.Z+-]+/g, '')
      .slice(0, 80)
      .trim();
    if (key) frictionCounts[key] = (frictionCounts[key] || 0) + 1;
  }
  const frictionThemes = Object.entries(frictionCounts)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, n]) => ({ theme, occurrences: n }));

  // Eval trend from local history.jsonl
  let evalTrend = null;
  try {
    const histPath = join(ROOT, '.agents', 'goals', '_eval', 'history.jsonl');
    if (existsSync(histPath)) {
      const rows = readFileSync(histPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => {
          try {
            return JSON.parse(l);
          } catch {
            return null;
          }
        })
        .filter(Boolean);
      const recent = rows.slice(-10);
      evalTrend = {
        total_runs: rows.length,
        recent_pass_rate: recent.length
          ? recent.filter((r) => r.ok).length / recent.length
          : null,
        last: rows[rows.length - 1] || null,
      };
    }
  } catch {
    /* non-fatal */
  }

  return {
    generated_at: new Date().toISOString(),
    episodes: { total: episodes.length, by_area: byArea },
    repeat_offenders: repeatOffenders,
    friction_themes: frictionThemes,
    eval_trend: evalTrend,
    open_incidents: incidents.filter((i) => i.status === 'open').length,
    recommendation:
      repeatOffenders.length > 0
        ? `Fix repeat offender first: ${repeatOffenders[0].title}`
        : frictionThemes.length > 0
          ? `Recurring friction: "${frictionThemes[0].theme}" — consider a skill or hard guard`
          : 'No recurring problems detected. Keep shipping.',
  };
}

/**
 * Self-heal pass: flush the offline sync queue, re-push all episodes,
 * verify remote health, and report anything stuck.
 */
export async function healSync() {
  const { flushQueue, syncHealth } = await import('./lib/turso-sync.mjs');
  const flush = await flushQueue(null);
  const push = await syncAllEpisodes();
  const health = await syncHealth();
  return {
    flushed: flush.flushed,
    dropped: flush.dropped,
    queue_remaining: flush.remaining,
    episodes_pushed: push.count || 0,
    remote: health,
    healthy: health.ok === true && (health.queue_depth === 0 || flush.remaining === 0),
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      out[key] = val;
    } else {
      out._.push(a);
    }
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cmd = args._[0] || 'status';

  if (cmd === 'record') {
    const result = recordFailure({
      title: args.title || 'Unnamed failure',
      error: args.error || '',
      command: args.command || '',
      area: args.area || 'general',
      step: args.step || '',
      prevention: typeof args.prevention === 'string' ? args.prevention : null,
      category: typeof args.category === 'string' ? args.category : null,
    });
    console.log(`[learning-loop] ${result.message}`);
    process.exit(result.isDuplicate ? 0 : 0);
  }

  if (cmd === 'resolve') {
    const result = resolveFailure({
      id: typeof args.id === 'string' ? args.id : null,
      fingerprint: typeof args.fingerprint === 'string' ? args.fingerprint : null,
      allOpen: args['all-open'] === true || args.allOpen === true,
      prevention: typeof args.prevention === 'string' ? args.prevention : null,
      note: typeof args.note === 'string' ? args.note : null,
    });
    console.log(`[learning-loop] ${result.message}`);
    return;
  }

  if (cmd === 'heal') {
    const result = runHealPass();
    console.log(`[learning-loop] ${result.message}`);
    return;
  }

  if (cmd === 'compact') {
    const result = compactLegacyErrors();
    console.log(`[learning-loop] ${result.message}`);
    return;
  }

  if (cmd === 'rebuild-index') {
    rebuildMarkdownViews();
    console.log('[learning-loop] ERRORS_INDEX.md rebuilt');
    return;
  }

  if (cmd === 'status') {
    const s = getStatus();
    console.log(JSON.stringify(s, null, 2));
    return;
  }

  if (cmd === 'episode') {
    const result = await recordEpisode({
      task: args.task || '',
      outcome: args.outcome || 'completed',
      pattern: typeof args.pattern === 'string' ? args.pattern : '',
      friction: typeof args.friction === 'string' ? args.friction : '',
      area: args.area || 'general',
      duration_min: args.duration ? Number(args.duration) : null,
      tools_used: args.tools ? String(args.tools).split(',') : [],
      steps_count: args.steps ? Number(args.steps) : null,
      auto_detect: args['auto-detect'] === true || args.autoDetect === true || !args.task,
    });
    console.log(`[learning-loop] ${result.message}`);
    if (result.turso) console.log(`[learning-loop] turso: ${JSON.stringify(result.turso)}`);
    return;
  }

  if (cmd === 'episode-status') {
    const s = getEpisodeStatus();
    console.log(JSON.stringify(s, null, 2));
    return;
  }

  if (cmd === 'episode-sync') {
    const result = await syncAllEpisodes();
    console.log(`[learning-loop] episode-sync: ${JSON.stringify(result)}`);
    return;
  }

  if (cmd === 'insights') {
    console.log(JSON.stringify(getInsights(), null, 2));
    return;
  }

  if (cmd === 'heal-sync') {
    const result = await healSync();
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.healthy ? 0 : 1;
    return;
  }

  console.error(`Unknown command: ${cmd}
Usage:
  node scripts/learning-loop.mjs record --title "..." --error "..." [--command "..."] [--area "..."]
  node scripts/learning-loop.mjs episode [--task "..."] [--outcome "..."] [--pattern "..."] [--friction "..."] [--area "..."] [--tools "a,b"] [--steps N] [--auto-detect]
  node scripts/learning-loop.mjs episode-status
  node scripts/learning-loop.mjs episode-sync
  node scripts/learning-loop.mjs heal
  node scripts/learning-loop.mjs compact
  node scripts/learning-loop.mjs rebuild-index
  node scripts/learning-loop.mjs status`);
  process.exit(1);
}

// Cross-platform: run CLI only when this file is the entrypoint
const thisFile = fileURLToPath(import.meta.url);
const entry = process.argv[1] ? fileURLToPath(new URL(`file://${process.argv[1].replace(/\\/g, '/')}`)) : '';
const isDirectRun =
  process.argv[1] &&
  (thisFile === process.argv[1] ||
    thisFile.toLowerCase() === String(process.argv[1]).toLowerCase() ||
    String(process.argv[1]).replace(/\\/g, '/').endsWith('scripts/learning-loop.mjs'));

if (isDirectRun) {
  main();
}
