import { CalendarClock, Phone } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { businessPhone } from '../lib/contact';
import { ENV } from '../lib/env';

interface BookingCtaProps {
  audience?: 'homeowner' | 'commercial' | 'public-sector';
  className?: string;
}

const bookingLabels = {
  homeowner: 'Schedule a Project Walkthrough',
  commercial: 'Schedule a Project Review',
  'public-sector': 'Request a Capability Conversation',
};

export default function BookingCta({ audience = 'homeowner', className = '' }: BookingCtaProps) {
  const bookingUrl = ENV.BOOKING_URL || '';
  const label = audience === 'commercial' 
    ? bookingLabels.commercial 
    : audience === 'public-sector' 
    ? bookingLabels['public-sector'] 
    : bookingLabels.homeowner;

  if (bookingUrl) {
    return (
      <a
        href={bookingUrl}
        target="_blank"
        rel="noreferrer"
        data-track="booking_click"
        data-track-payload={JSON.stringify({ audience })}
        className={cn(buttonVariants({ variant: 'outline', size: 'marketing-lg' }), className)}
      >
        <CalendarClock aria-hidden="true" data-icon="inline-start" />
        {label}
      </a>
    );
  }

  return (
    <a
      href={`tel:${businessPhone}`}
      data-track="booking_click"
      data-track-payload={JSON.stringify({ audience, fallback: 'phone' })}
      className={cn(buttonVariants({ variant: 'outline', size: 'marketing-lg' }), className)}
    >
      <Phone aria-hidden="true" data-icon="inline-start" />
      Call to Schedule
    </a>
  );
}
