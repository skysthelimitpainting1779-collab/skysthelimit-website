'use client';

import { Calculator, Camera, ClipboardCheck, FileCheck2, Phone } from 'lucide-react';

import BookingCta from '@/components/BookingCta';
import JsonLd from '@/components/JsonLd';
import {
  PublicContainer,
  PublicCtaLink,
  PublicFeatureGrid,
  PublicHero,
  PublicPage,
  PublicProcess,
  PublicSection,
  PublicSectionHeading,
  PublicSplitCard,
} from '@/components/public/PublicSystem';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { marketBySlug, type MarketSlug } from '@/data/markets';
import { businessPhone } from '@/lib/contact';
import { breadcrumbSchema, serviceSchema } from '@/lib/seo';

interface MarketPageProps {
  slug: MarketSlug;
}

export default function MarketPage({ slug }: MarketPageProps) {
  const market = marketBySlug[slug];

  return (
    <PublicPage>
      <JsonLd
        data={[
          serviceSchema(market.title, market.metaDescription, `/${market.slug}`),
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: market.navLabel, path: `/${market.slug}` },
          ]),
        ]}
      />

      <PublicHero
        eyebrow={market.accent}
        title={market.title}
        description={market.headline}
        image={market.heroImage}
        imageAlt={market.heroAlt}
        proof={market.proof}
        badgeIcon={market.icon}
        actions={
          <>
            <PublicCtaLink
              href="/estimate"
              icon={Calculator}
              iconPosition="start"
              size="marketing-lg"
              track="hero_cta_click"
              trackPayload={{ label: 'Get a Free Price Range', source: market.slug }}
            >
              Get a Free Price Range
            </PublicCtaLink>
            <PublicCtaLink
              href={`tel:${businessPhone}`}
              variant="outline"
              icon={Phone}
              iconPosition="start"
              size="marketing-lg"
              track="call_click"
              trackPayload={{ source: market.slug }}
            >
              Call Anthony
            </PublicCtaLink>
          </>
        }
      />

      <PublicSection tone="soft">
        <PublicContainer className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <PublicSectionHeading
            eyebrow="Scope discipline"
            title="Built around the real conditions of the work."
            description={market.summary}
          />
          <PublicFeatureGrid items={market.capabilities} />
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="ink">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="Work sequence"
            title="Clear steps before paint opens."
            description="Protection, preparation, execution, and closeout stay tied to the same written scope."
          />
          <PublicProcess items={market.process} />
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="paper">
        <PublicContainer className="grid gap-10 lg:grid-cols-2 lg:items-stretch">
          <div className="relative min-h-[28rem] border border-border">
            <ResponsiveImage
              src={market.image}
              alt={`${market.title} project detail`}
              width={1400}
              height={1000}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col gap-5">
            <PublicSplitCard title="Owner-led scope review" description={market.description}>
              <div className="grid gap-4">
                {[
                  { icon: Camera, title: 'Surface evidence', body: 'Photos and site conditions inform the first conversation.' },
                  { icon: ClipboardCheck, title: 'Written preparation', body: 'Protection, repair, priming, and coating details stay visible.' },
                  { icon: FileCheck2, title: 'Documented closeout', body: 'Final details are reviewed against the agreed scope.' },
                ].map(({ icon: Icon, title, body }) => (
                  <Card key={title} variant="proof">
                    <CardHeader className="grid grid-cols-[auto_1fr] gap-x-4">
                      <Icon aria-hidden="true" className="text-trust" />
                      <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="mt-1">{body}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </PublicSplitCard>
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="trust">
        <PublicContainer className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <PublicSectionHeading
            eyebrow="Next step"
            title="Turn the property conditions into a written plan."
            description="Registered Minnesota Specialty Contractor IR816596. Fully insured. Owner-led from first scope review through final detail."
          />
          <div className="grid gap-3">
            <PublicCtaLink
              href="/estimate"
              size="marketing-lg"
              icon={Calculator}
              iconPosition="start"
              track="hero_cta_click"
              trackPayload={{ label: 'Get a Free Price Range', source: `${market.slug}_close` }}
            >
              Get a Free Price Range
            </PublicCtaLink>
            <PublicCtaLink
              href="/contact"
              variant="outline"
              size="marketing-lg"
              track="hero_cta_click"
              trackPayload={{ label: market.cta, source: market.slug }}
            >
              {market.cta}
            </PublicCtaLink>
            <BookingCta audience={market.slug === 'residential' ? 'homeowner' : market.slug} className="w-full" />
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
