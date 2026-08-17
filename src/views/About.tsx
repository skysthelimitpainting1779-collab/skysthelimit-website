import { Camera, ClipboardCheck, PaintRoller, Phone, ShieldCheck } from 'lucide-react';

import JsonLd from '@/components/JsonLd';
import {
  PublicContainer,
  PublicCtaLink,
  PublicFeatureGrid,
  PublicHero,
  PublicPage,
  PublicProcess,
  PublicProofBand,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { businessEmail, businessPhone } from '@/lib/contact';
import { breadcrumbSchema, businessSchema } from '@/lib/seo';

const credentials = [
  { icon: PaintRoller, title: 'Journeyworker foundation', body: 'Anthony completed a Minnesota Journeyworker Painter and Decorator apprenticeship program.' },
  { icon: ClipboardCheck, title: 'Direct accountability', body: 'The same owner handles the scope conversation, preparation review, execution oversight, and closeout.' },
  { icon: ShieldCheck, title: 'Registered and insured', body: 'Registered Minnesota Specialty Contractor IR816596 with general liability, commercial auto, and tools coverage.' },
  { icon: Camera, title: 'Documented surfaces', body: 'Photos and condition notes keep the estimate tied to the actual property.' },
] as const;

const process = [
  { title: 'Scope', body: 'Walk the space, record surfaces, access, protection, timing, and finish expectations.' },
  { title: 'Prep', body: 'Clean, repair, sand, caulk, mask, protect, and prime as the written scope requires.' },
  { title: 'Execute', body: 'Apply the coating system with controlled staging, coverage, and communication.' },
  { title: 'Verify', body: 'Review the completed work against the same written scope and close out the details.' },
] as const;

export default function AboutPage() {
  return (
    <PublicPage>
      <JsonLd
        data={[
          businessSchema,
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About Us', path: '/about' },
          ]),
        ]}
      />

      <PublicHero
        eyebrow="About the company"
        title="One owner. One written scope."
        description="Journeyworker-trained painting built around direct accountability, careful preparation, and a finish that holds up."
        image="/brand/generated/sky-owner-proof.webp"
        imageAlt="Sky's the Limit Painting branded equipment and owner-led field proof"
        proof={['Owner-operated', 'Prep-first by design', 'Twin Cities based']}
        badgeIcon={PaintRoller}
        actions={
          <>
            <PublicCtaLink href="/estimate" size="marketing-lg" track="hero_cta_click" trackPayload={{ source: 'about_hero', label: 'Get a Free Price Range' }}>
              Get a Free Price Range
            </PublicCtaLink>
            <PublicCtaLink href={`tel:${businessPhone}`} variant="outline" size="marketing-lg" icon={Phone} iconPosition="start" track="call_click" trackPayload={{ source: 'about_hero' }}>
              Call Anthony
            </PublicCtaLink>
          </>
        }
      />

      <PublicProofBand items={['Registered MN Specialty Contractor IR816596', 'Fully insured', 'Owner-led scope through closeout']} />

      <PublicSection tone="paper">
        <PublicContainer className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[32rem] border border-border">
            <ResponsiveImage
              src="/images/site/iphone-exterior-prep-front-entry.webp"
              alt="Exterior surface preparation in progress"
              width={1200}
              height={1000}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div>
            <PublicSectionHeading
              eyebrow="Owner-operator advantage"
              title="The scope does not change hands."
              description="Anthony Briseno founded Sky's the Limit Painting LLC around a simple operating principle: the person who walks the property should stay accountable for the preparation, communication, and final detail."
            />
            <div className="mt-8 grid gap-5 text-lg leading-8 text-muted-foreground">
              <p>That direct line matters in occupied homes, active businesses, and facilities where protection, access, and scheduling cannot be improvised.</p>
              <p>Preparation is treated as visible work. Cleaning, scraping, sanding, caulking, masking, and priming are documented before the coating system begins.</p>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="soft">
        <PublicContainer>
          <PublicSectionHeading eyebrow="Credentials and coverage" title="Trade discipline you can verify." />
          <div className="mt-12"><PublicFeatureGrid items={credentials} columns={4} /></div>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="ink">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="Working method"
            title="The same sequence, scaled to the scope."
            description="A residential room and a commercial facility need different logistics, but both benefit from a visible work sequence."
          />
          <PublicProcess items={process} />
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="trust">
        <PublicContainer className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <PublicSectionHeading
            eyebrow="Twin Cities service"
            title="Talk directly with the owner about the work."
            description="Based in Inver Grove Heights and serving homeowners, businesses, and qualified public opportunities across the Twin Cities Metro."
          />
          <Card variant="panel">
            <CardHeader>
              <CardTitle className="public-display text-4xl">Start with the property.</CardTitle>
              <CardDescription>Share the city, surfaces, timing, and preparation concerns. Anthony will respond from the same details used to build the scope.</CardDescription>
            </CardHeader>
            <div className="grid gap-3 px-6 pb-6">
              <PublicCtaLink href="/estimate" size="marketing-lg">Get a Free Price Range</PublicCtaLink>
              <PublicCtaLink href={`mailto:${businessEmail}`} variant="outline" size="marketing" icon={null}>{businessEmail}</PublicCtaLink>
            </div>
          </Card>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
