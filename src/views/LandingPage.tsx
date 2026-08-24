'use client';

import { useParams, notFound } from 'next/navigation';
import NotFound from './NotFound';
import PageTransition from '../components/PageTransition';
import { Hero } from '@/components/landing/Hero';
import { ScopeMap } from '@/components/landing/ScopeMap';
import { ProcessSteps } from '@/components/landing/ProcessSteps';
import { ProofIntake } from '@/components/landing/ProofIntake';
import { EstimateCta } from '@/components/landing/EstimateCta';
import { RelatedPaths } from '@/components/landing/RelatedPaths';
import {
  areaLandingPages,
  landingPageByKindAndSlug,
  landingPageBySlug,
  landingPagePath,
  serviceLandingPages,
  type LandingPage,
  type LandingPageKind,
} from '../data/landingPages';

interface LandingPageRouteProps {
  kind: LandingPageKind;
  initialPageData?: LandingPage;
}

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
    .filter((related): related is LandingPage => Boolean(related))
    .slice(0, 4);
  const relatedCards = [
    ...relatedPages,
    ...siblings.filter(
      (sibling) => sibling.slug !== page.slug && !relatedPages.some((related) => related.slug === sibling.slug),
    ),
  ].slice(0, 4);

  return (
    <PageTransition>
      <Hero page={page} path={path} />
      <ScopeMap page={page} />
      <ProcessSteps process={page.process} />
      <ProofIntake market={page.market} />
      <EstimateCta page={page} />
      <RelatedPaths cards={relatedCards} market={page.market} />
    </PageTransition>
  );
}
