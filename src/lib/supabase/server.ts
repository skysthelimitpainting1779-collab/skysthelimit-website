import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireEnvironmentVariable } from '../config/required-env';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have the proxy refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
