import { ENV } from './env';

const siteUrl = ENV.SITE_URL.replace(/\/$/, '');

export const businessSchema = {
  '@context': 'https://schema.org',
  '@type': 'HousePainter',
  name: "Sky's the Limit Painting LLC",
  founder: 'Anthony Briseno',
  telephone: '+1-651-410-4196',
  email: 'skysthelimitpainting1779@gmail.com',
  url: siteUrl,
  logo: `${siteUrl}/brand/SkyLLP_BrandLogo.svg`,
  image: `${siteUrl}/brand/generated/sky-local-authority.webp`,
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '07:00',
      closes: '17:00',
    },
  ],
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Inver Grove Heights',
    addressRegion: 'MN',
    addressCountry: 'US',
  },
  areaServed: [
    {
      '@type': 'Place',
      name: 'Twin Cities Metro',
    },
    {
      '@type': 'AdministrativeArea',
      name: 'Minnesota',
    },
    {
      '@type': 'City',
      name: 'Inver Grove Heights',
    },
    {
      '@type': 'City',
      name: 'South St. Paul',
    },
    {
      '@type': 'City',
      name: 'St. Paul',
    },
    {
      '@type': 'City',
      name: 'Eagan',
    },
    {
      '@type': 'City',
      name: 'Woodbury',
    },
    {
      '@type': 'City',
      name: 'Minneapolis',
    },
  ],
  sameAs: [
    ENV.FACEBOOK_URL,
    ENV.INSTAGRAM_URL,
    ENV.LINKEDIN_URL,
    ENV.TIKTOK_URL,
    ENV.GOOGLE_BUSINESS_URL,
  ].filter(Boolean),
  knowsAbout: [
    'Residential painting',
    'Commercial painting',
    'Interior painting',
    'Exterior painting',
    'Facility repainting',
    'Pavement marking',
    'Parking-lot striping',
    'Road striping',
    'Guardrail painting',
    'Light pole painting',
  ],
};

export function serviceSchema(name: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name,
    description,
    provider: {
      '@type': 'HousePainter',
      name: "Sky's the Limit Painting LLC",
      telephone: '+1-651-410-4196',
      email: 'skysthelimitpainting1779@gmail.com',
      url: siteUrl,
    },
    areaServed: 'Minnesota',
    url: `${siteUrl}${path}`,
  };
}

export function articleSchema(headline: string, description: string, path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    author: {
      '@type': 'Organization',
      name: "Sky's the Limit Painting LLC",
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: "Sky's the Limit Painting LLC",
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/brand/SkyLLP_BrandLogo.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}${path}`,
    },
    url: `${siteUrl}${path}`,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}

export function localBusinessSchema(cityName: string, slug: string) {
  // The business is physically based in Inver Grove Heights; the service-area
  // city is expressed through areaServed, never as the business address, so
  // crawlers do not read each suburb page as a separate business location.
  const businessLocality = 'Inver Grove Heights';
  return {
    '@context': 'https://schema.org',
    '@type': 'HousePainter',
    name: `${cityName} Painting Contractor | Sky's the Limit Painting LLC`,
    telephone: '+1-651-410-4196',
    email: 'skysthelimitpainting1779@gmail.com',
    url: `${siteUrl}/service-areas/${slug}`,
    logo: `${siteUrl}/brand/SkyLLP_BrandLogo.svg`,
    image: `${siteUrl}/brand/generated/sky-local-authority.webp`,
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '07:00',
        closes: '17:00',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: businessLocality,
      addressRegion: 'MN',
      addressCountry: 'US',
    },
    areaServed: [
      {
        '@type': 'City',
        name: cityName,
      },
      {
        '@type': 'Place',
        name: 'Twin Cities Metro',
      },
    ],
  };
}

export function faqSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
