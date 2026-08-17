'use client';

import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { Calculator, Camera, ClipboardCheck, MapPin, PaintRoller, Phone, Route } from 'lucide-react';

import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
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
  PublicSplitCard,
} from '@/components/public/PublicSystem';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  areaLandingPages,
  landingPageByKindAndSlug,
  landingPageBySlug,
  landingPagePath,
  serviceLandingPages,
  type LandingPage,
  type LandingPageKind,
} from '@/data/landingPages';
import { businessPhone } from '@/lib/contact';
import { breadcrumbSchema, localBusinessSchema, serviceSchema } from '@/lib/seo';
import NotFound from '@/views/NotFound';

interface LandingPageRouteProps {
  kind: LandingPageKind;
  initialPageData?: LandingPage;
}

const marketPath = {
  Residential: '/residential',
  Commercial: '/commercial',
  'Public Sector': '/public-sector',
} as const;

export default function LandingPageRoute({ kind, initialPageData }: LandingPageRouteProps) {
  const { slug } = useParams();
  const page = initialPageData || landingPageByKindAndSlug(kind, typeof slug === 'string' ? slug : undefined);

  if (!page) {
    notFound();
    return <NotFound />;
  }

  const path = landingPagePath(page);
  const siblings = page.kind === 'area' ? areaLandingPages : serviceLandingPages;
  const relatedPages = page.related
    .map((relatedSlug) => landingPageBySlug(relatedSlug))
    .filter((related): related is LandingPage => Boolean(related));
  const relatedCards = [
    ...relatedPages,
    ...siblings.filter(
      (sibling) => sibling.slug !== page.slug && !relatedPages.some((related) => related.slug === sibling.slug),
    ),
  ].slice(0, 4);
  const structuredData: unknown[] = [
    serviceSchema(page.title, page.description, path),
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: page.market, path: marketPath[page.market] },
      { name: page.shortTitle, path },
    ]),
  ];
  if (page.kind === 'area') structuredData.push(localBusinessSchema(page.shortTitle, page.slug));

  return (
    <PublicPage>
      <JsonLd data={structuredData} />

      <PublicHero
        eyebrow={page.eyebrow}
        title={page.title}
        description={page.headline}
        image={page.image}
        imageAlt={`${page.title} project proof`}
        proof={page.proof}
        badgeIcon={page.kind === 'area' ? MapPin : PaintRoller}
        actions={
          <>
            <PublicCtaLink
              href="/estimate"
              icon={Calculator}
              iconPosition="start"
              size="marketing-lg"
              track="landing_cta_click"
              trackPayload={{ page: path, action: 'calculator' }}
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
              trackPayload={{ source: path }}
            >
              Call Anthony
            </PublicCtaLink>
          </>
        }
      />

      <PublicProofBand items={page.proof} />

      <PublicSection tone="soft">
        <PublicContainer className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <div>
            <PublicSectionHeading
              eyebrow="Scope map"
              title="Price the real surfaces, not a generic package."
              description={page.description}
            />
            {page.kind === 'area' && page.neighborhoods?.length ? (
              <div className="mt-8 flex flex-wrap gap-2" aria-label="Neighborhoods served">
                {page.neighborhoods.map((neighborhood) => (
                  <span key={neighborhood} className="border border-border bg-card px-3 py-2 text-xs font-bold text-card-foreground">
                    {neighborhood}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid border-l border-t border-border sm:grid-cols-2">
            {page.scope.map((item, index) => (
              <Card key={item} variant="default" className="border-l-0 border-t-0">
                <CardHeader>
                  <p className="text-sm font-bold text-trust">{String(index + 1).padStart(2, '0')}</p>
                  <CardTitle className="text-xl">{item}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="ink">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="How it moves"
            title="Clear steps before anyone starts painting."
            description="The same owner-led sequence carries the project from scope to closeout."
          />
          <PublicProcess items={page.process} />
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="paper">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="Proof intake"
            title="Send the surface story once."
            description="Photos, location, timeline, and access constraints give the first response enough context to be useful."
          />
          <div className="mt-12">
            <PublicFeatureGrid
              items={[
                { icon: Camera, title: 'Photo evidence', body: 'Add a public Google Drive, iCloud, Dropbox, or album link.' },
                { icon: Route, title: 'Correct service lane', body: `This request enters the ${page.market.toLowerCase()} estimate path.` },
                { icon: ClipboardCheck, title: 'Structured next step', body: 'Anthony receives the project facts instead of a vague callback request.' },
              ]}
            />
          </div>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="trust" id="start-scope">
        <PublicContainer className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <PublicSectionHeading
            eyebrow="Start the written scope"
            title={`${page.shortTitle} project details.`}
            description="Share the project conditions first. Contact details come after the useful scope information."
          />
          <PublicSplitCard title="Tell us about the work">
            <LeadForm source={`${page.title} landing page`} defaultMarket={page.market} compact theme="ledger" />
          </PublicSplitCard>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="soft">
        <PublicContainer>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <PublicSectionHeading eyebrow="Related paths" title="Keep moving in the right lane." />
            <PublicCtaLink href={marketPath[page.market]} variant="outline">
              View {page.market}
            </PublicCtaLink>
          </div>
          <div className="mt-10 grid border-l border-t border-border md:grid-cols-2 xl:grid-cols-4">
            {relatedCards.map((related) => (
              <Link key={related.slug} href={landingPagePath(related)} className="group border-b border-r border-border">
                <Card variant="interactive" className="h-full border-0">
                  <CardHeader>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-trust">{related.eyebrow}</p>
                    <CardTitle>{related.shortTitle}</CardTitle>
                    <CardDescription>Open the service scope</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
