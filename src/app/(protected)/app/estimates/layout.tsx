import type { Metadata } from 'next';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function EstimatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/portal/login?next=%2Fapp%2Festimates');
  return <>{children}</>;
}
