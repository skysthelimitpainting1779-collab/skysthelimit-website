import LandingPageRoute from '../../../views/LandingPage';
import { serviceLandingPages } from '../../../data/landingPages';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serviceSchema, breadcrumbSchema, faqSchema } from '../../../lib/seo';
import JsonLd from '../../../components/JsonLd';

export function generateStaticParams() {
  return serviceLandingPages.map((page) => ({
    slug: page.slug,
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = serviceLandingPages.find((p) => p.slug === slug);
  if (!page) {
    return {};
  }
  const imageUrl = `https://www.skysthelimitpaintingllc.com${page.image}`;
  const socialTitle = `${page.metaTitle} | Sky's the Limit Painting LLC`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: {
      canonical: `https://www.skysthelimitpaintingllc.com/painting-services/${slug}`,
    },
    openGraph: {
      title: socialTitle,
      description: page.metaDescription,
      url: `https://www.skysthelimitpaintingllc.com/painting-services/${slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${page.shortTitle} Painting Services | Sky's the Limit Painting LLC`,
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

export default async function PaintingServiceLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = serviceLandingPages.find((p) => p.slug === slug);
  if (!page) {
    notFound();
    // notFound() is not typed as `never` in this Next version, so the
    // explicit throw keeps TypeScript narrowing sound (unreachable at runtime).
    throw new Error(`Painting service not found: ${slug}`);
  }

  const serviceJson = serviceSchema(page.title, page.metaDescription, `/painting-services/${page.slug}`);
  const breadcrumbJson = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Capabilities', path: '/capabilities' },
    { name: page.shortTitle, path: `/painting-services/${page.slug}` },
  ]);
  const faqJson = page.faq?.length ? faqSchema(page.faq) : null;

  return (
    <>
      <JsonLd data={serviceJson} />
      <JsonLd data={breadcrumbJson} />
      {faqJson ? <JsonLd data={faqJson} /> : null}
      <LandingPageRoute kind="service" initialPageData={page} />
    </>
  );
}
