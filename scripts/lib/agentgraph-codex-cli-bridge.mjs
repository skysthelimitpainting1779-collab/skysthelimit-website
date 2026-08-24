import { spawn } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function codexThreadId(stdout) {
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      if (event.type === 'thread.started' && typeof event.thread_id === 'string') {
        return event.thread_id;
      }
    } catch {
      // Non-JSON diagnostics are retained in the failure output below.
    }
  }
  return null;
}

export function createCodexCliTaskBridge({
  cwd,
  command = process.platform === 'win32' ? process.execPath : 'codex',
  commandPrefix =
    process.platform === 'win32'
      ? [join(process.env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js')]
      : [],
  sandbox = 'read-only',
  approval = 'never',
  spawnProcess = spawn,
  loadJobState,
  saveJobState,
}) {
  if (
    typeof cwd !== 'string' ||
    !cwd ||
    typeof loadJobState !== 'function' ||
    typeof saveJobState !== 'function'
  ) {
    throw new Error(
      'Codex CLI bridge requires cwd and durable loadJobState/saveJobState callbacks',
    );
  }
  const jobs = new Map();

  return {
    async createTask({ assignment, prompt, idempotencyKey, scopeHash }) {
      const stableKey = idempotencyKey || assignment.id;
      if (typeof stableKey !== 'string' || !stableKey) {
        throw new Error('Codex CLI task requires an assignment idempotency key');
      }
      const taskId = `codex-cli:${stableKey}`;
      const requestedScopeHash = scopeHash || stableKey;
      if (jobs.has(taskId)) {
        if (jobs.get(taskId).scopeHash !== requestedScopeHash) {
          throw new Error(`local Codex CLI job scope does not match: ${taskId}`);
        }
        return { threadId: taskId, hostId: 'codex-cli' };
      }
      const durable = await loadJobState(taskId);
      if (durable && durable.scopeHash !== requestedScopeHash) {
        throw new Error(`durable Codex CLI job scope does not match: ${taskId}`);
      }
      if (
        durable?.status === 'terminal' &&
        durable?.outcome &&
        durable.assignmentId === assignment.id
      ) {
        jobs.set(taskId, {
          assignmentId: assignment.id,
          child: null,
          done: Promise.resolve(durable.outcome),
          scopeHash: requestedScopeHash,
        });
        return { threadId: taskId, hostId: 'codex-cli' };
      }
      if (['launching', 'running'].includes(durable?.status)) {
        throw new Error(
          `Codex CLI assignment is durably running but not locally owned: ${taskId}`,
        );
      }
      if (durable) {
        throw new Error(`invalid durable Codex CLI job state: ${taskId}`);
      }
      await saveJobState(taskId, {
        schemaVersion: '1.0.0',
        status: 'launching',
        assignmentId: assignment.id,
        scopeHash: requestedScopeHash,
      });
      const outputPath = join(tmpdir(), `${taskId.replaceAll(':', '-')}.json`);
      const args = [
        '--sandbox',
        sandbox,
        '--ask-for-approval',
        approval,
        'exec',
        '--json',
        '--color',
        'never',
        '--output-last-message',
        outputPath,
        '-C',
        cwd,
        '-',
      ];
      const child = spawnProcess(command, [...commandPrefix, ...args], {
        cwd,
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
      child.stdin.end(prompt);

      const done = new Promise((resolve) => {
        let settled = false;
        const finish = async (outcome) => {
          if (settled) return;
          settled = true;
          try {
            await saveJobState(taskId, {
              schemaVersion: '1.0.0',
              status: 'terminal',
              assignmentId: assignment.id,
              scopeHash: requestedScopeHash,
              outcome,
            });
          } catch {
            // A stale running record fails closed after restart.
          } finally {
            resolve(outcome);
          }
        };
        child.on('error', (error) => {
          void finish({
            assignmentId: assignment.id,
            status: 'failed',
            error: error.message,
          });
        });
        child.on('close', async (code) => {
          let final = '';
          try {
            final = await readFile(outputPath, 'utf8');
          } catch {
            // A missing final file is reported as a terminal missing completion.
          } finally {
            await unlink(outputPath).catch(() => {});
          }
          await finish({
            assignmentId: assignment.id,
            status: code === 0 && final.trim() ? 'completed' : 'failed',
            final: final.trim(),
            error:
              code === 0 && final.trim()
                ? null
                : stderr.trim() || `Codex CLI exited ${code} without a completion callback`,
            codexThreadId: codexThreadId(stdout),
          });
        });
      });
      jobs.set(taskId, {
        assignmentId: assignment.id,
        child,
        done,
        scopeHash: requestedScopeHash,
      });
      await saveJobState(taskId, {
        schemaVersion: '1.0.0',
        status: 'running',
        assignmentId: assignment.id,
        scopeHash: requestedScopeHash,
      });
      return { threadId: taskId, hostId: 'codex-cli' };
    },
    async reattachTask(args) {
      return this.createTask(args);
    },

    async waitForAny(tasks) {
      const pending = tasks.map((task) => {
        const job = jobs.get(task.threadId);
        if (!job) throw new Error(`unknown Codex CLI task: ${task.threadId}`);
        return job.done.then((outcome) => ({ ...outcome, threadId: task.threadId }));
      });
      const outcome = await Promise.race(pending);
      return outcome;
    },

    async steerTask({ threadId }) {
      const job = jobs.get(threadId);
      if (!job?.child) return { stopped: false };
      const stopped = job.child.kill();
      return { stopped };
    },
  };
}
