import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import HoverLift from '../components/animations/HoverLift';
import BeforeAfterSlider from '../components/BeforeAfterSlider';
import ResponsiveImage from '../components/ResponsiveImage';
import { createPublicClient } from '../lib/supabase/public';
import { getCaseStudies, directusAssetUrl } from '../lib/directus/client';
import JsonLd from '../components/JsonLd';
import { businessSchema, breadcrumbSchema } from '../lib/seo';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ProcessTag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Badge variant="outline" className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border-white/10 px-2 py-1 rounded-none font-bold">
    <CheckCircle2 size={12} className="text-white" />
    {children}
  </Badge>
);

interface CaseStudyCardProps {
  type: string;
  location: string;
  problem: string;
  prep: string[];
  result: string;
  image?: string;
  beforeImage?: string;
  afterImage?: string;
}

const CaseStudyCard = ({ type, location, problem, prep, result, image, beforeImage, afterImage }: CaseStudyCardProps) => (
  <HoverLift className="bg-[#0B0B0D] rounded-none overflow-hidden border border-white/10 shadow-none flex flex-col group h-full mb-12 transition duration-500 hover:border-white/40">
    <div className="relative overflow-hidden">
      {beforeImage && afterImage ? (
        <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} beforeLabel="The Challenge" afterLabel="The Result" />
      ) : (
        <div className="h-[350px] relative">
          {image && (
            <ResponsiveImage src={image} alt={`${type} in ${location}`} width={1200} height={700} sizes="(min-width: 1024px) 33vw, 100vw" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none" />
          )}
          <Badge variant="outline" className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border-white/20 text-white text-xs font-bold px-3 py-1 rounded-none">
            {location}
          </Badge>
        </div>
      )}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <Badge variant="secondary" className="bg-white text-[#050505] text-xs font-black px-3 py-1 rounded-none shadow-none border-none">
          {type}
        </Badge>
      </div>
    </div>
    <div className="p-8 flex flex-col flex-1">
      <h3 className="text-xl font-display font-black text-white mb-6 group-hover:text-gray-300 transition-colors">{type}</h3>
      <div className="space-y-6 mb-8 flex-grow">
        <div>
          <h4 className="text-gray-400 text-xs font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> The Challenge
          </h4>
          <p className="text-white text-sm leading-relaxed">{problem}</p>
        </div>
        <div className="w-full h-px bg-white/5"></div>
        <div>
          <h4 className="text-gray-400 text-xs font-bold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> The Prep
          </h4>
          <div className="flex flex-wrap gap-2">
            {prep.map((tag: string, i: number) => (
              <ProcessTag key={i}>{tag}</ProcessTag>
            ))}
          </div>
        </div>
        <div className="w-full h-px bg-white/5"></div>
        <div>
          <h4 className="text-white text-xs font-bold mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white"></span> The Result
          </h4>
          <p className="text-white text-sm font-medium leading-relaxed">{result}</p>
        </div>
      </div>
      <div className="mt-auto pt-6 border-t border-white/5">
        <Link 
          href="/contact" 
          className={cn(buttonVariants({ variant: "link" }), "px-0 items-center gap-2 text-xs font-black text-white hover:text-gray-300 transition-colors")}
        >
          Inquire About A Similar Scope <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  </HoverLift>
);

export default async function ProjectsPage() {
  const schemaJson = [
    businessSchema,
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Our Work', path: '/projects' }
    ])
  ];

  // 1. Try Directus CMS first (graceful fallback if not configured or unreachable)
  const cmsStudies = await getCaseStudies();

  // 2. Try the anonymous Supabase portfolio table as a secondary source.
  // This client is deliberately cookie-free so the public page can prerender safely.
  let portfolioItems: Array<{ title: string; location: string; problem: string; prep: string[]; result: string; image_url?: string; before_image_url?: string; after_image_url?: string }> = [];
  if (cmsStudies.length === 0) {
    const supabase = createPublicClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('portfolio')
          .select('*')
          .order('created_at', { ascending: false });
        if (data && !error) {
          portfolioItems = data;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Portfolio DB fetch failed (${message}), using static fallback.`);
      }
    }
  }

  // 3. Static fallback (always available, ensures Vercel builds never break)
  const fallbackProjects = [
    {
      type: "Commercial Interior Refresh",
      location: "Inver Grove Heights, MN",
      problem: "Client needed a darker, more finished look for a storefront interior while working with the existing ceiling grid.",
      prep: ["Grid cleaning", "Floor protection", "Masking fixtures", "Adhesion primer"],
      result: "Darker, cleaner commercial interior with a more complete presentation for customers and staff.",
      beforeImage: "/brand/generated/sky-owner-proof.webp",
      afterImage: "/images/services/commercial/sky-work-08-finished-commercial.webp"
    },
    {
      type: "Interior Residential Repaint",
      location: "Twin Cities Metro",
      problem: "Bedroom walls, trim, and doors had visible wear, dated colors, and stains that needed careful prep before finish paint.",
      prep: ["Drywall patching", "Stain-blocking primer", "Trim sanding", "Dust containment"],
      result: "A cleaner, more current bedroom finish with sharper lines, stronger coverage, and a calmer finished feel.",
      beforeImage: "/images/services/interior/sky-work-01-finished-kitchen.webp",
      afterImage: "/images/services/interior/sky-work-real-04-before-after-bedroom.webp"
    },
    {
      type: "Pavement Marking / Striping",
      location: "Dakota County, MN",
      problem: "Faded lot markings made parking flow harder to read and weakened the first impression of the property.",
      prep: ["Power washing", "Debris clearing", "Chalk lining", "Layout adjustment"],
      result: "Clearer, brighter parking lot markings that improve visibility, traffic flow, and the property's arrival experience.",
      image: "/images/services/striping/SkyLLP_ParkingLot_Striping.webp"
    },
    {
      type: "Interior Trim & Wall Finishing",
      location: "St. Paul Metro",
      problem: "Living room walls and trim needing an update to brighten the space after years of fading and minor structural settling.",
      prep: ["Caulking baseboards", "Putty filling", "Spot priming", "Masking windows"],
      result: "A fresh, clean finish that brightens the room and gives the trim and walls a more finished look.",
      image: "/images/services/interior/sky-work-02-finished-living-room.webp"
    }
  ];

  // Priority: CMS → Supabase → static
  const projectsToRender = cmsStudies.length > 0
    ? cmsStudies.map(item => ({
        type: item.type,
        location: item.location,
        problem: item.problem,
        prep: item.prep || [],
        result: item.result,
        image: directusAssetUrl(item.image),
        beforeImage: directusAssetUrl(item.before_image),
        afterImage: directusAssetUrl(item.after_image),
      }))
    : portfolioItems.length > 0
    ? portfolioItems.map(item => ({
        type: item.title,
        location: item.location,
        problem: item.problem,
        prep: item.prep || [],
        result: item.result,
        image: item.image_url,
        beforeImage: item.before_image_url,
        afterImage: item.after_image_url
      }))
    : fallbackProjects;

  return (
    <>
      <JsonLd data={schemaJson} />

      <main className="animate-premium-fade-in">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#050505] py-24 px-6 border-b border-white/10">
          <ResponsiveImage src="/brand/generated/sky-service-proof.webp" alt="Sky's the Limit Painting LLC premium work proof" width={1920} height={1080} sizes="100vw" className="absolute inset-0 h-full w-full object-cover opacity-20 pointer-events-none" />
          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-display font-black mb-6 text-white leading-[0.96]">Real Surfaces.<br/>Real Finish.</h1>
              <p className="text-xl max-w-prose text-gray-300">
                Take a look at some of our recent verifiable interior, exterior, and commercial painting projects across the Twin Cities.
              </p>
              {cmsStudies.length > 0 && (
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">
                  Live from CMS · {cmsStudies.length} published case studies
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="bg-[#050505] py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {projectsToRender.map((project, index) => (
                <div key={index}>
                  <CaseStudyCard {...project} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="py-24 px-6 bg-[#050505] border-t border-white/10">
          <div className="max-w-4xl mx-auto bg-[#0B0B0D] border border-white/10 rounded-none p-8 md:p-12 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-black text-white mb-4">Have a Similar Project?</h2>
              <p className="text-gray-300 text-lg mb-8 max-w-prose mx-auto">
                We're ready to put the same level of care into your next project. Contact us today for a free estimate.
              </p>
              <Link href="/contact" className={cn(buttonVariants({ variant: "default", size: "lg" }), "gap-2 bg-white hover:bg-gray-200 text-[#050505] px-8 py-7 rounded-none font-black text-sm")}>
                Get Your Free Estimate <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
