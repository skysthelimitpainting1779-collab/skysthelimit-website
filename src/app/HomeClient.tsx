import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Phone, ShieldCheck } from 'lucide-react';

import EditorialReveal from '../components/EditorialReveal';
import LeadForm from '../components/LeadForm';
import PrepProtocolStage from '../components/PrepProtocolStage';
import ResponsiveImage from '../components/ResponsiveImage';
import { PublicCtaLink, PublicPage } from '../components/public/PublicSystem';
import { faqSchema } from '../lib/seo';

const preparationSequence = [
  ['Protect', 'Cover, mask, and safeguard the property before tools touch the surface.'],
  ['Repair', 'Patch, caulk, sand, and correct the defects that would show through paint.'],
  ['Prime', 'Match the primer to the surface, repair, and exposure.'],
  ['Paint', 'Apply the specified coating system with clean edges and controlled coverage.'],
  ['Finish', 'Detail, clean up, and review the same written scope together.'],
] as const;

const scopeRows = [
  {
    service: 'Interior',
    surfaces: 'Walls, ceilings, trim, doors, and cabinets',
    href: '/residential',
    layout: 'md:col-span-7 md:min-h-[20rem]',
    surface: 'bg-[#0254C3] text-white',
  },
  {
    service: 'Exterior',
    surfaces: 'Siding, trim, entries, decks, and fences',
    href: '/residential',
    layout: 'md:col-span-5 md:min-h-[20rem]',
    surface: 'bg-[#E8E2D5] text-[#071321]',
  },
  {
    service: 'Property',
    surfaces: 'Repaints, turnovers, and common areas',
    href: '/commercial',
    layout: 'md:col-span-5 md:min-h-[17rem]',
    surface: 'bg-[#FBFAF6] text-[#071321]',
  },
  {
    service: 'Marking',
    surfaces: 'Parking lots, curbs, and safety striping',
    href: '/commercial',
    layout: 'md:col-span-7 md:min-h-[17rem]',
    surface: 'bg-[#071321] text-[#F6F3EB]',
  },
] as const;

const proofItems = [
  ['Owner operated', 'Anthony leads the scope'],
  ['Minnesota registration', 'IR816596'],
  ['Coverage', 'Fully insured'],
  ['Service area', 'Twin Cities metro'],
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
    <PublicPage className="ledger-surface home-editorial">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema([...faqItems])) }} />

      <section aria-labelledby="home-title" className="border-b border-[#071321]/20 bg-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] xl:min-h-[calc(100dvh-4.75rem)] xl:grid-cols-[0.88fr_1.12fr]">
          <EditorialReveal className="flex flex-col justify-center px-5 py-12 sm:px-8 sm:py-16 lg:px-12 xl:px-16" direction="right">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0254C3]">
              Owner-operated Twin Cities painting
            </p>
            <h1
              id="home-title"
              className="ledger-display mt-5 max-w-[12ch] text-[clamp(3.6rem,6.2vw,6.6rem)] leading-[0.88] text-[#071321]"
            >
              A finish that lasts starts before the first coat.
            </h1>
            <p className="mt-7 max-w-[32rem] text-lg font-semibold leading-7 text-[#314457] sm:text-xl sm:leading-8">
              Anthony scopes, prepares, and closes out every project directly, so protection and finish details stay accountable.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PublicCtaLink
                href="#walkthrough"
                size="marketing-lg"
                track="hero_cta_click"
                trackPayload={{ source: 'homepage_hero', label: 'Start the Written Scope' }}
              >
                Start the Written Scope
              </PublicCtaLink>
              <PublicCtaLink href="#prep-standard" variant="outline" size="marketing-lg">
                Inspect the Preparation
              </PublicCtaLink>
            </div>
          </EditorialReveal>

          <figure className="border-t border-[#071321]/20 bg-[#071321] p-3 sm:p-5 xl:border-l xl:border-t-0 xl:p-6">
            <EditorialReveal className="flex h-full flex-col" delay={0.12} direction="left">
              <div className="relative min-h-[23rem] flex-1 overflow-hidden sm:min-h-[31rem] xl:min-h-0">
                <ResponsiveImage
                  src="/brand/generated/sky-prep-material-study.webp"
                  alt="Painting preparation materials arranged on protected work surfaces"
                  width={1600}
                  height={1000}
                  sizes="(min-width: 1280px) 56vw, 100vw"
                  priority
                  fetchPriority="high"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              </div>
              <figcaption className="grid gap-2 border-t border-white/20 bg-[#071321] px-4 py-4 text-[#F6F3EB] sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                <span className="text-sm font-black">Preparation material study</span>
                <span className="text-xs font-semibold text-[#BCD0E3]">Real project photography appears below</span>
              </figcaption>
            </EditorialReveal>
          </figure>
        </div>
      </section>

      <section aria-label="Business proof" className="border-b border-[#071321]/20 bg-[#FBFAF6]">
        <div className="mx-auto grid max-w-[94rem] grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          {proofItems.map(([label, value]) => (
            <div key={label} className="border-b border-r border-[#071321]/20 px-5 py-5 lg:border-b-0 sm:px-6">
              <p className="text-xs font-bold text-[#53616F]">{label}</p>
              <p className="mt-1 text-sm font-black text-[#071321]">{value}</p>
            </div>
          ))}
          <a
            href="tel:+16514104196"
            data-track="call_click"
            data-track-payload='{"source":"homepage_proof_rail"}'
            className="col-span-2 flex min-h-20 items-center justify-between gap-4 border-r border-[#071321]/20 px-5 text-sm font-black text-[#071321] transition-colors hover:bg-[#E8E2D5] lg:col-span-1 lg:min-h-0 lg:border-r-0 sm:px-6"
          >
            Call Anthony
            <Phone aria-hidden="true" size={18} className="text-[#0254C3]" />
          </a>
        </div>
      </section>

      <section aria-labelledby="finish-depends-title" className="border-b border-[#071321]/20 bg-[#F6F3EB] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[86rem]">
          <EditorialReveal>
            <h2 id="finish-depends-title" className="ledger-display max-w-[10ch] text-[clamp(3.4rem,6vw,6.5rem)] leading-[0.88] text-[#071321]">
              What the finish depends on.
            </h2>
            <p className="mt-7 max-w-[42rem] text-lg leading-8 text-[#314457]">
              Anthony manages the walkthrough, written scope, preparation plan, and final detail. The visible result stays tied to the work underneath it.
            </p>
          </EditorialReveal>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1.18fr_0.82fr] lg:items-stretch lg:gap-12">
            <EditorialReveal direction="right">
              <figure className="border border-[#071321]/20 bg-[#071321] p-3">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <ResponsiveImage
                    src="/brand/generated/sky-surface-preparation-study.webp"
                    alt="Close surface study showing repair, primer, and finished paint texture"
                    width={1536}
                    height={1024}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </div>
                <figcaption className="border-t border-white/20 px-4 py-4 text-sm font-semibold text-[#D8E2EC]">
                  Surface preparation study: repair, primer, and finish in one continuous plane.
                </figcaption>
              </figure>
            </EditorialReveal>

            <ol className="border-t border-[#071321]/25">
              {preparationSequence.map(([title, detail], index) => (
                <li key={title} className="border-b border-[#071321]/20">
                  <EditorialReveal
                    delay={index * 0.045}
                    className="grid grid-cols-[7rem_1fr] gap-5 py-5 sm:grid-cols-[9rem_1fr] sm:py-6"
                  >
                    <h3 className="ledger-display text-3xl leading-none text-[#071321] sm:text-4xl">{title}</h3>
                    <p className="text-sm leading-6 text-[#3E4D5D] sm:text-base sm:leading-7">{detail}</p>
                  </EditorialReveal>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section aria-labelledby="scope-title" className="border-b border-[#071321]/20 bg-[#F6F3EB] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[86rem]">
          <EditorialReveal>
            <h2 id="scope-title" className="ledger-display max-w-[10ch] text-[clamp(3.4rem,6vw,6.5rem)] leading-[0.88] text-[#071321]">
              Everything priced before anything starts.
            </h2>
            <p className="mt-7 max-w-[40rem] text-lg leading-8 text-[#314457]">
              The estimate follows the property conditions, not a generic package. Every line makes preparation and execution visible before scheduling.
            </p>
          </EditorialReveal>

          <div className="mt-12 grid border-l border-t border-[#071321]/20 md:grid-cols-12">
            {scopeRows.map((item, index) => (
              <EditorialReveal key={item.service} className={item.layout} delay={index * 0.055}>
                <Link
                  href={item.href}
                  aria-label={`Explore ${item.service.toLowerCase()} painting`}
                  className={`group flex h-full min-h-[15rem] flex-col justify-between border-b border-r border-[#071321]/20 p-6 transition-transform sm:p-8 ${item.surface}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <h3 className="ledger-display text-[clamp(3.25rem,6vw,5.6rem)] leading-[0.88]">{item.service}</h3>
                    <ArrowUpRight aria-hidden="true" size={28} className="shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" />
                  </div>
                  <p className="max-w-[28rem] text-base font-semibold leading-7 opacity-80 sm:text-lg">{item.surfaces}</p>
                </Link>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <PrepProtocolStage />

      <section id="accountability" aria-labelledby="accountability-title" className="bg-[#071321] text-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] lg:grid-cols-[1.08fr_0.92fr]">
          <figure className="border-b border-white/20 p-3 sm:p-5 lg:border-b-0 lg:border-r lg:p-6">
            <EditorialReveal className="flex h-full flex-col" direction="right">
              <div className="relative min-h-[30rem] flex-1 overflow-hidden lg:min-h-[44rem]">
                <ResponsiveImage
                  src="/images/site/iphone-interior-painting-progress.webp"
                  alt="Interior painting in progress with furniture and floors protected"
                  width={1200}
                  height={1600}
                  sizes="(min-width: 1024px) 54vw, 100vw"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              <figcaption className="grid gap-1 border-t border-white/20 px-4 py-4 text-sm font-semibold text-[#D8E2EC] sm:grid-cols-[1fr_auto] sm:items-center">
                <span>Interior protection in progress</span>
                <span className="text-[#94ABC0]">Project photography</span>
              </figcaption>
            </EditorialReveal>
          </figure>

          <EditorialReveal className="px-5 py-16 sm:px-8 lg:px-12 lg:py-24 xl:px-16" direction="left">
            <h2 id="accountability-title" className="ledger-display max-w-[8ch] text-[clamp(3.4rem,5.6vw,6rem)] leading-[0.88] text-[#F6F3EB]">
              The scope does not change hands.
            </h2>
            <p className="mt-7 max-w-[34rem] text-lg leading-8 text-[#D8E2EC]">
              Anthony handles the project conversation directly, then checks the final detail against the same written scope used to begin.
            </p>
            <dl className="mt-10 grid border-l border-t border-white/20 sm:grid-cols-2">
              {proofItems.slice(0, 3).map(([label, value]) => (
                <div key={label} className="border-b border-r border-white/20 p-5">
                  <dt className="text-xs font-semibold text-[#94ABC0]">{label}</dt>
                  <dd className="mt-2 text-sm font-black text-[#F6F3EB]">{value}</dd>
                </div>
              ))}
              <div className="border-b border-r border-white/20 p-5">
                <dt className="text-xs font-semibold text-[#94ABC0]">Closeout</dt>
                <dd className="mt-2 text-sm font-black text-[#F6F3EB]">Final walkthrough</dd>
              </div>
            </dl>
            <Link href="/about" className="mt-8 inline-flex min-h-12 items-center gap-3 border border-white/40 px-5 text-sm font-black text-[#F6F3EB] transition-colors hover:border-[#FF5A00] hover:text-[#FF8A4B]">
              Meet the owner <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </EditorialReveal>
        </div>
      </section>

      <section aria-labelledby="questions-title" className="border-t border-white/15 bg-[#071321] px-5 py-20 text-[#F6F3EB] sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-[86rem]">
          <EditorialReveal>
            <h2 id="questions-title" className="ledger-display max-w-[9ch] text-[clamp(3.4rem,6vw,6.5rem)] leading-[0.88]">
              Questions before the walkthrough.
            </h2>
          </EditorialReveal>
          <div className="mt-12 border-t border-white/20">
            {faqItems.map((item, index) => (
              <EditorialReveal key={item.question} delay={index * 0.05}>
                <details className="group border-b border-white/20 py-7 sm:py-8">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black marker:content-none sm:text-xl">
                    {item.question}
                    <span aria-hidden="true" className="text-3xl font-normal text-[#FF7B35] transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-5 max-w-[46rem] text-base leading-7 text-[#BCD0E3]">{item.answer}</p>
                </details>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="walkthrough" aria-labelledby="walkthrough-title" className="border-t border-white/15 bg-[#071321] text-[#F6F3EB]">
        <div className="mx-auto grid max-w-[94rem] lg:grid-cols-[0.76fr_1.24fr]">
          <EditorialReveal className="bg-[#0254C3] px-5 py-16 sm:px-8 lg:px-12 lg:py-24 xl:px-16" direction="right">
            <h2 id="walkthrough-title" className="ledger-display max-w-[8ch] text-[clamp(3.4rem,5.5vw,6rem)] leading-[0.88] text-white">
              Start the written scope.
            </h2>
            <p className="mt-7 max-w-[31rem] text-lg leading-8 text-[#E6EFF8]">
              Share the property, surfaces, timing, and preparation concerns. Contact details come after the project information.
            </p>
            <div className="mt-10 border-t border-white/30 pt-6">
              <p className="flex items-start gap-3 text-sm font-semibold leading-6 text-white">
                <ShieldCheck aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
                Your information is used only to review and respond to this project request.
              </p>
            </div>
          </EditorialReveal>
          <div className="bg-[#F6F3EB] p-5 text-[#071321] sm:p-8 lg:p-12">
            <LeadForm source="homepage_owner_finish_ledger" defaultMarket="Residential" theme="ledger" />
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
