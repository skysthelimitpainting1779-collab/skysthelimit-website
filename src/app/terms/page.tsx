import type { Metadata } from 'next';

import {
  PublicContainer,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';

export const metadata: Metadata = {
  title: 'Website Terms',
  description: "Terms governing use of the Sky's the Limit Painting LLC website.",
};

const sections = [
  {
    title: 'Website purpose',
    body: 'This website provides general information about painting services, service areas, project preparation, and ways to request a conversation. Website content is not a binding bid, warranty, or project agreement.',
  },
  {
    title: 'Estimates and project agreements',
    body: 'Calculator results, price ranges, availability statements, and preliminary conversations are informational. Final scope, price, schedule, materials, payment terms, and warranties are established only in a written proposal or contract accepted by the customer and Sky\'s the Limit Painting LLC.',
  },
  {
    title: 'Acceptable use',
    body: 'You may use the site for lawful personal or business inquiries. Do not interfere with the site, attempt unauthorized access, submit deceptive information, introduce harmful code, or use automated systems in a way that disrupts normal operation.',
  },
  {
    title: 'Content and external services',
    body: 'Site text, branding, layouts, and original media are protected by applicable intellectual-property laws. Links to mapping, scheduling, social, storage, or other third-party services are governed by those providers\' terms and practices.',
  },
  {
    title: 'Availability and disclaimers',
    body: 'We work to keep the site accurate and available, but content may change and the site may occasionally be interrupted. To the extent permitted by law, the site is provided without guarantees that it will always be complete, error-free, or available.',
  },
  {
    title: 'Changes and contact',
    body: 'We may update these website terms as the site or our services change. Continued use after an update means the revised terms apply to later site use. Questions may be sent to the business contact below.',
  },
] as const;

export default function TermsPage() {
  return (
    <PublicPage>
      <PublicSection tone="paper">
        <PublicContainer className="max-w-4xl">
          <PublicSectionHeading
            eyebrow="Legal"
            title="Website terms."
            description="Last updated August 17, 2026. These terms apply to use of the Sky's the Limit Painting LLC website."
          />
          <div className="mt-12 divide-y divide-border border-y border-border">
            {sections.map((section) => (
              <section key={section.title} className="py-8">
                <h2 className="public-display text-3xl text-foreground">{section.title}</h2>
                <p className="mt-4 leading-7 text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
          <p className="mt-8 leading-7 text-muted-foreground">
            Questions may be sent to{' '}
            <a className="font-bold text-foreground underline underline-offset-4" href="mailto:skysthelimitpainting1779@gmail.com">
              skysthelimitpainting1779@gmail.com
            </a>.
          </p>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
