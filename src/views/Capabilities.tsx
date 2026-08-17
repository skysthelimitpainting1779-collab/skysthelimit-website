import { Award, Building, FileText, Landmark, PaintRoller, Ruler, ShieldCheck } from 'lucide-react';

import JsonLd from '@/components/JsonLd';
import {
  PublicContainer,
  PublicCtaLink,
  PublicFeatureGrid,
  PublicHero,
  PublicPage,
  PublicProofBand,
  PublicSection,
  PublicSectionHeading,
  PublicSplitCard,
} from '@/components/public/PublicSystem';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { breadcrumbSchema, businessSchema } from '@/lib/seo';

const competencies = [
  { icon: Building, title: 'Commercial and facility painting', body: 'Durable coatings, repairs, protection, and precise finish work for retail, office, and property environments.' },
  { icon: Landmark, title: 'Pavement marking and striping', body: 'Parking layout markings, accessibility stencils, curb paint, and traffic-flow visibility work.' },
  { icon: PaintRoller, title: 'Cabinet and millwork spraying', body: 'Multi-stage preparation, primer systems, and controlled spray finishes for wood upgrades.' },
  { icon: Ruler, title: 'Precision prep and trim finish', body: 'Sanding, dust control, caulking, priming, masking, and clean trade-built detail.' },
] as const;

const companyRows = [
  ['Legal entity', "Sky's the Limit Painting LLC"],
  ['Specialty designation', 'Registered Minnesota Specialty Contractor (Painting)'],
  ['DLI registration ID', 'IR816596'],
  ['Employer identification', '41-4832542'],
  ['SWIFT portal ID', 'VN0001223327_1'],
  ['SAM.gov package', 'Registration package in preparation'],
] as const;

export default function CapabilitiesPage() {
  return (
    <PublicPage>
      <JsonLd data={[businessSchema, breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Capabilities', path: '/capabilities' }])]} />

      <PublicHero
        eyebrow="Procurement and bidding"
        title="Capabilities statement."
        description="Commercial, facility, pavement-marking, and qualified public-sector readiness from a registered Minnesota Specialty Contractor."
        image="/images/services/striping/SkyLLP_ParkingLot_Striping.webp"
        imageAlt="Commercial parking lot striping by Sky's the Limit Painting"
        proof={['NAICS 238320', 'MN ID IR816596', 'Fully insured']}
        badgeIcon={Landmark}
        actions={
          <PublicCtaLink href="/documents/skys-the-limit-capabilities-statement.pdf" download icon={FileText} iconPosition="start" size="marketing-lg">
            Download Capabilities PDF
          </PublicCtaLink>
        }
      />

      <PublicProofBand items={['Owner-operated trade execution', 'Documentation-minded scope control', 'Twin Cities Metro coverage']} />

      <PublicSection tone="soft">
        <PublicContainer>
          <PublicSectionHeading eyebrow="Core competencies" title="Defined service lanes. Visible preparation." />
          <div className="mt-12"><PublicFeatureGrid items={competencies} columns={4} /></div>
        </PublicContainer>
      </PublicSection>

      <PublicSection tone="ink">
        <PublicContainer className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <PublicSectionHeading
              eyebrow="Differentiators"
              title="Owner accountability with procurement discipline."
              description="Formal trade training, a preparation-first work sequence, and direct owner oversight reduce the communication layers that make small commercial scopes harder to control."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                { icon: ShieldCheck, title: 'Insurance and compliance', body: 'Acuity commercial general liability, commercial auto, and inland marine coverage. Validation records available.' },
                { icon: FileText, title: 'Owner-operator documentation', body: 'Owner-operator workers compensation exemption under Minnesota Statute 176.041. Attestation documents available upon request.' },
                { icon: Award, title: 'Trade foundation', body: 'Led by Anthony Briseno with a completed Minnesota Journeyworker Painter and Decorator apprenticeship.' },
                { icon: Ruler, title: 'Surface-first estimating', body: 'Access, protection, repairs, preparation, coating system, timing, and closeout are recorded in the scope.' },
              ].map(({ icon: Icon, title, body }) => (
                <Card key={title} variant="proof">
                  <CardHeader>
                    <Icon aria-hidden="true" className="text-trust" />
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          <PublicSplitCard title="Company profile" description="Identifiers supplied for procurement and vendor conversations.">
            <dl className="grid gap-0 border-l border-t border-border">
              {companyRows.map(([label, value]) => (
                <div key={label} className="border-b border-r border-border p-4">
                  <dt className="text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">{label}</dt>
                  <dd className="mt-2 font-mono text-sm font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </PublicSplitCard>
        </PublicContainer>
      </PublicSection>
    </PublicPage>
  );
}
