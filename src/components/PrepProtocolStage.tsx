'use client';

import { useState } from 'react';
import Image from 'next/image';

const stages = [
  {
    id: '01',
    title: 'Protect',
    label: 'Site control',
    image: '/images/site/marketing-hero-exterior-painting.webp',
    detail: 'Floors, furniture, landscaping, and adjacent surfaces are masked before preparation begins.',
    output: 'Protected work area',
  },
  {
    id: '02',
    title: 'Correct',
    label: 'Surface repair',
    image: '/images/site/iphone-exterior-prep-front-entry.webp',
    detail: 'Failed coating, open seams, dents, and visible substrate issues are identified in the written scope.',
    output: 'Sound surface',
  },
  {
    id: '03',
    title: 'Coat',
    label: 'Primer and finish',
    image: '/images/site/iphone-interior-painting-progress.webp',
    detail: 'Primer and finish coats are matched to the surface, exposure, and selected coating system.',
    output: 'Specified coating system',
  },
  {
    id: '04',
    title: 'Verify',
    label: 'Final walkthrough',
    image: '/images/services/interior/sky-work-01-finished-kitchen.webp',
    detail: 'The project closes with an owner-led walkthrough against the agreed scope, followed by a clean handoff.',
    output: 'Agreed closeout',
  },
] as const;

export default function PrepProtocolStage() {
  const [activeId, setActiveId] = useState('01');
  const active = stages.find((stage) => stage.id === activeId) ?? stages[0];

  return (
    <section aria-labelledby="prep-standard" className="overflow-hidden bg-[#071321] text-[#F6F3EB]">
      <div className="mx-auto grid max-w-[96rem] lg:grid-cols-[0.76fr_1.24fr]">
        <div className="relative flex min-h-[44rem] flex-col border-b border-white/20 lg:min-h-[48rem] lg:border-b-0 lg:border-r">
          <div className="p-5 pt-16 sm:p-8 sm:pt-20 lg:p-12 lg:pt-24 xl:px-16">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#70A9F0]">The preparation record</p>
            <h2 id="prep-standard" className="proof-display mt-5 max-w-[7ch] text-[clamp(3.3rem,5.4vw,6.5rem)] leading-[0.8] tracking-[-0.055em]">
              Inspect the work behind the finish.
            </h2>
            <p className="mt-7 max-w-[30rem] text-base leading-7 text-[#C8D7E6]">Move through the controls that belong in a clear written scope. Each stage protects the one after it.</p>
          </div>

          <div className="mt-auto border-t border-white/20" role="group" aria-label="Preparation stages">
            {stages.map((stage) => {
              const selected = active.id === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveId(stage.id)}
                  aria-pressed={selected}
                  className={`group grid min-h-20 w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/15 px-5 py-4 text-left transition-colors last:border-b-0 sm:px-8 lg:px-12 xl:px-16 ${
                    selected
                      ? 'bg-[#0254C3] text-[#F6F3EB] shadow-[inset_4px_0_0_#0254C3]'
                      : 'bg-[#071321] text-[#F6F3EB] hover:bg-white hover:text-[#071321]'
                  }`}
                >
                  <span className={`text-xs font-black tracking-[0.16em] ${selected ? 'text-brand' : 'text-[#70A9F0] group-hover:text-[#0254C3]'}`}>
                    {stage.id}
                  </span>
                  <span>
                    <span className="proof-display block text-2xl leading-none tracking-[-0.04em]">{stage.title}</span>
                    <span className={`mt-1 block text-[0.68rem] font-black uppercase tracking-[0.12em] ${selected ? 'text-[#DDEBFA]' : 'text-[#AFC0D0] group-hover:text-[#314457]'}`}>
                      {stage.label}
                    </span>
                  </span>
                  <span className="text-[0.68rem] font-black uppercase tracking-[0.12em]">{selected ? 'Open' : 'View'}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative min-h-[38rem] overflow-hidden bg-[#0254C3] lg:min-h-[48rem]">
          <Image
            key={active.image}
            src={active.image}
            alt={`${active.title}: ${active.detail}`}
            fill
            sizes="(min-width: 1024px) 62vw, 100vw"
            className="proof-stage-image object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,19,33,0.54)_0%,transparent_55%),linear-gradient(0deg,rgba(7,19,33,0.95)_0%,transparent_56%)]" />
          <span aria-hidden="true" className="absolute -right-5 top-2 text-[clamp(12rem,25vw,24rem)] font-black leading-none tracking-[-0.12em] text-white/15">{active.id}</span>
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/30 px-5 py-4 sm:px-8 lg:px-10">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F6F3EB]">Preparation record / {active.id}</p>
            <p className="hidden text-xs font-bold uppercase tracking-[0.12em] text-[#DDEBFA] sm:block">Scope reference</p>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#70A9F0]">{active.label}</p>
            <h3 className="proof-display mt-3 max-w-[7ch] text-[clamp(4rem,8vw,8.5rem)] leading-[0.78] tracking-[-0.065em]">{active.title}</h3>
            <div className="mt-7 grid max-w-[48rem] gap-6 border-t border-white/30 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
              <p className="text-sm leading-7 text-[#DDEBFA] sm:text-base">{active.detail}</p>
              <div className="border-l-2 border-[#FF661C] pl-4 sm:max-w-[12rem]">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#AFC0D0]">Control output</p>
                <p className="mt-2 text-sm font-black leading-5 text-[#F6F3EB]">{active.output}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
