import type { ComponentType, HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';

import ResponsiveImage from '@/components/ResponsiveImage';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

type Tone = 'paper' | 'soft' | 'ink' | 'trust';
type CtaVariant = 'default' | 'outline' | 'trust' | 'inverse' | 'secondary';
type IconComponent = ComponentType<{ 'aria-hidden'?: boolean | 'true'; 'data-icon'?: string }>;

export function PublicPage({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article data-surface="public" className={cn('public-surface overflow-hidden', className)} {...props} />;
}

export function PublicContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[94rem] px-[var(--public-gutter)]', className)} {...props} />;
}

interface PublicSectionProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
  ruled?: boolean;
}

export function PublicSection({ tone = 'paper', ruled = false, className, ...props }: PublicSectionProps) {
  return (
    <section
      data-tone={tone}
      className={cn(
        'border-b border-border py-[var(--public-section-y)]',
        ruled && 'public-grid',
        className,
      )}
      {...props}
    />
  );
}

interface PublicCtaLinkProps {
  href: string;
  children: ReactNode;
  variant?: CtaVariant;
  size?: 'marketing' | 'marketing-lg';
  icon?: IconComponent | null;
  iconPosition?: 'start' | 'end';
  className?: string;
  ariaLabel?: string;
  track?: string;
  trackPayload?: Record<string, unknown>;
  download?: boolean;
}

export function PublicCtaLink({
  href,
  children,
  variant = 'default',
  size = 'marketing',
  icon: Icon = ArrowRight,
  iconPosition = 'end',
  className,
  ariaLabel,
  track,
  trackPayload,
  download = false,
}: PublicCtaLinkProps) {
  const sharedProps = {
    'aria-label': ariaLabel,
    'data-track': track,
    'data-track-payload': trackPayload ? JSON.stringify(trackPayload) : undefined,
    className: cn(buttonVariants({ variant, size }), className),
  };
  const content = (
    <>
      {iconPosition === 'start' && Icon ? <Icon aria-hidden="true" data-icon="inline-start" /> : null}
      {children}
      {iconPosition === 'end' && Icon ? <Icon aria-hidden="true" data-icon="inline-end" /> : null}
    </>
  );

  if (download || href.startsWith('tel:') || href.startsWith('sms:') || href.startsWith('mailto:')) {
    return <a href={href} download={download || undefined} {...sharedProps}>{content}</a>;
  }

  return <Link href={href} {...sharedProps}>{content}</Link>;
}

interface PublicHeroProps {
  id?: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  proof?: readonly string[];
  actions?: ReactNode;
  badgeIcon?: IconComponent;
}

export function PublicHero({
  id,
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  proof = [],
  actions,
  badgeIcon: BadgeIcon,
}: PublicHeroProps) {
  return (
    <section id={id} data-tone="paper" className="border-b border-border">
      <div className="mx-auto grid min-h-[min(48rem,calc(100svh-7rem))] max-w-[94rem] lg:grid-cols-[58fr_42fr]">
        <div className="public-grid flex flex-col justify-center px-5 py-12 sm:px-8 lg:px-12 lg:py-16 xl:px-16">
          <Badge variant="eyebrow" className="mb-6">
            {BadgeIcon ? <BadgeIcon aria-hidden="true" data-icon="inline-start" /> : null}
            {eyebrow}
          </Badge>
          <h1 className="public-display max-w-[12ch] text-[clamp(3.25rem,7vw,6.75rem)] leading-[0.9] text-foreground">
            {title}
          </h1>
          <p className="mt-6 max-w-[38rem] text-lg font-semibold leading-8 text-muted-foreground sm:text-xl">
            {description}
          </p>
          {actions ? <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{actions}</div> : null}
          {proof.length ? (
            <ul aria-label="Service commitments" className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-muted-foreground">
              {proof.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check aria-hidden="true" className="text-trust" />
                  {item}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative min-h-[26rem] border-t border-border lg:min-h-0 lg:border-l lg:border-t-0">
          <ResponsiveImage
            src={image}
            alt={imageAlt}
            width={1600}
            height={1100}
            sizes="(min-width: 1024px) 42vw, 100vw"
            priority
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-background/95 px-5 py-4 backdrop-blur-sm sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-trust">Field record</p>
            <p className="mt-1 text-sm font-semibold text-foreground">Real surfaces. Written preparation. Owner-led review.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

interface PublicSectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
}

export function PublicSectionHeading({ eyebrow, title, description, align = 'left' }: PublicSectionHeadingProps) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow ? <Badge variant="eyebrow" className="mb-5">{eyebrow}</Badge> : null}
      <h2 className="public-display text-[clamp(2.75rem,5vw,5.5rem)] leading-[0.92] text-foreground">{title}</h2>
      {description ? <p className="mt-6 max-w-[62ch] text-lg leading-8 text-muted-foreground">{description}</p> : null}
    </div>
  );
}

interface PublicFeature {
  title: string;
  body: string;
  icon?: IconComponent;
}

export function PublicFeatureGrid({ items, columns = 3 }: { items: readonly PublicFeature[]; columns?: 2 | 3 | 4 }) {
  return (
    <div className={cn('grid border-l border-t border-border', columns === 2 && 'md:grid-cols-2', columns === 3 && 'md:grid-cols-3', columns === 4 && 'md:grid-cols-2 xl:grid-cols-4')}>
      {items.map(({ title, body, icon: Icon }) => (
        <Card key={title} variant="default" className="border-l-0 border-t-0">
          <CardHeader>
            {Icon ? <Icon aria-hidden="true" data-icon="inline-start" /> : null}
            <CardTitle>{title}</CardTitle>
            <CardDescription>{body}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function PublicProcess({ items }: { items: readonly { title: string; body: string }[] }) {
  return (
    <ol className="mt-12 grid border-l border-t border-border md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <li key={item.title} className="border-b border-r border-border bg-card p-6 text-card-foreground">
          <p className="text-sm font-bold text-trust">Step {String(index + 1).padStart(2, '0')}</p>
          <h3 className="public-display mt-8 text-3xl leading-none">{item.title}</h3>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function PublicProofBand({ items }: { items: readonly string[] }) {
  return (
    <div className="border-y border-border bg-card">
      <div className="mx-auto grid max-w-[94rem] md:grid-cols-3">
        {items.map((item, index) => (
          <div key={item} className="flex items-start gap-3 border-b border-border px-5 py-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 sm:px-8">
            <span className="font-display text-2xl font-bold text-trust">{String(index + 1).padStart(2, '0')}</span>
            <p className="text-sm font-bold leading-6 text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PublicSplitCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card variant="panel">
      <CardHeader>
        <CardTitle className="public-display text-4xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
