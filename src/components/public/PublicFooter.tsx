import Link from 'next/link';

import SocialLinks from '@/components/SocialLinks';
import { PublicContainer } from '@/components/public/PublicSystem';
import { Separator } from '@/components/ui/separator';

const columns = [
  {
    title: 'Markets',
    links: [
      ['/residential', 'Residential'],
      ['/commercial', 'Commercial'],
      ['/public-sector', 'Public Sector'],
      ['/projects', 'Recent Work'],
    ],
  },
  {
    title: 'Services',
    links: [
      ['/painting-services/interior-painting', 'Interior Painting'],
      ['/painting-services/exterior-painting', 'Exterior Painting'],
      ['/painting-services/cabinet-painting', 'Cabinet Painting'],
      ['/painting-services/deck-fence-staining', 'Deck & Fence Staining'],
      ['/painting-services/commercial-painting', 'Commercial Painting'],
      ['/painting-services/parking-lot-striping', 'Parking Lot Striping'],
      ['/painting-services/pavement-marking', 'Pavement Marking'],
    ],
  },
  {
    title: 'Service Areas',
    links: [
      ['/service-area', 'Coverage Map'],
      ['/service-areas/inver-grove-heights', 'Inver Grove Heights'],
      ['/service-areas/eagan', 'Eagan'],
      ['/service-areas/woodbury', 'Woodbury'],
      ['/service-areas/st-paul', 'St. Paul'],
    ],
  },
  {
    title: 'Company',
    links: [
      ['/about', 'About Us'],
      ['/capabilities', 'Capabilities Statement'],
      ['/estimate', 'Room Cost Calculator'],
      ['/refer', 'Referral Program'],
      ['/review', 'Google Review Funnel'],
      ['/contact', 'Get an Estimate'],
    ],
  },
] as const;

export default function PublicFooter({ year }: { year: string }) {
  return (
    <footer data-surface="public" className="public-surface" aria-label="Site footer">
      <div data-tone="ink" className="py-16 lg:py-20">
        <PublicContainer>
          <div className="grid gap-12 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <h2 className="public-display text-4xl leading-none">Sky&apos;s the Limit Painting LLC</h2>
              <p className="mt-5 max-w-md text-lg font-semibold text-foreground">Residential detail. Commercial discipline. Public-sector ready.</p>
              <p className="mt-4 max-w-md leading-7 text-muted-foreground">
                Fully insured, owner-operated painting across the Twin Cities Metro. Registered Minnesota Specialty Contractor IR816596.
              </p>
              <div className="mt-7 grid gap-2">
                <a href="tel:+16514104196" data-track="call_click" data-track-payload='{"source":"footer"}' className="text-xl font-bold text-foreground hover:text-primary">
                  651-410-4196
                </a>
                <a href="mailto:skysthelimitpainting1779@gmail.com" className="break-all text-muted-foreground hover:text-foreground">
                  skysthelimitpainting1779@gmail.com
                </a>
              </div>
              <SocialLinks />
            </div>

            {columns.map((column) => (
              <div key={column.title}>
                <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-foreground">{column.title}</h3>
                <nav className="mt-6 flex flex-col gap-3 text-sm text-muted-foreground" aria-label={`${column.title} links`}>
                  {column.links.map(([href, label]) => (
                    <Link key={href} href={href} className="hover:text-foreground">{label}</Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>

          <Separator className="my-10" />
          <div className="flex flex-col gap-4 text-sm text-muted-foreground md:flex-row md:items-end md:justify-between">
            <div className="grid gap-2">
              <p>&copy; {year} Sky&apos;s the Limit Painting LLC. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              </div>
            </div>
            <p className="max-w-2xl md:text-right">
              Registered MN Specialty Contractor IR816596 / Owner exempt from workers&apos; compensation under MN Statute 176.041 / Fully insured / Twin Cities Metro Area
            </p>
          </div>
        </PublicContainer>
      </div>
    </footer>
  );
}
