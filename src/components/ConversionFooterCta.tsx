'use client';

import { usePathname } from 'next/navigation';
import { Calculator, Camera, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';

import {
  PublicContainer,
  PublicCtaLink,
  PublicFeatureGrid,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';
import { businessPhone } from '@/lib/contact';

const proofItems = [
  {
    icon: Camera,
    title: 'Photo-ready intake',
    body: 'Send room, exterior, commercial, or striping photos so the first response starts from surface evidence.',
  },
  {
    icon: ClipboardCheck,
    title: 'Clear scope first',
    body: 'Surfaces, access, prep, timeline, budget range, and preferred contact method stay organized.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified credentials',
    body: 'Registered Minnesota Specialty Contractor IR816596, fully insured, and owner-operated.',
  },
];

export default function ConversionFooterCta() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <div data-surface="public" className="public-surface">
      <PublicSection tone="ink">
        <PublicContainer className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
          <div>
            <PublicSectionHeading
              eyebrow="Price before paint"
              title="Turn the surface conditions into a useful range."
              description="Get a fast planning range, then send the details needed for a firm owner-led walkthrough and written scope."
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <PublicCtaLink
                href="/estimate"
                size="marketing-lg"
                icon={Calculator}
                iconPosition="start"
                track="footer_conversion_cta_click"
                trackPayload={{ action: 'calculator' }}
              >
                Get a Free Price Range
              </PublicCtaLink>
              <PublicCtaLink
                href={`tel:${businessPhone}`}
                variant="outline"
                size="marketing-lg"
                icon={Phone}
                iconPosition="start"
                track="call_click"
                trackPayload={{ source: 'conversion_footer' }}
              >
                Call Anthony
              </PublicCtaLink>
            </div>
          </div>
          <PublicFeatureGrid items={proofItems} />
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
