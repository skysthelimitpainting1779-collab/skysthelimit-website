import { redirect } from 'next/navigation';

/**
 * The legacy Supabase management console is intentionally retired. Administrative
 * work moves to the authenticated replacement platform; this route must never
 * expose browser-side provisioning or direct administrative database access.
 */
export default function RetiredManagePage() {
  redirect('/contact');
}
