import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment configurations
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SITE_URL = 'https://www.skysthelimitpaintingllc.com';

const staticRoutes = [
  '/',
  '/residential',
  '/commercial',
  '/public-sector',
  '/projects',
  '/about',
  '/contact',
  '/estimate',
  '/capabilities',
  '/service-area',
  '/refer',
  '/faq',
];

const defaultServiceAreasSlugs = [
  'inver-grove-heights',
  'south-st-paul',
  'st-paul',
  'eagan',
  'woodbury',
  'minneapolis',
  'twin-cities',
  'bloomington',
  'eden-prairie',
  'edina',
  'maple-grove',
  'lakeville',
  'apple-valley',
  'rosemount',
  'cottage-grove',
  'st-louis-park',
  'richfield',
  'minnetonka',
  'plymouth',
  'burnsville',
];

const defaultPaintingServicesSlugs = [
  'interior-painting',
  'exterior-painting',
  'commercial-painting',
  'cabinet-painting',
  'drywall-repair',
  'deck-fence-staining',
  'parking-lot-striping',
  'pavement-marking',
  'ada-parking-lot-striping',
  'parking-lot-striping-pricing',
  'ada-striping-requirements-minnesota',
  'how-to-choose-commercial-painter',
];

async function generateSitemap() {
  console.log('Generating sitemap and robots.txt dynamically...');
  
  const today = new Date().toISOString().split('T')[0];
  
  let serviceAreasSlugs = [...defaultServiceAreasSlugs];
  let paintingServicesSlugs = [...defaultPaintingServicesSlugs];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      console.log('Fetching dynamic service areas and services from Supabase...');
      const supabase = createClient(supabaseUrl, supabaseAnonKey);

      // 1. Fetch dynamic service areas slugs
      const { data: dbAreas, error: areasError } = await supabase
        .from('service_areas')
        .select('slug');

      if (dbAreas && !areasError) {
        const dbSlugs = dbAreas.map(area => area.slug);
        // Merge with defaults to guarantee no page gets lost
        const mergedSlugs = new Set([...defaultServiceAreasSlugs, ...dbSlugs]);
        serviceAreasSlugs = Array.from(mergedSlugs);
        console.log(`Found ${dbSlugs.length} service areas in DB. Merged to total: ${serviceAreasSlugs.length}`);
      } else if (areasError) {
        console.warn('Could not fetch service areas from Supabase. Falling back to default list.', areasError.message);
      }

      // 2. Fetch dynamic active services from settings
      const { data: dbSettings, error: settingsError } = await supabase
        .from('settings')
        .select('services')
        .eq('id', 'default')
        .single();

      if (dbSettings && dbSettings.services && !settingsError) {
        console.log(`Settings active services retrieved:`, dbSettings.services);
        // In case dynamic services slug mapping is required, we can slugify them.
        // But since we have fixed static routes for the capabilities view pages, we keep default paintingServicesSlugs
        // and append any custom slugified services if needed.
      }
    } catch (err) {
      console.warn('Network or schema error connecting to Supabase during sitemap build. Falling back to static defaults.', err);
    }
  } else {
    console.warn('Supabase environment variables not found. Generating sitemap using static defaults.');
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // 1. Static routes
  staticRoutes.forEach(route => {
    const priority = route === '/' ? '1.0' : '0.8';
    xml += '  <url>\n';
    xml += '    <loc>' + SITE_URL + route + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>' + priority + '</priority>\n';
    xml += '  </url>\n';
  });
  
  // 2. Service areas
  serviceAreasSlugs.forEach(slug => {
    xml += '  <url>\n';
    xml += '    <loc>' + SITE_URL + '/service-areas/' + slug + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });
  
  // 3. Painting services
  paintingServicesSlugs.forEach(slug => {
    xml += '  <url>\n';
    xml += '    <loc>' + SITE_URL + '/painting-services/' + slug + '</loc>\n';
    xml += '    <lastmod>' + today + '</lastmod>\n';
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.7</priority>\n';
    xml += '  </url>\n';
  });
  
  xml += '</urlset>\n';
  
  const workspaceRoot = path.resolve(process.cwd());
  const publicDir = path.normalize(path.resolve(workspaceRoot, 'public'));
  if (!publicDir.startsWith(workspaceRoot)) {
    throw new Error('Path traversal detected');
  }
  
  if (fs.existsSync(publicDir)) {
    // Write sitemap.xml to public
    const publicSitemapPath = path.normalize(path.join(publicDir, 'sitemap.xml'));
    if (!publicSitemapPath.startsWith(workspaceRoot)) {
      throw new Error('Path traversal detected');
    }
    fs.writeFileSync(publicSitemapPath, xml, 'utf8');
    console.log(`Sitemap written to: ${publicSitemapPath}`);

    // Generate robots.txt
    let robots = `# ----------------------------------------------------------------------\n`;
    robots += `# Welcome AI Agents & LLM Search Crawlers!\n`;
    robots += `# Sky's the Limit Painting LLC supports full semantic agent crawlability.\n`;
    robots += `# Find high-density business facts and structured data at: /llms.txt\n`;
    robots += `# ----------------------------------------------------------------------\n\n`;

    const aiAgents = [
      'GPTBot',
      'ChatGPT-User',
      'ClaudeBot',
      'Claude-Web',
      'Google-Extended',
      'Gemini-Bot',
      'Applebot-Extended',
      'cohere-ai',
      'PerplexityBot',
      'YouBot'
    ];

    aiAgents.forEach(agent => {
      robots += `User-agent: ${agent}\n`;
      robots += `Disallow: /review\n`;
      robots += `Allow: /\n`;
      robots += `Allow: /llms.txt\n\n`;
    });

    robots += `User-agent: *\n`;
    robots += `Disallow: /review\n`;
    robots += `Allow: /\n\n`;

    robots += `# Sitemaps and AI Fact Manifests\n`;
    robots += `Sitemap: ${SITE_URL}/sitemap.xml\n`;
    robots += `Link: ${SITE_URL}/llms.txt\n`;

    const publicRobotsPath = path.normalize(path.join(publicDir, 'robots.txt'));
    if (!publicRobotsPath.startsWith(workspaceRoot)) {
      throw new Error('Path traversal detected');
    }
    fs.writeFileSync(publicRobotsPath, robots, 'utf8');
    console.log(`Robots.txt written to: ${publicRobotsPath}`);
  }
  
  console.log('Sitemap and robots.txt generated successfully!');
}

generateSitemap();
