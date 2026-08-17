'use client';

import { Calculator, Mail, MapPin, MessageSquareText, Phone } from 'lucide-react';

import BookingCta from '@/components/BookingCta';
import JsonLd from '@/components/JsonLd';
import LeadForm from '@/components/LeadForm';
import {
  PublicContainer,
  PublicCtaLink,
  PublicHero,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
  PublicSplitCard,
} from '@/components/public/PublicSystem';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { businessEmail, businessPhone, smsPhone } from '@/lib/contact';
import { breadcrumbSchema } from '@/lib/seo';

const channels = [
  { icon: Phone, label: 'Call Anthony', value: businessPhone, href: `tel:${businessPhone}`, event: 'call_click' },
  { icon: MessageSquareText, label: 'Text Anthony', value: businessPhone, href: `sms:${smsPhone}`, event: 'text_click' },
  { icon: Mail, label: 'Email direct', value: businessEmail, href: `mailto:${businessEmail}`, event: 'lead_mailto_fallback_opened' },
] as const;

export default function ContactPage() {
  return (
    <PublicPage>
      <JsonLd data={breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact', path: '/contact' }])} />

      <PublicHero
        eyebrow="Contact"
        title="Start with a clear scope."
        description="Send the surface, city, schedule, and access details Anthony needs to give you a useful next step."
        image="/images/site/marketing-hero-exterior-painting.webp"
        imageAlt="Exterior painting preparation by Sky's the Limit Painting"
        proof={['Direct owner response', 'Photo-ready intake', 'No-pressure next step']}
        actions={
          <>
            <PublicCtaLink
              href="/estimate"
              icon={Calculator}
              iconPosition="start"
              size="marketing-lg"
              track="hero_cta_click"
              trackPayload={{ source: 'contact_hero', label: 'Get a Free Price Range' }}
            >
              Get a Free Price Range
            </PublicCtaLink>
            <BookingCta />
          </>
        }
      />

      <PublicSection tone="soft">
        <PublicContainer className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <div>
            <PublicSectionHeading
              eyebrow="Direct channels"
              title="Reach the owner without a sales desk."
              description="Call or text for the fastest response. Use the structured form when photos, timing, or multiple surfaces need context."
            />
            <div className="mt-10 grid gap-3">
              {channels.map(({ icon: Icon, label, value, href, event }) => (
                <a
                  key={label}
                  href={href}
                  data-track={event}
                  data-track-payload={JSON.stringify({ source: 'contact_panel' })}
                  className="group"
                >
                  <Card variant="interactive">
                    <CardHeader className="grid grid-cols-[auto_1fr] gap-x-4">
                      <Icon aria-hidden="true" className="text-trust" />
                      <div>
                        <CardTitle className="text-lg">{label}</CardTitle>
                        <CardDescription className="mt-1 break-all">{value}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </a>
              ))}
              <Card variant="proof">
                <CardHeader className="grid grid-cols-[auto_1fr] gap-x-4">
                  <MapPin aria-hidden="true" className="text-trust" />
                  <div>
                    <CardTitle className="text-lg">Twin Cities Metro</CardTitle>
                    <CardDescription className="mt-1">Based in Inver Grove Heights, Minnesota.</CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </div>
          </div>

          <PublicSplitCard
            title="Tell us about the work"
            description="Project details come first so the first response can address the actual surfaces, prep, access, and timing."
          >
            <LeadForm source="Contact page lead form" compact theme="ledger" />
          </PublicSplitCard>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
