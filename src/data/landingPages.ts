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
  customSections?: LandingPageCustomSection[];
  faq?: LandingPageFaq[];
}

export interface LandingPageLink {
  text: string;
  href: string;
}

export interface LandingPageCustomSection {
  heading: string;
  eyebrow?: string;
  body: string[];
  links?: LandingPageLink[];
}

export interface LandingPageFaq {
  question: string;
  answer: string;
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
    customSections: [
      {
        heading: 'Parking Lot Striping in Inver Grove Heights',
        eyebrow: 'The lot',
        body: [
          'We run a pavement-marking operation right from our home base in Inver Grove Heights: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, and crosswalks. Free walkthrough, written quote, and one crew that can take the building and the lot in the same visit.',
        ],
        links: [
          { text: 'parking lot striping in Inver Grove Heights', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Inver Grove Heights', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
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
    customSections: [
      {
        heading: 'Parking Lot Striping in South St. Paul',
        eyebrow: 'The lot',
        body: [
          'South St. Paul commercial and industrial lots get the full operation: re-stripes, ADA stalls and access aisles, fire lanes, and directional markings. Free lot walkthrough, written number, and striping scheduled around your traffic.',
        ],
        links: [
          { text: 'parking lot striping in South St. Paul', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in South St. Paul', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
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
    customSections: [
      {
        heading: 'Parking Lot Striping in St. Paul',
        eyebrow: 'The lot',
        body: [
          'St. Paul commercial properties, offices, and retail lots get the same striping operation we run across the metro: re-stripes, ADA-compliant layouts, fire lanes, arrows, and crosswalks. Free walkthrough, written quote, and evenings-and-weekends scheduling where access allows.',
        ],
        links: [
          { text: 'parking lot striping in St. Paul', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in St. Paul', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
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
    customSections: [
      {
        heading: 'Parking Lot Striping in Eagan',
        eyebrow: 'The lot',
        body: [
          'Eagan’s corporate and retail corridors need striping that keeps up with heavy traffic and hard winters. We re-stripe stalls, ADA layouts, fire lanes, and crosswalks — free walkthrough, written quote, one crew for the building and the lot.',
        ],
        links: [
          { text: 'parking lot striping in Eagan', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Eagan', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
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
    customSections: [
      {
        heading: 'Parking Lot Striping in Woodbury',
        eyebrow: 'The lot',
        body: [
          'Woodbury retail and office lots restripe on a cycle — plows and traffic wear the lines down every winter. We handle re-stripes, ADA stalls and access aisles, and full new-lot layouts. Free walkthrough and a written number before any work starts.',
        ],
        links: [
          { text: 'parking lot striping in Woodbury', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Woodbury', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
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
    customSections: [
      {
        heading: 'Parking Lot Striping in Minneapolis',
        eyebrow: 'The lot',
        body: [
          'Minneapolis commercial lots take the heaviest traffic in the metro — and the hardest winters. We re-stripe stalls, ADA-compliant layouts, fire lanes, and crosswalks, scheduled around your lot’s low-traffic hours. Free walkthrough, written quote.',
        ],
        links: [
          { text: 'parking lot striping in Minneapolis', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Minneapolis', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
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
    metaTitle: 'Where We Paint: Twin Cities Metro',
    metaDescription:
      'Where we paint: Minneapolis–St. Paul and surrounding suburbs — homes, commercial, pavement marking. Free estimates.',
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
    customSections: [
      {
        heading: 'Parking Lot Striping Across the Twin Cities',
        eyebrow: 'The lot',
        body: [
          'Every suburb page on this site feeds the same striping operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, and crosswalks across the Minneapolis–St. Paul metro. One crew, one schedule, and a free walkthrough before anything is quoted.',
        ],
        links: [
          { text: 'parking lot striping in the Twin Cities', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in the Twin Cities', href: '/painting-services/pavement-marking' },
        ],
      },
    ],
  },
  {
    kind: 'area',
    slug: 'bloomington',
    title: 'Bloomington Painting Contractor',
    shortTitle: 'Bloomington',
    eyebrow: 'South metro / 494-35W corridor',
    headline: 'Owner-operated painting in Bloomington — homes, businesses, and the lots they sit on.',
    description:
      'Sky’s the Limit Painting LLC serves Bloomington with residential painting, commercial painting, and parking lot striping. Based in Inver Grove Heights, working the whole south metro.',
    metaTitle: 'Bloomington Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Bloomington, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'South metro local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Bloomington',
      'Owner-led project communication',
      'Residential, commercial, and striping under one crew',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Interior repainting',
      'Exterior repaints',
      'Cabinet refinishing',
      'Commercial interiors and exteriors',
      'Parking lot striping and ADA stalls',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us what you are looking at — house, office, parking lot — and where in Bloomington it is.' },
      { title: 'Walkthrough', body: 'We come to you, measure, and note the prep the job actually needs.' },
      { title: 'Written Quote', body: 'One number, line-itemed. You know exactly what is covered before we start.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['eagan', 'edina', 'inver-grove-heights', 'parking-lot-striping'],
    customSections: [
      {
        heading: 'Painting Contractor in Bloomington, MN',
        eyebrow: 'Why Bloomington',
        body: [
          'Sky’s the Limit Painting serves Bloomington neighborhoods and the 494/35W corridor with residential painting, commercial painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'Bloomington has a little of everything: single-family homes that need fresh exteriors after a few hard Minnesota winters, a heavy retail/office/hospitality corridor along 494 that needs to look sharp for tenants and customers, and parking lots that take a real beating from snowplows all winter. Faded, plow-chewed striping is a liability problem in a high-traffic corridor lot, not a cosmetic one — and we can fix the building and the lot under one contract.',
          'Call or text 651-410-4196 for a free estimate. We will come out, walk the job with you, and give you a straight number.',
        ],
      },
      {
        heading: 'Residential Painting in Bloomington',
        eyebrow: 'Homes',
        body: [
          'Most of our Bloomington residential work falls into three buckets. Exterior repaints — siding, trim, soffits, and decks — prepped the way Minnesota weather demands: scrape, prime, caulk, then topcoat with exterior-grade paint built for freeze-thaw cycles.',
          'Interior repaints run year-round: whole homes, single rooms, and basements. Winter is our busiest interior season in the Twin Cities, and we schedule around your household, not the other way around.',
          'Cabinet painting is the full kitchen refinish without the full remodel price. We spray-shop the doors and drawers for a factory-smooth finish and finish the boxes in place.',
          'Every residential job starts with a walkthrough and a written quote — what is included, what is prepped, what paint goes where. No allowance-line games.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting for Bloomington Businesses',
        eyebrow: 'Businesses',
        body: [
          'Bloomington’s retail, office, and hospitality corridors along 494 need painters who do not shut down business to do the work. We paint after hours and on weekends, keep common areas clean and signed off, and coordinate with your property manager or GC so the job never touches operating hours.',
          'We handle office build-outs and refreshes, retail fronts and common areas, and multi-tenant properties where consistency across units matters. If you are a property manager comparing bids, ask us about phased scheduling — we can work floor by floor or suite by suite so tenants stay put.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Bloomington',
        eyebrow: 'The lot',
        body: [
          'We are a painting contractor in the south metro that also runs a pavement-marking operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, crosswalks, and full new-lot layouts. In Bloomington that matters — retail and office lots take a beating from snowplows every winter, and faded lines are a liability problem, not just a cosmetic one.',
          'We do the same free walkthrough on lots that we do on buildings: measure the stalls, check your ADA layout against the current configuration, and give you a written number for the work. If the same property also needs the building painted, one crew schedules both — no coordinating a painter and a striping company separately.',
        ],
        links: [
          { text: 'parking lot striping in Bloomington', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Bloomington', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How a Bloomington Project Runs',
        eyebrow: 'Process',
        body: [
          'First, call or text 651-410-4196 and tell us what you are looking at — house, office, parking lot. Then we walk it: measure, note the prep the job actually needs, and flag anything you should know before money moves. You get a written quote — one number, line-itemed. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repairs, carpentry touch-ups, and deck or fence staining can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why Bloomington Homeowners and Property Managers Call Us',
        eyebrow: 'Why us',
        body: [
          'One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, no surprises. Local: based in Inver Grove Heights, we are across the metro in minutes, not a dispatch center three states away. And the person you talk to is the person accountable for the work.',
        ],
      },
      {
        heading: 'Serving Bloomington and the South Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Bloomington and the surrounding south-metro suburbs — Eagan, Edina, Richfield, Burnsville, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Eagan', href: '/service-areas/eagan' },
          { text: 'painting contractor in Edina', href: '/service-areas/edina' },
        ],
      },
    ],
    faq: [
      {
        question: 'Do you paint exteriors in Bloomington during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall, and we book the season early. Interior work, cabinets, and commercial interiors run year-round, including winter.',
      },
      {
        question: 'Can you stripe our parking lot and paint the building on one contract?',
        answer: 'Yes — that is the advantage of hiring us. One walkthrough, one written quote, one schedule for both the building and the lot.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'Do you do after-hours work for businesses?',
        answer: 'Tell us your operating hours at the walkthrough — we build retail, office, and hospitality work around them so your operation never stops, and the schedule goes in the written scope.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'eden-prairie',
    title: 'Eden Prairie Painting Contractor',
    shortTitle: 'Eden Prairie',
    eyebrow: 'West metro / corporate corridor',
    headline: 'Commercial-grade painting for Eden Prairie offices, business parks, and family homes.',
    description:
      'Sky’s the Limit Painting LLC serves Eden Prairie with commercial painting, parking lot striping, and residential painting. After-hours scheduling, phased multi-tenant work, and one crew for the building and the lot.',
    metaTitle: 'Eden Prairie Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Eden Prairie, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'West metro local',
    market: 'Commercial',
    proof: [
      'Based in Inver Grove Heights, serving Eden Prairie',
      'Owner-led project communication',
      'After-hours and weekend commercial scheduling',
      'Building and lot under one contract',
    ],
    scope: [
      'Commercial interiors and exteriors',
      'Multi-tenant phased painting',
      'Parking lot striping and ADA stalls',
      'Interior repainting',
      'Exterior refreshes and cabinet refinishing',
    ],
    process: [
      { title: 'Scope Review', body: 'Walk the property, record surfaces, access windows, tenant constraints, and the finish standard.' },
      { title: 'Written Quote', body: 'One number, line-itemed — including schedule windows that fit your operations.' },
      { title: 'Scheduled Work', body: 'Nights, weekends, or phased across suites — the building keeps running while we paint.' },
      { title: 'Closeout', body: 'Walk the work with you, clean the site, and confirm the details against the written scope.' },
    ],
    related: ['edina', 'bloomington', 'minneapolis', 'parking-lot-striping'],
    customSections: [
      {
        heading: 'Painting Contractor in Eden Prairie, MN',
        eyebrow: 'Why Eden Prairie',
        body: [
          'Sky’s the Limit Painting serves Eden Prairie neighborhoods and the 494/169 corridor with commercial painting, parking lot striping, and residential painting. We are a local, owner-run crew, and this page reads the way we actually work here: written for the facilities manager and the property manager first, the homeowner second.',
          'Eden Prairie is where the Twin Cities’ corporate corridor lives — business parks, corporate offices, and retail centers that need painters who plan like contractors, not handymen. After-hours and weekend scheduling is the default here, not the exception. Multi-tenant properties get phased work: floor by floor or suite by suite, so tenants stay put and operations never stop.',
          'And when the same property needs its lot re-striped, one crew does both. Tell us your operating hours at the walkthrough and we build the schedule around them — in writing.',
        ],
      },
      {
        heading: 'Residential Painting in Eden Prairie',
        eyebrow: 'Homes',
        body: [
          'Eden Prairie homes skew newer and larger, and the work follows: family-home repaints, exterior refreshes on two-story elevations, and cabinet refinishing as the remodel alternative. We prep for Minnesota weather on exteriors — scrape, prime, caulk, topcoat with exterior-grade paint built for freeze-thaw cycles.',
          'Interiors run year-round, scheduled around your household. Every residential job starts with a walkthrough and a written quote: what is included, what is prepped, what paint goes where.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting for Eden Prairie Businesses',
        eyebrow: 'Businesses',
        body: [
          'Office parks, corporate campuses, and retail corridors need painting scoped around operations, not the other way around. We schedule nights and weekends, stage cleanly, protect fixtures and common areas, and close out with the property manager — not a subcontractor you have never met.',
          'We handle office build-outs and refreshes, retail fronts and common areas, and multi-tenant properties where consistency across units matters. Phased scheduling keeps tenants in place while the work moves through the building.',
          'Property managers comparing bids should ask about our written-scope discipline: the schedule, the access windows, and the exact finish standard all land in the quote before we start.',
          'If your portfolio includes Eden Prairie offices plus retail or industrial elsewhere in the metro, we can scope multiple properties in one pass and sequence the work across them — one point of contact, one set of closeouts.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Eden Prairie',
        eyebrow: 'The lot',
        body: [
          'Corporate and retail lots in Eden Prairie restripe on a cycle — plows, salt, and traffic wear lines down every winter. We run the full operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, crosswalks, and new-lot layouts chalked from your site plan.',
          'The walkthrough is free: we measure the stalls, check your ADA layout against the current configuration, and give you a written number. One crew can schedule the building and the lot together — no coordinating a painter and a striping company separately.',
        ],
        links: [
          { text: 'parking lot striping in Eden Prairie', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Eden Prairie', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How an Eden Prairie Project Runs',
        eyebrow: 'Process',
        body: [
          'Call or text 651-410-4196 with the property and the scope you are thinking about. We walk it — buildings and lots alike — and give you a written, itemized quote with the schedule baked in. We show up when we said, keep the site clean, and close out with a walkthrough against the written scope.',
          'Drywall repairs, touch-ups, and deck or fence staining can fold into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why Eden Prairie Property Managers and Homeowners Call Us',
        eyebrow: 'Why us',
        body: [
          'One crew, building and lot: commercial painting and striping under one contract. Operations-first scheduling — nights, weekends, phased suites — in writing before we start. Straight quotes: written, itemized, no surprises. Local and owner-run: the person you talk to is accountable for the work, not a dispatcher.',
        ],
      },
      {
        heading: 'Serving Eden Prairie and the West Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Eden Prairie and the west metro — Edina, Minnetonka, Bloomington, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Edina', href: '/service-areas/edina' },
          { text: 'painting contractor in Bloomington', href: '/service-areas/bloomington' },
        ],
      },
    ],
    faq: [
      {
        question: 'Can you paint our offices without disrupting business hours?',
        answer: 'Yes — most Eden Prairie commercial work is scheduled nights and weekends. Phased work across floors or suites keeps tenants and staff in place while the job moves through the building.',
      },
      {
        question: 'Do you stripe parking lots for office parks?',
        answer: 'Yes. We re-stripe office-park lots, check ADA stall and access-aisle layouts on the walkthrough, and handle fire lanes, arrows, and crosswalks in the same visit.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'What goes into the written quote?',
        answer: 'The scope, the prep, the schedule windows, and the finish standard — line-itemed, so you can compare bids on what is actually included instead of guessing.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'edina',
    title: 'Edina Painting Contractor',
    shortTitle: 'Edina',
    eyebrow: 'West metro / finish-quality market',
    headline: 'Finish-quality painting for Edina homes — whole-home repaints, exteriors, and cabinet refinishing.',
    description:
      'Sky’s the Limit Painting LLC serves Edina with whole-home repaints, exterior refreshes, cabinet refinishing, and commercial painting. Spray-shop cabinet doors, careful prep on mature exteriors, and written quotes that itemize what matters on a high-end job.',
    metaTitle: 'Edina Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Edina, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'West metro local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Edina',
      'Owner-led project communication',
      'Finish-quality positioning: spray-shop cabinet doors',
      'Written, itemized quotes on every job',
    ],
    scope: [
      'Whole-home repaints',
      'Exterior refreshes',
      'Cabinet refinishing',
      'Interior room repaints',
      'Small-office and retail refreshes',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us about the home or project — whole-home, exterior, kitchen — and what you want it to look like.' },
      { title: 'Walkthrough', body: 'We walk the property, record surfaces, prep needs, and the finish standard you expect.' },
      { title: 'Written Quote', body: 'One number, line-itemed — including exactly what prep goes into each surface.' },
      { title: 'Scheduled Work', body: 'Clean staging, careful protection, and a walkthrough against the written scope at the end.' },
    ],
    related: ['bloomington', 'eden-prairie', 'minneapolis', 'cabinet-painting'],
    customSections: [
      {
        heading: 'Painting Contractor in Edina, MN',
        eyebrow: 'Why Edina',
        body: [
          'Sky’s the Limit Painting serves Edina neighborhoods with residential painting — whole-home repaints, exterior refreshes, and cabinet refinishing — plus commercial painting and parking lot striping. We are a local, owner-run crew, and the work we do in Edina is finish-quality work: the prep shows in the final coat.',
          'Edina’s housing stock rewards care. Mature exteriors need proper scraping, priming, and caulking before a topcoat earns its keep through another decade of freeze-thaw. Interiors get the protection treatment: floors covered, fixtures masked, and clean lines at every edge. And cabinet refinishing gets spray-shop doors and drawers, so the kitchen reads like a remodel without the remodel price.',
          'Call or text 651-410-4196 for a free estimate. We walk the job with you and give you a straight, written number.',
        ],
      },
      {
        heading: 'Residential Painting in Edina',
        eyebrow: 'Homes',
        body: [
          'Whole-home repaints are the core of our Edina work — interiors room by room and exteriors in season, scoped as one project so the finish is consistent everywhere. Exterior season runs roughly spring through fall; interiors run year-round, scheduled around your household.',
          'Cabinet painting is the detail trade here: doors and drawers finished smooth, boxes done in place, hardware planned before the first coat. If you are comparing refinishing against a full remodel, the walkthrough will give you an honest read on which makes sense.',
          'Every residential job starts with a walkthrough and a written quote — what is included, what is prepped, what paint goes where. On a high-end job the quote itemizes what matters: the prep line is the one that decides how the finish looks in five years.',
          'Whole-home projects get sequenced properly: drywall repair and prep first so every surface is paint-ready, ceilings and walls room by room, trim and doors detailed last. If the exterior is on the plan too, we schedule it in the same season so the whole property finishes together.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting for Edina Businesses',
        eyebrow: 'Businesses',
        body: [
          'Small offices, retail spaces, and professional suites in Edina need the same finish quality as the homes around them. We schedule around operating hours — evenings and weekends when the job calls for it — and keep common areas clean and signed off.',
          'Retail fronts and commercial interiors get careful staging and protection so the business keeps running. Parking lots attached to those properties get re-striped and ADA-checked in the same visit when you want them to — one crew, one schedule.',
          'Small-office refreshes often come with turnover deadlines — lease dates, open houses, tenant move-ins. Tell us the date at the walkthrough and we will give you an honest answer on whether we can hit it, with the schedule written into the quote.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'How an Edina Project Runs',
        eyebrow: 'Process',
        body: [
          'Call or text 651-410-4196 and tell us about the home or the project. We walk it, record the surfaces and the prep they need, and give you a written, itemized quote. Then we show up on the date we said, protect the space like it matters, and walk it with you at the end.',
          'Drywall repairs and carpentry touch-ups can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why Edina Homeowners Call Us',
        eyebrow: 'Why us',
        body: [
          'Finish quality over speed: the prep line in the quote is the one that decides the result. Spray-shop cabinet doors, careful masking, clean edges. Written, itemized quotes — you know exactly what goes into every surface. Local and owner-run: based in Inver Grove Heights, accountable to the person you talked to, not a dispatcher.',
        ],
      },
      {
        heading: 'Serving Edina and the West Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Edina and the west metro — Eden Prairie, Bloomington, Minneapolis, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Eden Prairie', href: '/service-areas/eden-prairie' },
          { text: 'painting contractor in Bloomington', href: '/service-areas/bloomington' },
        ],
      },
    ],
    faq: [
      {
        question: 'Do you do cabinet refinishing in Edina?',
        answer: 'Yes — cabinet painting is core residential work here. Doors and drawers are finished for a smooth, durable surface and the boxes are completed in place, with hardware planned before the first coat.',
      },
      {
        question: 'How do you handle exterior repaints on older Edina homes?',
        answer: 'With prep first: scrape, prime, caulk, then topcoat with exterior-grade paint built for freeze-thaw cycles. The walkthrough records exactly what each surface needs before we quote.',
      },
      {
        question: 'Can you work around our schedule?',
        answer: 'Interiors run year-round and we schedule around your household; commercial work in Edina is usually evenings and weekends so the business keeps running.',
      },
      {
        question: 'What does the written quote include?',
        answer: 'The scope, the prep per surface, the schedule, and the finish standard — line-itemed, so the prep line that decides the result is visible before we start.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'maple-grove',
    title: 'Maple Grove Painting Contractor',
    shortTitle: 'Maple Grove',
    eyebrow: 'Northwest metro / growth corridor',
    headline: 'Responsive painting for Maple Grove — retail fronts, new-tenant build-outs, and family-home repaints.',
    description:
      'Sky’s the Limit Painting LLC serves Maple Grove with commercial painting, parking lot striping, and residential painting. Growth-corridor contractor: responsive scheduling, one call for paint and striping.',
    metaTitle: 'Maple Grove Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Maple Grove, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Northwest metro local',
    market: 'Commercial',
    proof: [
      'Based in Inver Grove Heights, serving Maple Grove',
      'Owner-led project communication',
      'Weekend commercial scheduling so businesses stay open',
      'Building and lot under one contract',
    ],
    scope: [
      'Retail front and commercial refreshes',
      'New-tenant build-outs',
      'Parking lot striping and ADA stalls',
      'Residential repaints',
      'Interior painting and cabinet refinishing',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us about the property — retail space, restaurant, office, or home — and your timeline.' },
      { title: 'Walkthrough', body: 'We walk it, measure, record prep needs, and flag anything that affects the schedule.' },
      { title: 'Written Quote', body: 'One number, line-itemed, with the schedule windows that fit your opening or operating hours.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said and close out with a walkthrough against the written scope.' },
    ],
    related: ['bloomington', 'eden-prairie', 'minneapolis', 'parking-lot-striping'],
    customSections: [
      {
        heading: 'Painting Contractor in Maple Grove, MN',
        eyebrow: 'Why Maple Grove',
        body: [
          'Sky’s the Limit Painting serves Maple Grove neighborhoods and the I-94 corridor with commercial painting, parking lot striping, and residential painting. We are a local, owner-run crew built for the growth-corridor pace: new tenants turning spaces over, retail fronts refreshing on a cycle, and family homes repainting on newer housing stock.',
          'The commercial story here is speed with control. New-tenant build-outs and refreshes need painters who show up, stage cleanly, and hand the space back on schedule — we schedule weekends and off-hours so businesses do not close for a paint job. Retail lots along the corridor restripe on a cycle too, and one crew can take the building and the lot in the same visit.',
          'Call or text 651-410-4196 for a free estimate. Tell us the timeline and we will tell you honestly whether we can hit it.',
        ],
      },
      {
        heading: 'Residential Painting in Maple Grove',
        eyebrow: 'Homes',
        body: [
          'Maple Grove’s housing stock runs newer, and the work follows: repaints on two-story elevations, interior refreshes as families grow into homes, and cabinet refinishing as the kitchen upgrade that costs less than a remodel.',
          'Exterior season runs roughly spring through fall with proper prep for Minnesota weather — scrape, prime, caulk, then topcoat. Interiors run year-round, scheduled around your household. Every residential job starts with a walkthrough and a written quote: what is included, what is prepped, what paint goes where.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting for Maple Grove Businesses',
        eyebrow: 'Businesses',
        body: [
          'Retail fronts, restaurants, and commercial buildings along the main commercial strips need painting that keeps pace with the corridor. We do new-tenant build-outs and refreshes on tight turnarounds, scheduled so the business opens on time — weekends and evenings when the job calls for it.',
          'Property managers get phased work across multi-tenant spaces and a written scope with the schedule baked in. The same visit can cover the lot: re-stripes, ADA stalls and access aisles, fire lanes, and arrows under one contract.',
          'Restaurants and food-service spaces get the same off-hours treatment — prep areas masked, dining areas protected, and the space handed back ready for the lunch or dinner rush. Growth-corridor work rewards contractors who communicate; you will know the schedule, the crew, and the closeout date before we open the first can.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Maple Grove',
        eyebrow: 'The lot',
        body: [
          'Growth-corridor retail lots restripe on a cycle — plows and traffic wear the lines down every winter, and faded markings in a busy lot are a liability problem, not a cosmetic one. We re-stripe stalls, ADA-compliant accessible spaces and aisles, fire lanes, stop bars, arrows, and crosswalks.',
          'The walkthrough is free: we measure the stalls, check your ADA layout against the current configuration, and give you a written number. New-lot layouts get chalked from your site plan before the first line goes down.',
        ],
        links: [
          { text: 'parking lot striping in Maple Grove', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking in Maple Grove', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How a Maple Grove Project Runs',
        eyebrow: 'Process',
        body: [
          'Call or text 651-410-4196 with the property and the timeline you are working against. We walk it, give you a written itemized quote with the schedule included, and show up when we said. Closeout is a walkthrough against the written scope — the details get confirmed before we wrap.',
          'Drywall repairs and touch-ups can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why Maple Grove Businesses and Homeowners Call Us',
        eyebrow: 'Why us',
        body: [
          'Growth-corridor pace: responsive scheduling, tight-turnaround build-outs, and honest answers on timelines. One crew, building and lot: painting and striping under one quote. Written, itemized quotes — no surprises. Local and owner-run: accountable to the person you talked to.',
        ],
      },
      {
        heading: 'Serving Maple Grove and the Northwest Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Maple Grove and the northwest metro — Minneapolis, the I-94 corridor, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Minneapolis', href: '/service-areas/minneapolis' },
          { text: 'twin-cities coverage', href: '/service-areas/twin-cities' },
        ],
      },
    ],
    faq: [
      {
        question: 'Can you paint our retail space without closing the business?',
        answer: 'Yes — most Maple Grove commercial work is scheduled evenings and weekends. Tell us your hours at the walkthrough and we build the schedule around them in the written scope.',
      },
      {
        question: 'Do you handle new-tenant build-outs?',
        answer: 'Yes. We paint build-outs and refreshes on tight turnarounds, staged cleanly so the space hands back on schedule.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'Do you paint in winter in Maple Grove?',
        answer: 'Exteriors are spring through fall — Minnesota winters do not cooperate with exterior coatings. Interiors, cabinets, and commercial interiors run year-round.',
      },
    ],
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
    metaTitle: 'Room & Whole-Home Interior Painting, Twin Cities',
    metaDescription:
      'Interior painting in the Twin Cities — single rooms to whole homes, clean lines, low-odor paint. Free estimates.',
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
    customSections: [
      {
        heading: 'Interior Painting Inside a Whole-Home Scope',
        eyebrow: 'Residential scope',
        body: [
          'Interior painting usually sits inside a bigger residential project — drywall repair first so the walls are paint-ready, cabinets in the kitchen, maybe the exterior next season. We scope it as one project so the finish is consistent everywhere.',
          'If you are planning the whole house, start with the residential path — it covers interiors, exteriors, cabinets, and drywall under one written scope.',
        ],
        links: [
          { text: 'residential painting services', href: '/residential' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
    ],
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
    customSections: [
      {
        heading: 'Exterior Painting Across the Metro',
        eyebrow: 'Coverage',
        body: [
          'We paint exteriors across the Twin Cities metro — siding, trim, soffits, and decks — prepped for Minnesota weather: scrape, prime, caulk, then topcoat. Exterior season runs roughly spring through fall.',
          'See where we work and what the coverage includes.',
        ],
        links: [
          { text: 'Twin Cities painting contractor', href: '/service-areas/twin-cities' },
          { text: 'free estimate', href: '/estimate' },
        ],
      },
    ],
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
    metaTitle: 'Commercial Painting Minneapolis-St. Paul',
    metaDescription:
      'Commercial painting in Minneapolis–St. Paul: offices, HOAs, churches, multi-family. Written scopes, minimal downtime. Free estimates.',
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
    metaTitle: 'Paint-Ready Drywall Repair, Twin Cities',
    metaDescription:
      'Paint-ready drywall repair in the Twin Cities — patches, cracks, and texture matched so the paint job lasts. Free estimates.',
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
    metaTitle: 'Deck and Fence Staining',
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
    metaTitle: 'Parking Lot Striping Minneapolis-St. Paul',
    metaDescription:
      'Parking lot striping in Minneapolis–St. Paul: crisp lines, ADA stalls, fast turnaround for businesses. Free estimates.',
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
    related: ['commercial', 'pavement-marking', 'public-sector', 'twin-cities'],
    customSections: [
      {
        heading: 'Parking Lot Striping Services in the Minneapolis–St. Paul Metro',
        eyebrow: 'Striping scope',
        body: [
          'We stripe parking lots across the Minneapolis–St. Paul metro: new layouts chalked from your site plan, re-stripes of faded lots, and stencils for arrows, stop bars, crosswalks, fire lanes, and numbered stalls. Small lots, commercial properties, and facilities — the job is scoped on a walkthrough, measured, and quoted in writing.',
          'Crisp lines do two jobs at once: they tell drivers where to go and they tell customers the property is looked after. We lay out for both — clear traffic flow and a clean arrival.',
        ],
        links: [
          { text: 'ADA pavement marking services', href: '/painting-services/pavement-marking' },
          { text: 'ADA parking lot striping and compliance', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'Restriping: When Faded Lines Need a Refresh',
        eyebrow: 'Restriping',
        body: [
          'Restriping is the same layout, painted fresh — same stalls, same flow, new crisp lines. It is the right call when the layout still works and only the paint has failed: lines worn to half their visibility, plow-scraped symbols, faded stall edges.',
          'In Minnesota the refresh rhythm is seasonal. Winter does the damage — plows, salt, freeze-thaw — and spring is when it shows. A walkthrough each spring tells you whether this is a refresh year or whether the layout itself needs rework first.',
        ],
      },
      {
        heading: 'Line Striping for St. Paul and the East Metro',
        eyebrow: 'East metro',
        body: [
          'St. Paul and the east metro — Woodbury, Maplewood, Oakdale, South St. Paul, Inver Grove Heights — get the same full operation as the west side: re-stripes, ADA stall and aisle layouts, fire lanes, arrows, and crosswalks, scheduled around the property’s traffic.',
          'If you manage lots in more than one east-metro city, one walkthrough can scope all of them and one schedule can cover the work.',
        ],
      },
      {
        heading: 'What We Stripe: Stalls, Aisles, Arrows, Stencils, and Fire Lanes',
        eyebrow: 'The inventory',
        body: [
          'Standard and compact stalls, angled and 90-degree layouts, directional arrows, stop bars, crosswalks, loading zones, numbered and reserved stalls, bike lanes — and fire lane markings. Fire lanes follow your local fire marshal’s rules; we chalk what the authority requires.',
          'ADA stalls and access aisles get their own treatment — that work is covered in detail on our ADA and pavement-marking pages.',
        ],
        links: [
          { text: 'ADA pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How a Restriping Job Runs: Quote to Done',
        eyebrow: 'The sequence',
        body: [
          'One, we walk the lot: existing markings, pavement condition, traffic flow, layout needs. Two, surface prep: sweep, clean, and remove or black out old marks where the layout is changing. Three, we chalk the layout. Four, the striping machine puts down the lines. Five, stencil details — arrows, stop bars, symbols. Six, cure time before traffic returns.',
          'Your written quote includes the schedule. We work around your lot’s low-traffic hours so the job does not shut the property down.',
        ],
      },
      {
        heading: 'Winter-Proofing: Why Minnesota Lots Fade Faster',
        eyebrow: 'Minnesota reality',
        body: [
          'Plow blades scrape flat-painted symbols first. Salt and sand grind the lines all winter. Snow-storage piles drag gravel across paint for months. Freeze-thaw opens the pavement under the lines. That is why Twin Cities lots fade faster than the paint’s rating suggests — and why spring is the season to look at them.',
          'Plan a walkthrough each spring. Catching fade early is a re-stripe; catching it late is a full re-mark.',
        ],
      },
      {
        heading: 'Striping Costs in the Twin Cities',
        eyebrow: 'Pricing',
        body: [
          'Every lot prices differently — stall count, layout complexity, and how much old marking needs rework all move the number. Request a free estimate and we will measure the lot and give you a written number before any work starts.',
        ],
        links: [
          { text: 'request a free striping estimate', href: '/estimate' },
        ],
      },
    ],
    faq: [
      {
        question: 'How often should a parking lot be restriped in Minnesota?',
        answer: 'Most Twin Cities lots need restriping every 2–4 years, depending on traffic and plow exposure. Lots that see heavy winter plowing fade fastest — plan a walk-through each spring.',
      },
      {
        question: 'Can you stripe over old, faded lines?',
        answer: 'Usually yes. If the old paint is still visible enough to follow, we re-chalk the layout and spray fresh lines. If the layout is changing or the old markings conflict, we remove or black them out first.',
      },
      {
        question: 'How long does a restriping job take?',
        answer: 'Your written quote includes the schedule. We work around your lot’s low-traffic hours — evenings and weekends where access allows — so the job does not shut the property down.',
      },
      {
        question: 'Can you work around our business hours?',
        answer: 'Yes. Tell us your low-traffic windows at the walkthrough and we build the schedule around them, in writing.',
      },
      {
        question: 'What is the difference between striping and sealcoating?',
        answer: 'Sealcoating protects the asphalt surface; striping paints the lines on top. Sealcoat first, let it cure, then stripe — never the reverse.',
      },
    ],
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
    metaTitle: 'ADA Parking Lot Marking & Striping, Twin Cities',
    metaDescription:
      'ADA-compliant pavement marking and striping for Twin Cities lots — stalls, arrows, curbs. Free estimates.',
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
    related: ['parking-lot-striping', 'commercial', 'public-sector', 'minneapolis'],
    customSections: [
      {
        heading: 'ADA-Compliant Parking Lot Marking in the Twin Cities',
        eyebrow: 'Compliance',
        body: [
          'What "ADA compliant marking" actually means on the ground: van-accessible spaces, access aisles at the right width, signage at the right height, and slopes within tolerance. We mark to the ADA Standards — but rules change and cities add their own requirements, so verify your layout with your local authority.',
          'This page is the commercial entry point. The full deep dive — space counts, violation patterns, restripe-vs-redesign — lives on our ADA striping page.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'ADA parking lot striping and compliance', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'What ADA Requires for Accessible Parking Spaces',
        eyebrow: 'The Standards',
        body: [
          'The 2010 ADA Standards for Accessible Design set measurable requirements. Accessible-space counts scale with total stalls. At least 1 in 6 accessible spaces must be van-accessible. Minimum widths: 8 feet for a car-accessible space, 11 feet for a van-accessible space, 5 feet for every access aisle. Signs carrying the International Symbol of Accessibility must have their bottom edge at least 60 inches above the pavement, and slopes may not exceed 1 in 48.',
          'This is a summary, not legal advice — verify your layout with your local authority, and remember cities can require more than the federal minimum.',
        ],
      },
      {
        heading: 'Pavement Marking Services Beyond Striping',
        eyebrow: 'Full inventory',
        body: [
          'Crosswalks, stop bars, speed legends, directional arrows, bike lanes, fire lanes, loading zones, numbered stalls — the full markings inventory a property manager can order in one visit. One crew, one schedule, one written scope for everything the pavement needs to say.',
        ],
      },
      {
        heading: 'Common ADA Violations We See in Twin Cities Lots',
        eyebrow: 'What fails',
        body: [
          'Faded or missing ISA symbols — plows erase flat-painted symbols first because they sit in the drive path. Access aisles painted too narrow, or painted correctly and then used as a drive lane. Missing van-accessible designation. Signs mounted too low. Faded blue backgrounds. Winter is behind most of it.',
          'The deep dive on each violation pattern, with what the fix looks like, is on our ADA striping page.',
        ],
        links: [
          { text: 'ADA parking lot striping and compliance', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'Restriping vs. Full Redesign: What Your Lot Needs',
        eyebrow: 'Which one you need',
        body: [
          'Restriping is the same layout, fresh paint — the right call when the layout still meets current requirements. Redesign is the call when space counts, stall sizes, or ADA ratios no longer meet them, and the lot needs re-layout.',
          'A walk-through tells us which one your lot needs. We will give you a straight answer on what the lot needs before any paint goes down.',
        ],
      },
      {
        heading: 'How Our Marking Jobs Run: Assessment, Layout, Crisp Lines',
        eyebrow: 'The sequence',
        body: [
          'One, on-site assessment: location, photos, current markings, dimensions, access, timing. Two, compliant layout chalked. Three, professional striping equipment lays the lines. Four, stencil and sign work. Five, final walk-through with you before we wrap.',
          'Your written quote includes the schedule, and we build it around your lot’s low-traffic hours.',
        ],
      },
      {
        heading: 'Request an ADA Marking Assessment',
        eyebrow: 'Next step',
        body: [
          'If your accessible markings are fading or you have never had the layout checked against current requirements, call 651-410-4196 or request an estimate online. We will walk the lot and give you a straight answer.',
        ],
        links: [
          { text: 'request a free estimate', href: '/estimate' },
        ],
      },
    ],
    faq: [
      {
        question: 'What makes a parking space ADA compliant?',
        answer: 'The space must meet minimum width (8 ft for car-accessible, 11 ft for van-accessible), sit next to an access aisle at least 5 ft wide, have the right slope, and carry proper signage with the International Symbol of Accessibility mounted at least 60 in. above the pavement. Requirements change — confirm your layout with your local authority.',
      },
      {
        question: 'How many accessible spaces does my lot need?',
        answer: 'It scales with total stalls — for example, a 100-stall lot needs 4 accessible spaces under the federal standards, and at least 1 in 6 of those must be van-accessible. Your city may require more. We measure your lot and lay out the compliant count.',
      },
      {
        question: 'What is a van-accessible space?',
        answer: 'An 11-foot-wide accessible space with an adjacent access aisle, marked with "van-accessible" signage. At least 1 in 6 accessible spaces on a lot must be van-accessible.',
      },
      {
        question: 'My accessible symbols are fading — is that a violation?',
        answer: 'Faded markings can be a problem: if the International Symbol of Accessibility or the blue background is not clearly visible, the space may not read as accessible — and in Minnesota, winter plows wear symbols faster than standard lines. Restriping before they disappear keeps the lot clearly readable; federal ADA standards require compliant signs and dimensions but do not themselves mandate a painted symbol, so check state and local rules.',
      },
      {
        question: 'Do ADA rules apply to my private lot?',
        answer: 'If your lot is open to the public — retail, office, church, restaurant, medical — accessible-parking requirements generally apply. Private lots not open to the public may be treated differently. This is not legal advice; check with your local building authority.',
      },
    ],
  },
  {
    kind: 'service',
    slug: 'ada-parking-lot-striping',
    title: 'ADA Parking Lot Striping & Compliance',
    shortTitle: 'ADA Striping',
    eyebrow: 'Compliance / accessible parking',
    headline: 'ADA parking lot striping for Twin Cities lots — stalls, aisles, and signage checked against the Standards.',
    description:
      'Faded accessible-parking markings are one of the fastest ways a Twin Cities lot can drift out of compliance. We re-stripe ADA-compliant parking layouts across the Minneapolis–St. Paul metro: correct stall sizes, access aisles, signage, and crisp, visible markings.',
    metaTitle: 'ADA Parking Lot Striping & Compliance, Twin Cities',
    metaDescription:
      'ADA parking lot striping in the Twin Cities — accessible stalls, access aisles, van spaces, and signage checks. Free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-public-authority.webp',
    accent: 'Compliance marking',
    market: 'Commercial',
    proof: [
      'ADA layout assessment on the walkthrough',
      'Stall counts, van ratio, widths, slopes, and signage checked',
      'Free walkthrough, written quote',
      'Non-ADA markings handled in the same visit',
    ],
    scope: [
      'Accessible stall restriping',
      'Van-accessible spaces',
      'Access aisles',
      'ISA symbols, arrows, and lettering',
      'Crosswalks, stop bars, and fire lanes',
    ],
    process: [
      { title: 'Assessment', body: 'We walk your lot, measure stalls and aisles, count spaces, and check signage height and slope flags against the Standards.' },
      { title: 'Compliant Layout', body: 'We chalk a layout that hits the space counts, van ratio, widths, and closest-to-entrance placement.' },
      { title: 'Crisp Lines', body: 'Professional striping equipment, proper surface prep, and stencils for ISA symbols, arrows, and lettering.' },
    ],
    related: ['pavement-marking', 'parking-lot-striping', 'commercial-painting', 'twin-cities'],
    customSections: [
      {
        heading: 'ADA Parking Lot Striping in the Twin Cities',
        eyebrow: 'Compliance overview',
        body: [
          'Faded accessible-parking markings are one of the fastest ways a Twin Cities lot can drift out of compliance. The accessible space is still there — the paint just stopped saying so. We re-stripe ADA-compliant parking layouts across the Minneapolis–St. Paul metro: correct stall sizes, access aisles, signage, and crisp, visible markings.',
          'One important note up front: this page summarizes the federal ADA Standards for Accessible Design. Rules change, and Minnesota cities and building codes can add their own requirements on top. Verify your layout with your local authority — this is practical guidance, not legal advice.',
        ],
        links: [
          { text: 'ADA pavement marking services', href: '/painting-services/pavement-marking' },
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
        ],
      },
      {
        heading: 'What ADA Requires for Accessible Parking',
        eyebrow: 'The Standards',
        body: [
          'Accessible parking is not just a blue wheelchair symbol. The 2010 ADA Standards for Accessible Design set specific, measurable requirements for spaces on lots open to the public.',
          'Space counts scale with lot size — a lot with 100 spaces needs 4 accessible spaces; a 500-space lot needs 9; larger lots follow percentage rules. At least 1 in every 6 accessible spaces must be van-accessible, with at least 1 van space on any lot that has accessible parking. A standard accessible space is at least 8 feet wide, a van-accessible space at least 11 feet wide, and every accessible space must sit beside an access aisle at least 5 feet wide.',
          'Slopes are capped at roughly 2% (1 in 48) in every direction — Minnesota freeze-thaw can push older lots over that line without anyone noticing. Signage is measured too: the International Symbol of Accessibility must appear on a sign mounted so its bottom edge is at least 60 inches above the pavement, and van-accessible spaces need "van-accessible" on the sign. Painted symbols alone do not satisfy the federal sign rule.',
          'Again: this is a summary, not the code book. Verify with your local authority; requirements change, and your city may ask for more than the federal minimum.',
        ],
      },
      {
        heading: 'Common Violations We See in Twin Cities Lots',
        eyebrow: 'What fails',
        body: [
          'Minnesota lots fail ADA checks for a handful of repeat reasons — and winter is behind most of them. Plow blades scrape flat-painted symbols in the drive path first; when the wheelchair symbol wears away, the space stops reading as accessible even if the stall is still wide enough. Access aisles get painted narrower than 5 feet, or painted correctly and then used as a drive lane or snow-storage strip all winter.',
          'We also see lots with accessible spaces but no van space, van-width spaces without the "van-accessible" sign, signs mounted too low or missing after a January storm, and wrong counts after a lot gets restriped with a few extra stalls. Older asphalt settles too — what graded at 1:48 when poured can exceed it ten winters later.',
          'The pattern is always the same: the layout drifts while the paint fades, and nobody catches it until a complaint or an inspection. A spring walkthrough of the accessible stalls and aisles is the cheapest insurance a property manager can buy — it costs you a phone call.',
        ],
      },
      {
        heading: 'Restriping vs. Full Redesign',
        eyebrow: 'Which one you need',
        body: [
          'Restriping keeps your existing layout and paints it fresh — same stall count, same accessible spaces, new crisp lines. That is the right move when the layout still meets the current requirements and only the paint has failed.',
          'Redesign is the call when the layout itself is the problem: too few accessible spaces for the stall count, van ratio off, access aisles undersized, or slopes out of tolerance. A redesign re-chalks the whole lot — sometimes moving the accessible spaces closer to the accessible entrance, which the Standards require.',
          'A walk-through tells us which one your lot needs. We will tell you honestly what your lot needs before any paint goes down.',
          'If the layout already complies, the re-stripe also catches the small things: touch-up arrows and stop bars that faded at a different rate, crosswalks worn thin by foot traffic, and fire lane legends the plows blurred. One visit keeps the whole lot legible.',
        ],
      },
      {
        heading: 'Get an ADA Striping Assessment',
        eyebrow: 'Next step',
        body: [
          'If your accessible markings are fading, your signage took a winter beating, or you have never had the layout checked against current requirements — call 651-410-4196 or request an estimate online. We will walk the lot and give you a straight answer on what it needs.',
          'This is practical guidance, not legal advice — verify your layout with your local authority.',
        ],
        links: [
          { text: 'request a free estimate', href: '/estimate' },
        ],
      },
    ],
    faq: [
      {
        question: 'What does ADA compliant parking lot striping include?',
        answer: 'It means the accessible spaces, access aisles, van-accessible spaces, signage, and slopes all match the ADA Standards for Accessible Design — not just a blue symbol. We assess the full layout, not only the paint.',
      },
      {
        question: 'How many accessible parking spaces does my lot need?',
        answer: 'It scales with total stalls — a 100-stall lot needs 4 under the federal standards, and at least 1 in 6 accessible spaces must be van-accessible. Cities can require more. We measure your lot and lay out the correct count.',
      },
      {
        question: 'Can you restripe our accessible spaces without changing the layout?',
        answer: 'Usually, yes — if the layout already meets current requirements, we restripe the same stalls, aisles, and symbols with fresh paint. If the layout is out of compliance, we will flag what needs redesigning before we paint.',
      },
      {
        question: 'How long do painted accessible symbols last in Minnesota?',
        answer: 'It depends on traffic and plow exposure — flat-painted symbols in the drive path wear fastest. If your symbols are fading after a winter, call before they disappear.',
      },
      {
        question: 'Do you do the signage too, or just the paint?',
        answer: 'We stripe the pavement markings and lay out the accessible stalls and aisles. On the walkthrough we will tell you honestly what your lot needs, including signage.',
      },
    ],
  },
  {
    kind: 'service',
    slug: 'parking-lot-striping-pricing',
    title: 'Parking Lot Striping Pricing',
    shortTitle: 'Parking Lot Striping',
    eyebrow: 'What striping costs',
    headline: 'Parking lot striping pricing for Twin Cities lots — what drives the cost and how to get an accurate quote.',
    description:
      'How parking lot striping is priced in the Minneapolis–St. Paul metro: the cost drivers, how contractors structure quotes, and restripe vs. new layout. Free on-site measurement from Sky’s the Limit Painting.',
    metaTitle: 'Parking Lot Striping Pricing, Twin Cities',
    metaDescription:
      'How parking lot striping is priced in the Twin Cities — cost drivers, quote structures, restripe vs. new layout. Free on-site measurement. Call 651-410-4196.',
    image: '/brand/generated/sky-commercial-authority.webp',
    accent: 'Striping pricing guide',
    market: 'Commercial',
    proof: [
      'Free on-site measurement and written quote',
      'No flat numbers pulled from a price list',
      'Same local crew that stripes the lot',
      'ADA and specialty markings quoted transparently',
    ],
    scope: [
      'Parking lot restriping',
      'New layout design and striping',
      'Accessible-space layouts',
      'Fire lanes, crosswalks, and stencils',
      'Seasonal refresh planning',
    ],
    process: [
      { title: 'Measure', body: 'We walk the lot or review your photos, count stalls, note layout complexity, and check surface condition and ADA needs.' },
      { title: 'Quote', body: 'You get a written quote that shows how the price was built — no mystery line items, no flat number from a list.' },
      { title: 'Stripe', body: 'The same local crew lays the layout we quoted, on your lot’s low-traffic schedule.' },
    ],
    related: ['parking-lot-striping', 'pavement-marking', 'ada-parking-lot-striping', 'commercial-painting'],
    customSections: [
      {
        heading: 'How Parking Lot Striping Is Actually Priced',
        eyebrow: 'The honest version',
        body: [
          'Striping is one of the cheapest ways to make a commercial lot look managed and stay compliant — but what it costs depends on your lot, not a price list. Any contractor who gives you a number without seeing the lot is guessing.',
          'An honest quote is built from measurements: how much paint goes down, how complex the layout is, what the surface needs first, and whether the layout itself has to change. This page explains each of those drivers so you can read any quote — including ours — with confidence.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
        ],
      },
      {
        heading: 'What Drives the Price',
        eyebrow: 'The five drivers',
        body: [
          'Lot size and stall count. More stalls mean more linear feet of paint and more crew time. This is the single biggest driver — a small retail pad and a large office lot are different jobs, not different prices on the same job.',
          'Layout complexity. Straight 90-degree stalls go down fast. Angled stalls, one-way arrows, crosswalks, stop bars, loading zones, numbered stalls, and fire-lane markings all add layout and stencil time.',
          'Surface condition. Clean, sound asphalt takes paint directly. Lots that need sweeping, cleaning, crack repair, or old-mark blackout first cost more to stripe — paint will not hold on a surface that is not prepped.',
          'ADA and specialty requirements. Accessible spaces, van-accessible signage, and stencils add line items. This is also the work that carries the most liability weight — price it as compliance, not paint.',
          'Mobilization. A crew coming to your lot has setup, equipment, and scheduling cost. Bundling striping with other lot work in one visit keeps that overhead from being paid twice.',
        ],
      },
      {
        heading: 'How Contractors Structure Quotes',
        eyebrow: 'Reading a quote',
        body: [
          'Striping quotes are usually structured one of three ways. Per linear foot is common nationally — you pay for the amount of line painted. Per stall shows up on straightforward restripes with uniform stalls. Per project covers new layouts and complex lots where design time matters as much as paint.',
          'The structure matters less than what is inside it. A good quote names the layout being striped, the surface prep included, the ADA line items, and the schedule. If a quote is a single number with no breakdown, you cannot compare it to anything — ask for the detail.',
          'Our quotes are written and itemized before any paint goes down. What we measure is what you pay for.',
        ],
        links: [
          { text: 'ADA striping and compliance', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'Restripe vs. New Layout: The Cost Difference',
        eyebrow: 'Which one you need',
        body: [
          'Restriping is refresh work: the layout stays, the paint gets renewed. Because layout time drops to nearly zero, restriping is the lowest-cost option — the right move when the layout still works and only the paint has faded.',
          'A new layout is design work: measuring, chalking a fresh stall plan, possibly removing conflicting old marks, and striping from scratch. It runs meaningfully above a restripe of the same lot — the layout labor is the difference. ADA redesigns (accessible-space counts, aisle rework, sign placement) sit in this category.',
          'A walk-through is what turns the drivers above into a number. Most quotes take one site visit or a good set of lot photos with a stall count.',
        ],
        links: [
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'What to Ask Before You Hire',
        eyebrow: 'Protect yourself',
        body: [
          'Is the quote itemized, or a single number? Does it include surface prep, or does prep get billed as a surprise later? Are ADA spaces, van signage, and stencils separate line items? Who is doing the work — the company quoting it, or a subcontractor you have never met? And what is the refresh plan — Minnesota winters eat paint, and a contractor who stripes your lot should be the one you call when the lines fade.',
          'Ask those five questions and the snake oil separates itself from the trade work fast.',
        ],
      },
      {
        heading: 'Get Your Lot Measured',
        eyebrow: 'Next step',
        body: [
          'The fastest path to a real number is a free on-site measurement: we walk the lot, count stalls, check the surface and the ADA layout, and hand you a written, itemized quote. Call 651-410-4196 or request an estimate online.',
        ],
        links: [
          { text: 'request a free estimate', href: '/estimate' },
        ],
      },
    ],
    faq: [
      {
        question: 'How is parking lot striping usually priced?',
        answer: 'Most contractors quote per linear foot of line painted, per stall on uniform restripes, or per project on new layouts and complex lots. The structure varies, but every honest quote is built from the same drivers: stall count, layout complexity, surface prep, and ADA requirements.',
      },
      {
        question: 'What is cheaper — restriping or a full new layout?',
        answer: 'Restriping is always cheaper: same layout, fresh paint, no design time. A new layout adds measuring, chalking, and old-mark removal — worth it when the layout is wrong (wrong stall sizes, bad flow, ADA gaps), not when only the paint has faded.',
      },
      {
        question: 'How often should a Minnesota lot be restriped?',
        answer: 'Most commercial lots need fresh paint every few years. Heavy plow exposure shortens that — plows scrape flat-painted lines and symbols every winter. A spring walkthrough catches fading before it becomes a compliance or appearance problem.',
      },
      {
        question: 'Do ADA markings add to the cost?',
        answer: 'Accessible spaces, van-accessible signage, and stencils are line items on the quote — and they are the cheapest compliance protection a property manager can buy. We quote them transparently as part of the layout, not as surprises.',
      },
      {
        question: 'Can I get a quote without a site visit?',
        answer: 'Often, yes — clear lot photos (aerial or wide shots), a stall count, and knowing whether it is a restripe or new layout gets us close. Final quotes are confirmed on a walk-through so the surface condition does not surprise either of us.',
      },
    ],
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
