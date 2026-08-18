export type LandingPageKind = 'service' | 'area';

export interface LandingPage {
  kind: LandingPageKind;
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  headline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  accent: string;
  market: 'Residential' | 'Commercial' | 'Public Sector';
  proof: string[];
  scope: string[];
  process: Array<{ title: string; body: string }>;
  related: string[];
  neighborhoods?: string[];
}

export const areaLandingPages: LandingPage[] = [
  {
    kind: 'area',
    slug: 'inver-grove-heights',
    title: 'Inver Grove Heights Painting Contractor',
    shortTitle: 'Inver Grove Heights',
    eyebrow: 'Home base / Dakota County',
    headline: 'Owner-operated painting based in Inver Grove Heights, built for homes, properties, and facility work.',
    description:
      'Sky’s the Limit Painting LLC serves Inver Grove Heights with residential painting, commercial repainting, public-sector readiness, and prep-first project communication.',
    metaTitle: 'Inver Grove Heights Painting Contractor',
    metaDescription:
      'Owner-operated painting contractor based in Inver Grove Heights, MN for residential painting, commercial repainting, and qualified facility opportunities.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Local authority',
    market: 'Residential',
    proof: ['Based in Inver Grove Heights', 'Owner-led project communication', 'Residential, commercial, and facility-ready scope'],
    scope: ['Interior repainting', 'Exterior refreshes', 'Commercial interior work', 'Facility painting inquiries', 'Pavement-marking and striping conversations'],
    process: [
      { title: 'Local Scope Review', body: 'Clarify surfaces, access, project timing, and the finish standard before a recommendation is made.' },
      { title: 'Prep-Led Estimate', body: 'Treat patching, sanding, masking, caulking, and protection as the foundation of the estimate.' },
      { title: 'Owner Follow-Through', body: 'Keep the project tied to Anthony’s direct communication, photos, and jobsite accountability.' },
    ],
    related: ['residential', 'commercial', 'public-sector', 'south-st-paul'],
    neighborhoods: ['Argenta Hills', 'South Grove', 'Cahill Avenue', 'Babcock Avenue', 'Concord Boulevard'],
  },
  {
    kind: 'area',
    slug: 'south-st-paul',
    title: 'South St. Paul Painting Contractor',
    shortTitle: 'South St. Paul',
    eyebrow: 'South metro painting',
    headline: 'Careful painting for South St. Paul homes, shops, rentals, and small facilities.',
    description:
      'Residential and commercial painting support near South St. Paul with clear scope, careful protection, surface prep, and owner-operated communication.',
    metaTitle: 'South St. Paul Painting Contractor',
    metaDescription:
      'Painting contractor near South St. Paul for residential interiors, exterior refreshes, commercial repainting, and facility painting inquiries.',
    image: '/brand/generated/sky-service-proof.webp',
    accent: 'South metro coverage',
    market: 'Residential',
    proof: ['Nearby Inver Grove Heights base', 'Clean prep and protection', 'Commercial and residential scope paths'],
    scope: ['Interior walls and ceilings', 'Trim, doors, and detail painting', 'Small commercial refreshes', 'Rental turnover painting', 'Exterior painting conversations'],
    process: [
      { title: 'Walk The Project', body: 'Confirm the room, building, surface, access, timing, and prep needs.' },
      { title: 'Protect The Space', body: 'Cover floors, fixtures, and adjacent surfaces before coating work starts.' },
      { title: 'Close Cleanly', body: 'Review touchups, cleanup, and next-step documentation before the job wraps.' },
    ],
    related: ['inver-grove-heights', 'st-paul', 'interior-painting', 'commercial-painting'],
    neighborhoods: ['Riverview', 'Kaposia', 'Southview', 'Grand Avenue'],
  },
  {
    kind: 'area',
    slug: 'st-paul',
    title: 'St. Paul Painting Contractor',
    shortTitle: 'St. Paul',
    eyebrow: 'Twin Cities east metro',
    headline: 'Structured painting support for St. Paul homes, storefronts, offices, and property refreshes.',
    description:
      'Sky’s the Limit Painting LLC supports St. Paul painting inquiries with owner-led scoping, careful prep, and service paths for homes and commercial properties.',
    metaTitle: 'St. Paul Painting Contractor',
    metaDescription:
      'St. Paul painting contractor for interior painting, commercial refreshes, exterior painting conversations, and prep-first project scopes.',
    image: '/brand/generated/sky-commercial-authority.webp',
    accent: 'City property focus',
    market: 'Commercial',
    proof: ['Commercial presentation mindset', 'Residential detail standards', 'Remote photo estimate reviews'],
    scope: ['Storefront repainting', 'Office interiors', 'Residential rooms and trim', 'Occupied-space planning', 'Facility painting conversations'],
    process: [
      { title: 'Clarify Access', body: 'Identify occupied-space concerns, parking, tenant timing, and surfaces before scheduling.' },
      { title: 'Stage With Control', body: 'Plan protection, masking, materials, and cleanup around the way the property is used.' },
      { title: 'Document The Result', body: 'Capture closeout notes and photos so the finished work has a usable record.' },
    ],
    related: ['commercial-painting', 'interior-painting', 'south-st-paul', 'twin-cities'],
    neighborhoods: ['Macalester-Groveland', 'Highland Park', 'Summit Hill', 'Crocus Hill', 'Como Park'],
  },
  {
    kind: 'area',
    slug: 'eagan',
    title: 'Eagan Painting Contractor',
    shortTitle: 'Eagan',
    eyebrow: 'Dakota County homes and properties',
    headline: 'Prep-first painting for Eagan homeowners, property managers, and commercial spaces.',
    description:
      'Painting services near Eagan focused on careful prep, protected spaces, organized scheduling, and a clean finish for residential and commercial work.',
    metaTitle: 'Eagan Painting Contractor',
    metaDescription:
      'Eagan painting contractor for residential painting, commercial interiors, exterior refreshes, and owner-operated project communication.',
    image: '/brand/generated/sky-residential-authority.webp',
    accent: 'Dakota County finish work',
    market: 'Residential',
    proof: ['Clean residential protection', 'Commercial scheduling awareness', 'Owner-operated communication'],
    scope: ['Bedroom and living-area repainting', 'Trim and door painting', 'Commercial interiors', 'Exterior refresh planning', 'Paint-ready drywall repair'],
    process: [
      { title: 'Define The Finish', body: 'Match scope, sheen, prep, timing, and expectations before the estimate is finalized.' },
      { title: 'Prep Before Paint', body: 'Patch, sand, mask, caulk, cover, and prime where the surface requires it.' },
      { title: 'Walk The Work', body: 'Review the project together and handle closeout details before calling it done.' },
    ],
    related: ['residential', 'interior-painting', 'drywall-repair', 'woodbury'],
    neighborhoods: ['Diffley', 'Wescott', 'Yankee Doodle', 'Pilgrim', 'Lexington'],
  },
  {
    kind: 'area',
    slug: 'woodbury',
    title: 'Woodbury Painting Contractor',
    shortTitle: 'Woodbury',
    eyebrow: 'East metro painting',
    headline: 'Clean residential and commercial painting for Woodbury projects that need a sharper finish.',
    description:
      'Sky’s the Limit Painting LLC supports Woodbury painting inquiries with detailed prep, owner communication, and estimate paths for homes and properties.',
    metaTitle: 'Woodbury Painting Contractor',
    metaDescription:
      'Woodbury painting contractor for residential painting, commercial refreshes, trim work, exterior painting conversations, and project scoping.',
    image: '/brand/generated/sky-residential-authority.webp',
    accent: 'East metro detail',
    market: 'Residential',
    proof: ['Residential detail mindset', 'Property-refresh capability', 'Clear estimate intake'],
    scope: ['Interior repainting', 'Trim and doors', 'Commercial touchups and refreshes', 'Exterior surface review', 'Deck and fence staining inquiries'],
    process: [
      { title: 'Review The Space', body: 'Document rooms, surfaces, damage, colors, access, and timing.' },
      { title: 'Plan Protection', body: 'Prepare a clean work path that respects floors, fixtures, furniture, and active spaces.' },
      { title: 'Finish With Accountability', body: 'Tie the final walkthrough to visible touchups, cleanup, and owner-led follow-through.' },
    ],
    related: ['eagan', 'deck-fence-staining', 'residential', 'exterior-painting'],
    neighborhoods: ['Stonemill Farms', 'Colby Lake', 'Powers Lake', 'Bailey Lake', 'Wedgwood'],
  },
  {
    kind: 'area',
    slug: 'minneapolis',
    title: 'Minneapolis Painting Contractor',
    shortTitle: 'Minneapolis',
    eyebrow: 'Metro commercial and residential',
    headline: 'A serious painting partner for Minneapolis homes, commercial interiors, and facility refreshes.',
    description:
      'Minneapolis painting inquiries can be scoped for residential interiors, commercial presentation work, facility surfaces, and prep-heavy repainting.',
    metaTitle: 'Minneapolis Painting Contractor',
    metaDescription:
      'Minneapolis painting contractor for commercial painting, residential interiors, facility refreshes, and prep-first repainting conversations.',
    image: '/brand/generated/sky-commercial-authority.webp',
    accent: 'Metro project readiness',
    market: 'Commercial',
    proof: ['Commercial presentation focus', 'Residential finish discipline', 'Documentation-minded estimates'],
    scope: ['Commercial interiors', 'Office and retail repainting', 'Residential rooms and trim', 'Facility refreshes', 'Remote visual scoping'],
    process: [
      { title: 'Tailor The Scope', body: 'Customize each proposal to match the exact needs of homeowners, property managers, or facility departments.' },
      { title: 'Confirm Constraints', body: 'Plan for access, schedules, cleanup, surface prep, and work around occupied spaces.' },
      { title: 'Deliver A Record', body: 'Use notes and photos to keep the job accountable after the first conversation.' },
    ],
    related: ['commercial-painting', 'pavement-marking', 'twin-cities', 'st-paul'],
    neighborhoods: ['Linden Hills', 'North Loop', 'Uptown', 'Downtown', 'Northeast'],
  },
  {
    kind: 'area',
    slug: 'twin-cities',
    title: 'Twin Cities Painting Contractor',
    shortTitle: 'Twin Cities',
    eyebrow: 'Regional painting coverage',
    headline: 'Residential detail, commercial discipline, and public-sector readiness across the Twin Cities.',
    description:
      'Sky’s the Limit Painting LLC serves Twin Cities painting inquiries with market-specific paths for homeowners, businesses, facilities, and qualified opportunities.',
    metaTitle: 'Twin Cities Painting Contractor',
    metaDescription:
      'Twin Cities painting contractor for residential painting, commercial repainting, facility work, pavement marking, and project scoping.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Twin Cities coverage',
    market: 'Public Sector',
    proof: ['Complete three-sector capability', 'Streamlined digital estimations', 'Owner-operated follow-through'],
    scope: ['Residential painting', 'Commercial painting', 'Public-sector readiness', 'Pavement marking conversations', 'Facility repainting'],
    process: [
      { title: 'Assess Coating Needs', body: 'Analyze project specifications for residential, commercial, or public facility upgrades to determine the optimal products and prep.' },
      { title: 'Verify Details', body: 'Evaluate surface conditions, square footage, specific timelines, and your preferred access methods.' },
      { title: 'Deliver Proposals', body: 'Provide highly itemized estimates specifying exact preparation methods, paint specs, and linear measurements.' },
    ],
    related: ['residential', 'commercial', 'pavement-marking', 'inver-grove-heights'],
  },
];

export const serviceLandingPages: LandingPage[] = [
  {
    kind: 'service',
    slug: 'interior-painting',
    title: 'Interior Painting',
    shortTitle: 'Interior Painting',
    eyebrow: 'Walls / ceilings / trim',
    headline: 'Interior painting with careful prep, cleaner lines, and respect for the space.',
    description:
      'Interior painting for bedrooms, living spaces, trim, doors, ceilings, and commercial rooms where protection and finish quality matter.',
    metaTitle: 'Interior Painters in Twin Cities',
    metaDescription:
      'Interior painting for Twin Cities homes and properties with clean prep, careful masking, trim detail, owner communication, and final walkthroughs.',
    image: '/brand/generated/sky-residential-authority.webp',
    accent: 'Clean indoor finish',
    market: 'Residential',
    proof: ['Walls, ceilings, trim, and doors', 'Protection-first prep', 'Final walkthrough mindset'],
    scope: ['Room repainting', 'Ceiling repainting', 'Trim and doors', 'Patch and prime areas', 'Occupied home protection'],
    process: [
      { title: 'Protect', body: 'Cover floors, furniture, fixtures, and paths before tools and paint move through the space.' },
      { title: 'Prepare', body: 'Patch, sand, caulk, mask, spot-prime, and solve visible surface issues.' },
      { title: 'Finish', body: 'Apply clean coats, review lines and coverage, then handle touchups and cleanup.' },
    ],
    related: ['residential', 'drywall-repair', 'inver-grove-heights', 'eagan'],
  },
  {
    kind: 'service',
    slug: 'exterior-painting',
    title: 'Exterior Painting',
    shortTitle: 'Exterior Painting',
    eyebrow: 'Curb appeal / weathered surfaces',
    headline: 'Exterior painting conversations built around prep, timing, weather, and lasting presentation.',
    description:
      'Exterior painting and refresh inquiries for Minnesota homes and properties, scoped around surface prep, access, weather windows, and curb appeal.',
    metaTitle: 'Exterior Painters in Twin Cities',
    metaDescription:
      'Exterior painting contractor for Twin Cities homes and properties with prep-first scoping, weather-aware scheduling, and owner communication.',
    image: '/brand/generated/sky-service-proof.webp',
    accent: 'Exterior readiness',
    market: 'Residential',
    proof: ['Prep-first exterior review', 'Weather-aware scheduling', 'Curb-appeal presentation'],
    scope: ['Siding and trim review', 'Doors and detail areas', 'Peeling or worn surfaces', 'Caulking and patch planning', 'Exterior color refreshes'],
    process: [
      { title: 'Inspect', body: 'Review surface condition, access, peeling, moisture concerns, prep needs, and timing.' },
      { title: 'Prepare', body: 'Plan cleaning, scraping, sanding, caulking, masking, and priming where needed.' },
      { title: 'Coat', body: 'Apply the right approach for the surface and close with a visible review.' },
    ],
    related: ['residential', 'woodbury', 'deck-fence-staining', 'twin-cities'],
  },
  {
    kind: 'service',
    slug: 'commercial-painting',
    title: 'Commercial Painting',
    shortTitle: 'Commercial Painting',
    eyebrow: 'Shops / offices / properties',
    headline: 'Commercial painting for spaces where presentation, schedule, and cleanup matter.',
    description:
      'Commercial painting for Twin Cities shops, offices, facilities, storefronts, workrooms, and occupied spaces that need reliable communication.',
    metaTitle: 'Commercial Painters in Twin Cities',
    metaDescription:
      'Commercial painting for Twin Cities shops, offices, facilities, and properties with organized scope, clean execution, and owner-led follow-through.',
    image: '/brand/generated/sky-commercial-authority.webp',
    accent: 'Property presentation',
    market: 'Commercial',
    proof: ['Retail and office presentation', 'Occupied-space awareness', 'Schedule-aware communication'],
    scope: ['Commercial interiors', 'Customer-facing spaces', 'Back-of-house rooms', 'Facility refreshes', 'Touchup and repaint planning'],
    process: [
      { title: 'Plan Access', body: 'Clarify business hours, occupied areas, fixtures, traffic paths, and staging constraints.' },
      { title: 'Protect Operations', body: 'Mask and cover adjacent surfaces while keeping the work area orderly.' },
      { title: 'Close Professionally', body: 'Review the result, handle touchups, and leave a cleaner property presentation.' },
    ],
    related: ['commercial', 'st-paul', 'minneapolis', 'public-sector'],
  },
  {
    kind: 'service',
    slug: 'cabinet-painting',
    title: 'Cabinet Painting',
    shortTitle: 'Cabinet Painting',
    eyebrow: 'Detail finish inquiries',
    headline: 'Cabinet painting inquiries scoped around prep, adhesion, finish expectations, and durability.',
    description:
      'Cabinet painting conversations for homeowners who want a cleaner finish path with surface prep, masking, product selection, and clear expectations.',
    metaTitle: 'Cabinet Painting in the Twin Cities',
    metaDescription:
      'Cabinet painting inquiry path for Twin Cities homeowners, with prep-first scoping around adhesion, masking, finish expectations, and durability.',
    image: '/brand/generated/sky-residential-authority.webp',
    accent: 'Detail finish planning',
    market: 'Residential',
    proof: ['Adhesion and prep conversation', 'Masking and protection planning', 'Finish expectation review'],
    scope: ['Kitchen cabinet repaint inquiries', 'Vanity painting conversations', 'Door and drawer prep', 'Primer and coating discussion', 'Visual surface review'],
    process: [
      { title: 'Review Photos', body: 'Start with cabinet photos, material notes, condition, hardware, and desired finish.' },
      { title: 'Define Prep', body: 'Discuss cleaning, sanding, adhesion primer, masking, and drying or cure expectations.' },
      { title: 'Scope Honestly', body: 'Confirm whether the project is a fit before promising a cabinet finish.' },
    ],
    related: ['residential', 'interior-painting', 'woodbury', 'eagan'],
  },
  {
    kind: 'service',
    slug: 'drywall-repair',
    title: 'Paint-Ready Drywall Repair',
    shortTitle: 'Drywall Repair',
    eyebrow: 'Patch / prime / finish',
    headline: 'Paint-ready drywall repair for projects where the finish depends on the prep.',
    description:
      'Paint-ready drywall repair and surface prep conversations for holes, dents, stains, patches, and problem areas before repainting.',
    metaTitle: 'Paint-Ready Drywall Repair',
    metaDescription:
      'Paint-ready drywall repair for Twin Cities repainting projects, including patching, sanding, stain-blocking primer, and finish preparation.',
    image: '/brand/generated/sky-service-proof.webp',
    accent: 'Prep before finish',
    market: 'Residential',
    proof: ['Patch and prime methods', 'Surface prep tied to paint quality', 'Visual scoping available'],
    scope: ['Small wall repairs', 'Dents and holes', 'Stain-blocking primer', 'Texture review', 'Paint-ready patching'],
    process: [
      { title: 'Identify Damage', body: 'Collect photos, location, size, surface type, and whether texture matching is required.' },
      { title: 'Prep The Surface', body: 'Patch, sand, prime, and prepare the area for a cleaner paint finish.' },
      { title: 'Finish The Room', body: 'Tie repair work into the repaint scope so the wall does not look patched and forgotten.' },
    ],
    related: ['interior-painting', 'residential', 'eagan', 'south-st-paul'],
  },
  {
    kind: 'service',
    slug: 'deck-fence-staining',
    title: 'Deck and Fence Staining',
    shortTitle: 'Deck / Fence Staining',
    eyebrow: 'Exterior wood inquiries',
    headline: 'Deck and fence staining conversations built around condition, cleaning, prep, and weather.',
    description:
      'Deck and fence staining inquiries for Twin Cities homeowners who need exterior wood reviewed for prep, timing, coating approach, and finish goals.',
    metaTitle: 'Deck and Fence Staining Painting',
    metaDescription:
      'Deck and fence staining inquiry path for Twin Cities homeowners, with condition review, prep planning, weather timing, and finish expectations.',
    image: '/brand/generated/sky-service-proof.webp',
    accent: 'Exterior wood scope',
    market: 'Residential',
    proof: ['Condition review first', 'Weather-aware scheduling', 'Prep and coating conversation'],
    scope: ['Fence staining inquiries', 'Deck staining conversations', 'Cleaning and prep review', 'Weathered wood evaluation', 'Exterior finish planning'],
    process: [
      { title: 'Check Condition', body: 'Review age, previous coating, weathering, access, and photos before estimating.' },
      { title: 'Plan Prep', body: 'Discuss cleaning, drying, sanding, masking, and product fit.' },
      { title: 'Time The Work', body: 'Schedule around Minnesota weather and realistic dry-time expectations.' },
    ],
    related: ['exterior-painting', 'woodbury', 'residential', 'twin-cities'],
  },
  {
    kind: 'service',
    slug: 'parking-lot-striping',
    title: 'Parking Lot Striping',
    shortTitle: 'Parking Lot Striping',
    eyebrow: 'Lines / flow / first impression',
    headline: 'Parking lot striping for clearer traffic flow, cleaner presentation, and stronger property arrival.',
    description:
      'Parking lot striping inquiries for small lots, commercial properties, facilities, and public-facing spaces that need clearer markings.',
    metaTitle: 'Twin Cities Parking Lot Striping',
    metaDescription:
      'Parking lot striping for Twin Cities properties, including layout refreshes, visible line markings, and project-specific preparation.',
    image: '/brand/generated/sky-public-authority.webp',
    accent: 'Clearer property flow',
    market: 'Public Sector',
    proof: ['Layout and visibility focus', 'Commercial property presentation', 'Public-facing surface readiness'],
    scope: ['Parking stall lines', 'Directional markings', 'Small-lot refreshes', 'Facility lots', 'Property arrival improvements'],
    process: [
      { title: 'Assess The Lot', body: 'Review existing markings, pavement condition, traffic flow, and layout needs.' },
      { title: 'Prepare The Surface', body: 'Plan cleaning, debris removal, chalk lines, and access timing.' },
      { title: 'Stripe For Clarity', body: 'Focus on visibility, flow, property presentation, and closeout photos.' },
    ],
    related: ['commercial-painting', 'pavement-marking', 'public-sector', 'twin-cities'],
  },
  {
    kind: 'service',
    slug: 'pavement-marking',
    title: 'Pavement Marking',
    shortTitle: 'Pavement Marking',
    eyebrow: 'Safety / visibility / infrastructure',
    headline: 'Pavement marking inquiries for properties and qualified opportunities that need clear surface communication.',
    description:
      'Pavement marking and surface-visibility inquiries for commercial properties, facilities, parking areas, and qualified public-sector opportunities.',
    metaTitle: 'Twin Cities Pavement Marking',
    metaDescription:
      'Pavement marking for Twin Cities properties with preparation-first planning, clear layouts, and owner-led commercial coordination.',
    image: '/brand/generated/sky-public-authority.webp',
    accent: 'Surface visibility',
    market: 'Public Sector',
    proof: ['Documentation-minded scope', 'Commercial and facility fit', 'Public-sector readiness language'],
    scope: ['Safety markings', 'Parking lot markings', 'Traffic-flow markings', 'Facility surface markings', 'Qualified opportunity review'],
    process: [
      { title: 'Document Need', body: 'Collect location, photos, current markings, dimensions, access, and timing requirements.' },
      { title: 'Plan Execution', body: 'Clarify layout, surface condition, cleaning needs, materials, and work windows.' },
      { title: 'Close With Proof', body: 'Use photos and notes to record the completed surface work.' },
    ],
    related: ['parking-lot-striping', 'commercial-painting', 'public-sector', 'minneapolis'],
  },
];

export const landingPages = [...areaLandingPages, ...serviceLandingPages];

export function landingPagePath(page: LandingPage) {
  return page.kind === 'area' ? `/service-areas/${page.slug}` : `/painting-services/${page.slug}`;
}

export function landingPageByKindAndSlug(kind: LandingPageKind, slug?: string) {
  if (!slug) {
    return undefined;
  }

  const collection = kind === 'area' ? areaLandingPages : serviceLandingPages;
  return collection.find((page) => page.slug === slug);
}

export function landingPageBySlug(slug: string) {
  return landingPages.find((page) => page.slug === slug);
}
