'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Calculator, Camera, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';
import { businessPhone } from '../lib/contact';
import IconFeatureCard from './IconFeatureCard';

const proofItems = [
  {
    icon: Camera,
    title: 'Photo-ready estimate intake',
    body: 'Send room, exterior, commercial, or striping photos with the form so the first response starts from real surface evidence.',
  },
  {
    icon: ClipboardCheck,
    title: 'Clear scope before scheduling',
    body: 'Each request is organized around surfaces, access, prep, timeline, budget range, and preferred contact method.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified contractor language',
    body: 'Registered Minnesota Specialty Contractor (Painting), fully insured, and owner-operator workers\' comp exempt under MN Statute 176.041. MN ID: IR816596',
  },
];

export default function ConversionFooterCta() {
  const pathname = usePathname();

  // The homepage closes with its own full walkthrough form; repeating another
  // conversion panel immediately afterward weakens the finish and the choice.
  if (pathname === '/') return null;

  return (
    <section className="border-y border-zinc-800 bg-[#111111] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="relative z-20 mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
            Know your price before paint ever opens.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#c9c1b4] md:text-lg">
            Get a fast planning range in under a minute, then send the details for a firm on-site estimate. Owner-led walkthrough, written scope, no pressure.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/estimate"
              data-track="footer_conversion_cta_click"
              data-track-payload='{"action":"calculator"}'
              className="inline-flex items-center justify-center gap-2 bg-[#FF5A00] px-7 py-4 text-sm font-black uppercase tracking-[0.1em] text-white transition-colors hover:bg-[#d94d00]"
            >
              <Calculator size={18} />
              Calculate Room Scope
            </Link>
            <a
              href={`tel:${businessPhone}`}
              data-track="call_click"
              data-track-payload='{"source":"conversion_footer"}'
              className="inline-flex items-center justify-center gap-2 border border-zinc-600 bg-transparent px-7 py-4 text-sm font-black text-white transition-colors hover:border-[#FF5A00] hover:text-[#FF5A00]"
            >
              <Phone size={18} />
              Call / Text
              <ArrowRight size={16} />
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 lg:col-span-7">
          {proofItems.map(({ icon, title, body }) => (
            <IconFeatureCard
              key={title}
              icon={icon}
              title={title}
              body={body}
              className="min-h-[240px] bg-[#111] p-8"
              iconClassName="mb-8 text-white"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
