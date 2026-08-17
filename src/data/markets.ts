import { Building2, ClipboardCheck, Home, Landmark, LucideIcon, PaintRoller, Ruler, ShieldCheck } from 'lucide-react';

export type MarketSlug = 'residential' | 'commercial' | 'public-sector';

export interface MarketCapability {
  title: string;
  body: string;
}

export interface Market {
  slug: MarketSlug;
  navLabel: string;
  number: string;
  title: string;
  headline: string;
  summary: string;
  description: string;
  image: string;
  heroImage: string;
  heroAlt: string;
  icon: LucideIcon;
  accent: string;
  proof: string[];
  capabilities: MarketCapability[];
  process: MarketCapability[];
  cta: string;
  metaTitle: string;
  metaDescription: string;
}

export const markets: Market[] = [
  {
    slug: 'residential',
    navLabel: 'Residential',
    number: '01',
    title: 'Residential Painting',
    headline: 'A calmer, cleaner residential painting experience — built around your home, your schedule, and a finish worth living with.',
    summary: 'Whole-home interiors, kitchens, baths, accent walls, cabinet refinishing, trim, ceilings, decks, and fences. One room or the entire house — every project begins with protection, preparation, and a clear plan for your space.',
    description:
      'Residential work is personal. Sky’s the Limit Painting brings owner-led accountability, careful protection, clear communication, surface prep, and finish quality into homes across Inver Grove Heights and the Twin Cities Metro.',
    image: '/images/site/iphone-interior-painting-progress.webp',
    heroImage: '/images/site/marketing-hero-exterior-painting.webp',
    heroAlt: 'Painter coating exterior trim beside masked windows and protected landscaping',
    icon: Home,
    accent: 'Warm detail',
    proof: ['Interior and exterior repainting', 'Protection, prep, and daily jobsite care', 'Final walkthrough with the owner'],
    capabilities: [
      {
        title: 'Interior Finish Work',
        body: 'Walls, ceilings, trim, doors, and detail areas painted with careful masking, clean lines, and respect for the space.',
      },
      {
        title: 'Exterior Refreshes',
        body: 'Exterior surfaces approached with prep-first thinking, weather awareness, and attention to curb appeal.',
      },
      {
        title: 'Prep And Protection',
        body: 'Patching, sanding, caulking, masking, covering, and cleanup treated as part of the job, not an afterthought.',
      },
    ],
    process: [
      { title: 'Walk The Space', body: 'Confirm rooms, surfaces, access, protection needs, finish expectations, and timeline.' },
      { title: 'Protect And Prep', body: 'Cover surfaces, patch problem areas, sand, caulk, mask, and prime where needed.' },
      { title: 'Paint With Control', body: 'Apply clean coats with attention to lines, coverage, sheen, and the feel of the finished room.' },
      { title: 'Review And Clean', body: 'Walk the work, clean the area, and confirm the details before wrapping the job.' },
    ],
    cta: 'Plan A Residential Project',
    metaTitle: 'Residential Painting | Sky’s the Limit Painting LLC',
    metaDescription:
      'Residential painting in Inver Grove Heights, Minneapolis, St. Paul, and the Twin Cities Metro. Owner-led prep, careful home protection, clear communication, and refined finishes.',
  },
  {
    slug: 'commercial',
    navLabel: 'Commercial',
    number: '02',
    title: 'Commercial Painting',
    headline: 'Reliable commercial painting for properties where presentation and schedule matter.',
    summary:
      'Retail stores, offices, multi-family common areas, warehouses, and more. Professional finishes delivered on your timeline with minimal disruption to your customers, employees, or daily operations.',
    description:
      'Commercial projects need more than paint on walls. Registered under NAICS Code 238320 (Painting and Wall Covering Contractors) and UNSPSC Code 72151300, we provide the documentation, safety protocols, and execution that retail, office, and industrial properties require.',
    image: '/images/site/iphone-commercial-door-frame.webp',
    heroImage: '/images/site/iphone-commercial-door-frame.webp',
    heroAlt: 'Painter coating a protected commercial door frame',
    icon: Building2,
    accent: 'Commercial discipline',
    proof: ['Commercial interiors and exteriors', 'NAICS Code 238320 Registered', 'Schedule-aware communication'],
    capabilities: [
      {
        title: 'Business Interiors',
        body: 'Interior repainting for shops, offices, retail spaces, workrooms, and commercial areas that need a sharper presentation.',
      },
      {
        title: 'Property Refreshes',
        body: 'Commercial exterior and common-area painting with a focus on curb appeal, durability, and clean execution.',
      },
      {
        title: 'Occupied-Space Awareness',
        body: 'Communication around access, timing, protection, and cleanup so the work fits the business environment.',
      },
    ],
    process: [
      { title: 'Define The Scope', body: 'Clarify surfaces, access, schedule windows, disruption risks, materials, and finish expectations.' },
      { title: 'Prep The Property', body: 'Protect floors, fixtures, merchandise, office areas, and surrounding surfaces before coating starts.' },
      { title: 'Execute Cleanly', body: 'Work with steady communication, organized staging, and a finish that improves the property.' },
      { title: 'Close The Loop', body: 'Review completion items, cleanup, touchups, and any documentation needed for the job record.' },
    ],
    cta: 'Discuss A Commercial Job',
    metaTitle: 'Commercial Painting | Sky’s the Limit Painting LLC',
    metaDescription:
      'Commercial painting for Twin Cities shops, offices, facilities, and properties with organized communication, clean execution, and durable finishes.',
  },
  {
    slug: 'public-sector',
    navLabel: 'Public Sector',
    number: '03',
    title: 'Public Sector Opportunities',
    headline: 'Documentation-minded painting, facility, and striping readiness for qualified public opportunities.',
    summary:
      'Schools, municipal buildings, government facilities, and public infrastructure. Insured and prepared for qualified opportunities requiring organized documentation and compliance-minded communication.',
    description:
      'Sky’s the Limit Painting is building a documented path for public-sector painting, facility, and pavement-marking work across Minnesota. We are registered under NAICS Code 238320 (Painting and Wall Covering) and maintain the safety, insurance, and documentation discipline public-sector conversations require.',
    image: '/images/services/striping/SkyLLP_ParkingLot_Striping.webp',
    heroImage: '/brand/generated/sky-public-authority.webp',
    heroAlt: 'Parking striping, elevated pole painting, and a branded work vehicle',
    icon: Landmark,
    accent: 'Public-sector ready',
    proof: ['NAICS Code 238320 readiness', 'General liability & auto coverage', 'Registered MN Specialty Contractor IR816596'],
    capabilities: [
      {
        title: 'Facilities And Public Spaces',
        body: 'Facility repainting, public-building surfaces, interior and exterior maintenance painting, and public-facing property refreshes.',
      },
      {
        title: 'Marking And Striping',
        body: 'Pavement marking, parking-lot striping, road-striping opportunities, traffic-flow markings, and safety visibility work where appropriate.',
      },
      {
        title: 'Infrastructure Surfaces',
        body: 'Light pole painting, guardrail painting, sign painting, and exterior specialty surfaces approached as capability and readiness targets.',
      },
    ],
    process: [
      { title: 'Document The Scope', body: 'Clarify surfaces, quantities, access, requirements, schedule, safety notes, and submission expectations.' },
      { title: 'Prepare The Work', body: 'Plan prep, protection, materials, equipment, traffic or access considerations, and communication checkpoints.' },
      { title: 'Execute To Spec', body: 'Work toward clear scope requirements, clean staging, surface prep, coating quality, and jobsite follow-through.' },
      { title: 'Verify Completion', body: 'Confirm visible finish, cleanup, punch items, photos, and documentation requested for qualified opportunities.' },
    ],
    cta: 'Discuss Public-Sector Readiness',
    metaTitle: 'Public Sector Painting Opportunities | Sky’s the Limit Painting LLC',
    metaDescription:
      'Sky’s the Limit Painting is preparing to compete for Minnesota city, county, and state painting, facility, striping, and pavement-marking opportunities.',
  },
];

export const marketBySlug = markets.reduce<Record<MarketSlug, Market>>((acc, market) => {
  acc[market.slug] = market;
  return acc;
}, {} as Record<MarketSlug, Market>);

export const trustPillars = [
  { title: 'Registered MN Specialty Contractor', body: 'Registered Minnesota Specialty Contractor (Painting) with general liability coverage in place.', icon: ShieldCheck },
  { title: 'Owner-Operated And Trade-Built', body: 'Led by Anthony Briseno with Journeyworker Painter & Decorator apprenticeship background.', icon: PaintRoller },
  { title: 'Commercial Auto And Tools Coverage', body: 'Coverage in place for serious residential, commercial, and qualified public-sector opportunities.', icon: ClipboardCheck },
  { title: 'Scope Clarity And Follow-Through', body: 'Built around clear communication, prepared surfaces, clean execution, and a finished record.', icon: Ruler },
];

export const supportingImages = {
  exterior: '/images/site/iphone-exterior-prep-front-entry.webp',
  prep: '/images/site/iphone-interior-painting-progress.webp',
  commercialReal: '/images/site/iphone-commercial-door-frame.webp',
  interiorBeforeAfter: '/images/services/interior/sky-work-real-04-before-after-bedroom.webp',
};
