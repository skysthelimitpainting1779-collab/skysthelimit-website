'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';

const stages = [
  {
    id: '01',
    title: 'Protect',
    label: 'Containment / site control',
    image: '/images/site/marketing-hero-exterior-painting.webp',
    detail: 'Floors, furniture, landscaping, and adjacent surfaces are masked before prep begins.',
    output: 'Protected work area',
  },
  {
    id: '02',
    title: 'Correct',
    label: 'Surface / defect correction',
    image: '/images/site/iphone-exterior-prep-front-entry.webp',
    detail: 'Failed coating, open seams, dents, and surface issues are identified in the written scope.',
    output: 'Sound surface ready for coating',
  },
  {
    id: '03',
    title: 'Coat',
    label: 'Primer / finish application',
    image: '/images/site/iphone-interior-painting-progress.webp',
    detail: 'Primer and finish coats are matched to the surface, exposure, and selected coating system.',
    output: 'Specified coating system',
  },
  {
    id: '04',
    title: 'Verify',
    label: 'Walkthrough / closeout',
    image: '/images/services/interior/sky-work-01-finished-kitchen.webp',
    detail: 'The job closes with a walkthrough against the agreed scope—not a rushed handoff.',
    output: 'Final detail checked against scope',
  },
] as const;

export default function PrepProtocolStage() {
  const [activeId, setActiveId] = useState('01');
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];

  return (
    <section aria-labelledby="prep-standard" className="border-b border-line bg-surface-void">
      <div className="container-page section">
        <div className="grid overflow-hidden border border-line-strong lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
          <div className="flex flex-col border-b border-line-strong bg-surface-base lg:border-b-0 lg:border-r">
            <header className="border-b border-line p-6 sm:p-8">
              <p className="text-sm font-semibold text-brand">Prep-first standard</p>
              <h2 id="prep-standard" className="display-2 mt-3 max-w-[11ch] text-balance uppercase text-white">How we prep before painting.</h2>
              <p className="mt-5 max-w-md text-base leading-7 text-ink-4">Four visible stages keep surface preparation from disappearing inside a vague labor line.</p>
            </header>

            <div className="grid" role="group" aria-label="Preparation stages">
              {stages.map((stage) => {
                const selected = active.id === stage.id;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setActiveId(stage.id)}
                    aria-pressed={selected}
                    className={`grid min-h-20 grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-line px-6 py-5 text-left transition-colors last:border-b-0 sm:px-8 ${selected ? 'bg-brand text-white' : 'bg-surface-base text-ink-2 hover:bg-surface-raised'}`}
                  >
                    <span className={`text-sm font-black ${selected ? 'text-white' : 'text-brand'}`}>{stage.id}</span>
                    <span>
                      <span className="block text-base font-black uppercase tracking-[0.02em]">{stage.title}</span>
                      <span className={`mt-1 block text-sm ${selected ? 'text-white/80' : 'text-ink-4'}`}>{stage.label}</span>
                    </span>
                    {selected ? (
                      <Check aria-hidden="true" size={18} className="text-white" />
                    ) : (
                      <ArrowRight aria-hidden="true" size={18} className="text-ink-4" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative min-h-[30rem] overflow-hidden bg-black sm:min-h-[34rem] lg:min-h-[42rem]">
            <Image
              key={active.id}
              src={active.image}
              alt={`${active.title}: ${active.detail}`}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/15" aria-hidden="true" />
            <div className="absolute left-5 top-5 border border-white/20 bg-black/70 px-3 py-2 text-sm font-semibold text-white backdrop-blur-sm sm:left-6 sm:top-6">
              Stage {active.id} of 04
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-6 pb-7 pt-28 sm:px-8 sm:pb-8" aria-live="polite">
              <p className="text-sm font-semibold text-brand">{active.label}</p>
              <h3 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.03em] text-white sm:text-5xl">{active.title}</h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-ink-2">{active.detail}</p>
              <div className="mt-5 border-t border-white/20 pt-4 sm:flex sm:items-baseline sm:gap-3">
                <p className="text-sm font-semibold text-ink-4">Result</p>
                <p className="mt-1 text-sm font-bold text-white sm:mt-0">{active.output}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
