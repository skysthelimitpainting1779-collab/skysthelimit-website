import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface PublicSupabaseEnv {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
}

function runtimePublicSupabaseEnv(): PublicSupabaseEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasPublicSupabaseConfig(
  env: PublicSupabaseEnv = runtimePublicSupabaseEnv(),
): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

/**
 * Create an anonymous, cookie-free client for public read-only content.
 *
 * Authenticated portal routes must continue using the server client in
 * `src/lib/supabase/server.ts`. Returning null when public variables are
 * absent keeps static builds deterministic and lets callers use local data.
 */
export function createPublicClient(
  env: PublicSupabaseEnv = runtimePublicSupabaseEnv(),
): SupabaseClient | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) return null;

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
