import { createBrowserClient } from '@supabase/ssr';
import { requireEnvironmentVariable } from '../config/required-env';

export function createClient() {
  return createBrowserClient(
    requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
}
