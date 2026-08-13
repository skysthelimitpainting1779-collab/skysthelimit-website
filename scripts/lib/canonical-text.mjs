import { createHash } from 'node:crypto';

export function canonicalSha256(text) {
  const canonical = String(text).replace(/\r\n/g, '\n');
  return createHash('sha256').update(canonical).digest('hex');
}
