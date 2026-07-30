'use client';

import { UserButton } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button } from '../ui/button';
import {
  nextCommandIdentity,
  resolveRevisionSync,
  type CommandIdentity,
} from './estimate-builder-state';

type EditableLineItem = {
  key: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
};

const fieldClassName =
  'h-10 w-full border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]';

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function uniqueId() {
  return globalThis.crypto.randomUUID();
}

export default function EstimateBuilder({
  estimateId,
}: {
  estimateId: string;
}) {
  const governedEstimateId = estimateId as Id<'estimates'>;
  const detail = useQuery(api.estimates.estimateDetail, {
    estimateId: governedEstimateId,
  });
  const saveEstimateDraft = useMutation(api.estimates.saveEstimateDraft);
  const approveEstimateVersion = useMutation(
    api.estimates.approveEstimateVersion
  );
  const [title, setTitle] = useState('');
  const [lineItems, setLineItems] = useState<EditableLineItem[]>([]);
  const [discountCents, setDiscountCents] = useState(0);
  const [taxCents, setTaxCents] = useState(0);
  const [assumptions, setAssumptions] = useState('');
  const [hydratedRevision, setHydratedRevision] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [stale, setStale] = useState(false);
  const [awaitingRevision, setAwaitingRevision] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'save' | 'approve' | null
  >(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const saveCommandRef = useRef<CommandIdentity | null>(null);
  const approvalCommandRef = useRef<CommandIdentity | null>(null);

  const hydrateFromDetail = useCallback(() => {
    if (!detail) return;
    setTitle(detail.estimate.title);
    setLineItems(
      detail.estimate.lineItems.map((item, index) => ({
        key: `${detail.estimate.revision}-${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      }))
    );
    setDiscountCents(detail.estimate.discountCents);
    setTaxCents(detail.estimate.taxCents);
    setAssumptions(detail.estimate.assumptions.join('\n'));
    setHydratedRevision(detail.estimate.revision);
    setDirty(false);
    setStale(false);
    setAwaitingRevision(null);
    saveCommandRef.current = null;
  }, [detail]);

  useEffect(() => {
    if (!detail) return;
    const action = resolveRevisionSync({
      serverRevision: detail.estimate.revision,
      hydratedRevision,
      dirty,
      awaitingRevision,
    });
    if (action === 'hydrate') hydrateFromDetail();
    if (action === 'preserve-stale') {
      setStale(true);
      setAwaitingRevision(null);
    }
  }, [
    awaitingRevision,
    detail,
    dirty,
    hydrateFromDetail,
    hydratedRevision,
  ]);

  const staleRevision =
    stale ||
    (hydratedRevision !== null &&
      awaitingRevision === null &&
      detail !== undefined &&
      detail.estimate.revision !== hydratedRevision);
  const formLocked = pendingAction !== null || awaitingRevision !== null;

  const calculated = useMemo(() => {
    const subtotalCents = lineItems.reduce(
      (sum, item) =>
        sum + Math.round(item.quantity * item.unitPriceCents),
      0
    );
    return {
      subtotalCents,
      totalCents: subtotalCents - discountCents + taxCents,
    };
  }, [discountCents, lineItems, taxCents]);

  const updateLineItem = (
    key: string,
    patch: Partial<Omit<EditableLineItem, 'key'>>
  ) => {
    setLineItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
    setDirty(true);
  };

  const saveDraft = async () => {
    if (
      !detail ||
      hydratedRevision === null ||
      !dirty ||
      staleRevision ||
      awaitingRevision !== null
    ) {
      return;
    }
    setPendingAction('save');
    setError('');
    setMessage('');
    try {
      const command = {
        companyId: detail.estimate.companyId,
        opportunityId: detail.estimate.opportunityId,
        estimateId: governedEstimateId,
        expectedRevision: hydratedRevision,
        title,
        lineItems: lineItems.map(({ description, quantity, unitPriceCents }) => ({
          description,
          quantity,
          unitPriceCents,
        })),
        discountCents,
        taxCents,
        assumptions: assumptions
          .split('\n')
          .map((assumption) => assumption.trim())
          .filter(Boolean),
      };
      const commandIdentity = nextCommandIdentity(
        saveCommandRef.current,
        JSON.stringify(command),
        uniqueId
      );
      saveCommandRef.current = commandIdentity;
      const result = await saveEstimateDraft({
        ...command,
        requestId: commandIdentity.requestId,
      });
      saveCommandRef.current = null;
      setAwaitingRevision(result.revision);
      setMessage(
        `Draft revision ${result.revision} saved. Synchronizing the governed copy.`
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The estimate draft could not be saved.'
      );
    } finally {
      setPendingAction(null);
    }
  };

  const approveVersion = async () => {
    if (
      !detail ||
      hydratedRevision === null ||
      dirty ||
      staleRevision ||
      awaitingRevision !== null
    ) {
      return;
    }
    setPendingAction('approve');
    setError('');
    setMessage('');
    try {
      const command = {
        companyId: detail.estimate.companyId,
        estimateId: governedEstimateId,
        expectedRevision: hydratedRevision,
      };
      const commandIdentity = nextCommandIdentity(
        approvalCommandRef.current,
        JSON.stringify(command),
        uniqueId
      );
      approvalCommandRef.current = commandIdentity;
      const result = await approveEstimateVersion({
        ...command,
        requestId: commandIdentity.requestId,
      });
      approvalCommandRef.current = null;
      setMessage(`Approved immutable version ${result.versionNumber}.`);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'The estimate version could not be approved.'
      );
    } finally {
      setPendingAction(null);
    }
  };

  if (detail === undefined) {
    return (
      <main className="dark flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)]">
        <div role="status" className="flex items-center gap-3 text-sm">
          <Loader2
            aria-hidden="true"
            className="size-4 animate-spin motion-reduce:animate-none"
          />
          Loading estimate
        </div>
      </main>
    );
  }

  return (
    <main className="dark min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[90rem]">
        <header className="flex items-start justify-between gap-6 border-b border-[var(--border)] pb-6">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--primary)]">
              Revenue operations
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Estimate builder
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Staff enter scope, prices, and terms. The system calculates totals
              and preserves every approved version as an immutable snapshot.
            </p>
          </div>
          <UserButton />
        </header>

        <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section aria-labelledby="estimate-draft-title">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border)] pb-5">
              <div>
                <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                  Revision {detail.estimate.revision}
                </p>
                <h2 id="estimate-draft-title" className="mt-1 text-xl font-black">
                  Draft scope and pricing
                </h2>
              </div>
              <span className="border border-[var(--border)] px-3 py-1 text-xs font-bold uppercase">
                {staleRevision
                  ? 'Server update available'
                  : awaitingRevision !== null
                    ? 'Synchronizing'
                    : dirty
                      ? 'Unsaved changes'
                      : detail.estimate.status}
              </span>
            </div>

            <fieldset
              disabled={formLocked}
              className="m-0 min-w-0 border-0 p-0 disabled:opacity-75"
            >
              <label className="mt-6 block text-xs font-bold uppercase text-[var(--muted-foreground)]">
                Estimate title
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setDirty(true);
                  }}
                  className={`${fieldClassName} mt-2`}
                  maxLength={200}
                />
              </label>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-black">Line items</h3>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-none"
                  onClick={() => {
                    setLineItems((current) => [
                      ...current,
                      {
                        key: uniqueId(),
                        description: '',
                        quantity: 1,
                        unitPriceCents: 0,
                      },
                    ]);
                    setDirty(true);
                  }}
                >
                  <Plus aria-hidden="true" />
                  Add item
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {lineItems.map((item, index) => (
                  <div
                    key={item.key}
                    className="grid gap-3 border border-[var(--border)] p-4 lg:grid-cols-[minmax(12rem,1fr)_7rem_9rem_7rem_2.5rem]"
                  >
                    <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                      Description
                      <input
                        aria-label={`Line item ${index + 1} description`}
                        value={item.description}
                        onChange={(event) =>
                          updateLineItem(item.key, {
                            description: event.target.value,
                          })
                        }
                        className={`${fieldClassName} mt-2`}
                        maxLength={500}
                      />
                    </label>
                    <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                      Quantity
                      <input
                        aria-label={`Line item ${index + 1} quantity`}
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.quantity}
                        onChange={(event) =>
                          updateLineItem(item.key, {
                            quantity: Number(event.target.value),
                          })
                        }
                        className={`${fieldClassName} mt-2`}
                      />
                    </label>
                    <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                      Unit price
                      <input
                        aria-label={`Line item ${index + 1} unit price`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPriceCents / 100}
                        onChange={(event) =>
                          updateLineItem(item.key, {
                            unitPriceCents: Math.round(
                              Number(event.target.value) * 100
                            ),
                          })
                        }
                        className={`${fieldClassName} mt-2`}
                      />
                    </label>
                    <div className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                      Total
                      <p className="mt-2 flex h-10 items-center text-sm text-[var(--foreground)]">
                        {formatCurrency(
                          Math.round(item.quantity * item.unitPriceCents)
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove line item ${index + 1}`}
                      className="mt-6 rounded-none"
                      disabled={lineItems.length === 1}
                      onClick={() => {
                        setLineItems((current) =>
                          current.filter((candidate) => candidate.key !== item.key)
                        );
                        setDirty(true);
                      }}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                Discount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountCents / 100}
                  onChange={(event) => {
                    setDiscountCents(
                      Math.round(Number(event.target.value) * 100)
                    );
                    setDirty(true);
                  }}
                  className={`${fieldClassName} mt-2`}
                />
              </label>
              <label className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                Tax
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxCents / 100}
                  onChange={(event) => {
                    setTaxCents(Math.round(Number(event.target.value) * 100));
                    setDirty(true);
                  }}
                  className={`${fieldClassName} mt-2`}
                />
              </label>
            </div>

              <label className="mt-6 block text-xs font-bold uppercase text-[var(--muted-foreground)]">
                Assumptions
                <textarea
                  value={assumptions}
                  onChange={(event) => {
                    setAssumptions(event.target.value);
                    setDirty(true);
                  }}
                  className="mt-2 min-h-32 w-full border border-[var(--border)] bg-[var(--background)] p-3 text-sm leading-6 outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
                  placeholder="One governed assumption per line"
                />
              </label>
            </fieldset>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--border)] pt-6">
              <Button
                type="button"
                className="rounded-none"
                disabled={
                  !dirty ||
                  staleRevision ||
                  awaitingRevision !== null ||
                  pendingAction !== null
                }
                onClick={saveDraft}
              >
                {pendingAction === 'save' ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Save aria-hidden="true" />
                )}
                Save draft
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-none"
                onClick={() => setPreviewOpen((open) => !open)}
              >
                <Eye aria-hidden="true" />
                {previewOpen ? 'Hide preview' : 'Preview'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="rounded-none"
                disabled={
                  dirty ||
                  staleRevision ||
                  awaitingRevision !== null ||
                  pendingAction !== null
                }
                onClick={approveVersion}
              >
                {pendingAction === 'approve' ? (
                  <Loader2
                    aria-hidden="true"
                    className="animate-spin motion-reduce:animate-none"
                  />
                ) : (
                  <Check aria-hidden="true" />
                )}
                Approve version
              </Button>
              {staleRevision ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-none"
                  disabled={pendingAction !== null}
                  onClick={() => {
                    hydrateFromDetail();
                    setMessage('Loaded the latest governed revision.');
                    setError('');
                  }}
                >
                  Load latest revision
                </Button>
              ) : null}
            </div>
            {staleRevision ? (
              <p className="mt-3 text-xs text-[var(--destructive)]">
                A newer revision is available. Your local edits are preserved;
                load the latest revision explicitly before continuing.
              </p>
            ) : awaitingRevision !== null ? (
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                Waiting for the saved revision to arrive on the live
                subscription.
              </p>
            ) : dirty ? (
              <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                Save the current draft before approving a version.
              </p>
            ) : null}
            <div aria-live="polite" className="mt-4 min-h-6 text-sm">
              {message ? <p className="text-[var(--primary)]">{message}</p> : null}
              {error ? <p className="text-[var(--destructive)]">{error}</p> : null}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="border border-[var(--border)] p-5">
              <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
                Current total
              </p>
              <p className="mt-2 text-3xl font-black">
                {formatCurrency(calculated.totalCents)}
              </p>
              <dl className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted-foreground)]">Subtotal</dt>
                  <dd>{formatCurrency(calculated.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted-foreground)]">Discount</dt>
                  <dd>-{formatCurrency(discountCents)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--muted-foreground)]">Tax</dt>
                  <dd>{formatCurrency(taxCents)}</dd>
                </div>
              </dl>
            </section>

            {previewOpen ? (
              <section
                aria-label="Estimate preview"
                className="border border-[var(--primary)] p-5"
              >
                <p className="text-xs font-bold uppercase text-[var(--primary)]">
                  Preview
                </p>
                <h2 className="mt-2 text-xl font-black">{title}</h2>
                <div className="mt-4 space-y-3 text-sm">
                  {lineItems.map((item) => (
                    <div
                      key={item.key}
                      className="flex justify-between gap-4 border-t border-[var(--border)] pt-3"
                    >
                      <span>{item.description || 'Untitled line item'}</span>
                      <span>
                        {formatCurrency(
                          Math.round(item.quantity * item.unitPriceCents)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border border-[var(--border)] p-5">
              <h2 className="font-black">Approved versions</h2>
              {detail.versions.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                  No approved version has been recorded.
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {detail.versions.map((version) => (
                    <li
                      key={version.id}
                      className="border-t border-[var(--border)] pt-3"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold">
                          Version {version.versionNumber}
                        </span>
                        <span>{formatCurrency(version.totalCents)}</span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                        Approved{' '}
                        {new Intl.DateTimeFormat('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }).format(version.approvedAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
