import { CheckCircle2 } from 'lucide-react';

import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import JsonLd from '@/components/JsonLd';
import {
  PublicContainer,
  PublicCtaLink,
  PublicHero,
  PublicPage,
  PublicSection,
  PublicSectionHeading,
} from '@/components/public/PublicSystem';
import ResponsiveImage from '@/components/ResponsiveImage';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { directusAssetUrl, getCaseStudies } from '@/lib/directus/client';
import { breadcrumbSchema, businessSchema } from '@/lib/seo';
import { createPublicClient } from '@/lib/supabase/public';

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

function CaseStudyCard({ type, location, problem, prep, result, image, beforeImage, afterImage }: CaseStudyCardProps) {
  return (
    <Card variant="panel" className="flex h-full flex-col overflow-hidden">
      <div className="relative min-h-[22rem] border-b border-border">
        {beforeImage && afterImage ? (
          <BeforeAfterSlider beforeImage={beforeImage} afterImage={afterImage} beforeLabel="Before" afterLabel="After" />
        ) : image ? (
          <ResponsiveImage
            src={image}
            alt={`${type} in ${location}`}
            width={1200}
            height={800}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <Badge variant="eyebrow" className="absolute right-4 top-4">{location}</Badge>
      </div>
      <CardHeader>
        <Badge variant="trust" className="mb-3">Verified project scope</Badge>
        <CardTitle className="public-display text-4xl">{type}</CardTitle>
        <CardDescription>{problem}</CardDescription>
      </CardHeader>
      <CardContent className="grid flex-1 gap-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-trust">Preparation record</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {prep.map((item) => (
              <Badge key={item} variant="outline">
                <CheckCircle2 aria-hidden="true" data-icon="inline-start" />
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <Separator />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-trust">Result</p>
          <p className="mt-3 leading-7 text-foreground">{result}</p>
        </div>
      </CardContent>
      <CardFooter>
        <PublicCtaLink href="/contact" variant="outline" className="w-full">Discuss a Similar Scope</PublicCtaLink>
      </CardFooter>
    </Card>
  );
}

export default async function ProjectsPage() {
  const cmsStudies = await getCaseStudies();
  let portfolioItems: Array<{ title: string; location: string; problem: string; prep: string[]; result: string; image_url?: string; before_image_url?: string; after_image_url?: string }> = [];

  if (cmsStudies.length === 0) {
    const supabase = createPublicClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });
        if (data && !error) portfolioItems = data;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Portfolio DB fetch failed (${message}), using static fallback.`);
      }
    }
  }

  const fallbackProjects = [
    {
      type: 'Commercial Interior Refresh',
      location: 'Inver Grove Heights, MN',
      problem: 'A storefront interior needed a darker, more finished look while working with the existing ceiling grid.',
      prep: ['Grid cleaning', 'Floor protection', 'Masking fixtures', 'Adhesion primer'],
      result: 'A cleaner commercial interior with a more complete presentation for customers and staff.',
      beforeImage: '/brand/generated/sky-owner-proof.webp',
      afterImage: '/images/services/commercial/sky-work-08-finished-commercial.webp',
    },
    {
      type: 'Interior Residential Repaint',
      location: 'Twin Cities Metro',
      problem: 'Bedroom walls, trim, and doors had visible wear, dated colors, and stains that required preparation before finish paint.',
      prep: ['Drywall patching', 'Stain-blocking primer', 'Trim sanding', 'Dust containment'],
      result: 'A calmer bedroom finish with sharper lines, stronger coverage, and cleaner detail.',
      beforeImage: '/images/services/interior/sky-work-01-finished-kitchen.webp',
      afterImage: '/images/services/interior/sky-work-real-04-before-after-bedroom.webp',
    },
    {
      type: 'Pavement Marking and Striping',
      location: 'Dakota County, MN',
      problem: 'Faded lot markings made parking flow harder to read and weakened the property arrival.',
      prep: ['Power washing', 'Debris clearing', 'Chalk lining', 'Layout adjustment'],
      result: 'Brighter markings that improve visibility, traffic flow, and the arrival experience.',
      image: '/images/services/striping/SkyLLP_ParkingLot_Striping.webp',
    },
    {
      type: 'Interior Trim and Wall Finishing',
      location: 'St. Paul Metro',
      problem: 'Living room walls and trim needed an update after years of fading and minor structural settling.',
      prep: ['Caulking baseboards', 'Putty filling', 'Spot priming', 'Masking windows'],
      result: 'A fresh finish that brightens the room and gives the trim and walls cleaner definition.',
      image: '/images/services/interior/sky-work-02-finished-living-room.webp',
    },
  ];

  const projectsToRender = cmsStudies.length
    ? cmsStudies.map((item) => ({
        type: item.type,
        location: item.location,
        problem: item.problem,
        prep: item.prep || [],
        result: item.result,
        image: directusAssetUrl(item.image),
        beforeImage: directusAssetUrl(item.before_image),
        afterImage: directusAssetUrl(item.after_image),
      }))
    : portfolioItems.length
      ? portfolioItems.map((item) => ({
          type: item.title,
          location: item.location,
          problem: item.problem,
          prep: item.prep || [],
          result: item.result,
          image: item.image_url,
          beforeImage: item.before_image_url,
          afterImage: item.after_image_url,
        }))
      : fallbackProjects;

  return (
    <PublicPage>
      <JsonLd data={[businessSchema, breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Our Work', path: '/projects' }])]} />
      <PublicHero
        eyebrow="Recent work"
        title="Real surfaces. Real finish."
        description="Interior, commercial, and pavement-marking scopes shown with the problem, preparation record, and result."
        image="/brand/generated/sky-service-proof.webp"
        imageAlt="Sky's the Limit Painting project work"
        proof={['Real project imagery', 'Preparation details', 'Visible outcomes']}
        actions={<PublicCtaLink href="/estimate" size="marketing-lg">Get a Free Price Range</PublicCtaLink>}
      />
      <PublicSection tone="soft">
        <PublicContainer>
          <PublicSectionHeading
            eyebrow={cmsStudies.length ? `${cmsStudies.length} published case studies` : 'Project ledger'}
            title="The work is easier to judge when the prep is visible."
          />
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            {projectsToRender.map((project, index) => <CaseStudyCard key={`${project.type}-${index}`} {...project} />)}
          </div>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
