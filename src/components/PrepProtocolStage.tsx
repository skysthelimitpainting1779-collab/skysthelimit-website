'use client';

import { useState } from 'react';
import Image from 'next/image';

const stages = [
  {
    id: 'protect',
    title: 'Protect',
    label: 'Site control',
    image: '/images/site/marketing-hero-exterior-painting.webp',
    detail: 'Floors, furniture, landscaping, and adjacent surfaces are masked before preparation begins.',
    output: 'Protected work area',
  },
  {
    id: 'correct',
    title: 'Correct',
    label: 'Surface repair',
    image: '/images/site/iphone-exterior-prep-front-entry.webp',
    detail: 'Failed coating, open seams, dents, and visible substrate issues are identified in the written scope.',
    output: 'Sound surface',
  },
  {
    id: 'coat',
    title: 'Coat',
    label: 'Primer and finish',
    image: '/images/site/iphone-interior-painting-progress.webp',
    detail: 'Primer and finish coats are matched to the surface, exposure, and selected coating system.',
    output: 'Specified coating system',
  },
  {
    id: 'verify',
    title: 'Verify',
    label: 'Final walkthrough',
    image: '/images/services/interior/sky-work-01-finished-kitchen.webp',
    detail: 'The project closes with an owner-led walkthrough against the agreed scope, followed by a clean handoff.',
    output: 'Agreed closeout',
  },
] as const;

export default function PrepProtocolStage() {
  const [activeId, setActiveId] = useState<(typeof stages)[number]['id']>('protect');
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];

  return (
    <section id="prep-standard" aria-labelledby="prep-standard-title" className="border-b border-[#071321]/20 bg-[#F6F3EB] px-5 py-20 text-[#071321] sm:px-8 lg:px-12 lg:py-28">
      <div className="mx-auto max-w-[86rem]">
        <header>
          <h2 id="prep-standard-title" className="ledger-display max-w-[11ch] text-[clamp(3.4rem,6vw,6.5rem)] leading-[0.88]">
            Inspect the work behind the finish.
          </h2>
          <p className="mt-7 max-w-[39rem] text-lg leading-8 text-[#314457]">
            Move through the preparation controls that belong in a clear written scope.
          </p>
        </header>

        <div className="mt-12 grid border border-[#071321]/25 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
          <div className="grid border-b border-[#071321]/25 lg:border-b-0 lg:border-r" role="group" aria-label="Preparation controls">
            {stages.map((stage) => {
              const selected = active.id === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setActiveId(stage.id)}
                  className={`group grid min-h-24 grid-cols-[1fr_auto] items-center gap-5 border-b border-[#071321]/20 px-6 py-5 text-left transition-colors last:border-b-0 sm:px-8 ${
                    selected
                      ? 'bg-[#0254C3] text-white'
                      : 'bg-[#F6F3EB] text-[#071321] hover:bg-[#E8E2D5]'
                  }`}
                >
                  <span>
                    <span className="ledger-display block text-3xl leading-none sm:text-4xl">{stage.title}</span>
                    <span className={`mt-2 block text-sm font-semibold ${selected ? 'text-[#D9E8FA]' : 'text-[#53616F]'}`}>
                      {stage.label}
                    </span>
                  </span>
                  <span aria-hidden="true" className={`h-3 w-3 border transition-transform group-hover:scale-125 ${selected ? 'border-white bg-[#FF5A00]' : 'border-[#071321]/40 bg-transparent'}`} />
                </button>
              );
            })}
          </div>

          <figure
            className="bg-[#071321] p-3 sm:p-5"
          >
            <div className="relative aspect-[4/3] min-h-[26rem] overflow-hidden lg:aspect-auto lg:min-h-[38rem]">
              <Image
                key={active.image}
                src={active.image}
                alt={`${active.title}: ${active.detail}`}
                fill
                sizes="(min-width: 1024px) 65vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="grid gap-5 border-t border-white/20 bg-[#071321] p-5 text-[#F6F3EB] sm:grid-cols-[1fr_auto] sm:items-end sm:p-7">
              <div>
                <p className="text-sm font-bold text-[#FF8A4B]">{active.label}</p>
                <h3 className="ledger-display mt-2 text-5xl leading-none sm:text-6xl">{active.title}</h3>
                <p className="mt-4 max-w-[40rem] text-sm leading-7 text-[#D8E2EC] sm:text-base">{active.detail}</p>
              </div>
              <div className="border-t border-white/20 pt-4 sm:min-w-44 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <p className="text-xs font-semibold text-[#94ABC0]">Expected control</p>
                <p className="mt-2 text-sm font-black">{active.output}</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
