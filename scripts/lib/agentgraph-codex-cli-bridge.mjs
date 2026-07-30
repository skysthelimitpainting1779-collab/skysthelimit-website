import { spawn } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

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
}) {
  if (typeof cwd !== 'string' || !cwd) throw new Error('Codex CLI bridge requires cwd');
  const jobs = new Map();

  return {
    async createTask({ assignment, prompt }) {
      const taskId = `codex-cli:${assignment.id}:${randomUUID()}`;
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
        child.on('error', (error) => {
          resolve({
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
          resolve({
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
      jobs.set(taskId, { assignmentId: assignment.id, child, done });
      return { threadId: taskId, hostId: 'codex-cli' };
    },

    async waitForAny(tasks) {
      const pending = tasks.map((task) => {
        const job = jobs.get(task.threadId);
        if (!job) throw new Error(`unknown Codex CLI task: ${task.threadId}`);
        return job.done.then((outcome) => ({ ...outcome, threadId: task.threadId }));
      });
      const outcome = await Promise.race(pending);
      jobs.delete(outcome.threadId);
      return outcome;
    },

    async steerTask({ threadId }) {
      const job = jobs.get(threadId);
      if (!job) return { stopped: false };
      const stopped = job.child.kill();
      return { stopped };
    },
  };
}
