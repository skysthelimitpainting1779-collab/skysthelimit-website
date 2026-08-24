#!/usr/bin/env node
/**
 * Goal-driven ship loop (Karpathy #4 + RPI).
 *
 *   npm run goal -- start "Fix lead form validation"
 *   npm run goal -- status
 *   npm run goal -- phase research|plan|implement
 *   npm run goal:verify
 *   npm run goal -- done
 *   npm run goal -- list
 *   npm run goal -- abort
 *
 * State: .agents/goals/<slug>/GOAL.md + phase files + active.json
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const GOALS = join(ROOT, '.agents', 'goals');
const ACTIVE = join(GOALS, 'active.json');

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || `goal-${Date.now()}`;
}

function ensureGoalsDir() {
  if (!existsSync(GOALS)) mkdirSync(GOALS, { recursive: true });
  const gitkeep = join(GOALS, '.gitkeep');
  if (!existsSync(gitkeep)) writeFileSync(gitkeep, '');
}

function readActive() {
  if (!existsSync(ACTIVE)) return null;
  try {
    return JSON.parse(readFileSync(ACTIVE, 'utf8'));
  } catch {
    return null;
  }
}

function writeActive(data) {
  ensureGoalsDir();
  data.heartbeat = new Date().toISOString();
  writeFileSync(ACTIVE, JSON.stringify(data, null, 2) + '\n');
}

/** Hours without heartbeat before a goal is considered stale. */
const STALE_HOURS = 2;

function isStale(active) {
  if (!active?.heartbeat) return false;
  const age = Date.now() - new Date(active.heartbeat).getTime();
  return age > STALE_HOURS * 3600_000;
}

function goalDir(slug) {
  return join(GOALS, slug);
}

function cmdStart(title) {
  ensureGoalsDir();
  const existing = readActive();
  if (existing?.slug && existing.status === 'active') {
    console.error(
      `[goal] Already active: ${existing.slug}\n  finish with: npm run goal -- done\n  or abort: npm run goal -- abort`,
    );
    process.exit(1);
  }
  const slug = slugify(title);
  const dir = goalDir(slug);
  mkdirSync(dir, { recursive: true });
  const now = new Date().toISOString();
  const goalMd = `---
type: goal
slug: ${slug}
title: ${JSON.stringify(title)}
status: active
phase: research
created: ${now}
---

# GOAL: ${title}

## Success criteria (edit these — must be verifiable)

- [ ] \`npm run lint\` passes
- [ ] \`npm test\` passes (or N/A if no tests touched — say why)
- [ ] Behavior matches: _fill in expected outcome_
- [ ] No unrelated files changed

## Loop

1. **Research** → \`research.md\` — graph:query, 1–3 files, risks
2. **Plan** → \`plan.md\` — steps with verify checks
3. **Implement** → code; re-run \`npm run goal:verify\` until green
4. **Done** → \`npm run goal -- done\` only after verify

## Commands

\`\`\`bash
npm run goal -- phase research
npm run goal -- phase plan
npm run goal -- phase implement
npm run goal:verify
npm run goal -- done
\`\`\`
`;
  writeFileSync(join(dir, 'GOAL.md'), goalMd);
  writeFileSync(
    join(dir, 'research.md'),
    `# Research — ${title}\n\n## Graph query\n\n\`\`\`bash\nnpm run graph:query -- "${title}"\n\`\`\`\n\n## Files / flows\n\n- \n\n## Risks\n\n- \n`,
  );
  writeFileSync(
    join(dir, 'plan.md'),
    `# Plan — ${title}\n\n| Step | Change | Verify |\n|------|--------|--------|\n| 1 | | |\n| 2 | | |\n\n## Out of scope\n\n- \n`,
  );
  const meta = {
    slug,
    title,
    status: 'active',
    phase: 'research',
    created: now,
    path: `.agents/goals/${slug}`,
  };
  writeActive(meta);
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'start',
        ...meta,
        next: [
          `Open ${meta.path}/GOAL.md and fill success criteria`,
          'Research: npm run graph:query + edit research.md',
          'npm run goal -- phase plan when research is solid',
        ],
      },
      null,
      2,
    ),
  );
}

function cmdPhase(phase) {
  const allowed = ['research', 'plan', 'implement'];
  if (!allowed.includes(phase)) {
    console.error(`[goal] phase must be one of: ${allowed.join(', ')}`);
    process.exit(1);
  }
  const active = readActive();
  if (!active?.slug) {
    console.error('[goal] No active goal. npm run goal -- start "title"');
    process.exit(1);
  }
  active.phase = phase;
  active.updated = new Date().toISOString();
  writeActive(active);
  const dir = goalDir(active.slug);
  if (existsSync(join(dir, 'meta.json'))) {
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(active, null, 2) + '\n');
  }
  // touch GOAL.md phase frontmatter lightly
  const gp = join(dir, 'GOAL.md');
  if (existsSync(gp)) {
    let t = readFileSync(gp, 'utf8');
    t = t.replace(/^phase:.*$/m, `phase: ${phase}`);
    writeFileSync(gp, t);
  }
  // Best-effort: sync goal lifecycle to Turso
  syncGoalToTurso(active, null).catch(() => {});
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'phase',
        slug: active.slug,
        phase,
        open: phase === 'research' ? `${active.path}/research.md` : phase === 'plan' ? `${active.path}/plan.md` : 'src/ + goal:verify',
      },
      null,
      2,
    ),
  );
}

function runVerify({ build = false } = {}) {
  const steps = [
    { name: 'lint', cmd: ['npm', 'run', 'lint'] },
    { name: 'test', cmd: ['npm', 'test'] },
  ];
  if (build) steps.push({ name: 'build', cmd: ['npm', 'run', 'build'] });

  const results = [];
  let ok = true;
  for (const s of steps) {
    const r = spawnSync(s.cmd[0], s.cmd.slice(1), {
      cwd: ROOT,
      encoding: 'utf8',
      shell: true,
      env: process.env,
    });
    const pass = r.status === 0;
    if (!pass) ok = false;
    results.push({
      name: s.name,
      pass,
      status: r.status,
      tail: `${r.stdout || ''}${r.stderr || ''}`.slice(-1200),
    });
  }
  return { ok, at: new Date().toISOString(), results };
}

async function cmdVerify(args) {
  const build = args.includes('--build');
  const active = readActive();
  console.error(`[goal] verify${build ? ' + build' : ''}…`);
  const out = runVerify({ build });
  ensureGoalsDir();
  const evalDir = join(GOALS, '_eval');
  mkdirSync(evalDir, { recursive: true });
  const payload = {
    ...out,
    goal: active?.slug || null,
    graders: 'deterministic (lint, test' + (build ? ', build' : '') + ')',
    note: 'Anthropic: prefer code graders over self-assessment',
  };
  writeFileSync(join(evalDir, 'last.json'), JSON.stringify(payload, null, 2) + '\n');
  // Durable append-only local history (mirrors ship_loop_evals)
  try {
    const histLine = JSON.stringify({
      at: payload.at,
      ok: payload.ok,
      pass_rate: (payload.results || []).filter((r) => r.pass).length / Math.max((payload.results || []).length, 1),
      graders: (payload.results || []).map((r) => ({ name: r.name, pass: r.pass, status: r.status })),
    });
    writeFileSync(join(evalDir, 'history.jsonl'), (existsSync(join(evalDir, 'history.jsonl')) ? readFileSync(join(evalDir, 'history.jsonl'), 'utf8') : '') + histLine + '\n');
  } catch {
    /* non-fatal */
  }
  if (active?.slug) {
    const dir = goalDir(active.slug);
    if (existsSync(dir)) {
      writeFileSync(join(dir, 'verify-last.json'), JSON.stringify(payload, null, 2) + '\n');
    }
  }
  // Sync eval result + goal state to Turso; MUST await before process.exit
  // or the write is killed mid-flight (durableExecute is timeout-capped).
  const turso = await syncEvalToTurso(payload, active).catch(() => ({ synced: false }));
  console.log(JSON.stringify({ ...payload, turso }, null, 2));
  process.exit(out.ok ? 0 : 1);
}

async function cmdDone() {
  const active = readActive();
  if (!active?.slug) {
    console.error('[goal] No active goal.');
    process.exit(1);
  }
  console.error('[goal] Running verify before done…');
  const out = runVerify({ build: false });
  if (!out.ok) {
    console.error('[goal] Verify failed — not marking done. Fix and re-run goal:verify.');
    console.log(JSON.stringify(out, null, 2));
    process.exit(1);
  }
  active.status = 'done';
  active.completed = new Date().toISOString();
  active.phase = 'done';
  const dir = goalDir(active.slug);
  writeFileSync(join(dir, 'meta.json'), JSON.stringify(active, null, 2) + '\n');
  if (existsSync(ACTIVE)) rmSync(ACTIVE);

  // Best-effort Turso sync (non-blocking to the user)
  const turso = await syncGoalToTurso(active, out);

  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'done',
        slug: active.slug,
        title: active.title,
        verify: out,
        turso,
        path: active.path,
      },
      null,
      2,
    ),
  );
}

function cmdAbort() {
  const active = readActive();
  if (!active?.slug) {
    console.log(JSON.stringify({ ok: true, action: 'abort', note: 'nothing active' }));
    return;
  }
  active.status = 'aborted';
  active.aborted = new Date().toISOString();
  const dir = goalDir(active.slug);
  if (existsSync(dir)) {
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(active, null, 2) + '\n');
  }
  if (existsSync(ACTIVE)) rmSync(ACTIVE);
  console.log(JSON.stringify({ ok: true, action: 'abort', slug: active.slug }));
}

function cmdResume() {
  const active = readActive();
  if (!active?.slug) {
    console.log(JSON.stringify({ ok: true, action: 'resume', note: 'nothing to resume', hint: 'npm run goal -- start "title"' }));
    return;
  }
  if (!isStale(active)) {
    console.log(JSON.stringify({ ok: true, action: 'resume', note: 'goal still fresh, continuing', slug: active.slug, phase: active.phase, heartbeat: active.heartbeat }));
    writeActive(active); // refresh heartbeat
    return;
  }
  // Stale goal detected — refresh heartbeat and report recovery
  const staleSince = active.heartbeat;
  writeActive(active);
  const dir = goalDir(active.slug);
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.json'))
    : [];
  console.log(
    JSON.stringify(
      {
        ok: true,
        action: 'resume',
        slug: active.slug,
        title: active.title,
        phase: active.phase,
        stale_since: staleSince,
        recovered_at: active.heartbeat,
        files,
        next:
          active.phase === 'research'
            ? 'Fill research.md; then npm run goal -- phase plan'
            : active.phase === 'plan'
              ? 'Fill plan.md; then npm run goal -- phase implement'
              : 'Implement; npm run goal:verify until green; npm run goal -- done',
      },
      null,
      2,
    ),
  );
}

function cmdStatus() {
  const active = readActive();
  if (!active) {
    console.log(JSON.stringify({ ok: true, active: null, hint: 'npm run goal -- start "title"' }, null, 2));
    return;
  }
  const stale = isStale(active);
  writeActive(active); // refresh heartbeat on any interaction
  const dir = goalDir(active.slug);
  const files = existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.md') || f.endsWith('.json'))
    : [];
  console.log(
    JSON.stringify(
      {
        ok: true,
        active,
        files,
        ...(stale ? { stale: true, stale_since: active.heartbeat, hint: 'Goal was idle >2h. Run: npm run goal -- resume' } : {}),
        next:
          active.phase === 'research'
            ? 'Fill research.md + graph:query; then npm run goal -- phase plan'
            : active.phase === 'plan'
              ? 'Fill plan.md with verify checks; then npm run goal -- phase implement'
              : 'Implement; npm run goal:verify until green; npm run goal -- done',
      },
      null,
      2,
    ),
  );
}

function cmdList() {
  ensureGoalsDir();
  const entries = readdirSync(GOALS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => {
      const mp = join(GOALS, d.name, 'meta.json');
      if (existsSync(mp)) {
        try {
          return JSON.parse(readFileSync(mp, 'utf8'));
        } catch {
          return { slug: d.name };
        }
      }
      return { slug: d.name };
    });
  console.log(JSON.stringify({ ok: true, goals: entries, active: readActive() }, null, 2));
}

function cmdHelp() {
  console.log(`goal — RPI ship loop

  npm run goal -- start "title"
  npm run goal -- status
  npm run goal -- resume
  npm run goal -- list
  npm run goal -- phase research|plan|implement
  npm run goal:verify [--build]
  npm run goal -- done
  npm run goal -- abort

Artifacts: .agents/goals/<slug>/
Active pointer: .agents/goals/active.json
`);
}

/**
 * Best-effort sync goal state to Turso via the durable shared lib.
 * Failed writes queue locally and flush on the next successful sync.
 */
async function syncGoalToTurso(meta, verify) {
  try {
    const { durableExecute } = await import('./lib/turso-sync.mjs');
    const result = await durableExecute([
      {
        table: 'ship_loop_goals',
        sql: `INSERT INTO ship_loop_goals (slug, title, phase, status, verify_ok, created, completed, payload)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                title = excluded.title, phase = excluded.phase, status = excluded.status,
                verify_ok = excluded.verify_ok, completed = excluded.completed, payload = excluded.payload`,
        args: [
          meta.slug,
          meta.title || null,
          meta.phase || null,
          meta.status || null,
          verify?.ok ? 1 : 0,
          meta.created || null,
          meta.completed || null,
          JSON.stringify({ ...meta, verify }),
        ],
      },
    ]);
    return result.synced
      ? { synced: true, slug: meta.slug }
      : { synced: false, queued: result.queued, reason: result.reason || 'queued for retry' };
  } catch (err) {
    return { synced: false, reason: err.message };
  }
}

/**
 * Best-effort sync eval result to Turso (time-series of build health).
 */
async function syncEvalToTurso(evalPayload, activeGoal) {
  try {
    const { durableExecute } = await import('./lib/turso-sync.mjs');
    const graders = (evalPayload.results || [])
      .map((r) => `${r.name}:${r.pass ? 'pass' : 'fail'}`)
      .join(',');
    const passRate = (evalPayload.results || []).filter((r) => r.pass).length /
      Math.max((evalPayload.results || []).length, 1);

    const writes = [
      {
        table: 'ship_loop_evals',
        sql: `INSERT INTO ship_loop_evals (goal_slug, ok, pass_rate, graders, at, payload)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          activeGoal?.slug || evalPayload.goal || null,
          evalPayload.ok ? 1 : 0,
          passRate,
          graders,
          evalPayload.at || new Date().toISOString(),
          JSON.stringify(evalPayload),
        ],
      },
    ];

    if (activeGoal?.slug) {
      writes.push({
        table: 'ship_loop_goals',
        sql: `INSERT INTO ship_loop_goals (slug, title, phase, status, verify_ok, created, completed, payload)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(slug) DO UPDATE SET
                phase = excluded.phase, status = excluded.status,
                verify_ok = excluded.verify_ok, payload = excluded.payload`,
        args: [
          activeGoal.slug,
          activeGoal.title || null,
          activeGoal.phase || null,
          activeGoal.status || 'active',
          evalPayload.ok ? 1 : 0,
          activeGoal.created || null,
          activeGoal.completed || null,
          JSON.stringify(activeGoal),
        ],
      });
    }

    const result = await durableExecute(writes);
    return result.synced
      ? { synced: true }
      : { synced: false, queued: result.queued, reason: result.reason || 'queued for retry' };
  } catch (err) {
    return { synced: false, reason: err.message };
  }
}

const args = process.argv.slice(2).filter((a) => a !== '--');
const sub = args[0] || 'status';

if (sub === 'start') {
  const title = args.slice(1).join(' ').trim() || 'untitled-goal';
  cmdStart(title);
} else if (sub === 'phase') {
  cmdPhase(args[1] || '');
} else if (sub === 'verify') {
  await cmdVerify(args.slice(1));
} else if (sub === 'done') {
  await cmdDone();
} else if (sub === 'abort') {
  cmdAbort();
} else if (sub === 'resume') {
  cmdResume();
} else if (sub === 'status') {
  cmdStatus();
} else if (sub === 'list') {
  cmdList();
} else if (sub === 'help' || sub === '-h') {
  cmdHelp();
} else {
  console.error(`[goal] unknown: ${sub}`);
  cmdHelp();
  process.exit(2);
}
