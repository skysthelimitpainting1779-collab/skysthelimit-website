import 'server-only';

import { Suspense, type ReactNode } from 'react';
import { connection } from 'next/server';

import { IdentityProviders } from '@/components/providers/ConvexProviderWithClerk';
import { getClientEnv } from '@/lib/env/client';
import { getRuntimeServerEnv } from '@/lib/env/server';

import { validateProtectedIdentityConfiguration } from './identity-configuration';

function ProtectedIdentityUnavailable() {
  return (
    <main
      className="flex min-h-[100dvh] items-center justify-center bg-[#050505] p-8 text-white"
      data-protected-identity-unavailable="true"
    >
      <div className="max-w-md border border-white/15 bg-[#0B0B0D] p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#FF5A00]">Unavailable</p>
        <h1 className="mt-3 text-2xl font-black">Protected application unavailable</h1>
        <p className="mt-3 text-sm text-gray-400">
          This application surface is not configured. Please contact the site administrator.
        </p>
      </div>
    </main>
  );
}

/**
 * Clerk and Convex are application-only dependencies. Keep them out of the
 * root and marketing trees so public preview pages render without credentials.
 */
async function ProtectedIdentityGate({ children }: { children: ReactNode }) {
  // At request time this layout validates only the public provider configuration
  // and Clerk's runtime secret. Deployment credentials are never in this graph.
  await connection();

  const configuration = validateProtectedIdentityConfiguration({
    getRuntimeServerEnv,
    getClientEnv,
  });

  if (!configuration.configured) {
    return <ProtectedIdentityUnavailable />;
  }

  return <IdentityProviders>{children}</IdentityProviders>;
}

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ProtectedIdentityUnavailable />}>
      <ProtectedIdentityGate>{children}</ProtectedIdentityGate>
    </Suspense>
  );
}
