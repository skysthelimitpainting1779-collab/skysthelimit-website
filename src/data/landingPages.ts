export type LandingPageKind = 'service' | 'area';

export interface LandingPage {
  kind: LandingPageKind;
  slug: string;
  // Structured-data classification: 'service' (default) emits Service JSON-LD;
  // 'article' emits Article JSON-LD for informational buyer guides.
  schemaKind?: 'service' | 'article';
  title: string;
  shortTitle: string;
  eyebrow: string;
  headline: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  image: string;
  imageCaption?: { label: string; text: string };
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
    eyebrow: 'East metro / 494-94 corridor',
    headline: 'Owner-operated painting in Woodbury — retail corridors, medical offices, and the neighborhoods around them.',
    description:
      'Sky’s the Limit Painting LLC serves Woodbury with residential painting, commercial painting, and parking lot striping. East-metro coverage along the 494/94 corridor.',
    metaTitle: 'Woodbury Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Woodbury, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-commercial-authority.webp',
    accent: 'East metro commercial',
    market: 'Commercial',
    proof: [
      'Serving the Woodbury 494/94 corridor',
      'Owner-led project communication',
      'Commercial, residential, and striping under one crew',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Retail and office repainting',
      'Medical and professional offices',
      'Interior repainting',
      'Exterior repaints',
      'Parking lot striping and ADA stalls',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us what you are looking at — office, retail space, house, parking lot — and where in Woodbury it is.' },
      { title: 'Walkthrough', body: 'We come to you, measure, and note the prep the job actually needs.' },
      { title: 'Written Quote', body: 'One number, line-itemed. You know exactly what is covered before we start.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['commercial-painting', 'parking-lot-striping', 'eagan', 'st-paul'],
    customSections: [
      {
        heading: 'Painting Contractor in Woodbury, MN',
        eyebrow: 'Why Woodbury',
        body: [
          'Sky’s the Limit Painting serves Woodbury’s 494/94 corridor with commercial painting, residential painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'Woodbury keeps growing east: retail centers along Valley Creek and the Radio Drive corridor, medical and professional offices clustering near the interstate interchanges, and established neighborhoods like Stonemill Farms and Wedgwood full of homes that need periodic exterior refreshes. It is the kind of market where commercial clients choose vendors on reliability — the crew that hits the schedule without disrupting business gets the next property too.',
          'Call or text 651-410-4196 for a free estimate. We will come out, walk the job with you, and give you a straight number.',
        ],
      },
      {
        heading: 'Commercial Painting in Woodbury: Retail, Medical, and Office',
        eyebrow: 'Commercial',
        body: [
          'Woodbury’s commercial mix runs retail storefronts, medical and dental offices, and professional office buildings — properties that live or die on appearance. A tired waiting room, scuffed retail front, or faded exterior trim sends a message you do not want patients or customers to read. We repaint commercial interiors and exteriors to a standard that holds up under traffic and light.',
          'We schedule around your operation: evenings and weekends for medical offices that cannot have a crew in the hallways during clinic hours, phased work for retail tenants that stay open, and clean, signed-off work areas every day. If you manage multiple properties along the corridor, ask about scheduling both the building and the parking lot in one visit.',
          'For multi-tenant buildings, consistency matters: the same colors, the same finish, the same schedule discipline across every suite. We document the specs on the first property so the second and third match without a re-discovery walkthrough. Property managers get one point of contact and a written scope per address, and retail fronts get off-hours scheduling so the center never looks like a construction site during business hours.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Residential Painting in Woodbury',
        eyebrow: 'Homes',
        body: [
          'Woodbury residential work splits two ways: interior repaints that run year-round — whole homes, single rooms, finished basements — and exterior repaints that run spring through fall. Exterior prep on Minnesota homes is where the money goes: scrape, prime, caulk, then an exterior-grade topcoat built for freeze-thaw. Skipping the prep is how a repaint peels early; we price the prep in and say so.',
          'Every residential job starts with a walkthrough and a written quote — what is included, what is prepped, what paint goes where. No allowance-line games. Finished basements and single-room refreshes are common too, and we schedule around your household, moving furniture, covering floors, and working one room at a time when the house is occupied. Drywall repairs and deck or fence staining can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
        ],
      },
      {
        heading: 'Parking Lot Striping in Woodbury',
        eyebrow: 'The lot',
        body: [
          'Retail and office lots along the Woodbury corridor take plow damage every winter, and faded lines plus a worn ADA stall are a liability problem, not a cosmetic one. We restripe lots — stalls, ADA spaces and access aisles, fire lanes, arrows, crosswalks — and every lot job starts with a free walkthrough: we measure, check your ADA layout against the current configuration, and give you a written number.',
          'If the same property also needs the building painted, one crew schedules both. No coordinating a painter and a striping company separately.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'Why Woodbury Property Managers and Homeowners Call Us',
        eyebrow: 'Why us',
        body: [
          'One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, no surprises. Commercial scheduling discipline: evenings, weekends, and phased work so businesses stay open. And the person you talk to is the person accountable for the work.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
        ],
      },
      {
        heading: 'Serving Woodbury and the East Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Woodbury and the east metro — St. Paul, Eagan, and the wider Twin Cities.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in St. Paul', href: '/service-areas/st-paul' },
          { text: 'painting contractor in Eagan', href: '/service-areas/eagan' },
        ],
      },
    ],
    faq: [
      {
        question: 'Do you repaint medical offices in Woodbury without disrupting clinic hours?',
        answer: 'Yes — tell us your operating hours at the walkthrough and we schedule evenings, weekends, or phased work around them. The schedule goes in the written scope before work starts.',
      },
      {
        question: 'Can you stripe our Woodbury lot and paint the building on one contract?',
        answer: 'Yes — one walkthrough, one written quote, one schedule for both the building and the lot.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'Do you paint exteriors in Woodbury during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall, and we book the season early. Interior work and commercial interiors run year-round, including winter.',
      },
      {
        question: 'Do you handle phased retail work so other tenants stay open?',
        answer: 'Yes. We work bay by bay on retail centers, keeping the rest of the center open and clean. Phasing goes in the written scope before we start.',
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
        answer: 'Tell us your operating hours at the walkthrough — we schedule retail, office, and hospitality work around them, and the schedule goes in the written scope.',
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
          'Eden Prairie is where the Twin Cities’ corporate corridor lives — business parks, corporate offices, and retail centers that need painters who plan like contractors, not handymen. After-hours and weekend scheduling is available where access allows. Multi-tenant properties get phased work: floor by floor or suite by suite, so tenants can stay put during the work.',
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
  {
    kind: 'area',
    slug: 'st-louis-park',
    title: 'St. Louis Park Painting Contractor',
    shortTitle: 'St. Louis Park',
    eyebrow: 'First-ring west / 394-100 corridor',
    headline: 'Owner-operated painting in St. Louis Park — homes, businesses, and the lots they park in.',
    description:
      'Sky’s the Limit Painting LLC serves St. Louis Park with residential painting, commercial painting, and parking lot striping. Based in Inver Grove Heights, working the whole west metro.',
    metaTitle: 'St. Louis Park Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in St. Louis Park, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'First-ring west local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving St. Louis Park',
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
      { title: 'Call or Text', body: 'Tell us what you are looking at — house, office, parking lot — and where in St. Louis Park it is.' },
      { title: 'Walkthrough', body: 'We come to you, measure, and note the prep the job actually needs.' },
      { title: 'Written Quote', body: 'One number, line-itemed. You know exactly what is covered before we start.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['edina', 'eden-prairie', 'minnetonka', 'commercial-painting'],
    customSections: [
      {
        heading: 'Painting Contractor in St. Louis Park, MN',
        eyebrow: 'Why St. Louis Park',
        body: [
          'Sky’s the Limit Painting serves St. Louis Park neighborhoods and the 394/100 corridor with residential painting, commercial painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'St. Louis Park sits in the first-ring west sweet spot: a straight shot up 394/100 from the metro core, and full of mid-century ranches, split-levels, and duplexes that take a beating from Minnesota freeze-thaw. The commercial side runs on small offices, retail storefronts, and service businesses along the highway corridors — the kind of jobs where a crew that shows up on time and finishes clean wins the next one by word of mouth.',
          'Call or text 651-410-4196 for a free estimate. We will come out, walk the job with you, and give you a straight number.',
        ],
      },
      {
        heading: 'Residential Painting in St. Louis Park',
        eyebrow: 'Homes',
        body: [
          'St. Louis Park exteriors: mid-century siding, original trim, soffits, and fascia on 1950s and 60s homes need real prep before paint — scrape, prime, caulk, then an exterior-grade topcoat built for freeze-thaw. Skipping the prep is how a repaint peels early; we price the prep in and say so.',
          'Interior repaints run year-round: whole homes, single rooms, and finished basements. We schedule around your household — furniture moved, floors covered, one room at a time if that is what it takes.',
          'Cabinet painting is the full kitchen refinish without the full remodel price. We spray-shop the doors and drawers for a factory-smooth finish and finish the boxes in place — no kitchen downtime measured in weeks.',
          'Every residential job starts with a walkthrough and a written quote — what is included, what is prepped, what paint goes where. No allowance-line games.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting for St. Louis Park Businesses',
        eyebrow: 'Businesses',
        body: [
          'St. Louis Park’s commercial mix is small offices, retail storefronts, and service businesses along the 394/100 corridors — workplaces that cannot afford to look tired and cannot afford to close for a week either. We paint after hours and on weekends, keep common areas clean and signed off, and coordinate with your property manager so the job never touches operating hours.',
          'We handle office refreshes, retail fronts, common areas, and multi-tenant buildings where consistency across suites matters. If you are comparing bids, ask us about phased scheduling — we can work suite by suite so tenants stay put and rent keeps flowing.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping in St. Louis Park',
        eyebrow: 'The lot',
        body: [
          'Office and retail lots along the 394/100 corridor take their share of plow damage every winter, and faded lines plus a worn ADA stall are a liability problem, not a cosmetic one. We restripe lots — stalls, ADA spaces and access aisles, fire lanes, arrows — and every lot job starts with a free walkthrough: we measure, check your ADA layout against the current configuration, and give you a written number.',
          'If the same property also needs the building painted, one crew schedules both. No coordinating a painter and a striping company separately.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How a St. Louis Park Project Runs',
        eyebrow: 'Process',
        body: [
          'First, call or text 651-410-4196 and tell us what you are looking at — house, office, parking lot. Then we walk it: measure, note the prep the job actually needs, and flag anything you should know before money moves. You get a written quote — one number, line-itemed. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repairs and deck or fence staining can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why St. Louis Park Homeowners and Property Managers Call Us',
        eyebrow: 'Why us',
        body: [
          'One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, no surprises. First-ring west logistics: we run the 494/35W/394 loop all week from Inver Grove Heights, so a St. Louis Park walkthrough is never a special trip. And the person you talk to is the person accountable for the work.',
        ],
      },
      {
        heading: 'Serving St. Louis Park and the West Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve St. Louis Park and the west metro — Edina, Eden Prairie, Minnetonka, and the wider Twin Cities.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Edina', href: '/service-areas/edina' },
          { text: 'painting contractor in Eden Prairie', href: '/service-areas/eden-prairie' },
        ],
      },
    ],
    faq: [
      {
        question: 'My house is a 1950s rambler — how do you handle the prep?',
        answer: 'The walkthrough checks siding and trim condition first, and the written quote itemizes scraping, priming, and caulking before any topcoat. On older exteriors, prep is most of the job — and we price it that way.',
      },
      {
        question: 'Do you paint exteriors in St. Louis Park during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall, and we book the season early. Interior work, cabinets, and commercial interiors run year-round, including winter.',
      },
      {
        question: 'Can you stripe our lot and paint the building on one contract?',
        answer: 'Yes — that is the advantage of hiring us. One walkthrough, one written quote, one schedule for both the building and the lot.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'Do you work after hours for businesses?',
        answer: 'Tell us your operating hours at the walkthrough — we build small-office and retail work around them so your operation never stops, and the schedule goes in the written scope.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'richfield',
    title: 'Richfield Painting Contractor',
    shortTitle: 'Richfield',
    eyebrow: 'South first-ring / 494-35W-77 corridor',
    headline: 'Owner-operated painting in Richfield — homes, retail fronts, and the lots behind them.',
    description:
      'Sky’s the Limit Painting LLC serves Richfield with residential painting, commercial painting, and parking lot striping. Based in Inver Grove Heights, working the whole south metro.',
    metaTitle: 'Richfield Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Richfield, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'South first-ring local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Richfield',
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
      { title: 'Call or Text', body: 'Tell us what you are looking at — house, storefront, parking lot — and where in Richfield it is.' },
      { title: 'Walkthrough', body: 'We come to you, measure, and note the prep the job actually needs.' },
      { title: 'Written Quote', body: 'One number, line-itemed. You know exactly what is covered before we start.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['bloomington', 'edina', 'twin-cities', 'parking-lot-striping'],
    customSections: [
      {
        heading: 'Painting Contractor in Richfield, MN',
        eyebrow: 'Why Richfield',
        body: [
          'Sky’s the Limit Painting serves Richfield neighborhoods and the 494/35W-77 corridor with residential painting, commercial painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'Richfield is a working first-ring suburb: postwar ranches and duplexes that need honest exterior work, and a retail strip along 494 that keeps painters and stripers busy in equal measure. It is the kind of market where one contractor doing the building AND the lot is a real advantage — the storefront refresh and the restripe happen on one schedule instead of two.',
          'Call or text 651-410-4196 for a free estimate. We will come out, walk the job with you, and give you a straight number.',
        ],
      },
      {
        heading: 'Residential Painting in Richfield',
        eyebrow: 'Homes',
        body: [
          'Richfield postwar housing stock means exteriors that are due or overdue. The process is always the same: walkthrough, real prep (scrape, prime, caulk), then exterior-grade topcoat rated for Minnesota freeze-thaw. On older siding, prep is the job; we itemize it in the quote instead of hiding it.',
          'Interiors run year-round: whole homes, single rooms, and rental turnovers.',
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
        heading: 'Commercial Painting for Richfield Businesses',
        eyebrow: 'Businesses',
        body: [
          'Richfield’s commercial work centers on the 494 retail strip and the first-ring housing behind it: retail fronts, restaurants, small offices, and multi-tenant buildings. We paint after hours and on weekends so the business stays open, keep the work zone tight and clean, and coordinate with your property manager or GC.',
          'We handle storefront refreshes, retail interiors, office repaints, and multi-tenant properties where consistent color across suites matters. If you manage a retail center, talk to us about phasing — we work bay by bay so the center never looks like a construction site.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Richfield',
        eyebrow: 'The lot',
        body: [
          'We are a painting contractor in the south metro that also runs a pavement-marking operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, crosswalks, and full new-lot layouts. In Richfield that earns its place — the retail lots along the 494 edge live under a plow blade half the year, and faded lines are a liability problem, not just a cosmetic one.',
          'We do the same free walkthrough on lots that we do on buildings: measure the stalls, check your ADA layout against the current configuration, and give you a written number for the work. If the same property also needs the building painted, one crew schedules both — no coordinating a painter and a striping company separately.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How a Richfield Project Runs',
        eyebrow: 'Process',
        body: [
          'First, call or text 651-410-4196 and tell us what you are looking at — house, storefront, parking lot. Then we walk it: measure, note the prep the job actually needs, and flag anything you should know before money moves. You get a written quote — one number, line-itemed. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repairs and deck or fence staining can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'deck and fence staining', href: '/painting-services/deck-fence-staining' },
        ],
      },
      {
        heading: 'Why Richfield Homeowners and Property Managers Call Us',
        eyebrow: 'Why us',
        body: [
          'One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, no surprises. 494-strip familiarity: the retail lots along Richfield’s 494 edge get plowed hard all winter, and we restripe and ADA-check lots that live under a plow blade half the year. And the person you talk to is the person accountable for the work.',
        ],
      },
      {
        heading: 'Serving Richfield and the South Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Richfield and the south metro — Bloomington, Edina, Burnsville, and the wider Twin Cities.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Bloomington', href: '/service-areas/bloomington' },
          { text: 'painting contractor in Edina', href: '/service-areas/edina' },
        ],
      },
    ],
    faq: [
      {
        question: 'Our retail lot on 494 is plow-chewed every winter — can you restripe it?',
        answer: 'Yes, and the ADA layout check comes with the walkthrough. We measure the stalls, confirm the accessible spaces and aisles, and give you a written number for the restripe before spring traffic picks up.',
      },
      {
        question: 'Do you paint exteriors in Richfield during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall, and we book the season early. Interior work, cabinets, and commercial interiors run year-round, including winter.',
      },
      {
        question: 'Can you stripe our lot and paint the storefront on one contract?',
        answer: 'Yes — that is the advantage of hiring us. One walkthrough, one written quote, one schedule for both the building and the lot.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'Do you work weekends so our store can stay open?',
        answer: 'Yes — most Richfield retail work is scheduled evenings and weekends. Tell us your hours at the walkthrough and we build the schedule around them in the written scope.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'minnetonka',
    title: 'Minnetonka Painting Contractor',
    shortTitle: 'Minnetonka',
    eyebrow: 'West metro / 394-494 corporate corridor',
    headline: 'Commercial-first painting in Minnetonka — offices, multi-tenant buildings, and the lots around them.',
    description:
      'Sky’s the Limit Painting LLC serves Minnetonka with commercial painting, residential painting, and parking lot striping. Based in Inver Grove Heights, working the west-metro corporate corridor.',
    metaTitle: 'Minnetonka Painting Contractor',
    metaDescription:
      'Commercial painting, house painting & parking lot striping in Minnetonka, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Corporate corridor local',
    market: 'Commercial',
    proof: [
      'Based in Inver Grove Heights, serving Minnetonka',
      'After-hours and weekend commercial scheduling',
      'Residential, commercial, and striping under one crew',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Commercial interiors and exteriors',
      'Multi-tenant and office properties',
      'Parking lot striping and ADA stalls',
      'Interior repainting',
      'Exterior repaints and cabinet refinishing',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us about the property — office building, retail center, home — and where in Minnetonka it is.' },
      { title: 'Walkthrough', body: 'We walk the building and the lot with you, noting prep, phasing, and schedule constraints.' },
      { title: 'Written Quote', body: 'One number, line-itemed, with the schedule in writing before we start.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['eden-prairie', 'plymouth', 'maple-grove', 'commercial-painting'],
    customSections: [
      {
        heading: 'Painting Contractor in Minnetonka, MN',
        eyebrow: 'Why Minnetonka',
        body: [
          'Sky’s the Limit Painting serves Minnetonka and the 394/494 corporate corridor with commercial painting, residential painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'Minnetonka is corporate west-metro: office parks and multi-tenant buildings off the 394/494 corridors, where the work that matters is the work nobody’s tenants ever notice. This page is written for the facilities manager first and the homeowner second — procurement language, scheduling detail, and a quote that actually itemizes what matters on a commercial job.',
          'Call or text 651-410-4196 for a free walkthrough and written quote. We will come out, measure, and give you a straight number.',
        ],
      },
      {
        heading: 'Commercial Painting for Minnetonka Offices and Property Managers',
        eyebrow: 'Businesses',
        body: [
          'Minnetonka’s office parks and multi-tenant buildings need painters who operate on building time, not contractor time. We paint after hours and on weekends, phase work floor by floor or suite by suite so tenants stay put, and coordinate directly with your property manager or GC. Common areas, lobbies, corridors, exteriors — one crew, one schedule, one point of accountability.',
          'We also handle the turnover side: office repaints between tenants, retail refreshes, and exterior touch-ups that keep a property competitive on the corridor. If you manage multiple buildings, ask about a standing walkthrough schedule — a planned repaint cycle beats an emergency repaint every time.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Minnetonka',
        eyebrow: 'The lot',
        body: [
          'We are a painting contractor in the west metro that also runs a pavement-marking operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, crosswalks, and full new-lot layouts. Office-park lots off the 394/494 corridors are exactly where striping pays for itself — high tenant turnover, snowplow wear every winter, and accessible-parking layouts that drift a little further out of compliance every year.',
          'We do the same free walkthrough on lots that we do on buildings: measure the stalls, check your ADA layout against the current configuration, and give you a written number for the work. And when the same property needs the building painted, one crew schedules both — paint and striping on one quote, no coordinating two contractors.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'Residential Painting in Minnetonka',
        eyebrow: 'Homes',
        body: [
          'Minnetonka residential work runs the full range: whole-home repaints, exterior refreshes on lakeside and wooded lots that take weather differently than open subdivisions, and interior repaints year-round, scheduled around your household.',
          'Cabinet painting is the full kitchen refinish without the full remodel price — we spray-shop the doors and drawers for a factory-smooth finish and finish the boxes in place. Every residential job starts with a walkthrough and a written quote: what is included, what is prepped, what paint goes where. No allowance-line games.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'How a Minnetonka Project Runs',
        eyebrow: 'Process',
        body: [
          'First, call or text 651-410-4196 and tell us about the property — office building, retail center, home, lot. Then we walk it with you: measure, note the prep the job actually needs, work out the phasing and schedule constraints, and flag anything you should know before money moves. You get a written quote — one number, line-itemed, with the schedule in writing. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repairs can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why Minnetonka Property Managers and Homeowners Call Us',
        eyebrow: 'Why us',
        body: [
          'Corporate-corridor scheduling: after-hours and weekend work, phased across multi-tenant buildings, built around your tenants’ hours. One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, no surprises. And the person you talk to is the person accountable for the work.',
        ],
      },
      {
        heading: 'Serving Minnetonka and the West Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Minnetonka and the west-metro corridor — Eden Prairie, Plymouth, the 394/494 loop, and the wider Twin Cities.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Eden Prairie', href: '/service-areas/eden-prairie' },
          { text: 'painting contractor in Plymouth', href: '/service-areas/plymouth' },
        ],
      },
    ],
    faq: [
      {
        question: 'Can you paint our office building without disrupting tenants?',
        answer: 'Yes — that is the core of our commercial scheduling. We work after hours and weekends, phase floor by floor or suite by suite, and put the schedule in the written scope so tenants know what to expect.',
      },
      {
        question: 'Do you handle ADA layout checks on office-park lots?',
        answer: 'Yes. The free lot walkthrough includes measuring stalls and access aisles and checking your accessible-parking layout against the current configuration, then a written number for the restripe.',
      },
      {
        question: 'Do you take on smaller commercial jobs, not just whole buildings?',
        answer: 'Yes — single-suite repaints, lobby refreshes, and retail turnovers are common. The walkthrough and written quote work the same at any scale.',
      },
      {
        question: 'How do you price a commercial repaint?',
        answer: 'Per project, after a walkthrough: we measure, note the prep, and give you a written, itemized number. No square-foot guesswork over the phone.',
      },
      {
        question: 'Do you paint exteriors in Minnetonka during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall. Interiors, cabinets, and commercial interiors run year-round, including winter.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'plymouth',
    title: 'Plymouth Painting Contractor',
    shortTitle: 'Plymouth',
    eyebrow: 'Northwest metro / 494-55 corporate corridor',
    headline: 'Owner-operated painting in Plymouth — corporate corridor, new-tenant build-outs, and the lots out front.',
    description:
      'Sky’s the Limit Painting LLC serves Plymouth with commercial painting, residential painting, and parking lot striping. Based in Inver Grove Heights, working the northwest corporate corridor.',
    metaTitle: 'Plymouth Painting Contractor',
    metaDescription:
      'Commercial painting, house painting & parking lot striping in Plymouth, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Corporate corridor local',
    market: 'Commercial',
    proof: [
      'Based in Inver Grove Heights, serving Plymouth',
      'New-tenant build-out and turnover scheduling',
      'Residential, commercial, and striping under one crew',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Commercial interiors and exteriors',
      'New-tenant build-outs and turnovers',
      'Parking lot striping and ADA stalls',
      'Interior repainting',
      'Exterior repaints and cabinet refinishing',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us about the space — build-out, office, retail, home — and where in Plymouth it is.' },
      { title: 'Walkthrough', body: 'We walk it with you, measure, and nail down the schedule and phasing.' },
      { title: 'Written Quote', body: 'One number, line-itemed, with the completion date in writing.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['maple-grove', 'minnetonka', 'twin-cities', 'parking-lot-striping'],
    customSections: [
      {
        heading: 'Painting Contractor in Plymouth, MN',
        eyebrow: 'Why Plymouth',
        body: [
          'Sky’s the Limit Painting serves Plymouth and the 494/55 northwest corporate corridor with commercial painting, residential painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'Plymouth’s corridor runs on build-outs and turnovers: new tenants signing along 494/55, retail and office spaces that hand back fast, and property managers who need a painter that can keep a schedule instead of explaining why they missed it. We stage paint work around lease dates and GC schedules — the space is ready when the lease starts, not a week after.',
          'Call or text 651-410-4196 for a free walkthrough and written quote. We will come out, measure, and give you a straight number.',
        ],
      },
      {
        heading: 'Commercial Painting for Plymouth Build-Outs and Offices',
        eyebrow: 'Businesses',
        body: [
          'New-tenant build-outs, office refreshes, and retail turnovers along the 494/55 corridor are our bread-and-butter commercial work. We coordinate with your GC or property manager, paint on the build-out’s timeline — nights and weekends when the schedule demands it — and keep the site clean enough for the next trade to walk in behind us.',
          'We also handle multi-tenant properties, common areas, and exteriors that need to look sharp for the next prospect walking the building. Phased scheduling keeps occupied suites running while the turnover suite gets finished — one crew, one accountable contact, one written schedule.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Plymouth',
        eyebrow: 'The lot',
        body: [
          'We are a painting contractor in the northwest metro that also runs a pavement-marking operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, crosswalks, and full new-lot layouts. Corporate-corridor lots in Plymouth get heavy turnover traffic and a full winter of plow wear — faded lines and worn accessible stalls are a liability problem, not just a cosmetic one.',
          'We do the same free walkthrough on lots that we do on buildings: measure the stalls, check your ADA layout against the current configuration, and give you a written number for the work. And when the building needs paint too, one crew schedules both — no coordinating a painter and a striping company separately.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'Residential Painting in Plymouth',
        eyebrow: 'Homes',
        body: [
          'Plymouth residential work spans newer subdivisions and established neighborhoods: exterior repaints prepped for Minnesota freeze-thaw — scrape, prime, caulk, then exterior-grade topcoat — and interior repaints that run year-round, scheduled around your household.',
          'Cabinet painting is the full kitchen refinish without the full remodel price: spray-shop doors and drawers for a factory-smooth finish, boxes finished in place. Every residential job starts with a walkthrough and a written quote — what is included, what is prepped, what paint goes where. No allowance-line games.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'How a Plymouth Project Runs',
        eyebrow: 'Process',
        body: [
          'First, call or text 651-410-4196 and tell us about the space — build-out, office, retail, home, lot. Then we walk it with you: measure, note the prep, lock the schedule and phasing against your lease date or timeline, and flag anything you should know before money moves. You get a written quote — one number, line-itemed, with the completion date in writing. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repairs and deck or fence staining can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'paint-ready drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Why Plymouth Property Managers and Homeowners Call Us',
        eyebrow: 'Why us',
        body: [
          'Build-out speed: new-tenant spaces along the 494/55 corridor hand back fast — we stage paint so the space is ready when the lease starts. One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, with the completion date on paper. And the person you talk to is the person accountable for the work.',
        ],
      },
      {
        heading: 'Serving Plymouth and the Northwest Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Plymouth and the northwest metro — Maple Grove, Minnetonka, the I-94 corridor, and the wider Twin Cities.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Maple Grove', href: '/service-areas/maple-grove' },
          { text: 'painting contractor in Minnetonka', href: '/service-areas/minnetonka' },
        ],
      },
    ],
    faq: [
      {
        question: 'Can you hit a lease-start deadline on a tenant build-out?',
        answer: 'Yes — tell us the date at the walkthrough and it goes in the written quote. We schedule build-outs on the lease timeline, working nights and weekends when the calendar demands it.',
      },
      {
        question: 'Do you coordinate with our general contractor?',
        answer: 'Yes. We work in the GC’s sequence, keep the site clean for the next trade, and put phasing in the written scope so everyone is working from the same plan.',
      },
      {
        question: 'Do you paint exteriors in Plymouth during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall, and we book the season early. Interior work, cabinets, and commercial interiors run year-round, including winter.',
      },
      {
        question: 'Can you stripe our lot and paint the building on one contract?',
        answer: 'Yes — that is the advantage of hiring us. One walkthrough, one written quote, one schedule for both the building and the lot.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'burnsville',
    title: 'Burnsville Painting Contractor',
    shortTitle: 'Burnsville',
    eyebrow: 'South metro / 35W-35E retail corridor',
    headline: 'Owner-operated painting in Burnsville — retail fronts, restaurants, homes, and the lots in front of them.',
    description:
      'Sky’s the Limit Painting LLC serves Burnsville with residential painting, commercial painting, and parking lot striping. Based in Inver Grove Heights, working the whole south metro.',
    metaTitle: 'Burnsville Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Burnsville, MN. Local crew, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'South metro local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Burnsville',
      'Retail and restaurant scheduling around your hours',
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
      { title: 'Call or Text', body: 'Tell us what you are looking at — house, storefront, restaurant, parking lot — and where in Burnsville it is.' },
      { title: 'Walkthrough', body: 'We come to you, measure, and note the prep the job actually needs.' },
      { title: 'Written Quote', body: 'One number, line-itemed. You know exactly what is covered before we start.' },
      { title: 'Scheduled Work', body: 'We show up on the date we said, keep the site clean, and walk it with you at the end.' },
    ],
    related: ['bloomington', 'eagan', 'inver-grove-heights', 'pavement-marking'],
    customSections: [
      {
        heading: 'Painting Contractor in Burnsville, MN',
        eyebrow: 'Why Burnsville',
        body: [
          'Sky’s the Limit Painting serves Burnsville and the 35W/35E south-metro corridor with residential painting, commercial painting, and parking lot striping. We are a local, owner-run crew — not a franchise — and every job gets a direct line to the person doing the work.',
          'Burnsville runs on retail and restaurants: fronts that live on curb appeal and lots that take punishment from traffic and plows all year. A tired facade costs a retail business customers, and a faded lot costs the property manager a liability problem. We do the building and the lot under one contract, on a schedule that never closes the business.',
          'Call or text 651-410-4196 for a free estimate. We will come out, walk the job with you, and give you a straight number.',
        ],
      },
      {
        heading: 'Commercial Painting for Burnsville Retail and Restaurants',
        eyebrow: 'Businesses',
        body: [
          'Burnsville’s retail and restaurant fronts along the 35W corridor live and die on first impressions. We paint retail facades, restaurant interiors, and common areas on nights and weekends so the business never closes — tight work zones, clean exits, and a site that opens for business on time every morning.',
          'We also handle multi-tenant retail centers: consistent colors across suites, storefront refreshes between tenants, and phased work so the center never looks like a construction site. If you manage a center, ask about phasing — we work bay by bay while the rest of the center stays open.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Parking Lot Striping and Pavement Marking in Burnsville',
        eyebrow: 'The lot',
        body: [
          'We are a painting contractor in the south metro that also runs a pavement-marking operation: re-stripes, ADA-compliant stalls and access aisles, fire lanes, arrows, crosswalks, and full new-lot layouts. Burnsville’s retail and restaurant lots earn the full section — high-turnover parking, plow wear every winter, and accessible-parking layouts that drift out of compliance while the paint fades.',
          'We do the same free walkthrough on lots that we do on buildings: measure the stalls, check your ADA layout against the current configuration, and give you a written number for the work. And when the building needs paint too, one crew schedules both — the facade and the lot on one quote, ready for the same opening day.',
        ],
        links: [
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
          { text: 'pavement marking services', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'Residential Painting in Burnsville',
        eyebrow: 'Homes',
        body: [
          'Burnsville residential work covers established neighborhoods and newer builds: exterior repaints prepped for Minnesota freeze-thaw — scrape, prime, caulk, then exterior-grade topcoat — and interior repaints that run year-round, scheduled around your household.',
          'Cabinet painting is the full kitchen refinish without the full remodel price: spray-shop doors and drawers for a factory-smooth finish, boxes finished in place. Every residential job starts with a walkthrough and a written quote — what is included, what is prepped, what paint goes where. No allowance-line games.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'How a Burnsville Project Runs',
        eyebrow: 'Process',
        body: [
          'First, call or text 651-410-4196 and tell us what you are looking at — house, storefront, restaurant, parking lot. Then we walk it: measure, note the prep the job actually needs, and build the schedule around your hours before money moves. You get a written quote — one number, line-itemed. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repairs and deck or fence staining can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'deck and fence staining', href: '/painting-services/deck-fence-staining' },
        ],
      },
      {
        heading: 'Why Burnsville Homeowners and Property Managers Call Us',
        eyebrow: 'Why us',
        body: [
          'Retail-front turnaround: restaurants and retail along the 35W corridor live on curb appeal — we paint and restripe around your hours so you never close. One crew, building and lot: painting and striping under one quote and one schedule. Straight quotes — written, itemized, no surprises. And the person you talk to is the person accountable for the work.',
        ],
      },
      {
        heading: 'Serving Burnsville and the South Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Burnsville and the south metro — Bloomington, Eagan, Inver Grove Heights, and the wider Twin Cities.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Bloomington', href: '/service-areas/bloomington' },
          { text: 'painting contractor in Inver Grove Heights', href: '/service-areas/inver-grove-heights' },
        ],
      },
    ],
    faq: [
      {
        question: 'Can you repaint our restaurant without closing for service?',
        answer: 'Yes — most Burnsville restaurant work happens overnight and between services. Tell us your hours at the walkthrough and the schedule goes in the written scope; the dining room opens on time.',
      },
      {
        question: 'Do you paint exteriors in Burnsville during winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season runs roughly spring through fall, and we book the season early. Interior work, cabinets, and commercial interiors run year-round, including winter.',
      },
      {
        question: 'Can you stripe our lot and paint the building on one contract?',
        answer: 'Yes — that is the advantage of hiring us. One walkthrough, one written quote, one schedule for both the building and the lot.',
      },
      {
        question: 'How do you price a parking lot re-stripe?',
        answer: 'Every lot is different, so we walk it with you, measure, and give you a free written quote. The walkthrough costs nothing and the number is in writing before we start.',
      },
      {
        question: 'Do you handle retail-center phasing so other tenants stay open?',
        answer: 'Yes. We work bay by bay on retail centers, keeping the rest of the center open and clean. Phasing goes in the written scope before we start.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'lakeville',
    title: 'Lakeville Painting Contractor',
    shortTitle: 'Lakeville',
    eyebrow: 'Dakota County / south metro',
    headline: 'Owner-operated painting in Lakeville — homes, townhomes, and the commercial lots around them.',
    description:
      'Sky’s the Limit Painting LLC serves Lakeville with residential painting, commercial painting, and parking lot striping. Based in nearby Inver Grove Heights, working across Dakota County.',
    metaTitle: 'Lakeville Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Lakeville, MN. Owner-operated, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Dakota County local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Lakeville',
      'Owner-led project communication',
      'Residential, commercial, and striping from one owner-led operation',
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
      { title: 'Call or Text', body: 'Tell us what you are looking at — house, townhome, office, parking lot — and where in Lakeville it is.' },
      { title: 'Walkthrough', body: 'We come to you, measure, and note the prep the job actually needs.' },
      { title: 'Written Quote', body: 'One number, line-itemed. You know exactly what is covered before we start.' },
      { title: 'Scheduled Work', body: 'The start date goes in the written scope. We keep the site clean and walk the finished work with you at the end.' },
    ],
    related: ['apple-valley', 'rosemount', 'inver-grove-heights', 'parking-lot-striping'],
    customSections: [
      {
        heading: 'Painting Contractor in Lakeville, MN',
        eyebrow: 'Why Lakeville',
        body: [
          'Sky’s the Limit Painting serves Lakeville with residential painting, commercial painting, and parking lot striping. We are based in Inver Grove Heights — a short drive south — and we work Lakeville jobs the same way we work our home turf: owner-run, prep-first, one written scope.',
          'Lakeville keeps growing, which means two kinds of work land on our schedule: newer homes and townhomes that need their first real repaint or a full interior refresh, and established neighborhoods where exteriors are due after a decade of Minnesota winters. On the commercial side, Lakeville’s retail and office properties need lots that stay legible through plow season — faded striping in a busy lot is a liability problem, not a cosmetic one.',
          'Call or text 651-410-4196 for a free estimate. We will come out, walk the job with you, and give you a straight number.',
        ],
      },
      {
        heading: 'Residential Painting in Lakeville',
        eyebrow: 'Homes',
        body: [
          'Lakeville residential work runs from whole-home interior repaints to exterior refreshes on two-stories that have taken ten winters of wind and sun. We scrape, prime, caulk, and topcoat with exterior-grade paint built for freeze-thaw — the prep is the job, the paint is just the finish.',
          'Cabinet painting suits Lakeville\'s newer kitchens well: sprayed doors and drawers for a factory-smooth finish, boxes finished in place, hardware back on and aligned — one of the most cost-effective kitchen updates short of a remodel.',
          'Interior repaints run year-round. Winter is our busiest interior season in the Twin Cities; we schedule around your household.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting and Striping for Lakeville Properties',
        eyebrow: 'Businesses',
        body: [
          'Lakeville’s retail centers, offices, and multi-tenant properties need contractors who do not interrupt business to do the work. We schedule around your business hours where the job allows, stage cleanly, and coordinate with property managers — and the schedule goes in the written scope.',
          'The differentiator: we also run a pavement-marking operation. Re-stripes, ADA stalls and access aisles, fire lanes, arrows, and crosswalks — on the same contract as the building paint if you want it. One walkthrough, one written quote, one schedule.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'parking lot striping', href: '/painting-services/parking-lot-striping' },
          { text: 'ADA parking lot striping', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'How a Lakeville Project Runs',
        eyebrow: 'Process',
        body: [
          'Call or text 651-410-4196. We walk the job — house, office, or lot — measure, note the prep it actually needs, and hand you a written, line-itemed quote. Then we show up on the date we said, keep the site clean, and walk it with you at the end.',
          'Drywall repair, deck and fence staining, and pavement marking can be folded into the same project — ask during the walkthrough.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'pavement marking', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'Serving Lakeville and Dakota County',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Lakeville and the surrounding Dakota County suburbs — Apple Valley, Rosemount, Eagan, Burnsville, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Apple Valley', href: '/service-areas/apple-valley' },
          { text: 'painting contractor in Rosemount', href: '/service-areas/rosemount' },
        ],
      },
    ],
    faq: [
      {
        question: 'Do you serve all of Lakeville or just certain neighborhoods?',
        answer: 'All of Lakeville — north to south. We are based in nearby Inver Grove Heights, so Lakeville jobs get the same scheduling priority as our home turf.',
      },
      {
        question: 'Can you stripe our lot and paint our building on one contract?',
        answer: 'Yes. One walkthrough, one written quote, one schedule for both the building and the lot — that is the advantage of hiring a painter that also runs a striping operation.',
      },
      {
        question: 'Do you paint townhome exteriors or just interiors?',
        answer: 'Both, where the HOA allows owner-arranged work. Interiors are straightforward; exteriors depend on your association’s rules — ask us at the walkthrough and we will tell you straight.',
      },
      {
        question: 'How far out are you booking?',
        answer: 'It moves with the season — exteriors book fastest in spring. Call or text 651-410-4196 and we will give you an honest timeline for your job type.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'apple-valley',
    title: 'Apple Valley Painting Contractor',
    shortTitle: 'Apple Valley',
    eyebrow: 'Dakota County / west of IGH',
    headline: 'Owner-operated painting in Apple Valley — repaints, refinishes, and retail-lot striping.',
    description:
      'Sky’s the Limit Painting LLC serves Apple Valley with residential painting, cabinet refinishing, commercial painting, and parking lot striping. Based in nearby Inver Grove Heights.',
    metaTitle: 'Apple Valley Painting Contractor',
    metaDescription:
      'House painting, cabinet refinishing & parking lot striping in Apple Valley, MN. Owner-operated, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Dakota County local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Apple Valley',
      'Owner-led project communication',
      'Cabinet refinishing specialty',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Interior repainting',
      'Exterior repaints',
      'Cabinet refinishing',
      'Townhome and HOA-friendly scheduling',
      'Parking lot striping and ADA stalls',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us the project — whole home, kitchen cabinets, office, lot — and where in Apple Valley.' },
      { title: 'Walkthrough', body: 'We measure, check surfaces and prep needs, and talk paint and schedule.' },
      { title: 'Written Quote', body: 'One number, line-itemed. No allowance-line games.' },
      { title: 'Scheduled Work', body: 'Clean site, schedule in writing, final walkthrough with you.' },
    ],
    related: ['lakeville', 'rosemount', 'inver-grove-heights', 'cabinet-painting'],
    customSections: [
      {
        heading: 'Painting Contractor in Apple Valley, MN',
        eyebrow: 'Why Apple Valley',
        body: [
          'Sky’s the Limit Painting serves Apple Valley from our home base in nearby Inver Grove Heights. Owner-run, prep-first, one written scope — the same job whether it is a whole-home repaint or a retail lot re-stripe.',
          'Apple Valley’s housing stock is largely established — homes hitting the age where original builder paint is done and exteriors need a real prep-and-repaint cycle, not a spray-and-pray. Kitchens are the other big ask: cabinet refinishing gives the full update without the remodel price, and doors and drawers get a sprayed, factory-smooth finish.',
          'Call or text 651-410-4196 for a free estimate.',
        ],
      },
      {
        heading: 'Cabinet Refinishing in Apple Valley',
        eyebrow: 'Kitchens',
        body: [
          'Cabinet painting — refinishing, done right. Doors and drawers are finished with a sprayed, factory-smooth finish; boxes are finished in place with full masking and dust control; hardware goes back on aligned and adjusted.',
          'It is one of the most cost-effective kitchen updates short of a remodel, at a fraction of the disruption. We give you an exact timeline at the walkthrough based on door count and finish.',
        ],
        links: [
          { text: 'cabinet painting services', href: '/painting-services/cabinet-painting' },
          { text: 'interior painting', href: '/painting-services/interior-painting' },
        ],
      },
      {
        heading: 'Exterior and Interior Repaints in Apple Valley',
        eyebrow: 'Homes',
        body: [
          'Exterior repaints follow the Minnesota playbook: scrape to sound surface, prime bare wood, caulk the gaps, then topcoat with exterior-grade paint rated for freeze-thaw. Siding, trim, soffits, fascia, and decks.',
          'Interiors run year-round — whole homes, single rooms, basements, stairwells. We protect floors and furnishings like it is our own house, because the referral is the business.',
        ],
        links: [
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'drywall repair', href: '/painting-services/drywall-repair' },
        ],
      },
      {
        heading: 'Commercial and Lot Work in Apple Valley',
        eyebrow: 'Businesses',
        body: [
          'Apple Valley’s retail corridors and office properties get the same owner-led treatment: scheduling built around your business hours where access allows, clean staging, and coordination with your property manager.',
          'And the lot comes with the building if you want it — re-stripes, ADA stalls and access aisles, fire lanes, arrows, and crosswalks, all on one contract. Plow season chews up markings every winter; a spring walkthrough identifies faded markings before they become a liability.',
        ],
        links: [
          { text: 'commercial painting', href: '/painting-services/commercial-painting' },
          { text: 'parking lot striping', href: '/painting-services/parking-lot-striping' },
          { text: 'ADA parking lot striping', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'Serving Apple Valley and Dakota County',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Apple Valley and the surrounding Dakota County suburbs — Lakeville, Rosemount, Eagan, Burnsville, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Lakeville', href: '/service-areas/lakeville' },
          { text: 'painting contractor in Eagan', href: '/service-areas/eagan' },
        ],
      },
    ],
    faq: [
      {
        question: 'How long does cabinet refinishing take?',
        answer: 'Most kitchens are back in service in days, not weeks. We will give you an exact timeline at the walkthrough based on door count and finish.',
      },
      {
        question: 'Do you work with HOAs and townhome associations?',
        answer: 'Bring the HOA color-approval and scheduling requirements to the walkthrough and we will build the quote around them.',
      },
      {
        question: 'Can you stripe our parking lot too?',
        answer: 'Yes. Re-stripes, ADA stalls, fire lanes, and full layouts — on the same contract as building work if you want one vendor and one schedule.',
      },
      {
        question: 'Do you paint exteriors in winter?',
        answer: 'No — Minnesota winters do not cooperate with exterior coatings. Exterior season is spring through fall; interiors and cabinets run year-round.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'rosemount',
    title: 'Rosemount Painting Contractor',
    shortTitle: 'Rosemount',
    eyebrow: 'Dakota County / south metro',
    headline: 'Owner-operated painting in Rosemount — homes, rentals, and commercial properties.',
    description:
      'Sky’s the Limit Painting LLC serves Rosemount with residential painting, commercial painting, and parking lot striping. Based in nearby Inver Grove Heights.',
    metaTitle: 'Rosemount Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Rosemount, MN. Owner-operated, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'Dakota County local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Rosemount',
      'Owner-led project communication',
      'Residential, commercial, and striping from one owner-led operation',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Interior repainting',
      'Exterior repaints',
      'Rental turnovers and refreshes',
      'Commercial interiors and exteriors',
      'Parking lot striping and ADA stalls',
    ],
    process: [
      { title: 'Call or Text', body: 'Describe the job — home, rental, office, lot — and where in Rosemount.' },
      { title: 'Walkthrough', body: 'We come out, measure, and scope the prep honestly.' },
      { title: 'Written Quote', body: 'One number, line-itemed, before anything starts.' },
      { title: 'Scheduled Work', body: 'On-date, clean, walked with you at the end.' },
    ],
    related: ['lakeville', 'apple-valley', 'inver-grove-heights', 'exterior-painting'],
    customSections: [
      {
        heading: 'Painting Contractor in Rosemount, MN',
        eyebrow: 'Why Rosemount',
        body: [
          'Sky’s the Limit Painting serves Rosemount from just north in Inver Grove Heights. Owner-run and prep-first: homes, rentals, offices, and the parking lots that serve them.',
          'Rosemount mixes established neighborhoods with newer development and working commercial and industrial properties. That mix is exactly where a one-contractor operation earns its keep — the same visit can scope a building repaint and a lot re-stripe, and rental turnovers need painters who schedule to your turnover date and confirm it in writing, because the next tenant is already scheduled.',
          'Call or text 651-410-4196 for a free estimate.',
        ],
      },
      {
        heading: 'Residential and Rental Painting in Rosemount',
        eyebrow: 'Homes and rentals',
        body: [
          'Owner-occupied repaints get the full prep treatment: scrape, prime, caulk, topcoat with exterior-grade paint on the outside; protection-first interiors on the inside. Rental turnovers get a different gear — fast, clean, durable finishes on a hard date, because vacancy costs more than paint.',
          'Either way the quote is written and line-itemed before work starts. No surprises at turnover is the whole point.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
        ],
      },
      {
        heading: 'Commercial Painting and Striping in Rosemount',
        eyebrow: 'Businesses',
        body: [
          'Rosemount’s commercial and industrial properties need painters who work around operations, not through them. We schedule after hours and weekends, stage cleanly, and keep communication to one owner-led thread.',
          'The lot work rides along: re-stripes, ADA stalls and access aisles, fire lanes, arrows, crosswalks, and full new-lot layouts. Winter plowing degrades markings every year — a spring walkthrough identifies worn markings before they become a liability problem.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'parking lot striping', href: '/painting-services/parking-lot-striping' },
          { text: 'ADA parking lot striping', href: '/painting-services/ada-parking-lot-striping' },
          { text: 'pavement marking', href: '/painting-services/pavement-marking' },
        ],
      },
      {
        heading: 'How a Rosemount Project Runs',
        eyebrow: 'Process',
        body: [
          'Call or text 651-410-4196, tell us what you are looking at, and we will walk it with you — measure, scope the prep, hand you a written number. Then we show up on the date we said and walk the finished work with you.',
        ],
        links: [
          { text: 'free estimate', href: '/estimate' },
          { text: 'our capabilities', href: '/capabilities' },
        ],
      },
      {
        heading: 'Serving Rosemount and Dakota County',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Rosemount and the surrounding Dakota County suburbs — Lakeville, Apple Valley, Eagan, Farmington, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in Lakeville', href: '/service-areas/lakeville' },
          { text: 'painting contractor in Apple Valley', href: '/service-areas/apple-valley' },
        ],
      },
    ],
    faq: [
      {
        question: 'Do you handle rental turnovers on tight timelines?',
        answer: 'Yes — tell us the turnover date at first contact and we will tell you straight whether we can hit it. The quote and schedule go in writing before work starts.',
      },
      {
        question: 'Can you paint our building and stripe the lot in one visit?',
        answer: 'Yes. One walkthrough, one written quote, one schedule — building and lot under a single contract.',
      },
      {
        question: 'Do you do industrial or warehouse painting?',
        answer: 'Tell us about the facility at the walkthrough — coatings, access, and scheduling around operations. If it is in our scope we will quote it; if not, we will say so.',
      },
      {
        question: 'Are estimates really free?',
        answer: 'Yes. Walkthrough, measurement, and a written quote cost nothing — for houses, buildings, and lots alike.',
      },
    ],
  },
  {
    kind: 'area',
    slug: 'cottage-grove',
    title: 'Cottage Grove Painting Contractor',
    shortTitle: 'Cottage Grove',
    eyebrow: 'Washington County / east metro',
    headline: 'Owner-operated painting in Cottage Grove — river-town homes and east-metro commercial.',
    description:
      'Sky’s the Limit Painting LLC serves Cottage Grove with residential painting, commercial painting, and parking lot striping. Based in Inver Grove Heights, across the metro east.',
    metaTitle: 'Cottage Grove Painting Contractor',
    metaDescription:
      'House painting, commercial painting & parking lot striping in Cottage Grove, MN. Owner-operated, free estimates. Call 651-410-4196.',
    image: '/brand/generated/sky-local-authority.webp',
    accent: 'East metro local',
    market: 'Residential',
    proof: [
      'Based in Inver Grove Heights, serving Cottage Grove',
      'Owner-led project communication',
      'Residential, commercial, and striping from one owner-led operation',
      'Free walkthroughs, written quotes',
    ],
    scope: [
      'Interior repainting',
      'Exterior repaints',
      'Deck and fence staining',
      'Commercial interiors and exteriors',
      'Parking lot striping and ADA stalls',
    ],
    process: [
      { title: 'Call or Text', body: 'Tell us the project and where in Cottage Grove it is.' },
      { title: 'Walkthrough', body: 'We measure, scope prep, and talk finishes and timing.' },
      { title: 'Written Quote', body: 'One number, line-itemed.' },
      { title: 'Scheduled Work', body: 'On-date arrival, clean site, final walkthrough.' },
    ],
    related: ['inver-grove-heights', 'south-st-paul', 'st-paul', 'deck-fence-staining'],
    customSections: [
      {
        heading: 'Painting Contractor in Cottage Grove, MN',
        eyebrow: 'Why Cottage Grove',
        body: [
          'Sky’s the Limit Painting serves Cottage Grove from our Inver Grove Heights home base, just east across the metro. Owner-run, prep-first — homes near the river valley, established neighborhoods, and the commercial corridors that serve them.',
          'Cottage Grove homes face the full Minnesota weather range — freeze-thaw, sun, and wind — which is why exterior prep matters more here than the paint brand on the can. Decks and fences are a standing ask: strip, brighten, and stain them on the right cycle and they last years longer.',
          'Call or text 651-410-4196 for a free estimate.',
        ],
      },
      {
        heading: 'Exterior Painting and Deck Staining in Cottage Grove',
        eyebrow: 'Exteriors',
        body: [
          'Exterior repaints follow the full prep sequence: scrape to sound surface, prime bare wood, caulk gaps, topcoat with exterior-grade paint built for Minnesota freeze-thaw. Siding, trim, soffits, fascia — and the garage and outbuildings too.',
          'Decks and fences get their own process: wash, strip or brighten as needed, then stain with product matched to sun exposure and wood condition. Done on cycle, a stained deck stays a long-term asset instead of an early replacement.',
        ],
        links: [
          { text: 'exterior painting', href: '/painting-services/exterior-painting' },
          { text: 'deck and fence staining', href: '/painting-services/deck-fence-staining' },
        ],
      },
      {
        heading: 'Interior Painting in Cottage Grove',
        eyebrow: 'Interiors',
        body: [
          'Whole-home repaints, single rooms, basements, and stairwells — year-round, scheduled around your household. Floors, furniture, and fixtures protected before a drop of paint moves.',
        ],
        links: [
          { text: 'interior painting', href: '/painting-services/interior-painting' },
          { text: 'cabinet painting', href: '/painting-services/cabinet-painting' },
        ],
      },
      {
        heading: 'Commercial Painting and Striping in Cottage Grove',
        eyebrow: 'Businesses',
        body: [
          'Cottage Grove’s retail, office, and service commercial properties get scheduling built around your business hours where access allows, clean staging, and one owner-led point of contact.',
          'Lot work rides on the same contract: re-stripes, ADA stalls and access aisles, fire lanes, arrows, and crosswalks. One walkthrough covers building and lot.',
        ],
        links: [
          { text: 'commercial painting', href: '/painting-services/commercial-painting' },
          { text: 'parking lot striping', href: '/painting-services/parking-lot-striping' },
          { text: 'ADA parking lot striping', href: '/painting-services/ada-parking-lot-striping' },
        ],
      },
      {
        heading: 'Serving Cottage Grove and the East Metro',
        eyebrow: 'Service area',
        body: [
          'Based in Inver Grove Heights, MN. We serve Cottage Grove and the east metro — South St. Paul, St. Paul Park, Woodbury, Hastings, and the wider Twin Cities metro.',
        ],
        links: [
          { text: 'full service-area map', href: '/service-area' },
          { text: 'painting contractor in South St. Paul', href: '/service-areas/south-st-paul' },
          { text: 'painting contractor in Woodbury', href: '/service-areas/woodbury' },
        ],
      },
    ],
    faq: [
      {
        question: 'How often should a deck be re-stained in Minnesota?',
        answer: 'It depends on sun exposure and the previous product — most decks need attention every few years. We will assess yours at the walkthrough and tell you straight whether it needs a wash, a re-stain, or a full strip.',
      },
      {
        question: 'Do you paint in winter in Cottage Grove?',
        answer: 'Exteriors are spring through fall. Interiors, cabinets, and commercial interiors run year-round — winter is actually our busiest interior season.',
      },
      {
        question: 'Can you handle both our building and our lot?',
        answer: 'Yes — painting and striping on one contract, one walkthrough, one schedule.',
      },
      {
        question: 'Are your estimates free?',
        answer: 'Yes. Walkthrough, measurement, and written quote — free for homes, buildings, and lots.',
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
    image: '/brand/generated/chatgpt/sky-finished-room.webp',
    imageCaption: {
      label: 'Illustration',
      text: 'Stylized surface illustration — real surfaces get the written scope.',
    },
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
    image: '/brand/generated/chatgpt/sky-surface-prep.webp',
    imageCaption: {
      label: 'Illustration',
      text: 'Stylized surface illustration — real surfaces get the written scope.',
    },
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
    image: '/brand/generated/chatgpt/sky-commercial-facade.webp',
    imageCaption: {
      label: 'Illustration',
      text: 'Stylized surface illustration — real surfaces get the written scope.',
    },
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
    related: ['commercial', 'pavement-marking', 'public-sector', 'parking-lot-striping-pricing'],
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
    related: ['parking-lot-striping', 'commercial', 'public-sector', 'parking-lot-striping-pricing'],
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
    related: ['pavement-marking', 'parking-lot-striping', 'commercial-painting', 'parking-lot-striping-pricing'],
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
          'Minnesota lots fail ADA checks for a handful of repeat reasons — and winter is behind most of them. Plow blades scrape flat-painted symbols in the drive path first; when the wheelchair symbol wears away, the space stops reading as accessible even if the stall is still wide enough. Access aisles get painted too narrow, or painted correctly and then used as a drive lane or snow-storage strip all winter.',
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
          'The fastest path to a real number is a free on-site measurement: we walk the lot, count stalls, check the surface and the ADA layout, and hand you a written, itemized quote. Call 651-410-4196 or start your written scope below — it enters the commercial estimate path.',
        ],
        links: [
          { text: 'start your written scope', href: '#start-scope' },
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
        answer: 'Comparing like for like, restriping is cheaper: same layout, fresh paint, no design time. A new layout adds measuring, chalking, and old-mark removal — worth it when the layout is wrong (wrong stall sizes, bad flow, ADA gaps), not when only the paint has faded.',
      },
      {
        question: 'How often should a Minnesota lot be restriped?',
        answer: 'Most commercial lots need fresh paint every few years. Heavy plow exposure shortens that — plows scrape flat-painted lines and symbols every winter. A spring walkthrough catches fading before it becomes a compliance or appearance problem.',
      },
      {
        question: 'Do ADA markings add to the cost?',
        answer: 'Accessible spaces, van-accessible stall markings, and stencils are line items on the quote — and they are the cheapest compliance protection a property manager can buy. We quote them transparently as part of the layout, not as surprises.',
      },
      {
        question: 'Can I get a quote without a site visit?',
        answer: 'You can get a preliminary estimate from clear lot photos (aerial or wide shots), a stall count, and knowing whether it is a restripe or new layout. The final quote is confirmed on a walk-through so the surface condition does not surprise either of us.',
      },
    ],
  },
  {
    kind: 'service',
    schemaKind: 'article',
    slug: 'ada-striping-requirements-minnesota',
    title: 'ADA Parking Lot Striping Requirements: A Minnesota Property Owner’s Guide',
    shortTitle: 'ADA Requirements Guide',
    eyebrow: 'Compliance / ADA guide',
    headline: 'ADA parking lot striping requirements, explained for Minnesota property owners.',
    description:
      'A Minnesota property owner’s plain-language guide to ADA accessible-parking striping requirements — space counts, van-accessible spaces, access aisles, and signage — plus what Minnesota adds on top.',
    metaTitle: 'ADA Striping Requirements in Minnesota — Property Owner Guide',
    metaDescription:
      'ADA parking lot striping requirements for Minnesota owners: accessible spaces, van spaces, access aisles, signage. Free walkthroughs. Call 651-410-4196.',
    image: '/brand/generated/sky-public-authority.webp',
    accent: 'Compliance guidance',
    market: 'Commercial',
    proof: [
      'Plain-language summary of the federal ADA framework',
      'Minnesota-specific verification steps',
      'Based on the 2010 ADA Standards for Accessible Design',
      'Not legal advice — verify with your local authority',
    ],
    scope: [
      'Accessible space counts by lot size',
      'Van-accessible space requirements',
      'Access aisles',
      'Signage rules',
      'Minnesota code-layer checklist',
    ],
    process: [
      { title: 'Assessment', body: 'Walk the lot: count spaces, measure accessible stalls and aisles, check signage and slopes.' },
      { title: 'Layout Plan', body: 'Chalk a layout that hits space counts, van ratio, widths, and closest-to-entrance placement.' },
      { title: 'Restripe', body: 'Professional striping, surface prep, and stencils for ISA symbols, arrows, and lettering.' },
      { title: 'Verify', body: 'Confirm the finished layout against the requirements before the crew leaves.' },
    ],
    related: ['ada-parking-lot-striping', 'parking-lot-striping', 'pavement-marking', 'commercial-painting'],
    customSections: [
      {
        heading: 'ADA Parking Lot Striping Requirements: A Minnesota Property Owner’s Guide',
        eyebrow: 'The guide',
        body: [
          'This guide explains the federal ADA framework for accessible parking striping in plain language — space counts, van-accessible spaces, access aisles, and signage — and where Minnesota’s own rules layer on top. It is a starting point, not legal advice: requirements change, and your city may ask for more than the federal minimum. Verify your layout with your local authority before you stripe.',
          'If you are a property manager staring at a faded lot and wondering what you actually owe, this guide lets you read your own lot the way an inspector would. When you are ready to fix what you find, our ADA striping services page covers what we do about it.',
        ],
        links: [
          { text: 'ADA parking lot striping services', href: '/painting-services/ada-parking-lot-striping' },
          { text: 'free estimate', href: '/estimate' },
        ],
      },
      {
        heading: 'The Federal Framework: 2010 ADA Standards for Accessible Design',
        eyebrow: 'The Standards',
        body: [
          'Accessible parking under the ADA is not just a blue wheelchair symbol. The 2010 ADA Standards for Accessible Design set specific, measurable requirements for parking on lots open to the public. Here is the framework in plain terms.',
          'Space counts scale with lot size, and the standards define the required share of van-accessible spaces, minimum widths for spaces and access aisles, slope limits, and sign mounting rules. We do not reproduce the federal tables here — requirements change, and Minnesota building code and your city can add requirements on top of the federal floor. Use this guide as the shape of the rules, then verify the exact numbers for your lot with your local authority having jurisdiction before you stripe.',
          'Accessible spaces must also be on the shortest accessible route to the building entrance. Again — this is a summary, not the code book. Read it as the floor your lot has to clear, then verify the details with your local authority.',
        ],
        links: [
          { text: 'ADA pavement marking services', href: '/painting-services/pavement-marking' },
          { text: 'parking lot striping services', href: '/painting-services/parking-lot-striping' },
        ],
      },
      {
        heading: 'What Minnesota Adds on Top',
        eyebrow: 'Minnesota',
        body: [
          'The ADA is federal law, but it is not the only rulebook. Minnesota adopts its own building code and accessibility provisions, and cities and counties can add requirements beyond the federal floor — on accessible-space counts, stall and aisle dimensions, or how the accessible route connects to the building entrance. A layout that clears the federal Standards can still fail a local inspection.',
          'The practical move: verify the layout with your local authority having jurisdiction — your city’s building department or the county — before a new layout or a major restripe. Local inspectors enforce local rules, and they are the ones who sign off. When we do an ADA layout assessment on a walkthrough, we check the configuration against the current requirements and flag anything that needs local confirmation — then you stripe once, not twice.',
        ],
        links: [
          { text: 'ADA layout assessments', href: '/painting-services/ada-parking-lot-striping' },
          { text: 'free estimate', href: '/estimate' },
        ],
      },
      {
        heading: 'Where Minnesota Lots Go Wrong',
        eyebrow: 'What fails',
        body: [
          'Minnesota lots fail for a handful of repeat reasons, and winter is behind most of them. Plow blades scrape flat-painted wheelchair symbols in the drive path first — when the symbol wears away, the space stops reading as accessible even if the stall is still wide enough. Access aisles get painted too narrow, or painted correctly and then used as a drive lane or snow-storage strip all winter.',
          'We also see lots with accessible spaces but no van space, van-width spaces without the “van-accessible” sign, signs mounted too low or knocked out by a January storm, and wrong counts after a restripe added a few extra stalls. Older asphalt settles too — what graded at 1:48 when poured can exceed it ten winters later.',
          'The pattern is always the same: the layout drifts while the paint fades, and nobody catches it until a complaint or an inspection. A spring walkthrough of the accessible stalls and aisles is the cheapest compliance insurance a property manager can buy — it costs a phone call.',
        ],
      },
      {
        heading: 'What To Do About It',
        eyebrow: 'Next steps',
        body: [
          'Start with an assessment, not paint. Walk the lot, count total and accessible spaces, measure stall and aisle widths, check sign heights, and note the slopes. Compare what you find against the framework above and your local rules. Then restripe to a compliant layout — crisp lines, correct symbols, proper signage — and keep a record of what the finished layout meets.',
          'That is exactly what our ADA walkthrough does: free, on your lot, measured and documented, with a written number for the restripe. No legal advice, no guesswork — a layout you can defend.',
        ],
        links: [
          { text: 'ADA parking lot striping services', href: '/painting-services/ada-parking-lot-striping' },
          { text: 'free estimate', href: '/estimate' },
        ],
      },
    ],
    faq: [
      {
        question: 'Are ADA striping rules the same in every Minnesota city?',
        answer: 'No. The federal ADA Standards are the floor every lot must clear, but Minnesota’s building code and local city or county rules can add requirements on top. Verify the layout with your local authority having jurisdiction before you stripe.',
      },
      {
        question: 'How many accessible spaces does my lot need?',
        answer: 'It scales with lot size: the required number of accessible spaces grows with total stall count, and a defined share of those must be van-accessible. We check the count on every lot walkthrough and flag anything that needs confirmation with your local authority.',
      },
      {
        question: 'What makes a van-accessible space different?',
        answer: 'The 2010 ADA Standards allow two compliant van layouts: a van space at least 132 inches wide beside a 60-inch access aisle, or — as an alternate — a van space at least 96 inches wide beside a 96-inch access aisle. Either way the space carries a sign reading “van-accessible” mounted at the required height, and the access aisle adjoins an accessible route. Confirm the layout with your local authority having jurisdiction before you stripe.',
      },
      {
        question: 'Do painted wheelchair symbols satisfy the signage rule?',
        answer: 'No. Painted symbols are markings, not signage — the federal rule requires the raised sign mounted at the correct height. Paint alone fails the sign requirement.',
      },
      {
        question: 'How often should a Minnesota lot be restriped?',
        answer: 'When the markings stop reading clearly — plows wear accessible symbols first. Schedule a walkthrough each spring, and restripe when lines, symbols, or aisles no longer read as compliant.',
      },
    ],
  },
  {
    kind: 'service',
    schemaKind: 'article',
    slug: 'how-to-choose-commercial-painter',
    title: 'How to Choose a Commercial Painting Contractor in the Twin Cities',
    shortTitle: 'Choosing a Commercial Painter',
    eyebrow: 'Buyer guide',
    headline: 'How to choose a commercial painting contractor in the Twin Cities — the vetting checklist.',
    description:
      'Choosing a commercial painter in the Twin Cities? The vetting checklist: written scope, insurance and COI, scheduling around operations, phased work, references, and the red flags that should end the conversation.',
    metaTitle: 'How to Choose a Commercial Painter — Twin Cities Guide',
    metaDescription:
      'How to choose a commercial painting contractor: written scope, insurance, scheduling, references, red flags. Twin Cities buyer’s checklist. Free estimates.',
    image: '/brand/generated/sky-commercial-authority.webp',
    accent: 'Buyer guidance',
    market: 'Commercial',
    proof: [
      'Vetting checklist for Twin Cities commercial painting',
      'What to ask, what to require, what to walk away from',
      'Applies to offices, retail, multi-tenant, and restaurants',
      'No sales pitch — a buyer’s checklist',
    ],
    scope: [
      'Written scope checklist',
      'Insurance and documentation checks',
      'Operations-safe scheduling',
      'Red-flag screening',
      'Bid comparison method',
    ],
    process: [
      { title: 'Define the Job', body: 'Write down the spaces, the surfaces, the timeline, and your operating hours.' },
      { title: 'Get 2–3 Written Bids', body: 'Compare line-itemed scopes, not just bottom-line numbers.' },
      { title: 'Check Insurance and References', body: 'Certificate of insurance and calls to two recent commercial clients.' },
      { title: 'Award on Scope', body: 'Pick the contractor whose scope and schedule match your operation, not the lowest number.' },
    ],
    related: ['commercial-painting', 'parking-lot-striping', 'twin-cities', 'interior-painting'],
    customSections: [
      {
        heading: 'How to Choose a Commercial Painting Contractor in the Twin Cities',
        eyebrow: 'The checklist',
        body: [
          'Hiring a commercial painter is a procurement decision, not a decorating one. The wrong contractor costs you tenant complaints, schedule slips, and a repaint in two years; the right one is invisible — the work happens around your operation and the building just looks maintained. This checklist is how you tell them apart before money moves.',
          'Work through it in order: define the job, require a written scope, verify insurance, pin down scheduling, meet the person running the job, check references, and watch for red flags. It applies whether you are hiring us or anyone else — the checklist does not change.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'free estimate', href: '/estimate' },
        ],
      },
      {
        heading: 'Start With a Written Scope',
        eyebrow: 'Scope first',
        body: [
          'A real commercial bid is a document, not a number. The written scope should name every space being painted, the surfaces in each space, the prep being done (scrape, patch, prime, caulk — specified, not assumed), the products going on, and the schedule. If the prep is not specified in writing, you are not getting the prep.',
          'The scope should also cover change orders: what happens when the job reveals something behind the walls, and how extras get priced and approved. A contractor who will not put the scope in writing will not honor it in practice. That is the first and biggest filter.',
        ],
      },
      {
        heading: 'Verify Insurance and Documentation',
        eyebrow: 'Paperwork',
        body: [
          'Before work starts, require a certificate of insurance and confirm coverage is current — general liability at minimum, plus workers’ compensation coverage for the crew that will be in your building, or a valid documented statutory exemption (for example, an owner-operator exemption under Minnesota Statute 176.041). Ask whether the people on your site are employees or subcontractors, and get the answer in the scope.',
          'This is not adversarial; it is standard commercial procurement. Any established Twin Cities commercial painter produces a COI on request. One that stalls or deflects is telling you something.',
        ],
      },
      {
        heading: 'Pin Down Scheduling Around Your Operations',
        eyebrow: 'Operations',
        body: [
          'The bid means nothing without a schedule that fits your operation. For offices: after hours and weekends, with common areas open during the day. For retail and restaurants: nights and between-services windows, with the site clean and open on time every morning. For multi-tenant: phased work — suite by suite or floor by floor — so occupied spaces stay running.',
          'Get the schedule in writing in the scope: start date, work windows, completion date, and what happens if the contractor slips. Then hold them to it.',
        ],
      },
      {
        heading: 'Ask Who Actually Runs the Job',
        eyebrow: 'Accountability',
        body: [
          'Know the name of the person accountable for your building. Who is the crew lead on site day to day? Who is your single point of contact if something is wrong? What happens when a question comes up at 6 a.m. before opening?',
          '“Can’t name the crew lead” is a red flag (see below). The estimator who sells the job is often not the person who shows up — that is fine, as long as the person who shows up has a name and a phone number before work begins.',
        ],
      },
      {
        heading: 'Check Commercial References — Then Call Them',
        eyebrow: 'References',
        body: [
          'Ask for two or three recent commercial clients with comparable work: similar building type, similar schedule constraints. Then call them and ask the questions that matter — did the crew show up when they said, did the schedule hold, how was the site left every day, would you hire them again for the next building?',
          'Glossy project photos prove a contractor can paint. References prove a contractor can run a job. They are different skills.',
        ],
      },
      {
        heading: 'Red Flags That Should End the Conversation',
        eyebrow: 'Walk away',
        body: [
          'Some bids disqualify themselves. No written quote — just a number on a napkin or a verbal “we’ll take care of it.” A demand for a large deposit before work starts; standard commercial work runs on reasonable progress terms, not big money up front. Can’t name the crew lead. Can’t produce a certificate of insurance. A vague or shifting timeline. And a price far below every other bid with no explanation — that is not a deal, it is a scope that will grow once your building is torn apart.',
          'One red flag ends the conversation. You do not need to debate it.',
        ],
      },
      {
        heading: 'Comparing Bids Fairly — and What To Bring to the Walkthrough',
        eyebrow: 'Compare and close',
        body: [
          'Lay the bids side by side and compare scope to scope: same spaces, same prep, same products, same schedule windows. The lowest number usually means the thinnest scope — and the “savings” come back as change orders. Award on the scope and the schedule, not the number alone.',
          'When you are ready to get bids, bring the walkthrough the facts it needs: the spaces and surfaces, your operating hours, the timeline you are working against, and any constraints (tenant communication, GC sequencing, building rules). The better the contractor understands your operation, the better the quote. Start with a free estimate and see how the walkthrough goes.',
        ],
        links: [
          { text: 'commercial painting services', href: '/painting-services/commercial-painting' },
          { text: 'free estimate', href: '/estimate' },
        ],
      },
    ],
    faq: [
      {
        question: 'Should I get multiple bids for a commercial painting job?',
        answer: 'Yes — two or three, all in writing. Compare scope to scope: spaces, prep, products, schedule. The lowest number usually means the thinnest scope.',
      },
      {
        question: 'Is a large deposit normal for commercial painting?',
        answer: 'No. A large deposit demanded before work starts is a red flag. Standard commercial work runs on reasonable progress terms agreed in the written scope.',
      },
      {
        question: 'Can commercial painting happen during business hours?',
        answer: 'It can, but it should not have to — most offices, retail, and restaurant work is scheduled after hours or in phases. If a contractor insists on painting through your operating hours, question the plan.',
      },
      {
        question: 'What is the difference between a commercial and a residential painter?',
        answer: 'Scheduling and accountability: after-hours windows, phased work across occupied spaces, written scopes with schedule dates, insurance documentation, and coordination with property managers or GCs.',
      },
      {
        question: 'Do I need a written contract, or is a written quote enough?',
        answer: 'A written, line-itemed quote with the schedule in it covers most commercial repaints — spaces, prep, products, schedule, and change-order terms. Bigger jobs get a formal contract. Verbal agreements cover nothing.',
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

export interface LandingPageCard {
  slug: string;
  shortTitle: string;
  eyebrow: string;
  kind: LandingPageKind;
  href: string;
}

/**
 * Compute the small set of related-card summaries for a landing page.
 * Kept here (server-side) so client components receive only the card
 * summaries instead of importing the full landing-page catalog.
 */
export function getLandingPageCards(page: LandingPage, count = 4): LandingPageCard[] {
  const siblings = page.kind === 'area' ? areaLandingPages : serviceLandingPages;
  const relatedPages = page.related
    .map((relatedSlug) => landingPageBySlug(relatedSlug))
    .filter((related): related is LandingPage => Boolean(related));
  const cards = [
    ...relatedPages,
    ...siblings.filter(
      (sibling) => sibling.slug !== page.slug && !relatedPages.some((related) => related.slug === sibling.slug),
    ),
  ].slice(0, count);
  return cards.map((card) => ({
    slug: card.slug,
    shortTitle: card.shortTitle,
    eyebrow: card.eyebrow,
    kind: card.kind,
    href: landingPagePath(card),
  }));
}
