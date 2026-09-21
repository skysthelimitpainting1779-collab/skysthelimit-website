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
import { phoneHref } from '@/lib/contact';
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
            <PublicCtaLink href={phoneHref} variant="outline" size="marketing-lg" icon={Phone} iconPosition="start">Call Anthony</PublicCtaLink>
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
      <PublicSection>
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="Cities served"
            title="One contractor, fourteen suburbs."
            description="Every city below has its own page: what we paint there, how the work runs, and how to start a written scope."
          />
          <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {SUBURBS.map((s) => (
              <a key={s.slug} href={`/service-areas/${s.slug}`} className="group bg-card p-6">
                <p className="font-semibold text-foreground group-hover:underline">{s.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.blurb}</p>
              </a>
            ))}
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}

const SUBURBS: { slug: string; name: string; blurb: string }[] = [
  { slug: 'inver-grove-heights', name: 'Inver Grove Heights', blurb: 'Home base. Owner-operated painting for homes, properties, and facility work across Dakota County.' },
  { slug: 'south-st-paul', name: 'South St. Paul', blurb: 'River-city neighbor to the east — repaints, rentals, and commercial work on a written scope.' },
  { slug: 'st-paul', name: 'St. Paul', blurb: 'Capital-city homes and rentals: interiors, exteriors, and the prep older housing stock demands.' },
  { slug: 'eagan', name: 'Eagan', blurb: 'Dakota County corporate and residential corridors — painting plus parking lot striping on one contract.' },
  { slug: 'woodbury', name: 'Woodbury', blurb: 'East-metro subdivisions and retail: whole-home repaints, exteriors, and lot re-stripes.' },
  { slug: 'minneapolis', name: 'Minneapolis', blurb: 'Dense city housing and small commercial — interiors year-round, exteriors in season.' },
  { slug: 'bloomington', name: 'Bloomington', blurb: 'South-metro retail and office lots plus residential repaints, with striping that survives plow season.' },
  { slug: 'eden-prairie', name: 'Eden Prairie', blurb: 'West-metro corporate campuses and homes — after-hours scheduling and phased multi-tenant work.' },
  { slug: 'edina', name: 'Edina', blurb: 'Established homes that reward careful prep: exteriors, interiors, and sprayed cabinet refinishing.' },
  { slug: 'maple-grove', name: 'Maple Grove', blurb: 'Northwest growth corridor — new-tenant build-outs, refreshes, and retail lot striping.' },
  { slug: 'lakeville', name: 'Lakeville', blurb: 'South Dakota County growth: newer homes, townhomes, and the commercial lots around them.' },
  { slug: 'apple-valley', name: 'Apple Valley', blurb: 'Established Dakota County homes — cabinet refinishing is a frequent request here.' },
  { slug: 'rosemount', name: 'Rosemount', blurb: 'Neighborhoods, rentals, and working commercial properties, all on one owner-led schedule.' },
  { slug: 'cottage-grove', name: 'Cottage Grove', blurb: 'East metro near the river valley — exteriors, deck and fence staining, and commercial striping.' },
];
