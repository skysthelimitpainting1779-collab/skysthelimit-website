import Link from 'next/link';
import { ArrowRight, Check, ClipboardCheck, HardHat, Ruler, ShieldCheck } from 'lucide-react';
import LeadForm from '@/components/LeadForm';
import PrepProtocolStage from '@/components/PrepProtocolStage';
import ResponsiveImage from '@/components/ResponsiveImage';
import ReviewCarousel from '@/components/ReviewCarousel';
import { faqSchema } from '@/lib/seo';

const scopeRows = [
  ['INTERIOR', 'Walls · ceilings · trim · cabinets', 'Residential'],
  ['EXTERIOR', 'Siding · trim · decks · fences', 'Residential'],
  ['PROPERTY', 'Repaints · turnovers · common areas', 'Commercial'],
  ['MARKING', 'Parking lots · curbs · safety striping', 'Public / commercial'],
];

const faqItems = [
  {
    question: 'How is a painting project scoped?',
    answer: 'The scope begins with surfaces, condition, access, preparation requirements, photos, and timeline. The result is a written estimate before work is scheduled.',
  },
  {
    question: 'Who performs the walkthrough?',
    answer: 'Anthony Briseno handles the project conversation and walkthrough directly, so the scope is not passed between a sales team and a crew.',
  },
  {
    question: 'Can documentation be provided for property or public work?',
    answer: 'A certificate of insurance is available for qualified commercial and public-sector opportunities. Ask about documentation during the scope review.',
  },
];

export default function HomeClient() {
  return (
    <article className="bg-[#0A0A0A] text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqItems)) }} />

      <section aria-labelledby="home-title" className="border-b border-zinc-800">
        <div className="mx-auto grid min-h-[calc(100svh-117px)] max-w-7xl lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
          <div className="flex flex-col justify-between px-6 py-10 sm:px-8 lg:px-12 lg:py-14">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A00]">Twin Cities / Residential painting scope desk</p>
              <h1 id="home-title" className="mt-6 max-w-4xl text-4xl font-black uppercase leading-[0.9] tracking-normal text-white sm:text-6xl lg:text-7xl">
                Residential detail. Commercial discipline. <span className="text-[#FF5A00]">Preps</span> first.
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                Sky&apos;s the Limit Painting LLC scopes the protection, correction, coating system, and final walkthrough before a project reaches your home.
              </p>
              {/* Trust badge chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Twin Cities Metro', 'MN ID: IR816596', '100% Insured', 'Public-Sector Ready'].map((chip) => (
                  <span key={chip} className="inline-flex items-center border border-white/10 bg-black/60 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-300">
                    {chip}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <Link href="/estimate" className="inline-flex min-h-14 items-center gap-4 bg-[#FF5A00] px-6 py-4 text-sm font-black uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#d94d00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF5A00]">
                Calculate room scope <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#2E7D32]">Typical response: same day &middot; Spring/summer slots filling now</p>
              <div className="mt-5 grid max-w-2xl border border-zinc-700 sm:grid-cols-3">
                {[['MN ID', 'IR816596'], ['EXEMPTION', '176.041 EXEMPT'], ['COVERAGE', '100% INSURED']].map(([label, value]) => <div key={label} className="border-b border-zinc-800 px-4 py-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-500">{label}</p><p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-white">{value}</p></div>)}
              </div>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">Start with surfaces, condition, and dimensions. Contact details come last.</p>
            </div>
          </div>

          <div className="relative min-h-[24rem] border-t border-zinc-800 lg:min-h-0 lg:border-l lg:border-t-0">
            <ResponsiveImage src="/images/site/marketing-hero-exterior-painting.webp" alt="Painter preparing an exterior trim surface with windows and landscaping protected" width={1600} height={900} sizes="(min-width: 1024px) 45vw, 100vw" priority fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 border-t border-zinc-700 bg-[#0A0A0A]/95 p-5 backdrop-blur-sm">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-zinc-400">Field image / exterior preparation</p>
              <p className="mt-2 text-sm font-semibold text-white">Protection and surface correction are part of the work order—not an upgrade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Process path strip — overlapping dark cards */}
      <section aria-label="How it works" className="relative z-10 -mt-12 border-b border-zinc-800">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px border border-zinc-700 bg-zinc-700 lg:grid-cols-4">
          {[
            ['01', 'Tell us', 'Property type, city, surfaces, and timeline'],
            ['02', 'Scope + price', 'Written estimate from real site conditions'],
            ['03', 'Reserve', 'Lock a start date that works for you'],
            ['04', 'Transparency', 'Photos, walkthrough, and final detail check'],
          ].map(([num, title, desc]) => (
            <div key={num} className="bg-[#111111] px-5 py-6">
              <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#FF5A00]">{num}</p>
              <p className="mt-2 text-sm font-black uppercase tracking-wide text-white">{title}</p>
              <p className="mt-1.5 text-xs leading-5 text-zinc-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="scope-ledger" className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A00]">01 / Scope ledger</p>
              <h2 id="scope-ledger" className="mt-4 text-4xl font-black uppercase leading-none tracking-normal text-white sm:text-5xl">What gets priced.</h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-zinc-400">The estimate follows the actual site conditions. Each line item exists to make preparation and execution visible before scheduling.</p>
            </div>
            <dl className="border-t border-zinc-700">
              {scopeRows.map(([code, work, market]) => (
                <div key={code} className="grid grid-cols-[4rem_1fr] gap-4 border-b border-zinc-800 py-5 sm:grid-cols-[5rem_1fr_auto] sm:items-center">
                  <dt className="font-mono text-xs font-bold tracking-widest text-[#FF5A00]">{code}</dt>
                  <dd className="text-sm font-bold uppercase tracking-wide text-white">{work}</dd>
                  <dd className="col-start-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500 sm:col-start-auto">{market}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <PrepProtocolStage />

      <section aria-labelledby="proof" className="border-b border-zinc-800">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="relative aspect-[4/3] border-b border-zinc-800 lg:aspect-auto lg:border-b-0 lg:border-r">
            <ResponsiveImage src="/images/site/iphone-interior-painting-progress.webp" alt="Interior painting work in progress with room surfaces prepared for coating" width={1200} height={900} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="px-6 py-16 sm:px-8 lg:px-12">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A00]">03 / Operational controls</p>
            <h2 id="proof" className="mt-4 text-4xl font-black uppercase leading-none tracking-normal text-white sm:text-5xl">A contractor record you can inspect.</h2>
            <ul className="mt-10 divide-y divide-zinc-800 border-y border-zinc-800">
              {[
                [ShieldCheck, 'MN ID: IR816596', 'registered Minnesota Specialty Contractor (Painting)'],
                [HardHat, '176.041 Exempt', 'Owner-operator exemption record'],
                [ClipboardCheck, '100% Insured', 'Certificate of insurance available for qualified opportunities'],
                [Ruler, 'Direct scope review', 'Owner-led walkthrough through final detail'],
              ].map(([Icon, title, detail]) => {
                const Mark = Icon as typeof ShieldCheck;
                return <li key={title as string} className="flex gap-4 py-5"><Mark aria-hidden="true" className="mt-1 shrink-0 text-[#FF5A00]" size={18} /><div><p className="text-sm font-bold uppercase tracking-wide text-white">{title as string}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500">{detail as string}</p></div></li>;
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* Social proof — customer reviews */}
      <section aria-label="Customer reviews" className="border-b border-zinc-800">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[0.6fr_1.4fr] lg:gap-16 lg:items-center">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A00]">Client record</p>
              <h2 className="mt-4 text-4xl font-black uppercase leading-none tracking-normal text-white sm:text-5xl">Word from the field.</h2>
              <a
                href="https://g.page/r/skysthelimitpainting/review"
                target="_blank"
                rel="noopener noreferrer"
                data-track="google_review_click"
                data-track-payload='{"source":"homepage_reviews"}'
                className="mt-6 inline-flex items-center gap-2 border border-zinc-600 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-zinc-300 transition-colors hover:border-[#FF5A00] hover:text-[#FF5A00]"
              >
                Leave a Google Review <ArrowRight size={14} />
              </a>
            </div>
            <ReviewCarousel />
          </div>
        </div>
      </section>

      <section aria-labelledby="request-scope" className="bg-[#0A0A0A]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-12 lg:py-20">
          <aside className="border-t-2 border-[#FF5A00] pt-6">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5A00]">04 / Request a written scope</p>
            <h2 id="request-scope" className="mt-4 text-4xl font-black uppercase leading-none tracking-normal text-white sm:text-5xl">Send the job data.</h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-zinc-400">Tell us the property type, city, surfaces, timeline, and preparation needs. The final step asks how Anthony should reach you.</p>
            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-500">Service area / Minneapolis · St. Paul · Twin Cities metro</p>
          </aside>
          <div className="border border-zinc-700 bg-[#111111] p-5 sm:p-8"><LeadForm source="homepage_scope_desk" defaultMarket="Residential" /></div>
        </div>
      </section>
    </article>
  );
}
