import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { gatePortalAccess, portalLoginUrl } from '@/lib/auth/portal';
import { loadPortalDashboard } from '@/lib/auth/portal-data';
import { Suspense } from 'react';

export default function PortalHomePage() {
  return (
    <main className="min-h-[70vh] bg-[#050505] text-white px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
              Client portal
            </p>
            <h1 className="text-4xl font-display font-black">Your projects</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/5 rounded-none"
            >
              Sign out
            </button>
          </form>
        </div>

        <Suspense fallback={<div className="text-gray-400 p-8 border border-white/10 bg-[#0B0B0D]">Loading your projects...</div>}>
          <PortalDashboard />
        </Suspense>

        <p className="mt-10 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">
            ← Marketing site
          </Link>
          {' · '}
          <Link href="/contact" className="hover:text-white">
            Contact
          </Link>
        </p>
      </div>
    </main>
  );
}

async function PortalDashboard() {
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
    redirect(portalLoginUrl('/portal'));
    // redirect() is not typed as `never` in this Next version, so the
    // explicit throw keeps TypeScript narrowing sound (unreachable at runtime).
    throw new Error('Redirecting to portal login');
  }

  const dashboard = await loadPortalDashboard(gate.user);

  return (
    <>
      <p className="text-gray-400 mt-2 text-sm mb-6 -mt-16">
        Signed in as <span className="text-white font-medium">{gate.user.email}</span>
      </p>

      {dashboard.message && (
        <p className="mb-6 text-sm text-gray-400 border border-white/10 px-4 py-3 bg-[#0B0B0D]">
          {dashboard.message}
        </p>
      )}

      {dashboard.leads.length === 0 ? (
        <div className="border border-white/10 bg-[#0B0B0D] p-8 rounded-none">
          <h2 className="text-xl font-bold mb-3">No requests yet</h2>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            When you submit an estimate with this email, it will show up here with status
            updates.
          </p>
          <Link
            href="/estimate"
            className="inline-flex bg-white text-[#050505] font-bold px-6 py-3 rounded-none hover:bg-gray-200"
          >
            Request an estimate
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {dashboard.leads.map((lead) => (
            <li
              key={lead.lead_id}
              className="border border-white/10 bg-[#0B0B0D] p-6 rounded-none"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-bold">{lead.project_type || lead.market || 'Estimate request'}</h2>
                <span className="text-xs font-black uppercase tracking-wider border border-white/20 px-2 py-1">
                  {lead.status || 'unknown'}
                </span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-400">
                <div>
                  <dt className="text-gray-500 text-xs uppercase font-bold">Lead ID</dt>
                  <dd className="text-white font-mono text-xs mt-1">{lead.lead_id}</dd>
                </div>
                {lead.city && (
                  <div>
                    <dt className="text-gray-500 text-xs uppercase font-bold">City</dt>
                    <dd className="text-white mt-1">{lead.city}</dd>
                  </div>
                )}
                {lead.timeline && (
                  <div>
                    <dt className="text-gray-500 text-xs uppercase font-bold">Timeline</dt>
                    <dd className="text-white mt-1">{lead.timeline}</dd>
                  </div>
                )}
                {lead.budget && (
                  <div>
                    <dt className="text-gray-500 text-xs uppercase font-bold">Budget</dt>
                    <dd className="text-white mt-1">{lead.budget}</dd>
                  </div>
                )}
                {lead.created_at && (
                  <div>
                    <dt className="text-gray-500 text-xs uppercase font-bold">Submitted</dt>
                    <dd className="text-white mt-1">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
