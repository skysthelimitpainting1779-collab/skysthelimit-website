import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, ClipboardCheck, ShieldCheck } from 'lucide-react';
import LeadForm from '../components/LeadForm';
import PrepProtocolStage from '../components/PrepProtocolStage';
import ResponsiveImage from '../components/ResponsiveImage';
import { PublicCtaLink, PublicPage } from '../components/public/PublicSystem';
import { faqSchema } from '../lib/seo';

const stageLedger = [
  ['01', 'Protect', 'Cover, mask, and safeguard the property.'],
  ['02', 'Repair', 'Patch, caulk, sand, and correct defects.'],
  ['03', 'Prime', 'Match the primer to the surface and exposure.'],
  ['04', 'Paint', 'Apply the specified coating system cleanly.'],
  ['05', 'Finish', 'Detail, clean up, and walk the scope together.'],
] as const;

const scopeRows = [
  ['Interior', 'Walls, ceilings, trim, doors, and cabinets', '/residential'],
  ['Exterior', 'Siding, trim, entries, decks, and fences', '/residential'],
  ['Property', 'Repaints, turnovers, and common areas', '/commercial'],
  ['Marking', 'Parking lots, curbs, and safety striping', '/commercial'],
] as const;

const faqItems = [
  {
    question: 'How is a painting project scoped?',
    answer: 'The walkthrough records the surfaces, condition, access, protection, preparation, photos, and timing. Those details become the written estimate before work is scheduled.',
  },
  {
    question: 'Who handles the walkthrough?',
    answer: 'Anthony Briseno handles the project conversation and scope review directly, so the details are not passed from a sales desk to the person responsible for the work.',
  },
  {
    question: 'What happens before painting begins?',
    answer: 'The scope identifies what must be covered, cleaned, repaired, sanded, caulked, and primed before the selected coating system is applied.',
  },
] as const;

export default function HomeClient() {
  return (
    <PublicPage className="ledger-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema([...faqItems])) }} />

      <section aria-labelledby="home-title" className="border-b border-[#071321]/20">
        <div className="mx-auto grid min-h-[calc(100svh-112px)] max-w-[94rem] lg:grid-cols-[58fr_42fr]">
          <div className="ledger-grid flex min-h-[39rem] flex-col justify-between px-5 py-10 sm:px-8 sm:py-12 lg:min-h-0 lg:px-12 lg:py-14 xl:px-16">
            <div>
              <h1 id="home-title" className="ledger-display max-w-[11ch] text-[clamp(3.5rem,6.6vw,6rem)] leading-[0.84] text-[#071321]">
                A finish that lasts starts before the first coat.
              </h1>
              <p className="mt-7 max-w-[36rem] text-lg font-semibold leading-7 text-[#26384A] sm:text-xl sm:leading-8">
                Anthony manages the walkthrough, written scope, preparation plan, and final detail—so your property stays protected and the work is clear before it starts.
              </p>
            </div>

            <div className="mt-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <PublicCtaLink
                  href="#walkthrough"
                  size="marketing-lg"
                  track="hero_cta_click"
                  trackPayload={{ source: 'homepage_hero', label: 'Get a Free Price Range' }}
                >
                  Start the Written Scope
                </PublicCtaLink>
                <PublicCtaLink
                  href="tel:+16514104196"
                  variant="outline"
                  size="marketing-lg"
                  icon={null}
                  track="call_click"
                  trackPayload={{ source: 'homepage_hero' }}
                >
                  Call Anthony
                </PublicCtaLink>
              </div>
              <ul aria-label="Service commitments" className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-[#314457]">
                {['Owner-led', 'Written scope', 'Twin Cities metro'].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check aria-hidden="true" size={16} className="text-[#0254C3]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative min-h-[32rem] border-t border-[#071321]/20 lg:min-h-0 lg:border-l lg:border-t-0">
            <span className="ledger-tape" aria-hidden="true" />
            <ResponsiveImage
              src="/images/site/marketing-hero-exterior-painting.webp"
              alt="Painter preparing exterior trim while windows and landscaping are protected"
              width={1600}
              height={900}
              sizes="(min-width: 1024px) 42vw, 100vw"
              priority
              fetchPriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/55 bg-[#F6F3EB]/94 px-5 py-3 text-xs font-black uppercase tracking-[0.08em] text-[#071321]">
              <span>Field record</span>
              <span>Exterior preparation</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 grid border-t border-[#071321]/20 bg-[#F6F3EB]/96 sm:grid-cols-[1fr_auto]">
              <div className="p-5 sm:p-6">
                <p className="text-base font-black text-[#071321]">Protection and correction belong in the work order.</p>
                <p className="mt-2 max-w-[34rem] text-sm leading-6 text-[#3E4D5D]">The visible finish starts with the details that are easiest to skip and hardest to correct later.</p>
              </div>
              <div className="border-t border-[#071321]/20 p-5 sm:border-l sm:border-t-0 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#0254C3]">Written scope</p>
                <p className="mt-2 text-sm font-bold text-[#071321]">Before scheduling</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="stage-ledger-title" className="border-b border-[#071321]/20 bg-[#F9F7F1]">
        <h2 id="stage-ledger-title" className="sr-only">Preparation stage ledger</h2>
        <div className="mx-auto max-w-[94rem] overflow-x-auto">
          <ol className="grid min-w-[65rem] grid-cols-[repeat(5,minmax(0,1fr))_1.15fr]">
            {stageLedger.map(([number, title, detail]) => (
              <li key={number} className="border-r border-[#071321]/20 px-5 py-6 last:border-r-0">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-black text-[#0254C3]">{number}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-[#0254C3]/45" />
                </div>
                <h3 className="ledger-display mt-3 text-3xl leading-none text-[#071321]">{title}</h3>
                <p className="mt-3 text-sm leading-5 text-[#3E4D5D]">{detail}</p>
              </li>
            ))}
            <li className="px-5 py-6">
              <ClipboardCheck aria-hidden="true" size={22} className="text-[#0254C3]" />
              <p className="mt-4 text-lg font-black text-[#071321]">One owner. One scope.</p>
              <p className="mt-2 text-sm leading-5 text-[#3E4D5D]">Documented from the first conversation through final detail.</p>
            </li>
          </ol>
        </div>
      </section>

      <section aria-labelledby="scope-title" className="border-b border-[#071321]/20 bg-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="ledger-grid border-b border-[#071321]/20 px-5 py-16 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-24 xl:px-16">
            <h2 id="scope-title" className="ledger-display max-w-[8ch] text-[clamp(3.2rem,5vw,5.5rem)] leading-[0.88] text-[#071321]">
              Everything priced before anything starts.
            </h2>
            <p className="mt-7 max-w-[34rem] text-lg leading-8 text-[#314457]">The estimate follows the property conditions—not a generic package. Each line makes preparation and execution visible before a date is reserved.</p>
          </div>

          <dl className="divide-y divide-[#071321]/20">
            {scopeRows.map(([service, surfaces, href]) => (
              <div key={service} className="grid min-h-28 grid-cols-[6.5rem_1fr_auto] items-center gap-5 px-5 py-6 sm:px-8 lg:px-10">
                <dt className="ledger-display text-3xl text-[#071321]">{service}</dt>
                <dd className="text-base font-semibold leading-6 text-[#314457]">{surfaces}</dd>
                <dd>
                  <Link href={href} aria-label={`Explore ${service.toLowerCase()} painting`} className="grid h-12 w-12 place-items-center border border-[#071321]/25 text-[#071321] transition-colors hover:border-[#0254C3] hover:text-[#0254C3]">
                    <ArrowUpRight aria-hidden="true" size={20} />
                  </Link>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <PrepProtocolStage />

      <section id="accountability" aria-labelledby="accountability-title" className="bg-[#071321] text-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[34rem] border-b border-white/20 lg:border-b-0 lg:border-r">
            <ResponsiveImage
              src="/images/site/iphone-interior-painting-progress.webp"
              alt="Interior painting in progress with furniture and floors protected"
              width={1200}
              height={1600}
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-white/40 bg-[#071321]/94 px-5 py-4 text-xs font-black uppercase tracking-[0.08em] text-[#F6F3EB] sm:px-8">
              <span>Interior protection record</span>
              <span>Preparation in progress</span>
            </div>
          </div>
          <div className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24 xl:px-16">
            <h2 id="accountability-title" className="ledger-display max-w-[7ch] text-[clamp(3.2rem,5vw,5.5rem)] leading-[0.88] text-[#F6F3EB]">
              The scope does not change hands.
            </h2>
            <p className="mt-7 max-w-[34rem] text-lg leading-8 text-[#D8E2EC]">Anthony handles the walkthrough and project conversation directly. The final detail is checked against the same written scope used to start the work.</p>
            <ul className="mt-10 divide-y divide-white/20 border-y border-white/20">
              {[
                ['Minnesota registration', 'IR816596'],
                ['Coverage', 'Fully insured'],
                ['Communication', 'Owner-led scope review'],
                ['Closeout', 'Final walkthrough'],
              ].map(([label, value]) => (
                <li key={label} className="grid grid-cols-[1fr_auto] gap-5 py-5">
                  <span className="text-sm font-semibold text-[#BCD0E3]">{label}</span>
                  <span className="text-right text-sm font-black text-[#F6F3EB]">{value}</span>
                </li>
              ))}
            </ul>
            <Link href="/about" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-white/40 px-5 text-sm font-black text-[#F6F3EB] transition-colors hover:border-[#FF661C] hover:text-[#FF8A4B]">
              Meet the owner <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="questions-title" className="border-b border-[#071321]/20 bg-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] lg:grid-cols-[0.7fr_1.3fr]">
          <div className="ledger-grid border-b border-[#071321]/20 px-5 py-16 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-24 xl:px-16">
            <h2 id="questions-title" className="ledger-display max-w-[7ch] text-[clamp(3.2rem,5vw,5.5rem)] leading-[0.88] text-[#071321]">Questions before the walkthrough.</h2>
          </div>
          <div className="divide-y divide-[#071321]/20">
            {faqItems.map((item) => (
              <details key={item.question} className="group px-5 py-7 sm:px-8 lg:px-10">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-[#071321] marker:content-none">
                  {item.question}
                  <span aria-hidden="true" className="text-2xl font-normal text-[#0254C3] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-5 max-w-[46rem] text-base leading-7 text-[#314457]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="walkthrough" aria-labelledby="walkthrough-title" className="bg-[#0254C3] text-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] lg:grid-cols-[0.72fr_1.28fr]">
          <div className="border-b border-white/30 px-5 py-16 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-24 xl:px-16">
            <h2 id="walkthrough-title" className="ledger-display max-w-[7ch] text-[clamp(3.2rem,5vw,5.5rem)] leading-[0.88] text-white">Start the written scope.</h2>
            <p className="mt-7 max-w-[32rem] text-lg leading-8 text-[#E6EFF8]">Share the property, city, surfaces, timing, and preparation concerns. Contact details come after the project information.</p>
            <div className="mt-10 border-y border-white/30 py-5">
              <p className="flex items-start gap-3 text-sm font-semibold leading-6 text-white">
                <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
                Your information is used only to review and respond to this project request.
              </p>
            </div>
          </div>
          <div className="bg-[#F6F3EB] p-5 text-[#071321] sm:p-8 lg:p-12">
            <LeadForm source="homepage_owner_finish_ledger" defaultMarket="Residential" theme="ledger" />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
