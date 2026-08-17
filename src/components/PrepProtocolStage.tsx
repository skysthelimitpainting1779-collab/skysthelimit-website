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
    <section aria-labelledby="prep-standard" className="border-b border-[#071321]/20 bg-[#F6F3EB] text-[#071321]">
      <div className="mx-auto max-w-[92rem] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid border border-[#071321]/25 lg:grid-cols-[minmax(19rem,0.72fr)_minmax(0,1.28fr)]">
          <div className="flex flex-col border-b border-[#071321]/25 lg:border-b-0 lg:border-r">
            <header className="ledger-grid border-b border-[#071321]/20 p-6 sm:p-8">
              <h2 id="prep-standard" className="ledger-display max-w-xl text-5xl uppercase leading-[0.88] sm:text-6xl">
                Inspect the work behind the finish.
              </h2>
              <p className="mt-6 max-w-md text-base leading-7 text-[#334353]">
                Select a stage to see the preparation controls that belong in a clear, written scope.
              </p>
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
                    className={`grid min-h-20 grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-b border-[#071321]/20 px-6 py-4 text-left transition-colors last:border-b-0 sm:px-8 ${
                      selected
                        ? 'bg-white text-[#071321] shadow-[inset_4px_0_0_#0254C3]'
                        : 'bg-[#F6F3EB] text-[#071321] hover:bg-white'
                    }`}
                  >
                    <span className="font-mono text-xs font-bold tracking-[0.16em] text-[#0254C3]">
                      {stage.id}
                    </span>
                    <span>
                      <span className="block text-lg font-black uppercase tracking-[-0.02em]">{stage.title}</span>
                      <span className={`mt-1 block text-xs font-bold uppercase tracking-[0.08em] ${selected ? 'text-[#334353]' : 'text-[#53616F]'}`}>
                        {stage.label}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em]">
                      {selected ? 'Open' : 'View'}
                    </span>
                  </button>
                );
              })}
            </div>

            <dl className="mt-auto grid grid-cols-2 border-t border-[#071321]/20">
              <div className="p-5">
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#53616F]">Method</dt>
                <dd className="mt-2 text-sm font-black uppercase">Prep-first scope</dd>
              </div>
              <div className="border-l border-[#071321]/20 p-5">
                <dt className="text-xs font-bold uppercase tracking-[0.08em] text-[#53616F]">Scope item</dt>
                <dd className="mt-2 text-sm font-black uppercase text-[#0254C3]">{active.id} / 04</dd>
              </div>
            </dl>
          </div>

          <div className="relative min-h-[34rem] overflow-hidden bg-[#071321] lg:min-h-[42rem]">
            <Image
              key={active.image}
              src={active.image}
              alt={`${active.title}: ${active.detail}`}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-white/35 bg-[#071321]/85 px-5 py-4 text-[#F6F3EB] sm:px-6">
              <p className="text-xs font-black uppercase tracking-[0.08em]">Preparation record / {active.id}</p>
              <p className="hidden text-xs uppercase tracking-[0.08em] text-[#F6F3EB]/70 sm:block">Scope reference</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 grid border-t border-white/30 bg-[#071321]/95 text-[#F6F3EB] sm:grid-cols-[1fr_auto]">
              <div className="p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-brand">{active.label}</p>
                <h3 className="ledger-display mt-2 text-5xl uppercase leading-none">{active.title}</h3>
                <p className="mt-4 max-w-xl text-sm leading-7 text-[#F6F3EB]/78">{active.detail}</p>
              </div>
              <div className="border-t border-white/20 p-6 sm:border-l sm:border-t-0 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#F6F3EB]/55">Control output</p>
                <p className="mt-3 max-w-[12rem] text-sm font-black uppercase leading-5">{active.output}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
