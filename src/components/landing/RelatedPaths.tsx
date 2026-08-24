import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { landingPagePath, type LandingPage } from '@/data/landingPages';

interface RelatedPathsProps {
  cards: LandingPage[];
  market: LandingPage['market'];
}

const marketPath = {
  Residential: '/residential',
  Commercial: '/commercial',
  'Public Sector': '/public-sector',
} as const;

export function RelatedPaths({ cards, market }: RelatedPathsProps) {
  return (
    <section className="bg-[#080807] px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold text-white">Related paths</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">Keep moving through the right lane.</h2>
          </div>
          <Link href={marketPath[market]} className={cn(buttonVariants({ variant: 'link' }), 'px-0 text-white hover:text-white font-semibold')}>
            View {market} <ArrowRight size={17} />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {cards.map((related) => (
            <Link
              key={related.slug}
              href={landingPagePath(related)}
              className="group min-h-[190px] border border-white/10 bg-[#11100d] p-5 transition duration-300 hover:-translate-y-1 hover:border-white/60"
            >
              <p className="text-xs font-semibold text-[#9fa9a9]">{related.eyebrow}</p>
              <h3 className="mt-4 text-2xl font-black leading-tight text-white">{related.shortTitle}</h3>
              <span className="mt-8 inline-flex items-center gap-2 text-xs font-semibold text-white">
                Open <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
