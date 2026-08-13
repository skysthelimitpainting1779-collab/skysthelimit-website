'use client';

import { SignOutButton, UserButton } from '@clerk/nextjs';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import Link from 'next/link';
import { useEffect } from 'react';

import { api } from '../../../../convex/_generated/api';

export default function PortalHomePage() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const currentUser = useQuery(api.users.current, isAuthenticated ? {} : 'skip');
  const syncCurrentIdentity = useMutation(api.users.syncCurrentIdentity);
  const projects = useQuery(
    api.crm.myProjects,
    isAuthenticated && currentUser?.status === 'active' ? {} : 'skip',
  );

  useEffect(() => {
    if (isAuthenticated && currentUser === null) {
      void syncCurrentIdentity();
    }
  }, [currentUser, isAuthenticated, syncCurrentIdentity]);

  return (
    <main className="min-h-[70vh] bg-[#050505] px-6 py-16 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">
              Client portal
            </p>
            <h1 className="font-display text-4xl font-black">Your projects</h1>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <UserButton />
              <SignOutButton redirectUrl="/portal/login">
                <button
                  type="button"
                  className="border border-white/20 px-4 py-2 text-sm font-bold hover:bg-white/5"
                >
                  Sign out
                </button>
              </SignOutButton>
            </div>
          ) : null}
        </div>

        {isAuthLoading ? (
          <div className="border border-white/10 bg-[#0B0B0D] p-8 text-gray-400">
            Loading your projects...
          </div>
        ) : !isAuthenticated ? (
          <div className="border border-white/10 bg-[#0B0B0D] p-8">
            <h2 className="mb-3 text-xl font-bold">Sign in required</h2>
            <Link
              href="/portal/login"
              className="inline-flex bg-white px-6 py-3 font-bold text-[#050505] hover:bg-gray-200"
            >
              Sign in
            </Link>
          </div>
        ) : currentUser === undefined || projects === undefined ? (
          <div className="border border-white/10 bg-[#0B0B0D] p-8 text-gray-400">
            Loading your projects...
          </div>
        ) : currentUser?.status === 'disabled' ? (
          <div className="border border-red-500/40 bg-red-500/10 p-8 text-red-100">
            This account is disabled. Contact support for assistance.
          </div>
        ) : !projects?.length ? (
          <div className="border border-white/10 bg-[#0B0B0D] p-8">
            <h2 className="mb-3 text-xl font-bold">No projects yet</h2>
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              Projects appear only after your company membership and project grant are active.
            </p>
            <Link
              href="/estimate"
              className="inline-flex bg-white px-6 py-3 font-bold text-[#050505] hover:bg-gray-200"
            >
              Request an estimate
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <li key={project.id} className="border border-white/10 bg-[#0B0B0D] p-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold">{project.name}</h2>
                  <span className="border border-white/20 px-2 py-1 text-xs font-black uppercase tracking-wider">
                    {project.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-10 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Marketing site</Link>
          {' · '}
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </p>
      </div>
    </main>
  );
}
