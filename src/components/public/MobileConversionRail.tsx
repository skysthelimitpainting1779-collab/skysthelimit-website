import { PublicCtaLink } from '@/components/public/PublicSystem';

export default function MobileConversionRail() {
  return (
    <div
      data-surface="public"
      className="mobile-conversion-rail public-surface fixed inset-x-0 bottom-0 z-50 grid grid-cols-[0.75fr_0.75fr_1.5fr] border-t border-border bg-background md:hidden print:hidden"
    >
      <a
        href="tel:+16514104196"
        data-track="call_click"
        data-track-payload='{"source":"mobile_sticky"}'
        className="flex min-h-14 items-center justify-center border-r border-border px-2 text-xs font-bold uppercase tracking-[0.08em] text-foreground"
      >
        Call
      </a>
      <a
        href="sms:+16514104196"
        data-track="text_click"
        data-track-payload='{"source":"mobile_sticky"}'
        className="flex min-h-14 items-center justify-center border-r border-border px-2 text-xs font-bold uppercase tracking-[0.08em] text-foreground"
      >
        Text
      </a>
      <PublicCtaLink
        href="/estimate"
        icon={null}
        track="hero_cta_click"
        trackPayload={{ source: 'mobile_sticky', label: 'Get a Free Price Range' }}
        className="h-full min-h-14 px-3 text-center text-xs uppercase tracking-[0.06em] whitespace-normal"
      >
        Get a Free Price Range
      </PublicCtaLink>
    </div>
  );
}
