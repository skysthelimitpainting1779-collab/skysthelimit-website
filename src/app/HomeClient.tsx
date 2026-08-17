import Link from 'next/link';
import { ArrowRight, Check, ClipboardCheck, HardHat, Phone, Ruler, ShieldCheck } from 'lucide-react';
import LeadForm from '../components/LeadForm';
import PrepProtocolStage from '../components/PrepProtocolStage';
import ResponsiveImage from '../components/ResponsiveImage';
import ReviewCarousel from '../components/ReviewCarousel';
import { faqSchema } from '../lib/seo';

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

const trustChips = ['Twin Cities Metro', 'MN ID: IR816596', 'Fully insured', 'Public-sector ready'];

const processSteps = [
  ['01', 'Tell us', 'Property type, city, surfaces, and timeline'],
  ['02', 'Scope + price', 'Written estimate from real site conditions'],
  ['03', 'Reserve', 'Choose a start date that works for you'],
  ['04', 'Walkthrough', 'Final detail check against the agreed scope'],
];

export default function HomeClient() {
  return (
    <article className="bg-surface-void text-ink-1">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqItems)) }} />

      <section aria-labelledby="home-title" className="relative isolate min-h-[calc(100svh-117px)] overflow-hidden border-b border-line bg-surface-base">
        <div className="absolute inset-0 -z-20">
          <ResponsiveImage
            src="/images/site/marketing-hero-exterior-painting.webp"
            alt="Painter preparing exterior trim with windows and landscaping protected"
            width={1600}
            height={900}
            sizes="100vw"
            priority
            fetchPriority="high"
            className="h-full w-full object-cover object-[62%_center] sm:object-center"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-black/20" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black via-black/80 to-black/10" aria-hidden="true" />

        <div className="container-page flex min-h-[calc(100svh-117px)] items-center py-16 pb-28 sm:py-20 sm:pb-32 lg:min-h-[720px] lg:py-24 lg:pb-32">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-brand">Twin Cities painting contractor</p>
            <h1 id="home-title" className="display-1 mt-4 max-w-[13ch] text-balance uppercase text-white">
              Residential detail. Commercial discipline. <span className="text-brand">Preps</span> first.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-ink-2 sm:text-lg sm:leading-8">
              Owner-led painting for Twin Cities homes, businesses, and qualified public work—with protection, surface correction, coating system, and final walkthrough scoped before work starts.
            </p>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Contractor credentials">
              {trustChips.map((chip) => (
                <span key={chip} className="inline-flex min-h-9 items-center border border-white/15 bg-black/60 px-3 py-2 text-xs font-semibold text-ink-2 backdrop-blur-sm">
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/estimate"
                data-track="hero_cta_click"
                data-track-payload='{"source":"homepage_hero","label":"Get My Free Price Range"}'
                className="inline-flex min-h-14 items-center justify-center gap-3 bg-brand px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:bg-orange-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Get My Free Price Range <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <a
                href="tel:+16514104196"
                data-track="call_click"
                data-track-payload='{"source":"homepage_hero"}'
                className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/45 bg-black/35 px-6 py-4 text-sm font-black uppercase tracking-[0.08em] text-white transition-colors hover:border-brand hover:text-brand"
              >
                <Phone aria-hidden="true" size={18} /> Call / Text Anthony
              </a>
              <Link href="/projects" className="inline-flex min-h-11 items-center px-1 text-sm font-bold text-ink-2 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-brand">
                See recent work
              </Link>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3" aria-label="Estimate process assurances">
              {['Written scope', 'COI available', 'Owner-led walkthrough', 'Final detail check'].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check aria-hidden="true" size={15} className="text-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="How the estimate process works" className="relative z-10 -mt-12 border-b border-line">
        <div className="container-page">
          <ol className="grid grid-cols-2 gap-px border border-line-strong bg-line lg:grid-cols-4">
            {processSteps.map(([num, title, desc]) => (
              <li key={num} className="min-h-32 bg-surface-raised px-5 py-5 sm:px-6 sm:py-6">
                <p className="text-xs font-black tracking-[0.08em] text-brand">{num}</p>
                <p className="mt-3 text-sm font-black uppercase tracking-[0.04em] text-white">{title}</p>
                <p className="mt-2 text-sm leading-6 text-ink-4">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="scope-ledger" className="border-b border-line bg-surface-void">
        <div className="container-page section">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold text-brand">Written scope</p>
              <h2 id="scope-ledger" className="display-2 mt-3 max-w-[12ch] text-balance uppercase text-white">What gets priced.</h2>
              <p className="mt-6 max-w-md text-base leading-7 text-ink-4">The estimate follows actual site conditions so preparation and execution are visible before scheduling—not buried after the work starts.</p>
            </div>
            <dl className="border-t border-line-strong">
              {scopeRows.map(([code, work, market]) => (
                <div key={code} className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-1 border-b border-line py-5 sm:grid-cols-[6rem_1fr_auto] sm:items-center sm:gap-6">
                  <dt className="text-xs font-black tracking-[0.08em] text-brand">{code}</dt>
                  <dd className="text-sm font-bold uppercase tracking-[0.03em] text-white sm:text-base">{work}</dd>
                  <dd className="col-start-2 text-sm text-ink-4 sm:col-start-auto">{market}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <PrepProtocolStage />

      <section aria-labelledby="proof" className="border-b border-line bg-surface-base">
        <div className="container-page grid lg:grid-cols-2">
          <div className="relative aspect-[4/3] border-b border-line lg:aspect-auto lg:min-h-[42rem] lg:border-b-0 lg:border-r">
            <ResponsiveImage
              src="/images/site/iphone-interior-painting-progress.webp"
              alt="Interior repaint in progress with furniture and adjacent surfaces protected"
              width={1200}
              height={900}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/75 px-5 py-4 text-sm text-ink-2 backdrop-blur-sm sm:px-6">
              Protection and surface correction are part of the work—not an upgrade added later.
            </div>
          </div>
          <div className="flex flex-col justify-center py-16 pl-0 lg:py-20 lg:pl-12">
            <p className="text-sm font-semibold text-brand">Contractor proof</p>
            <h2 id="proof" className="display-2 mt-3 max-w-[14ch] text-balance uppercase text-white">A contractor record you can inspect.</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-4">Registration, insurance, documentation, and the person responsible for the walkthrough should be clear before the project begins.</p>
            <ul className="mt-8 divide-y divide-line border-y border-line">
              {[
                [ShieldCheck, 'MN ID: IR816596', 'Registered Minnesota Specialty Contractor (Painting)'],
                [HardHat, '176.041 Exempt', 'Owner-operator exemption record'],
                [ClipboardCheck, 'Fully insured', 'Certificate of insurance available for qualified opportunities'],
                [Ruler, 'Direct scope review', 'Owner-led walkthrough through final detail'],
              ].map(([Icon, title, detail]) => {
                const Mark = Icon as typeof ShieldCheck;
                return (
                  <li key={title as string} className="flex gap-4 py-5">
                    <Mark aria-hidden="true" className="mt-0.5 shrink-0 text-brand" size={20} />
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.04em] text-white">{title as string}</p>
                      <p className="mt-1 text-sm leading-6 text-ink-4">{detail as string}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="customer-reviews" className="border-b border-line bg-surface-void">
        <div className="container-page section-tight">
          <div className="grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:items-center lg:gap-16">
            <div>
              <h2 id="customer-reviews" className="display-2 max-w-[12ch] text-balance uppercase text-white">Word from the field.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-ink-4">Project feedback should answer the same question the scope does: what was done, how it was handled, and whether the finish held up to expectations.</p>
              <Link href="/projects" className="mt-7 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-white underline decoration-white/30 underline-offset-4 transition-colors hover:text-brand hover:decoration-brand">
                See recent work <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <ReviewCarousel />
          </div>
        </div>
      </section>

      <section aria-labelledby="request-scope" className="bg-surface-base">
        <div className="container-page section grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <aside className="border-t-2 border-brand pt-6">
            <p className="text-sm font-semibold text-brand">Free written estimate</p>
            <h2 id="request-scope" className="display-2 mt-3 max-w-[12ch] text-balance uppercase text-white">Tell us about the project.</h2>
            <p className="mt-6 max-w-md text-base leading-7 text-ink-4">Start with the property, city, surfaces, timeline, and preparation needs. Contact details come last so the first decisions stay focused on the work.</p>
            <p className="mt-8 text-sm text-ink-4">Serving Minneapolis, St. Paul, and the Twin Cities metro.</p>
          </aside>
          <div className="border border-line-strong bg-surface-raised p-5 sm:p-8">
            <LeadForm source="homepage_scope_desk" defaultMarket="Residential" />
          </div>
        </div>
      </section>
    </article>
  );
}
