import FadeIn from '@/components/animations/FadeIn';
import type { LandingPage } from '@/data/landingPages';

interface ScopeMapProps {
  page: LandingPage;
}

export function ScopeMap({ page }: ScopeMapProps) {
  return (
    <section className="bg-[#e6dfd2] px-4 py-20 text-[#171512] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12">
        <FadeIn className="lg:col-span-4">
          <p className="text-xs font-semibold text-[#8b4d20]">Scope map</p>
          <h2 className="mt-5 max-w-prose break-words text-3xl font-black leading-tight sm:text-4xl md:text-5xl">A focused page for a real buyer question.</h2>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-[#4c453d]">
            Start with the kind of work, where it is, what surface needs attention, and what proof or timeline matters before the first call.
          </p>
          {page.kind === 'area' && page.neighborhoods && page.neighborhoods.length > 0 && (
            <div className="mt-8 border-t border-[#8b4d20]/20 pt-6">
              <p className="text-xs font-semibold text-[#8b4d20]">Neighborhoods Served</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {page.neighborhoods.map((neighborhood) => (
                  <span key={neighborhood} className="bg-[#171512]/10 px-3 py-1.5 text-xs font-semibold text-[#171512]">
                    {neighborhood}
                  </span>
                ))}
              </div>
            </div>
          )}
        </FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
          {page.scope.map((item, index) => (
            <FadeIn key={item} delay={0.04 * index}>
              <div className="flex min-h-[112px] gap-4 border-l border-[#8b4d20]/35 bg-[#f5f0e7] p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center border border-[#171512]/15 bg-white text-xs font-black text-[#8b4d20]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <p className="text-base font-black leading-snug text-[#171512]">{item}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
