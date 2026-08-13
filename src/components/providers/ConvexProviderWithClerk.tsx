'use client';

import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk as ConvexClerkProvider } from 'convex/react-clerk';
import type { ReactNode } from 'react';

import { getClientEnv } from '@/lib/env/client';

let convexClient: ConvexReactClient | undefined;

function getConvexClient(): ConvexReactClient {
  if (!convexClient) {
    convexClient = new ConvexReactClient(getClientEnv().NEXT_PUBLIC_CONVEX_URL);
  }
  return convexClient;
}

/** Mount inside ClerkProvider when the layout already owns Clerk. */
export function ConvexProviderWithClerk({ children }: { children: ReactNode }) {
  return (
    <ConvexClerkProvider client={getConvexClient()} useAuth={useAuth}>
      {children}
    </ConvexClerkProvider>
  );
}

/** Root provider composition for layouts that do not already mount Clerk. */
export function IdentityProviders({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ConvexProviderWithClerk>{children}</ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
