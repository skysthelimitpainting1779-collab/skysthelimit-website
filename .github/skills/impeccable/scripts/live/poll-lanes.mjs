export function eventPriority(event = {}) {
  if (event.type === 'accept' || event.type === 'discard' || event.type === 'exit') return 0;
  if (event.type === 'manual_edit_apply' || event.type === 'steer' || event.type === 'carbonize_cleanup') return 1;
  if (event.type === 'generate') return 2;
  return 3;
}

export function comparePendingSnapshotsForPolling(left = {}, right = {}) {
  const priorityDifference =
    eventPriority(left.pendingEvent) - eventPriority(right.pendingEvent);
  if (priorityDifference !== 0) return priorityDifference;

  const fifoDifference =
    (Date.parse(left.pendingEventAt || left.updatedAt || '') || 0)
    - (Date.parse(right.pendingEventAt || right.updatedAt || '') || 0);
  if (fifoDifference !== 0) return fifoDifference;

  return String(left.id || '').localeCompare(String(right.id || ''));
}

export function parseBoundedIntegerParam(value, { fallback, min, max }) {
  if (value == null || value === '') return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null;
}

export function selectAvailablePendingEvent(entries, { now = Date.now(), types = null } = {}) {
  const allowed = types instanceof Set ? types : (Array.isArray(types) ? new Set(types) : null);
  return entries
    .filter((entry) => !(entry.leaseUntil && entry.leaseUntil > now))
    .filter((entry) => !allowed || allowed.has(entry.event?.type))
    .sort((a, b) => eventPriority(a.event) - eventPriority(b.event) || a.seq - b.seq)[0] || null;
}
