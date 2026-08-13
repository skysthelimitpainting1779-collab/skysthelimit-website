export type ProtectedIdentityConfiguration =
  | { configured: true }
  | { configured: false; reason: 'server' | 'client' };

type ConfigurationLoaders = {
  getRuntimeServerEnv: () => unknown;
  getClientEnv: () => unknown;
};

/**
 * Validate both sides of the identity boundary before rendering an app route.
 * The loaders are injected so this fail-closed decision remains deterministic.
 */
export function validateProtectedIdentityConfiguration({
  getRuntimeServerEnv,
  getClientEnv,
}: ConfigurationLoaders): ProtectedIdentityConfiguration {
  try {
    getRuntimeServerEnv();
  } catch {
    return { configured: false, reason: 'server' };
  }

  try {
    getClientEnv();
  } catch {
    return { configured: false, reason: 'client' };
  }

  return { configured: true };
}
