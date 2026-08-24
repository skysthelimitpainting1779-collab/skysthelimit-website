import { Camera, ClipboardCheck, Route } from 'lucide-react';
import IconFeatureCard from '@/components/IconFeatureCard';
import FadeIn from '@/components/animations/FadeIn';
import type { LandingPage } from '@/data/landingPages';

interface ProofIntakeProps {
  market: LandingPage['market'];
}

export function ProofIntake({ market }: ProofIntakeProps) {
  return (
    <section className="bg-[#182023] px-4 py-20 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <FadeIn className="lg:col-span-5">
          <p className="text-xs font-semibold text-white">Proof intake</p>
          <h2 className="mt-5 max-w-prose text-4xl font-black leading-tight md:text-5xl">Send photos, location, timeline, and the surface story.</h2>
        </FadeIn>
        <FadeIn delay={0.1} className="lg:col-span-7">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Camera, title: 'Photo link', body: 'Add a Google Drive, iCloud, Dropbox, or public album link in the form.' },
              { icon: Route, title: 'Service lane', body: `This page routes into the ${market.toLowerCase()} estimate path.` },
              { icon: ClipboardCheck, title: 'Clear next step', body: 'Anthony gets the project details in a structured format instead of a vague callback request.' },
            ].map((card) => (
              <IconFeatureCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                body={card.body}
                className="min-h-[210px] border-t border-white/15 pt-8"
                iconClassName="mb-8 text-white"
                bodyClassName="mt-4 text-sm leading-relaxed text-[#cbd4d3]"
                as="div"
              />
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
