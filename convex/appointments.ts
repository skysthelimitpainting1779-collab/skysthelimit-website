import { ConvexError, v } from 'convex/values';

import { internal } from './_generated/api';
import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server';
import {
  CalProviderError,
  fetchCalOrganizationBookings,
} from './lib/cal';
import type {
  CalReconciliationStatus,
  CanonicalCalAppointment,
} from './lib/cal';
import {
  EventIntegrityError,
  applyCalAppointmentEvent,
  claimCalReconciliationPage as claimPage,
  failCalReconciliationPage as failPage,
  persistCalReconciliationPage as persistPage,
  startCalReconciliationJob,
} from './lib/events';
import type { EventContext } from './lib/events';

type CanonicalCalAppointmentState = CanonicalCalAppointment & {
  supersededByProviderBookingUid?: string;
};
type CalReconciliationClaim = Awaited<ReturnType<typeof claimPage>>;
type CalReconciliationPageResult = Awaited<ReturnType<typeof persistPage>>;
type CalReconciliationFailure = Awaited<ReturnType<typeof failPage>>;
type RunCalReconciliationPageResult =
  | ({ accepted: true } & CalReconciliationPageResult)
  | {
      accepted: false;
      terminal: boolean;
      retryAfterMs?: number;
    };

const appointmentStatus = v.union(
  v.literal('scheduled'),
  v.literal('pending'),
  v.literal('cancelled'),
  v.literal('completed'),
  v.literal('rescheduled'),
);

const appointmentTrigger = v.union(
  v.literal('BOOKING_CREATED'),
  v.literal('BOOKING_RESCHEDULED'),
  v.literal('BOOKING_CANCELLED'),
  v.literal('BOOKING_REQUESTED'),
  v.literal('BOOKING_REJECTED'),
  v.literal('RECONCILIATION'),
);

const reconciliationStatus = v.union(
  v.literal('upcoming'),
  v.literal('recurring'),
  v.literal('past'),
  v.literal('cancelled'),
  v.literal('unconfirmed'),
);

const appointment = v.object({
  triggerEvent: appointmentTrigger,
  providerOccurredAt: v.number(),
  providerOrganizationId: v.string(),
  providerBookingUid: v.string(),
  providerBookingId: v.string(),
  providerEventTypeId: v.string(),
  title: v.string(),
  startsAt: v.number(),
  endsAt: v.number(),
  timeZone: v.string(),
  status: appointmentStatus,
  iCalUid: v.optional(v.string()),
  providerSequence: v.optional(v.number()),
  supersedesProviderBookingUid: v.optional(v.string()),
  supersededByProviderBookingUid: v.optional(v.string()),
  participantCount: v.number(),
  participantTimeZones: v.array(v.string()),
});

function eventContext(ctx: unknown): EventContext {
  return ctx as EventContext;
}

export const applyVerifiedCalWebhook = internalMutation({
  args: {
    companyId: v.id('companies'),
    eventId: v.string(),
    payloadHash: v.string(),
    receivedAt: v.number(),
    appointment,
  },
  returns: v.object({
    ok: v.literal(true),
    applied: v.boolean(),
    duplicate: v.boolean(),
    stale: v.boolean(),
    appointmentId: v.id('appointments'),
  }),
  handler: async (ctx, args) => {
    try {
      const result = await applyCalAppointmentEvent(
        eventContext(ctx),
        args as typeof args & {
          appointment: CanonicalCalAppointmentState;
        },
      );
      return { ok: true as const, ...result };
    } catch (error) {
      if (error instanceof EventIntegrityError) {
        throw new ConvexError({
          code: 'conflicting_webhook_identity' as const,
        });
      }
      throw error;
    }
  },
});

export const startCalReconciliation = internalMutation({
  args: {
    companyId: v.id('companies'),
    providerOrganizationId: v.string(),
    runId: v.string(),
    now: v.number(),
  },
  returns: v.object({
    created: v.boolean(),
    jobId: v.id('calReconciliationJobs'),
  }),
  handler: async (ctx, args) =>
    startCalReconciliationJob(eventContext(ctx), {
      ...args,
      schedule: async (jobId, delayMs) => {
        await ctx.scheduler.runAfter(
          delayMs,
          internal.appointments.runCalReconciliationPage,
          { jobId },
        );
      },
    }),
});

export const getCalReconciliationJob = internalQuery({
  args: { jobId: v.id('calReconciliationJobs') },
  handler: async (ctx, args) => ctx.db.get(args.jobId),
});

export const claimCalReconciliationPage = internalMutation({
  args: {
    jobId: v.id('calReconciliationJobs'),
    leaseToken: v.string(),
    now: v.number(),
  },
  handler: async (ctx, args) =>
    claimPage(eventContext(ctx), {
      ...args,
      leaseDurationMs: 5 * 60_000,
      schedule: async (jobId, delayMs) => {
        await ctx.scheduler.runAfter(
          delayMs,
          internal.appointments.runCalReconciliationPage,
          { jobId },
        );
      },
    }),
});

export const persistCalReconciliationPage = internalMutation({
  args: {
    jobId: v.id('calReconciliationJobs'),
    leaseToken: v.string(),
    requestId: v.string(),
    expectedBookingStatus: reconciliationStatus,
    expectedCursor: v.optional(v.string()),
    expectedPageNumber: v.number(),
    observedAt: v.number(),
    appointments: v.array(appointment),
    hasMore: v.boolean(),
    nextCursor: v.optional(v.string()),
  },
  handler: async (ctx, args) =>
    persistPage(eventContext(ctx), {
      ...args,
      appointments: args.appointments as CanonicalCalAppointment[],
      schedule: async (jobId, delayMs) => {
        await ctx.scheduler.runAfter(
          delayMs,
          internal.appointments.runCalReconciliationPage,
          { jobId },
        );
      },
    }),
});

export const recordCalReconciliationFailure = internalMutation({
  args: {
    jobId: v.id('calReconciliationJobs'),
    leaseToken: v.string(),
    now: v.number(),
    retryable: v.boolean(),
  },
  handler: async (ctx, args) =>
    failPage(eventContext(ctx), {
      ...args,
      schedule: async (jobId, delayMs) => {
        await ctx.scheduler.runAfter(
          delayMs,
          internal.appointments.runCalReconciliationPage,
          { jobId },
        );
      },
    }),
});

/**
 * One scheduled action owns one provider page. The claim mutation installs a
 * durable watchdog before any network I/O, so process loss resumes the page.
 */
export const runCalReconciliationPage = internalAction({
  args: { jobId: v.id('calReconciliationJobs') },
  handler: async (ctx, args): Promise<RunCalReconciliationPageResult> => {
    const leaseToken = crypto.randomUUID();
    const claim: CalReconciliationClaim = await ctx.runMutation(
      internal.appointments.claimCalReconciliationPage,
      {
        jobId: args.jobId,
        leaseToken,
        now: Date.now(),
      },
    );
    if (!claim.claimed) {
      return {
        accepted: false,
        terminal: Boolean(claim.terminal),
      };
    }
    if (
      !claim.bookingStatus
      || claim.pageNumber === undefined
      || !claim.providerOrganizationId
    ) {
      throw new Error('Claimed Cal reconciliation page is incomplete.');
    }

    let page: Awaited<ReturnType<typeof fetchCalOrganizationBookings>>;
    try {
      page = await fetchCalOrganizationBookings({
        apiKey: process.env.CAL_API_KEY,
        organizationId: claim.providerOrganizationId,
        status: claim.bookingStatus as CalReconciliationStatus,
        cursor: claim.cursor,
      });
    } catch (error) {
      const retryable =
        error instanceof CalProviderError && error.retryable;
      const failure: CalReconciliationFailure = await ctx.runMutation(
        internal.appointments.recordCalReconciliationFailure,
        {
          jobId: args.jobId,
          leaseToken,
          now: Date.now(),
          retryable,
        },
      );
      return {
        accepted: false,
        terminal: failure.terminal,
        retryAfterMs: failure.retryAfterMs,
      };
    }

    const requestId = [
      'cal-reconciliation',
      String(args.jobId),
      claim.bookingStatus,
      String(claim.pageNumber),
      claim.cursor ?? 'first',
    ].join(':');
    const result: CalReconciliationPageResult = await ctx.runMutation(
      internal.appointments.persistCalReconciliationPage,
      {
        jobId: args.jobId,
        leaseToken,
        requestId,
        expectedBookingStatus:
          claim.bookingStatus as CalReconciliationStatus,
        expectedCursor: claim.cursor,
        expectedPageNumber: claim.pageNumber,
        observedAt: Date.now(),
        appointments: page.appointments,
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      },
    );
    if (result.terminal) {
      return { accepted: false, terminal: true };
    }
    return { accepted: true, ...result };
  },
});
