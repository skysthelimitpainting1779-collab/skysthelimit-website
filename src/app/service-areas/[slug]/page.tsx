import LandingPageRoute from '../../../views/LandingPage';
import { areaLandingPages, type LandingPage } from '../../../data/landingPages';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { localBusinessSchema, breadcrumbSchema } from '../../../lib/seo';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create safe, cookie-less public client for build/static rendering tasks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getPublicSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export async function getServiceAreaPage(slug: string): Promise<LandingPage | null> {
  'use cache';
  // 1. Try fetching from the database first
  try {
    const supabase = getPublicSupabase();
    if (supabase) {
      const { data: dbArea, error } = await supabase
        .from('service_areas')
        .select('*')
        .eq('slug', slug)
        .single();

      if (dbArea && !error) {
        return {
          kind: 'area',
          slug: dbArea.slug,
          title: `${dbArea.city} Painting Contractor`,
          shortTitle: dbArea.city,
          eyebrow: 'Local service / coverage',
          headline: `Owner-operated painting in ${dbArea.city}, built for homes, properties, and facility work.`,
          description: dbArea.description,
          metaTitle: dbArea.meta_title || `${dbArea.city} Painting Contractor | Sky's the Limit`,
          metaDescription: dbArea.meta_desc || `Looking for top-tier painting services in ${dbArea.city}, MN? Contact Sky's the Limit Painting LLC for residential and commercial projects.`,
          image: '/brand/generated/sky-local-authority.webp',
          accent: 'Local authority',
          market: 'Residential',
          proof: [`Based in ${dbArea.city}`, 'Owner-led project communication', 'Residential, commercial, and facility-ready scope'],
          scope: ['Interior repainting', 'Exterior refreshes', 'Commercial interior work', 'Facility painting inquiries', 'Pavement-marking and striping conversations'],
          process: [
            { title: 'Local Scope Review', body: 'Clarify surfaces, access, project timing, and the finish standard before a recommendation is made.' },
            { title: 'Prep-Led Estimate', body: 'Treat patching, sanding, masking, caulking, and protection as the foundation of the estimate.' },
            { title: 'Owner Follow-Through', body: 'Keep the project tied to Anthony’s direct communication, photos, and jobsite accountability.' },
          ],
          related: ['residential', 'commercial', 'public-sector'],
          neighborhoods: [dbArea.city]
        };
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Service area DB lookup failed for "${slug}": ${message}`);
  }

  // 2. Fall back to static configuration
  const staticPage = areaLandingPages.find((p) => p.slug === slug);
  return staticPage || null;
}

export async function generateStaticParams() {
  const staticParams = areaLandingPages.map((page) => ({
    slug: page.slug,
  }));

  try {
    const supabase = getPublicSupabase();
    if (supabase) {
      const { data: dbAreas } = await supabase
        .from('service_areas')
        .select('slug');

      if (dbAreas && dbAreas.length > 0) {
        const dbParams = dbAreas.map((area: { slug: string }) => ({
          slug: area.slug,
        }));
        
        const allParams = [...staticParams];
        dbParams.forEach(param => {
          if (!allParams.some(p => p.slug === param.slug)) {
            allParams.push(param);
          }
        });
        return allParams;
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`Service area static params fetch failed: ${message}`);
  }

  return staticParams;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getServiceAreaPage(slug);
  if (!page) {
    return {};
  }
  const imageUrl = `https://www.skysthelimitpaintingllc.com${page.image}`;
  const socialTitle = `${page.metaTitle} | Sky's the Limit Painting LLC`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `https://www.skysthelimitpaintingllc.com/service-areas/${slug}`,
    },
    openGraph: {
      title: socialTitle,
      description: page.metaDescription,
      url: `https://www.skysthelimitpaintingllc.com/service-areas/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${page.shortTitle} Painting Contractor | Sky's the Limit Painting LLC`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: page.metaDescription,
      images: [imageUrl],
    },
  };
}

export default async function ServiceAreaLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getServiceAreaPage(slug);
  if (!page) {
    notFound();
  }

  const businessJson = localBusinessSchema(page.shortTitle, page.slug);
  const breadcrumbJson = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Service Area', path: '/service-area' },
    { name: page.shortTitle, path: `/service-areas/${page.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
      <LandingPageRoute kind="area" initialPageData={page} />
    </>
  );
}
