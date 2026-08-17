import { MapPin, Phone } from 'lucide-react';

import JsonLd from '@/components/JsonLd';
import {
  PublicContainer,
  PublicCtaLink,
  PublicHero,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';
import ServiceAreaMap from '@/components/ServiceAreaMap';
import { businessPhone } from '@/lib/contact';
import { breadcrumbSchema, businessSchema } from '@/lib/seo';

export default function ServiceAreaPage() {
  return (
    <PublicPage>
      <JsonLd data={[businessSchema, breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Service Area', path: '/service-area' }])]} />
      <PublicHero
        eyebrow="Service area"
        title="Twin Cities local coverage."
        description="Based in Inver Grove Heights and focused on dependable response times across the Twin Cities Metro."
        image="/brand/generated/sky-local-authority.webp"
        imageAlt="Sky's the Limit Painting Twin Cities service area"
        proof={['Inver Grove Heights base', 'Twin Cities Metro', 'Owner-led scheduling']}
        badgeIcon={MapPin}
        actions={
          <>
            <PublicCtaLink href="/estimate" size="marketing-lg">Get a Free Price Range</PublicCtaLink>
            <PublicCtaLink href={`tel:${businessPhone}`} variant="outline" size="marketing-lg" icon={Phone} iconPosition="start">Call Anthony</PublicCtaLink>
          </>
        }
      />
      <PublicSection tone="soft">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="Coverage map"
            title="Choose the city, then send the surface details."
            description="A focused service area supports prompt walkthroughs, accurate estimates, and dedicated time on each job site."
          />
          <div className="mt-12 overflow-hidden border border-border bg-card">
            <ServiceAreaMap compact />
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
