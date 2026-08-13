'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock3,
  Loader2,
  X,
} from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { MotionConfig, motion } from 'motion/react';

import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';
import { Button } from '../ui/button';

type OpportunityStage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost';

const PIPELINE_STAGES: readonly OpportunityStage[] = [
  'new',
  'qualified',
  'proposal',
  'won',
  'lost',
];

const STAGE_LABELS: Record<OpportunityStage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

function shortOpportunityId(id: string) {
  return id.slice(-8).toUpperCase();
}

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

type StaffCompany = {
  companyId: Id<'companies'>;
  companyName: string;
  role: 'staff' | 'admin';
};

export default function CrmOperator({
  companies,
}: {
  companies: StaffCompany[] | undefined;
}) {
  const [companyId, setCompanyId] = useState<Id<'companies'> | null>(null);
  const [selectedOpportunityId, setSelectedOpportunityId] =
    useState<Id<'opportunities'> | null>(null);
  const [pendingStage, setPendingStage] = useState<OpportunityStage | null>(
    null
  );
  const [mutationError, setMutationError] = useState('');
  const [mutationStatus, setMutationStatus] = useState('');
  const pipeline = useQuery(
    api.crm.opportunityPipeline,
    companyId ? { companyId } : 'skip'
  );
  const updateOpportunityStage = useMutation(api.crm.updateOpportunityStage);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pipelineTitleRef = useRef<HTMLHeadingElement>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const lastSelectedOpportunityIdRef =
    useRef<Id<'opportunities'> | null>(null);

  useEffect(() => {
    if (!companies?.length) return;
    if (
      !companyId ||
      !companies.some((company) => company.companyId === companyId)
    ) {
      setCompanyId(companies[0].companyId);
    }
  }, [companies, companyId]);

  const selectedOpportunity = pipeline?.find(
    (opportunity) => opportunity.id === selectedOpportunityId
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!selectedOpportunity) {
      if (dialog.open) dialog.close();
      return;
    }
    if (dialog.open) return;
    dialog.showModal();
    requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, [selectedOpportunity]);

  const closeDrawer = () => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    } else {
      restoreTriggerFocus();
    }
  };

  const restoreTriggerFocus = () => {
    const opportunityId = lastSelectedOpportunityIdRef.current;
    setSelectedOpportunityId(null);
    setPendingStage(null);
    setMutationError('');
    setMutationStatus('');
    requestAnimationFrame(() => {
      const trigger = opportunityId
        ? triggerRefs.current.get(opportunityId)
        : undefined;
      (trigger ?? pipelineTitleRef.current)?.focus();
    });
  };

  const moveOpportunity = async (nextStage: OpportunityStage) => {
    if (!companyId || !selectedOpportunity) return;
    setPendingStage(nextStage);
    setMutationError('');
    setMutationStatus(`Moving opportunity to ${STAGE_LABELS[nextStage]}`);
    try {
      await updateOpportunityStage({
        companyId,
        opportunityId: selectedOpportunity.id,
        expectedStage: selectedOpportunity.stage,
        nextStage,
        requestId: globalThis.crypto.randomUUID(),
      });
      setMutationStatus(`Opportunity moved to ${STAGE_LABELS[nextStage]}`);
    } catch (error) {
      setMutationStatus('');
      setMutationError(
        error instanceof Error
          ? error.message
          : 'The opportunity could not be updated.'
      );
    } finally {
      setPendingStage(null);
    }
  };

  if (companies === undefined) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mt-8 flex min-h-48 items-center justify-center gap-3 border-y border-[var(--border)] text-sm text-[var(--muted-foreground)]"
      >
        <Loader2
          aria-hidden="true"
          className="size-4 animate-spin motion-reduce:animate-none"
        />
        Verifying staff authorization
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <section
        role="status"
        className="mt-8 border-y border-[var(--border)] py-12 text-center"
      >
        <h2 className="font-bold text-[var(--foreground)]">
          No authorized companies
        </h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">
          An active staff or admin membership is required.
        </p>
      </section>
    );
  }

  const activeCompany =
    companies.find((company) => company.companyId === companyId) ??
    companies[0];

  return (
    <MotionConfig reducedMotion="user">
      <section className="mt-8" aria-labelledby="pipeline-title">
        <div className="flex flex-col gap-4 border-y border-[var(--border)] py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--muted-foreground)]">
              <Building2 aria-hidden="true" className="size-4" />
              Active workspace
            </p>
            <h2
              ref={pipelineTitleRef}
              id="pipeline-title"
              tabIndex={-1}
              className="mt-1 text-xl font-bold text-[var(--foreground)]"
            >
              {activeCompany.companyName}
            </h2>
          </div>
          {companies.length > 1 ? (
            <label className="grid gap-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
              Company
              <select
                value={companyId ?? ''}
                onChange={(event) => {
                  setCompanyId(event.target.value as Id<'companies'>);
                  setSelectedOpportunityId(null);
                }}
                className="h-11 min-w-56 border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]"
              >
                {companies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
              {activeCompany.role}
            </span>
          )}
        </div>

        {pipeline === undefined ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-72 items-center justify-center gap-3 text-sm text-[var(--muted-foreground)]"
          >
            <Loader2
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            Loading pipeline
          </div>
        ) : pipeline.length === 0 ? (
          <div
            role="status"
            className="flex min-h-72 flex-col items-center justify-center border-b border-[var(--border)] text-center"
          >
            <CircleDot
              aria-hidden="true"
              className="size-7 text-[var(--muted-foreground)]"
            />
            <h3 className="mt-4 font-bold text-[var(--foreground)]">
              Pipeline is clear
            </h3>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              New qualified opportunities will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-b border-[var(--border)]">
            <div className="grid min-w-[70rem] grid-cols-5 divide-x divide-[var(--border)]">
              {PIPELINE_STAGES.map((stage) => {
                const opportunities = pipeline.filter(
                  (opportunity) => opportunity.stage === stage
                );
                return (
                  <section
                    key={stage}
                    aria-labelledby={`pipeline-${stage}`}
                    className="min-h-[28rem] px-3 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        id={`pipeline-${stage}`}
                        className="text-xs font-bold uppercase text-[var(--foreground)]"
                      >
                        {STAGE_LABELS[stage]}
                      </h3>
                      <span className="font-mono text-xs text-[var(--muted-foreground)]">
                        {opportunities.length}
                      </span>
                    </div>
                    {opportunities.length ? (
                      <ul className="mt-4 space-y-3">
                        {opportunities.map((opportunity) => (
                          <li key={opportunity.id}>
                            <button
                              ref={(element) => {
                                if (element) {
                                  triggerRefs.current.set(
                                    opportunity.id,
                                    element
                                  );
                                } else {
                                  triggerRefs.current.delete(opportunity.id);
                                }
                              }}
                              type="button"
                              aria-haspopup="dialog"
                              onClick={() => {
                                lastSelectedOpportunityIdRef.current =
                                  opportunity.id;
                                setMutationError('');
                                setMutationStatus('');
                                setSelectedOpportunityId(opportunity.id);
                              }}
                              className="w-full border border-[var(--border)] bg-[var(--card)] p-4 text-left transition-colors hover:bg-[var(--muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                            >
                              <span className="block font-mono text-xs text-[var(--muted-foreground)]">
                                OP-{shortOpportunityId(opportunity.id)}
                              </span>
                              <span className="mt-3 block text-sm font-semibold text-[var(--foreground)]">
                                {opportunity.nextAction ?? 'No next action'}
                              </span>
                              <span className="mt-4 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                                <Clock3
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                                {formatTimestamp(opportunity.updatedAt)}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-6 text-xs text-[var(--muted-foreground)]">
                        No opportunities
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeDrawer();
        }}
        onClose={restoreTriggerFocus}
        aria-labelledby="opportunity-drawer-title"
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-xl bg-transparent p-0 text-[var(--foreground)] backdrop:bg-black/70"
      >
        {selectedOpportunity ? (
          <motion.div
            initial={{ opacity: 0, x: 48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex h-full flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-6 border-b border-[var(--border)] p-5">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                  {STAGE_LABELS[selectedOpportunity.stage]}
                </p>
                <h2
                  id="opportunity-drawer-title"
                  className="mt-2 text-xl font-bold"
                >
                  Opportunity OP-
                  {shortOpportunityId(selectedOpportunity.id)}
                </h2>
              </div>
              <Button
                ref={closeButtonRef}
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close opportunity details"
                onClick={closeDrawer}
              >
                <X aria-hidden="true" />
              </Button>
            </header>

            <div className="flex-1 overflow-y-auto">
              <section
                aria-busy={pendingStage !== null}
                className="border-b border-[var(--border)] p-5"
              >
                <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                  Next action
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {selectedOpportunity.nextAction ?? 'No next action'}
                </p>
                {selectedOpportunity.allowedNextStages.length ? (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedOpportunity.allowedNextStages.map((stage) => (
                      <Button
                        key={stage}
                        type="button"
                        variant="outline"
                        disabled={pendingStage !== null}
                        onClick={() => moveOpportunity(stage)}
                      >
                        {pendingStage === stage ? (
                          <Loader2
                            aria-hidden="true"
                            className="animate-spin motion-reduce:animate-none"
                          />
                        ) : stage === 'won' ? (
                          <CheckCircle2 aria-hidden="true" />
                        ) : (
                          <ArrowRight aria-hidden="true" />
                        )}
                        Move to {STAGE_LABELS[stage]}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p
                    role="status"
                    className="mt-4 text-sm text-[var(--muted-foreground)]"
                  >
                    This stage is terminal. No further pipeline move is
                    available.
                  </p>
                )}
                {mutationError ? (
                  <p
                    role="alert"
                    className="mt-4 text-sm text-[var(--destructive)]"
                  >
                    {mutationError}
                  </p>
                ) : null}
                <p
                  role="status"
                  aria-live="polite"
                  className="sr-only"
                >
                  {mutationStatus}
                </p>
              </section>

              <section className="p-5" aria-labelledby="timeline-title">
                <h3
                  id="timeline-title"
                  className="text-xs font-bold uppercase text-[var(--muted-foreground)]"
                >
                  Timeline
                </h3>
                <ol className="mt-5 space-y-5">
                  {selectedOpportunity.timeline.map((entry) => (
                    <li
                      key={entry.id}
                      className="relative border-l border-[var(--border)] pl-5"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute -left-1 top-1 size-2 bg-[var(--primary)]"
                      />
                      <p className="text-sm font-semibold">{entry.summary}</p>
                      {entry.fromStage && entry.toStage ? (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          {STAGE_LABELS[entry.fromStage]} to{' '}
                          {STAGE_LABELS[entry.toStage]}
                        </p>
                      ) : null}
                      {entry.actorUserId ? (
                        <p className="mt-1 font-mono text-xs text-[var(--muted-foreground)]">
                          Actor {entry.actorUserId}
                        </p>
                      ) : null}
                      {entry.requestId ? (
                        <p className="mt-1 break-all font-mono text-xs text-[var(--muted-foreground)]">
                          Request {entry.requestId}
                        </p>
                      ) : null}
                      <time
                        dateTime={new Date(entry.occurredAt).toISOString()}
                        className="mt-2 block font-mono text-xs text-[var(--muted-foreground)]"
                      >
                        {formatTimestamp(entry.occurredAt)}
                      </time>
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          </motion.div>
        ) : null}
      </dialog>
    </MotionConfig>
  );
}
