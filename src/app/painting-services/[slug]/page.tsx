import LandingPageRoute from '../../../views/LandingPage';
import { serviceLandingPages } from '../../../data/landingPages';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { serviceSchema, breadcrumbSchema } from '../../../lib/seo';

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
  }

  const serviceJson = serviceSchema(page.title, page.metaDescription, `/painting-services/${page.slug}`);
  const breadcrumbJson = breadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'Capabilities', path: '/capabilities' },
    { name: page.shortTitle, path: `/painting-services/${page.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJson) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJson) }}
      />
      <LandingPageRoute kind="service" initialPageData={page} />
    </>
  );
}
