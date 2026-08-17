import type { Metadata } from 'next';

import {
  PublicContainer,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: "How Sky's the Limit Painting LLC handles information submitted through this website.",
};

const sections = [
  {
    title: 'Information you provide',
    body: 'We collect the contact, property, project, scheduling, photo-link, and referral information you choose to submit through our forms, email links, phone links, or text links.',
  },
  {
    title: 'Website and analytics data',
    body: 'Our hosting and analytics services may record limited technical information such as the page visited, referral source, browser or device type, approximate location, and interaction events. We use this information to operate the site and understand which project paths are useful.',
  },
  {
    title: 'How information is used',
    body: 'We use submitted information to review project requests, prepare estimates, respond to questions, manage referrals, schedule work, maintain business records, prevent abuse, and improve the website.',
  },
  {
    title: 'Service providers and sharing',
    body: 'Information may be processed by service providers that host the website, deliver form submissions, store business records, or provide analytics. We do not sell personal information. We may disclose information when required by law or when reasonably necessary to protect customers, the business, or the website.',
  },
  {
    title: 'Retention and your choices',
    body: 'We retain information only as long as reasonably needed for project follow-up, business records, legal obligations, security, and dispute resolution. You may ask us to correct or delete information by contacting us, subject to records we must retain.',
  },
  {
    title: 'Security and updates',
    body: 'We use reasonable administrative and technical safeguards, but no internet transmission or storage system can be guaranteed completely secure. We may update this policy as the site or our practices change.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <PublicPage>
      <PublicSection tone="paper">
        <PublicContainer className="max-w-4xl">
          <PublicSectionHeading
            eyebrow="Legal"
            title="Privacy policy."
            description="Last updated August 17, 2026. This policy explains how Sky's the Limit Painting LLC handles information collected through this website."
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
            Privacy questions or requests may be sent to{' '}
            <a className="font-bold text-foreground underline underline-offset-4" href="mailto:skysthelimitpainting1779@gmail.com">
              skysthelimitpainting1779@gmail.com
            </a>.
          </p>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
