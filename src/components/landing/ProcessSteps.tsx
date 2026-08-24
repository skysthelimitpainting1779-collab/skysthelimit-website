import ResponsiveImage from '@/components/ResponsiveImage';
import FadeIn from '@/components/animations/FadeIn';
import type { LandingPage } from '@/data/landingPages';

interface ProcessStepsProps {
  process: LandingPage['process'];
}

const sectionImages = [
  '/brand/generated/sky-residential-authority.webp',
  '/brand/generated/sky-commercial-authority.webp',
  '/brand/generated/sky-public-authority.webp',
] as const;

export function ProcessSteps({ process }: ProcessStepsProps) {
  return (
    <section className="relative overflow-hidden bg-[#080807] px-4 py-24 sm:px-6 lg:px-8">
      <div className="blueprint-grid absolute inset-0 opacity-10"></div>
      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start">
        <FadeIn className="lg:sticky lg:top-36 lg:col-span-5">
          <p className="text-xs font-semibold text-white">How it moves</p>
          <h2 className="mt-5 max-w-prose text-4xl font-black leading-tight text-white md:text-6xl">Clear steps before anyone starts painting.</h2>
        </FadeIn>
        <div className="grid gap-5 lg:col-span-7">
          {process.map((step, index) => (
            <FadeIn key={step.title} delay={0.08 * index}>
              <article className="grid overflow-hidden border-t border-white/10 md:grid-cols-12">
                <div className="relative min-h-[180px] md:col-span-5">
                  <ResponsiveImage
                    src={sectionImages[index % sectionImages.length]}
                    alt=""
                    width={900}
                    height={700}
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="absolute inset-0 h-full w-full object-cover opacity-75"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,7,0.75),rgba(8,8,7,0.12))]"></div>
                  <span className="absolute left-4 top-4 border border-white/15 bg-[#080807]/75 px-3 py-2 text-xs font-semibold text-white">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <div className="p-7 md:col-span-7">
                  <h3 className="text-3xl font-black leading-tight text-white">{step.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-[#c9c1b4]">{step.body}</p>
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
