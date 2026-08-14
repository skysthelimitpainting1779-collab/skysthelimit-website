/**
 * Normalize hook payloads emitted by Codex and Antigravity.
 * Hosts use different field casing; enforcement scripts consume this adapter only.
 */
export async function readHookInput(stream = process.stdin) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function toolInput(input) {
  return input?.tool_input ?? input?.toolCall?.args ?? input?.args ?? {};
}

export function toolName(input) {
  return String(input?.tool_name ?? input?.toolCall?.name ?? input?.toolName ?? '');
}

export function isAntigravityInput(input) {
  return Boolean(input?.toolCall && !input?.tool_name);
}

export function allowHook(input) {
  if (isAntigravityInput(input)) process.stdout.write(JSON.stringify({ decision: 'allow' }));
}

export function denyHook(input, reason) {
  if (isAntigravityInput(input)) {
    process.stdout.write(JSON.stringify({ decision: 'deny', reason }));
    process.exit(0);
  }
  process.stderr.write(`${reason}\n`);
  process.exit(2);
}

export function commandFrom(input) {
  const args = toolInput(input);
  return String(
    args?.command ??
    args?.CommandLine ??
    args?.cmd ??
    input?.command ??
    input?.CommandLine ??
    '',
  );
}

export function targetText(input) {
  const args = toolInput(input);
  return [
    commandFrom(input),
    args?.patch,
    args?.TargetFile,
    args?.target_file,
    args?.file_path,
    args?.path,
    args?.SearchPath,
    args?.search_path,
    args?.SearchDirectory,
    args?.Pattern,
  ]
    .filter((value) => typeof value === 'string')
    .join('\n');
}

function normalizeAgent(value) {
  const match = String(value ?? '').toUpperCase().match(/\b([AVS]\d{1,2})\b/);
  return match?.[1] ?? '';
}

export function sourceAgent(input) {
  const args = toolInput(input);
  return normalizeAgent(
    args?.source_agent ??
    args?.sourceAgent ??
    input?.source_agent ??
    input?.agent_id ??
    input?.agentId ??
    input?.senderId,
  );
}

export function targetAgent(input) {
  const args = toolInput(input);
  return normalizeAgent(
    args?.target_agent ??
    args?.targetAgent ??
    args?.target ??
    args?.recipient ??
    args?.agent_id ??
    args?.agent_type ??
    input?.target_agent,
  );
}
