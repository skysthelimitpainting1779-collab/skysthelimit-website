import { Phone, ShieldCheck } from 'lucide-react';

import JsonLd from '@/components/JsonLd';
import {
  PublicContainer,
  PublicCtaLink,
  PublicHero,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';
import { phoneHref } from '@/lib/contact';
import { breadcrumbSchema, faqSchema } from '@/lib/seo';

const faqs = [
  {
    question: 'What painting services do you offer?',
    answer:
      'Interior rooms, exterior painting, and cabinet refinishing for homes — plus commercial painting and pavement marking and striping for businesses and facilities.',
  },
  {
    question: 'Where do you work?',
    answer:
      'We serve the Twin Cities Metro Area and are based in Inver Grove Heights, Minnesota.',
  },
  {
    question: 'Are you licensed and insured?',
    answer:
      "Yes. Sky's the Limit Painting LLC is a registered Minnesota Specialty Contractor, Registration IR816596, effective May 18, 2026 through December 31, 2027. The company carries commercial general liability coverage through Acuity — $1,000,000 per occurrence and $2,000,000 aggregate — plus commercial auto coverage.",
  },
  {
    question: 'Who will actually do the work on my project?',
    answer:
      'Owner Anthony Briseno. He is a Minnesota DLI-certified Journeyworker Painter and Decorator (apprenticeship completed May 2020) and runs the company as an owner-operated, single-member LLC — so the person who scopes your project is the person accountable for it.',
  },
  {
    question: 'How do free estimates work?',
    answer:
      'Start with the estimate form on this site — it walks through your project in three steps — or call 651-410-4196. Every estimate is free, and the written scope documents surfaces, preparation, and timing before any work begins.',
  },
  {
    question: 'What does your prep work include?',
    answer:
      'Preparation drives the finish. Depending on the written scope, prep includes protecting floors and furnishings, cleaning, sanding, caulking, masking, and priming. Exterior work gets the same discipline — prep is where exterior finishes succeed or fail.',
  },
  {
    question: 'Do you refinish kitchen cabinets?',
    answer:
      'Yes. Cabinet refinishing is one of our core residential services, alongside interior rooms and exterior painting.',
  },
  {
    question: 'Do you take on commercial work or parking lot striping?',
    answer:
      'Yes. We handle commercial painting scopes and active pavement marking and striping work — line striping, ADA-compliant accessible stalls, and related markings for lots and facilities.',
  },
  {
    question: 'What paint products do you use?',
    answer:
      'Professional-grade coatings matched to the surface and exposure. We source through Sherwin-Williams PRO+ and select the specific coating system in the written scope.',
  },
  {
    question: 'How long will my project take?',
    answer:
      'It depends on the scope — surface condition, square footage, and preparation drive the schedule. Your written estimate includes a realistic timeline, and the owner reviews it with you before work starts.',
  },
] as const;

export default function FaqPage() {
  return (
    <PublicPage>
      <JsonLd
        data={[
          faqSchema([...faqs]),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]),
        ]}
      />

      <PublicHero
        eyebrow="FAQ"
        title="Straight answers, before you ask."
        description="Licensing, insurance, free estimates, prep standards, and service area — the questions every Twin Cities property owner should ask a painting contractor."
        image="/brand/generated/sky-owner-proof.webp"
        imageAlt="Sky's the Limit Painting branded equipment"
        proof={['Owner-operated', 'Registered MN Contractor IR816596', 'Free estimates']}
        badgeIcon={ShieldCheck}
        actions={
          <>
            <PublicCtaLink href="/estimate" size="marketing-lg" track="hero_cta_click" trackPayload={{ source: 'faq_hero', label: 'Get a Free Estimate' }}>
              Get a Free Estimate
            </PublicCtaLink>
            <PublicCtaLink href={phoneHref} variant="outline" size="marketing-lg" icon={Phone} iconPosition="start" track="call_click" trackPayload={{ source: 'faq_hero' }}>
              651-410-4196
            </PublicCtaLink>
          </>
        }
      />

      <PublicSection tone="paper">
        <PublicContainer className="max-w-4xl">
          <PublicSectionHeading
            eyebrow="Common questions"
            title="Frequently asked questions."
            description="Every answer below reflects how the company actually operates — the same answers you would get from the owner on a call."
          />
          <div className="mt-10 divide-y divide-border border-y border-border">
            {faqs.map((item) => (
              <details key={item.question} className="group py-6">
                <summary className="min-h-11 cursor-pointer text-lg font-bold text-foreground marker:text-primary">
                  {item.question}
                </summary>
                <p className="mt-4 leading-7 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 border-l-[3px] border-l-trust bg-muted p-5 text-sm leading-7 text-muted-foreground">
            Sky&apos;s the Limit Painting LLC is an owner-operated registered Minnesota Specialty Contractor, Registration ID IR816596, based in Inver Grove Heights. The owner is exempt from standard workers&apos; compensation requirements under Minnesota Statute 176.041.
          </p>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="ink">
        <PublicContainer className="max-w-4xl">
          <PublicSectionHeading
            eyebrow="Still have a question?"
            title="Ask the owner directly."
            description="Call or start the free estimate form — you will talk to the person who does the work."
          />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <PublicCtaLink href="/estimate" size="marketing-lg" track="cta_click" trackPayload={{ source: 'faq_bottom', label: 'Get a Free Estimate' }}>
              Get a Free Estimate
            </PublicCtaLink>
            <PublicCtaLink href={phoneHref} variant="outline" size="marketing-lg" icon={Phone} iconPosition="start" track="call_click" trackPayload={{ source: 'faq_bottom' }}>
              651-410-4196
            </PublicCtaLink>
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
