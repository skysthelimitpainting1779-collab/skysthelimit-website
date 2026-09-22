import { redirect } from 'next/navigation';

import { isEstimatorAdmin } from '@/lib/auth/estimator';
import { gatePortalAccess, portalLoginUrl } from '@/lib/auth/portal';
import { createClient } from '@/lib/supabase/server';
import ContractorEstimator from '@/views/ContractorEstimator';

// This protected page reads the authenticated session from request cookies.
export const instant = false;

export default async function ContractorEstimatorPage() {
  let user: { id: string; email?: string | null } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user ? { id: data.user.id, email: data.user.email } : null;
  } catch {
    user = null;
  }

  const gate = gatePortalAccess(user);
  if (!gate.authenticated) {
    redirect(portalLoginUrl('/portal/estimator'));
  }
  if (!isEstimatorAdmin(gate.user.email)) {
    redirect('/portal');
  }

  return <ContractorEstimator contractorEmail={gate.user.email} />;
}
