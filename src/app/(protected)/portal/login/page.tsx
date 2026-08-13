import { SignIn } from '@clerk/nextjs';
import { Suspense } from 'react';

function ClerkSignIn() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[#050505] px-6 py-24 text-white">
      <SignIn
        routing="path"
        path="/portal/login"
        fallbackRedirectUrl="/portal"
        signUpFallbackRedirectUrl="/portal"
      />
    </main>
  );
}

export default function PortalLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[50vh] items-center justify-center bg-[#050505] text-white">
          Loading...
        </main>
      }
    >
      <ClerkSignIn />
    </Suspense>
  );
}
