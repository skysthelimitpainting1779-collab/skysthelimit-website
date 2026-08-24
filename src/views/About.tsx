import Link from 'next/link';
import { ArrowRight, Camera, CheckCircle2, ClipboardCheck, Phone, ShieldCheck } from 'lucide-react';
import ResponsiveImage from '../components/ResponsiveImage';
import JsonLd from '../components/JsonLd';
import HeroOverlays from '../components/HeroOverlays';
import IconFeatureCard from '../components/IconFeatureCard';
import { businessEmail } from '../lib/contact';
import { businessSchema, breadcrumbSchema } from '../lib/seo';

export default function AboutPage() {
  const schemaJson = [
    businessSchema,
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About Us', path: '/about' }
    ])
  ];

  return (
    <>
      <JsonLd data={schemaJson} />
      
      <main className="animate-premium-fade-in">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#050505] py-24 px-6">
          <HeroOverlays
            imageSrc="/brand/generated/sky-service-proof.webp"
            imageAlt="Premium painting service proof and trade detailing"
            imageSizes="100vw"
            gradients={[
              'bg-gradient-to-r from-[#050505] via-[#050505]/94 to-transparent',
              'bg-gradient-to-t from-[#050505] via-transparent to-transparent',
            ]}
          />
          
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <span className="inline-block text-white font-semibold text-xs mb-4">About Us</span>
              <h1 className="text-5xl md:text-7xl font-display font-black mb-6 text-white leading-[0.96]">About Sky&apos;s the Limit<br/>Painting LLC</h1>
              <p className="text-xl text-gray-300 max-w-xl">
                Owner-operated. Journeyworker-trained. Prep-first by design.
              </p>
            </div>
          </div>
        </section>

        {/* Opening / Owner-Operator Section */}
        <div className="bg-[#050505] py-24 px-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              {/* Branded Equipment Bento Card */}
              <div className="relative group overflow-hidden border border-white/10 bg-[#0B0B0D] shadow-md transition duration-500 hover:border-white/45">
                <ResponsiveImage src="/brand/generated/sky-owner-proof.webp" alt="Sky's the Limit branded equipment and owner-led proof" width={1200} height={1200} sizes="(min-width: 1024px) 50vw, 100vw" className="w-full aspect-[4/3] object-cover" />
                <div className="absolute inset-0 bg-black-primary/10"></div>
                <div className="absolute bottom-0 left-0 right-0 bg-[linear-gradient(0deg,rgba(5,5,5,0.92),transparent)] p-6">
                  <p className="text-xs font-semibold text-white">Branded Equipment</p>
                  <p className="mt-1 text-sm font-bold text-white">Owner-operated trade tools</p>
                </div>
              </div>

              {/* Anthony Briseno Portrait/Trust Bento Card */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border border-white/10 bg-[#0B0B0D] p-6">
                <div className="md:col-span-4 relative aspect-square overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center bg-white/5 text-white font-display text-2xl font-black">
                    AB
                  </div>
                  <ResponsiveImage src="/images/site/anthony-portrait.webp" alt="Anthony Briseno" width={400} height={400} sizes="(min-width: 768px) 25vw, 100vw" className="absolute inset-0 h-full w-full object-cover opacity-90 grayscale hover:grayscale-0 transition duration-500" />
                </div>
                <div className="md:col-span-8 flex flex-col justify-center">
                  <p className="text-xs font-black text-white">Founder &amp; Operator</p>
                  <h3 className="text-lg font-black text-white mt-1">Anthony Briseno</h3>
                  <p className="text-xs text-[#b9b2a6] mt-2 leading-relaxed">
                    Minnesota Journeyworker Painter &amp; Decorator. Direct lead on every site, ensuring absolute prep and finish compliance.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-display font-bold mb-6 leading-tight">The Owner-Operator Advantage</h2>
              <div className="w-12 h-1 bg-white mb-8"></div>
              
              <div className="space-y-6 text-lg text-[#e4ded2] leading-relaxed">
                <p>
                  Anthony Briseno founded Sky&apos;s the Limit Painting LLC to bring dependable, high-craftsmanship painting to the Twin Cities &mdash; the kind of work where the prep is as meticulous as the finish, and the owner is on site from the first walkthrough to the final inspection.
                </p>
                <p>
                  After completing a formal Minnesota Journeyworker Painter &amp; Decorator apprenticeship, Anthony built Sky&apos;s the Limit on a simple principle: treat every home, business, and public facility like it&apos;s his own. No shortcuts. No disappearing crews. No surprises.
                </p>
                <p>
                  Most painting companies send a crew and a project manager you may never meet. At Sky&apos;s the Limit, Anthony is the one who walks your space with you, confirms the scope, leads the prep, oversees the execution, and does the final walkthrough. This isn&apos;t delegation &mdash; it&apos;s direct accountability.
                </p>
              </div>

              <div className="mt-12">
                <Link href="/contact" className="inline-flex items-center gap-2 bg-white hover:bg-white text-[#050505] px-8 py-4 rounded-none font-black transition-colors text-sm cursor-pointer">
                  Work With Us <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Credentials / Key Points */}
        <section className="bg-[#050505] border-b border-white/10 px-6 py-20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-display font-black text-white mb-12">Credentials &amp; Coverage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                'Minnesota Journeyworker Painter & Decorator (completed apprenticeship program)',
                'Direct lead on every job \u2014 from scope to sign-off',
                '15+ years of hands-on experience across construction and finishing trades',
                'Owner-operated: No layers of management between you and the person doing the work',
                'Registered Minnesota Specialty Contractor (Painting) \u2014 ID: IR816596',
                'Fully insured with general liability, commercial auto, and tools coverage',
              ].map((item) => (
                <div key={item} className="flex gap-3 border-t border-zinc-800 pt-6">
                  <CheckCircle2 className="mt-1 shrink-0 text-white" size={18} />
                  <p className="text-base leading-relaxed text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Prep-First Matters */}
        <section className="bg-[#080807] border-b border-white/10 px-6 py-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <p className="mb-6 text-sm font-semibold text-zinc-400">Why prep-first matters</p>
              <h2 className="text-4xl font-display font-black text-white mb-8 leading-tight md:text-5xl">
                Paint is only as good as what&apos;s underneath it.
              </h2>
              <div className="space-y-6 text-lg text-[#e4ded2] leading-relaxed">
                <p>
                  Anthony&apos;s trade background taught him that every project &mdash; whether it&apos;s a single room refresh or a full municipal facility upgrade &mdash; begins with uncompromising surface preparation.
                </p>
                <p>
                  We clean, scrape, sand, caulk, mask, and prime until the surface is truly ready. Then we paint. This isn&apos;t extra work; it&apos;s the only way to deliver finishes that look sharp and hold up for years instead of failing in months.
                </p>
                <p>
                  The result? Fewer callbacks, happier clients, and work that reflects well on everyone involved &mdash; especially in public-sector and commercial settings where documentation and durability matter.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 relative min-h-[400px] overflow-hidden">
              <ResponsiveImage src="/images/site/iphone-exterior-prep-front-entry.webp" alt="Exterior surface preparation in progress" width={1200} height={900} sizes="(min-width: 1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,8,7,0.5),rgba(8,8,7,0.05))]"></div>
            </div>
          </div>
        </section>

        {/* Our Approach / Process */}
        <section className="bg-[#050505] border-b border-white/10 px-6 py-24">
          <div className="max-w-7xl mx-auto">
            <p className="mb-6 text-sm font-semibold text-zinc-400">Our approach to every project</p>
            <h2 className="text-4xl font-display font-black text-white mb-4 leading-tight md:text-5xl">
              The same clear process on every job, scaled to the scope.
            </h2>
            <p className="max-w-[65ch] text-lg text-[#c9c1b4] leading-relaxed mb-16">
              This structure keeps communication clear and outcomes predictable &mdash; whether we&apos;re working in an occupied home, an active office, or a public facility.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { step: '01', title: 'Scope', body: 'We walk the space together, document priorities, access needs, timeline expectations, and any insurance or compliance requirements.' },
                { step: '02', title: 'Prep', body: 'We protect what needs protecting and prepare every surface properly. No rushed steps.' },
                { step: '03', title: 'Execute', body: 'Owner-led application with consistent coverage, clean lines, and respect for your active space.' },
                { step: '04', title: 'Verify', body: 'Joint walkthrough. We don\u2019t consider the job done until you\u2019re satisfied and the site is clean.' },
              ].map((item) => (
                <div key={item.step} className="border-t border-zinc-800 pt-8">
                  <span className="text-sm font-semibold text-zinc-400">{item.step}</span>
                  <h3 className="mt-4 text-2xl font-black text-white">{item.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-zinc-400">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Serving the Twin Cities */}
        <section className="bg-[#080807] border-b border-white/10 px-6 py-24">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7">
              <p className="mb-6 text-sm font-semibold text-zinc-400">Service area</p>
              <h2 className="text-4xl font-display font-black text-white mb-8 leading-tight md:text-5xl">
                Serving the Twin Cities
              </h2>
              <p className="text-lg text-[#e4ded2] leading-relaxed mb-8">
                Sky&apos;s the Limit Painting LLC is based in the east metro and serves homeowners, businesses, and public agencies throughout Minneapolis, St. Paul, Woodbury, Eagan, Inver Grove Heights, South St. Paul, and the broader Twin Cities area.
              </p>
              <div className="space-y-4">
                {[
                  'Residential whole-home and room-by-room painting (interiors, exteriors, cabinets, trim, decks)',
                  'Commercial interiors and exteriors with minimal operational disruption',
                  'Public-sector and municipal work, including facility repainting, light poles, pavement markings, and striping \u2014 with full documentation and compliance readiness',
                ].map((item) => (
                  <div key={item} className="flex gap-3">
                    <CheckCircle2 className="mt-1 shrink-0 text-white" size={18} />
                    <p className="text-base leading-relaxed text-zinc-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="border border-white/10 bg-[#0B0B0D] p-8">
                <h3 className="text-2xl font-black text-white mb-6">Let&apos;s Talk About Your Project</h3>
                <p className="text-base text-zinc-400 leading-relaxed mb-8">
                  Whether you&apos;re a homeowner planning a refresh, a property manager needing reliable commercial work, or a public agency seeking a documented, owner-operated contractor, we&apos;d welcome the conversation.
                </p>
                <div className="space-y-4">
                  <a href="tel:+16514104196" className="flex items-center gap-3 text-white font-bold text-lg hover:text-gray-300 transition-colors">
                    <Phone size={20} /> (651) 410-4196
                  </a>
                  <a href={`mailto:${businessEmail}`} className="text-zinc-400 hover:text-white transition-colors">
                    {businessEmail}
                  </a>
                </div>
                <p className="mt-6 text-sm text-zinc-400 leading-relaxed">
                  We start every relationship the same way: with a clear scope walkthrough and a transparent conversation about what the work will actually involve.
                </p>
                <div className="mt-8">
                  <Link href="/estimate" className="inline-flex items-center gap-2 bg-white hover:bg-gray-100 text-[#050505] px-8 py-4 rounded-none font-black transition-colors text-sm cursor-pointer">
                    Request Your Free Estimate <ArrowRight size={18} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Pillars */}
        <section className="relative overflow-hidden bg-[#050505] px-6 py-20">
          <div className="measurement-rules absolute inset-0 opacity-12"></div>
          <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: 'Neatness & Respect', body: 'We treat your property like our own \u2014 clean drop cloths, dust isolation, and orderly tool staging every single day.' },
              { icon: ClipboardCheck, title: 'Apprentice-Built Craft', body: 'Led by Anthony Briseno with a formal Journeyworker Painter & Decorator background \u2014 combining hands-on field experience with structural discipline.' },
              { icon: Camera, title: 'Detail-First Estimates', body: 'Every bid features detailed photo scopes and clear, itemized line items so you know exactly what prep and coating you are paying for.' },
            ].map((card) => (
              <IconFeatureCard
                key={card.title}
                icon={card.icon}
                title={card.title}
                body={card.body}
                className="h-full border-l border-white/35 bg-[#0B0B0D] p-7 transition duration-500 hover:-translate-y-1 hover:border-white/55"
                iconSize={30}
                iconClassName="mb-8 text-white"
                titleClassName="text-2xl font-black leading-tight text-white"
                bodyClassName="mt-5 text-sm leading-relaxed text-[#b9b2a6]"
                headingLevel="h2"
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
