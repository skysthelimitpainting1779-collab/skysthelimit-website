function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replacePath(value, pathValue, replacement) {
  if (!pathValue) return value;
  const variants = [...new Set([
    String(pathValue),
    String(pathValue).replaceAll('\\', '/'),
    String(pathValue).replaceAll('/', '\\'),
    String(pathValue).replaceAll('\\', '\\\\'),
  ])].sort((left, right) => right.length - left.length);

  let output = value;
  for (const variant of variants) {
    if (!variant) continue;
    const flags = /^[A-Za-z]:[\\/]/.test(variant) ? 'gi' : 'g';
    output = output.replace(new RegExp(escapeRegExp(variant), flags), replacement);
  }
  return output;
}

const SENSITIVE_ENVIRONMENT_KEY =
  /(?:SECRET|TOKEN|PASSWORD|PASSWD|KEY|CREDENTIAL|WEBHOOK|(?:DATABASE|DB|POSTGRES|TURSO|REDIS|KV).*(?:URL|URI))/i;

export function sensitiveEnvironmentValues(environment = {}) {
  return Object.entries(environment)
    .filter(([key, value]) => (
      SENSITIVE_ENVIRONMENT_KEY.test(key)
      && typeof value === 'string'
      && value.length >= 8
    ))
    .map(([, value]) => value);
}

function redactSensitiveValues(value, sensitiveValues) {
  const values = [...new Set(sensitiveValues)]
    .filter((item) => typeof item === 'string' && item.length >= 8)
    .sort((left, right) => right.length - left.length);

  let output = value;
  for (const sensitiveValue of values) {
    const variants = [...new Set([
      sensitiveValue,
      JSON.stringify(sensitiveValue).slice(1, -1),
      encodeURIComponent(sensitiveValue),
    ])].filter((item) => item.length >= 8);
    for (const variant of variants) {
      output = output.replaceAll(variant, '<redacted>');
    }
    const encodedPattern = escapeRegExp(encodeURIComponent(sensitiveValue))
      .replaceAll('%20', '(?:%20|\\+)');
    output = output.replace(new RegExp(encodedPattern, 'gi'), '<redacted>');
  }
  return output;
}

export function redactEvidenceOutput(value, {
  workspaceRoot,
  homeDirectory,
  sensitiveValues = [],
} = {}) {
  let output = String(value ?? '');
  output = redactSensitiveValues(output, sensitiveValues);
  output = replacePath(output, workspaceRoot, '<workspace>');
  output = replacePath(output, homeDirectory, '<home>');
  return output;
}
