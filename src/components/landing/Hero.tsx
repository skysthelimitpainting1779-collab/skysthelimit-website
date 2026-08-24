import Link from 'next/link';
import { ArrowRight, Calculator, CheckCircle2, MapPin, PaintRoller, Phone } from 'lucide-react';
import { motion } from 'motion/react';
import ResponsiveImage from '@/components/ResponsiveImage';
import FadeIn from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/Stagger';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { businessPhone } from '@/lib/contact';
import { trackEvent } from '@/lib/analytics';
import type { LandingPage } from '@/data/landingPages';

interface HeroProps {
  page: LandingPage;
  path: string;
}

const outlineCtaClassName = cn(
  buttonVariants({ variant: 'outline', size: 'lg' }),
  'gap-2 border-[#d8c7aa]/30 bg-[#070706]/55 px-7 py-7 text-sm font-semibold text-white backdrop-blur hover:border-white hover:text-white rounded-none hover:bg-white/10',
);

export function Hero({ page, path }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#070706] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <motion.div
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0"
      >
        <ResponsiveImage
          src={page.image}
          alt={`${page.title} visual proof`}
          width={1920}
          height={1080}
          sizes="100vw"
          priority
          className="h-full w-full object-cover opacity-48"
        />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#070706_0%,rgba(7,7,6,0.93)_42%,rgba(7,7,6,0.5)_100%)]"></div>
      <div className="measurement-rules absolute inset-0 opacity-20"></div>
      <div className="road-rule absolute left-0 top-0 h-1 w-full opacity-80"></div>

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12 lg:items-end">
        <StaggerContainer className="w-full overflow-hidden lg:col-span-7">
          <StaggerItem>
            <Badge variant="outline" className="font-display mb-7 inline-flex max-w-full items-center gap-3 border-[#d8c7aa]/20 bg-[#070706]/65 px-4 py-3 text-xs font-semibold text-white backdrop-blur sm:text-xs rounded-none">
              {page.kind === 'area' ? <MapPin size={16} /> : <PaintRoller size={16} />}
              <span>{page.eyebrow}</span>
            </Badge>
          </StaggerItem>
          <StaggerItem>
            <h1 className="max-w-[calc(100vw-2rem)] break-words text-[2rem] font-black leading-[1.02] text-white sm:max-w-5xl sm:text-5xl md:text-7xl">{page.title}</h1>
          </StaggerItem>
          <StaggerItem>
            <p className="mt-7 max-w-prose text-base leading-relaxed text-[#e7dfd2] md:text-xl">{page.headline}</p>
          </StaggerItem>
          <StaggerItem>
            <div className="mt-8 flex max-w-[calc(100vw-2rem)] flex-col gap-3 sm:max-w-none sm:flex-row sm:flex-wrap">
              <Link
                href="/contact"
                onClick={() => trackEvent('landing_cta_click', { page: path, action: 'estimate' })}
                className={cn(buttonVariants({ variant: 'default', size: 'lg' }), 'gap-2 bg-white px-7 py-7 text-sm font-semibold text-[#15110a] hover:bg-white/90 rounded-none')}
              >
                Start This Scope <ArrowRight size={18} />
              </Link>
              <Link
                href="/estimate"
                onClick={() => trackEvent('landing_cta_click', { page: path, action: 'calculator' })}
                className={outlineCtaClassName}
              >
                <Calculator size={18} /> Price Range
              </Link>
              <a
                href={`tel:${businessPhone}`}
                onClick={() => trackEvent('call_click', { source: path })}
                className={outlineCtaClassName}
              >
                <Phone size={18} /> Call Anthony
              </a>
            </div>
          </StaggerItem>
        </StaggerContainer>

        <FadeIn delay={0.4} direction="left" className="w-full overflow-hidden lg:col-span-5">
          <div className="w-full overflow-hidden border border-[#d8c7aa]/18 bg-[#11100d]/86 p-6 backdrop-blur">
            <p className="text-xs font-semibold text-white">{page.accent}</p>
            <p className="mt-5 text-base leading-relaxed text-[#e7dfd2]">{page.description}</p>
            <div className="mt-8 space-y-4">
              {page.proof.map((item) => (
                <div key={item} className="flex gap-3 border-t border-white/10 pt-4">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-white" size={18} />
                  <span className="min-w-0 break-words text-base font-medium text-white">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
