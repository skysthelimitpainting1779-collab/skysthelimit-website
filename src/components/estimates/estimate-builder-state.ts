export type RevisionSyncAction =
  | 'hydrate'
  | 'preserve-stale'
  | 'wait'
  | 'none';

export function resolveRevisionSync({
  serverRevision,
  hydratedRevision,
  dirty,
  awaitingRevision,
}: {
  serverRevision: number;
  hydratedRevision: number | null;
  dirty: boolean;
  awaitingRevision: number | null;
}): RevisionSyncAction {
  if (awaitingRevision !== null) {
    if (serverRevision === awaitingRevision) return 'hydrate';
    return serverRevision > awaitingRevision ? 'preserve-stale' : 'wait';
  }
  if (hydratedRevision === null) return 'hydrate';
  if (serverRevision === hydratedRevision) return 'none';
  return dirty ? 'preserve-stale' : 'hydrate';
}

export type CommandIdentity = {
  fingerprint: string;
  requestId: string;
};

export function nextCommandIdentity(
  current: CommandIdentity | null,
  fingerprint: string,
  createId: () => string
): CommandIdentity {
  return current?.fingerprint === fingerprint
    ? current
    : { fingerprint, requestId: createId() };
}
