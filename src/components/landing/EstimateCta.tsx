import ResponsiveImage from '@/components/ResponsiveImage';
import FadeIn from '@/components/animations/FadeIn';
import LeadForm from '@/components/LeadForm';
import type { LandingPage } from '@/data/landingPages';

interface EstimateCtaProps {
  page: LandingPage;
}

export function EstimateCta({ page }: EstimateCtaProps) {
  return (
    <section className="bg-[#e6dfd2] px-4 py-24 text-[#171512] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 overflow-hidden border border-[#171512]/15 bg-[#f5f0e7] lg:grid-cols-12">
        <div className="relative min-h-[420px] lg:col-span-5">
          <ResponsiveImage src={page.image} alt="" width={1200} height={900} sizes="(min-width: 1024px) 42vw, 100vw" className="absolute inset-0 h-full w-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(23,21,18,0.78),rgba(23,21,18,0.05))]"></div>
        </div>
        <div className="p-7 md:p-10 lg:col-span-7 lg:p-12">
          <FadeIn>
            <p className="text-xs font-semibold text-[#8b4d20]">Start the estimate</p>
            <h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">{page.shortTitle} project details.</h2>
            <div className="mt-10">
              <LeadForm source={`${page.title} landing page`} defaultMarket={page.market} compact />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
