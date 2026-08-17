'use client';

import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Check, Copy, Gift, Mail, MessageSquare, Share2 } from 'lucide-react';

import {
  PublicContainer,
  PublicCtaLink,
  PublicHero,
  PublicPage,
  PublicProcess,
  PublicSection,
  PublicSectionHeading,
  PublicSplitCard,
} from '@/components/public/PublicSystem';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ENV } from '@/lib/env';
import { trackEvent } from '@/lib/analytics';

const referralSteps = [
  { title: 'Generate', body: 'Enter your email to create the tracking link used to connect a completed project back to you.' },
  { title: 'Share', body: 'Send the link to a friend, neighbor, or colleague who is planning a qualifying project.' },
  { title: 'Complete', body: 'The new customer receives the stated project discount and the referrer reward is issued after completion.' },
] as const;

export default function ReferPage() {
  const [email, setEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
  }, []);

  const handleGenerate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    const cleanEmail = email.trim().toLowerCase();
    const siteUrl = ENV.SITE_URL || window.location.origin;
    setGeneratedLink(`${siteUrl.replace(/\/$/, '')}/?ref=${encodeURIComponent(cleanEmail)}`);
    setCopied(false);
    trackEvent('referral_link_generated', { email: cleanEmail });
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    trackEvent('referral_link_copied', { link: generatedLink });
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const shareText = "I used Sky's the Limit Painting for detailed painting work. This referral link applies the current qualifying customer offer:";
  const smsHref = `sms:?&body=${encodeURIComponent(`${shareText} ${generatedLink}`)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent('Painting project referral')}&body=${encodeURIComponent(`${shareText}\n\n${generatedLink}`)}`;

  return (
    <PublicPage>
      <PublicHero
        eyebrow="Referral program"
        title="Share the work. Share the reward."
        description="Create a trackable referral link for a friend, neighbor, or colleague planning a qualifying painting project."
        image="/brand/generated/sky-owner-proof.webp"
        imageAlt="Sky's the Limit Painting branded equipment"
        proof={['Direct referral tracking', 'Qualifying customer offer', 'Owner-operated local business']}
        badgeIcon={Gift}
      />

      <PublicSection tone="soft">
        <PublicContainer className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
          <PublicSectionHeading
            eyebrow="Create your link"
            title="One email. One shareable path."
            description="The email connects a completed qualifying project to the person who made the introduction."
          />
          <PublicSplitCard title="Referral link generator" description="Enter the email where you want referral follow-up sent.">
            <form onSubmit={handleGenerate}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="referrer-email">Your email address</FieldLabel>
                  <Input
                    id="referrer-email"
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <FieldDescription>Used only to identify and contact the referrer.</FieldDescription>
                </Field>
                <Field>
                  <Button type="submit" size="marketing-lg">
                    <Share2 data-icon="inline-start" />
                    Generate Referral Link
                  </Button>
                </Field>
              </FieldGroup>
            </form>

            {generatedLink ? (
              <div className="mt-8 border-t border-border pt-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="generated-referral-link">Your referral link</FieldLabel>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Input id="generated-referral-link" readOnly value={generatedLink} />
                      <Button type="button" variant="trust" size="icon-lg" onClick={handleCopy} aria-label="Copy referral link">
                        {copied ? <Check /> : <Copy />}
                      </Button>
                    </div>
                    <FieldDescription aria-live="polite">{copied ? 'Copied to clipboard.' : 'Copy the link or share it directly.'}</FieldDescription>
                  </Field>
                  <Field orientation="responsive">
                    <PublicCtaLink href={smsHref} variant="outline" icon={MessageSquare} iconPosition="start" track="referral_share_sms" trackPayload={{ email }} className="w-full">
                      Send Text
                    </PublicCtaLink>
                    <PublicCtaLink href={mailHref} variant="outline" icon={Mail} iconPosition="start" track="referral_share_email" trackPayload={{ email }} className="w-full">
                      Send Email
                    </PublicCtaLink>
                  </Field>
                </FieldGroup>
              </div>
            ) : null}
          </PublicSplitCard>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="ink">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow="Simple loop"
            title="How the referral is recorded."
            description="No points portal. The link carries the referral identifier into the estimate journey."
          />
          <PublicProcess items={referralSteps} />
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="paper">
        <PublicContainer className="max-w-4xl">
          <PublicSectionHeading eyebrow="Program details" title="Frequently asked questions." />
          <div className="mt-10 divide-y divide-border border-y border-border">
            {[
              ['Is there a referral limit?', 'No published quantity limit applies. Each reward is tied to a separate new customer and qualifying completed project.'],
              ['How is the customer offer applied?', 'The referral identifier is retained when the customer opens the link and begins the estimate journey. Final eligibility is confirmed in the written proposal.'],
              ['When is the referrer reward issued?', 'After the referred qualifying project is complete and the invoice is settled, the company contacts the referrer to arrange the stated reward.'],
              ['What qualifies?', 'The referred person must be a new customer and the project must meet the current published minimum contract requirement.'],
            ].map(([question, answer]) => (
              <details key={question} className="group py-6">
                <summary className="cursor-pointer text-lg font-bold text-foreground">{question}</summary>
                <p className="mt-4 leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
          <p className="mt-8 border-l-[3px] border-l-trust bg-muted p-5 text-sm leading-7 text-muted-foreground">
            Sky&apos;s the Limit Painting LLC is an owner-operated registered Minnesota Specialty Contractor, Registration ID IR816596, based in Inver Grove Heights. Referrals are subject to verification. The owner is exempt from standard workers&apos; compensation requirements under Minnesota Statute 176.041.
          </p>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
