import Link from 'next/link';
import { ArrowRight, Calculator, Camera, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';
import { businessPhone } from '../lib/contact';

const proofItems = [
  {
    icon: Camera,
    title: 'Photo-ready estimate intake',
    body: 'Send room, exterior, commercial, or striping photos so the first response starts from real surface evidence.',
  },
  {
    icon: ClipboardCheck,
    title: 'Clear scope before scheduling',
    body: 'Each request is organized around surfaces, access, prep, timeline, budget range, and preferred contact method.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified contractor record',
    body: 'Registered Minnesota Specialty Contractor (Painting), fully insured, and owner-operator workers\' comp exempt under MN Statute 176.041. MN ID: IR816596.',
  },
];

export default function ConversionFooterCta() {
  return (
    <section className="border-y border-line bg-surface-raised text-white">
      <div className="container-page section-tight grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
        <div className="lg:col-span-5">
          <h2 className="display-2 max-w-[12ch] text-balance uppercase text-white">Know the range before paint ever opens.</h2>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ink-3 sm:text-lg">
            Get a fast planning range in under a minute, then send the details for a firm on-site estimate. Owner-led walkthrough, written scope, no pressure.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/estimate"
              data-track="footer_conversion_cta_click"
              data-track-payload='{"action":"calculator"}'
              className="inline-flex min-h-14 items-center justify-center gap-2 bg-brand px-7 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-orange-deep"
            >
              <Calculator aria-hidden="true" size={18} />
              Get My Free Price Range
            </Link>
            <a
              href={`tel:${businessPhone}`}
              data-track="call_click"
              data-track-payload='{"source":"conversion_footer"}'
              className="inline-flex min-h-14 items-center justify-center gap-2 border border-line-strong bg-transparent px-7 py-4 text-sm font-black text-white transition-colors hover:border-brand hover:text-brand"
            >
              <Phone aria-hidden="true" size={18} />
              Call / Text
              <ArrowRight aria-hidden="true" size={16} />
            </a>
          </div>
        </div>

        <div className="border-y border-line lg:col-span-7">
          {proofItems.map(({ icon: Icon, title, body }) => (
            <div key={title} className="grid grid-cols-[2.75rem_1fr] gap-4 border-b border-line py-5 last:border-b-0 sm:grid-cols-[3rem_0.8fr_1.2fr] sm:items-start sm:gap-5">
              <div className="flex h-11 w-11 items-center justify-center border border-line-strong text-brand">
                <Icon aria-hidden="true" size={20} />
              </div>
              <h3 className="text-base font-black leading-6 text-white">{title}</h3>
              <p className="col-start-2 text-sm leading-6 text-ink-4 sm:col-start-auto">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
