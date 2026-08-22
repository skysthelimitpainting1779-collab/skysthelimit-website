'use client';

import { ArrowDownRight, ArrowRight, ArrowUpRight, Check, ShieldCheck } from 'lucide-react';

import LeadForm from '../components/LeadForm';
import PrepProtocolStage from '../components/PrepProtocolStage';
import ResponsiveImage from '../components/ResponsiveImage';
import { PublicCtaLink, PublicPage } from '../components/public/PublicSystem';
import { faqSchema } from '../lib/seo';

const stageLedger = [
  ['01', 'Protect', 'Cover, mask, and safeguard the property before preparation begins.'],
  ['02', 'Repair', 'Patch, caulk, sand, and correct the surface conditions that matter.'],
  ['03', 'Prime', 'Match the primer to the surface, exposure, and coating plan.'],
  ['04', 'Paint', 'Apply the selected coating system with the preparation still intact.'],
  ['05', 'Finish', 'Detail, clean up, and walk the agreed scope together.'],
] as const;

const scopeRows = [
  ['Interior', 'Walls, ceilings, trim, doors, and cabinets', '/residential'],
  ['Exterior', 'Siding, trim, entries, decks, and fences', '/residential'],
  ['Property', 'Repaints, turnovers, and common areas', '/commercial'],
  ['Parking Lot Striping', 'Parking lots, curbs, and safety striping', '/painting-services/parking-lot-striping'],
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
    <PublicPage className="proof-surface overflow-hidden bg-[#071321]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema([...faqItems])) }} />

      <section aria-labelledby="home-title" className="proof-hero relative isolate min-h-[calc(100svh-7rem)] overflow-hidden bg-[#071321] text-[#F6F3EB]">
        <ResponsiveImage
          src="/images/site/proof-in-the-prep-tape-material.jpg"
          alt=""
          width={2560}
          height={1440}
          sizes="100vw"
          priority
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,19,33,0.98)_0%,rgba(7,19,33,0.9)_45%,rgba(7,19,33,0.38)_76%,rgba(7,19,33,0.12)_100%)]" />
        <div aria-hidden="true" className="proof-hero-grain absolute inset-0" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/30" />

        <div className="relative mx-auto flex min-h-[calc(100svh-7rem)] max-w-[96rem] flex-col justify-between px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 xl:px-16">
          <div className="flex items-center justify-between gap-6 text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#DDEBFA]">
            <span>Twin Cities painting</span>
            <span className="hidden sm:block">Owner-led from walkthrough to final detail</span>
          </div>

          <div className="max-w-[56rem] py-12 sm:py-16 lg:py-20">
            <h1 id="home-title" className="proof-display max-w-[10ch] text-[clamp(4.2rem,10vw,10.5rem)] leading-[0.78] tracking-[-0.06em] text-[#F6F3EB]">
              Paint is the last thing we do.
            </h1>
            <p className="mt-8 max-w-[39rem] text-lg font-semibold leading-8 text-[#DDEBFA] sm:text-xl sm:leading-9">
              A finish that lasts starts before the first coat. It begins with what gets covered, corrected, specified, and checked—before the first coat ever reaches the wall.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <PublicCtaLink
                href="#walkthrough"
                size="marketing-lg"
                track="hero_cta_click"
                trackPayload={{ source: 'homepage_owner_finish_ledger', label: 'Start the Written Scope' }}
                className="proof-cta-primary"
              >
                Start the Written Scope
              </PublicCtaLink>
              <PublicCtaLink
                href="tel:+16514104196"
                variant="outline"
                size="marketing-lg"
                icon={null}
                track="call_click"
                trackPayload={{ source: 'homepage_proof_hero' }}
                className="border-white/45 bg-transparent text-[#F6F3EB] hover:border-[#FF661C] hover:bg-[#FF661C] hover:text-[#071321]"
              >
                Call Anthony
              </PublicCtaLink>
            </div>
          </div>

          <div className="grid gap-5 border-t border-white/25 pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <p className="max-w-[44rem] text-base font-semibold leading-6 text-[#DDEBFA]">
              Anthony manages the walkthrough, written scope, preparation plan, and final detail—so the work stays clear before a date is reserved.
            </p>
            <ul aria-label="Service commitments" className="flex flex-wrap gap-x-5 gap-y-2 text-xs font-black uppercase tracking-[0.1em] text-[#F6F3EB]">
              {['Owner-led', 'Written scope', 'Prep first'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check aria-hidden="true" size={15} className="text-[#FF661C]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="mechanism-title" className="relative overflow-hidden bg-[#F6F3EB] text-[#071321]">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 hidden w-[42%] bg-[#0254C3] lg:block" />
        <div className="relative mx-auto grid max-w-[96rem] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16">
            <h2 id="mechanism-title" className="proof-display max-w-[11ch] text-[clamp(3.4rem,7vw,7.5rem)] leading-[0.82] tracking-[-0.055em]">
              The work you see rests on the work you do not.
            </h2>
            <p className="mt-8 max-w-[38rem] text-lg leading-8 text-[#314457] sm:text-xl">
              The written scope makes preparation visible before the day begins. It gives the homeowner a clear path from walkthrough to closeout instead of a generic painting package.
            </p>
            <a href="#proof-record" className="group mt-10 inline-flex min-h-12 items-center gap-3 border-b-2 border-[#071321] text-sm font-black uppercase tracking-[0.08em] text-[#071321] transition-colors hover:border-[#FF661C] hover:text-[#FF661C]">
              See the preparation record <ArrowDownRight aria-hidden="true" size={19} className="transition-transform duration-300 group-hover:translate-y-1" />
            </a>
          </div>
          <div className="relative flex min-h-[22rem] flex-col justify-end overflow-hidden bg-[#0254C3] p-6 text-[#F6F3EB] sm:p-8 lg:min-h-full lg:p-12">
            <span aria-hidden="true" className="proof-vertical-word pointer-events-none absolute -right-5 top-8 select-none text-[clamp(5rem,15vw,14rem)] font-black leading-none text-white/15">PREP</span>
            <div className="relative max-w-[24rem] border-t border-white/40 pt-5">
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#DDEBFA]">A written field plan</p>
              <p className="mt-5 text-3xl font-black leading-tight sm:text-4xl">No guessing about what happens before the finish.</p>
              <p className="mt-6 text-base leading-7 text-[#E6EFF8]">Protection, repair, primer, coating, and closeout belong to the same documented conversation.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="proof-record" aria-labelledby="stage-ledger-title" className="overflow-hidden bg-[#0254C3] py-20 text-[#F6F3EB] sm:py-24 lg:py-32">
        <div className="mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
            <h2 id="stage-ledger-title" className="proof-display max-w-[8ch] text-[clamp(3.4rem,6vw,6.75rem)] leading-[0.82] tracking-[-0.055em]">
              Before color, there is control.
            </h2>
            <p className="max-w-[34rem] self-end text-lg leading-8 text-[#E6EFF8] sm:text-xl">Every stage protects the next one. The order is simple enough to understand and specific enough to put in writing.</p>
          </div>

          <ol className="mt-16 grid border-y border-white/35 md:grid-cols-5">
            {stageLedger.map(([number, title, detail], index) => (
              <li key={number} className="proof-stage group relative min-h-[20rem] border-b border-white/25 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 md:p-6 lg:min-h-[24rem] lg:p-8">
                <span className="text-sm font-black tracking-[0.14em] text-[#DDEBFA]">{number}</span>
                <h3 className="proof-display mt-10 max-w-[6ch] text-4xl leading-[0.86] tracking-[-0.045em] sm:text-5xl">{title}</h3>
                <p className="absolute inset-x-5 bottom-6 max-w-[18rem] text-sm leading-6 text-[#E6EFF8] md:inset-x-6 lg:inset-x-8 lg:bottom-8">{detail}</p>
                <span aria-hidden="true" className="absolute bottom-0 left-0 h-2 w-0 bg-[#FF661C] transition-[width] duration-500 group-hover:w-full group-focus-within:w-full" />
                <span aria-hidden="true" className="absolute right-5 top-6 text-[8rem] font-black leading-none text-white/10 md:right-4">{index + 1}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <PrepProtocolStage />

      <section aria-labelledby="scope-title" className="bg-[#071321] text-[#F6F3EB]">
        <div className="mx-auto grid max-w-[96rem] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16">
            <h2 id="scope-title" className="proof-display max-w-[8ch] text-[clamp(3.4rem,6vw,6.75rem)] leading-[0.82] tracking-[-0.055em]">
              One scope, different surfaces.
            </h2>
            <p className="mt-8 max-w-[31rem] text-lg leading-8 text-[#C8D7E6]">Residential, property, commercial, and striping work all start with the same question: what must be protected and corrected before the finish begins?</p>
          </div>
          <dl className="border-t border-white/20 lg:border-l lg:border-t-0">
            {scopeRows.map(([service, surfaces, href], index) => (
              <div key={service} className="group grid min-h-36 grid-cols-[auto_minmax(0,1fr)_3rem] items-center gap-4 border-b border-white/20 px-5 py-7 transition-colors hover:bg-white hover:text-[#071321] sm:grid-cols-[3.5rem_minmax(0,1fr)_3rem] sm:px-8 lg:px-10">
                <dt className="text-sm font-black tracking-[0.12em] text-[#70A9F0] group-hover:text-[#0254C3]">0{index + 1}</dt>
                <dd>
                  <p className="proof-display text-[clamp(2.2rem,3.5vw,4rem)] leading-[0.86] tracking-[-0.045em]">{service}</p>
                  <p className="mt-3 max-w-[34rem] text-sm font-semibold leading-6 text-[#C8D7E6] group-hover:text-[#314457]">{surfaces}</p>
                </dd>
                <dd>
                  <a href={href} aria-label={`Explore ${service.toLowerCase()} painting`} className="grid h-12 w-12 place-items-center border border-white/40 text-[#F6F3EB] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF661C] hover:bg-[#FF661C] hover:text-[#071321] group-hover:border-[#071321]/30 group-hover:text-[#071321]">
                    <ArrowUpRight aria-hidden="true" size={20} />
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="accountability" aria-labelledby="accountability-title" className="relative overflow-hidden bg-[#F6F3EB] text-[#071321]">
        <div className="mx-auto grid max-w-[96rem] lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative min-h-[34rem] overflow-hidden lg:min-h-[48rem]">
            <ResponsiveImage
              src="/images/site/marketing-hero-exterior-painting.webp"
              alt="Exterior painting work in progress"
              width={1200}
              height={1600}
              sizes="(min-width: 1024px) 54vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(7,19,33,0.88)_0%,transparent_56%)]" />
            <div className="absolute inset-x-0 bottom-0 px-5 pb-7 sm:px-8 sm:pb-10">
              <p className="max-w-[28rem] text-2xl font-black leading-tight text-[#F6F3EB] sm:text-3xl">The person who hears the scope is still there at the final walkthrough.</p>
            </div>
          </div>
          <div className="relative bg-[#FF661C] px-5 py-20 text-[#071321] sm:px-8 lg:px-12 lg:py-28 xl:px-16">
            <span aria-hidden="true" className="absolute right-6 top-5 text-[7rem] font-black leading-none text-[#071321]/10">A</span>
            <h2 id="accountability-title" className="proof-display relative max-w-[7ch] text-[clamp(3.4rem,5.2vw,6rem)] leading-[0.82] tracking-[-0.055em]">The scope does not change hands.</h2>
            <p className="relative mt-8 max-w-[31rem] text-lg font-semibold leading-8 text-[#2D180D]">Anthony handles the walkthrough and project conversation directly. The final detail is checked against the same written scope used to start the work.</p>
            <ul className="relative mt-12 divide-y divide-[#071321]/25 border-y border-[#071321]/25">
              {[
                ['Minnesota registration', 'IR816596'],
                ['Coverage', 'Fully insured'],
                ['Communication', 'Owner-led scope review'],
                ['Closeout', 'Final walkthrough'],
              ].map(([label, value]) => (
                <li key={label} className="grid grid-cols-[1fr_auto] gap-5 py-5">
                  <span className="text-sm font-semibold text-[#3C2416]">{label}</span>
                  <span className="text-right text-sm font-black">{value}</span>
                </li>
              ))}
            </ul>
            <a href="/about" className="relative mt-10 inline-flex min-h-12 items-center gap-3 border-b-2 border-[#071321] text-sm font-black uppercase tracking-[0.08em] transition-colors hover:border-white hover:text-white">
              Meet the owner <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="questions-title" className="bg-[#F6F3EB] text-[#071321]">
        <div className="mx-auto grid max-w-[96rem] lg:grid-cols-[0.78fr_1.22fr]">
          <div className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16">
            <h2 id="questions-title" className="proof-display max-w-[7ch] text-[clamp(3.4rem,5.4vw,6rem)] leading-[0.82] tracking-[-0.055em]">The questions worth asking first.</h2>
          </div>
          <div className="border-t border-[#071321]/20 lg:border-l lg:border-t-0">
            {faqItems.map((item) => (
              <details key={item.question} className="group border-b border-[#071321]/20 px-5 py-7 transition-colors open:bg-[#071321] open:text-[#F6F3EB] sm:px-8 lg:px-10">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-5 text-xl font-black leading-tight marker:content-none transition-colors hover:text-[#0254C3] group-open:hover:text-[#FF8A4B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0254C3]">
                  {item.question}
                  <span aria-hidden="true" className="text-3xl font-normal text-[#0254C3] transition-transform duration-300 group-open:rotate-45 group-open:text-[#FF661C]">+</span>
                </summary>
                <p className="mt-5 max-w-[46rem] text-base leading-7 text-[#314457] group-open:text-[#DDEBFA]">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="walkthrough" aria-labelledby="walkthrough-title" className="relative overflow-hidden bg-[#0254C3] text-[#F6F3EB]">
        <div aria-hidden="true" className="proof-walkthrough-lines absolute inset-0" />
        <div className="relative mx-auto grid max-w-[96rem] lg:grid-cols-[0.8fr_1.2fr]">
          <div className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28 xl:px-16">
            <h2 id="walkthrough-title" className="proof-display max-w-[7ch] text-[clamp(3.4rem,5.6vw,6.25rem)] leading-[0.82] tracking-[-0.055em]">Start with the surface in front of you.</h2>
            <p className="mt-8 max-w-[32rem] text-lg leading-8 text-[#E6EFF8]">Share the property, city, surfaces, timing, and preparation concerns. Contact details come after the project information.</p>
            <div className="mt-12 border-y border-white/30 py-5">
              <p className="flex items-start gap-3 text-sm font-semibold leading-6 text-white">
                <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
                Your information is used only to review and respond to this project request.
              </p>
            </div>
          </div>
          <div className="bg-[#F6F3EB] p-5 text-[#071321] sm:p-8 lg:p-12">
            <LeadForm source="homepage_proof_in_prep" defaultMarket="Residential" theme="ledger" />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
