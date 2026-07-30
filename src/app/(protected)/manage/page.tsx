'use client';

import { UserButton } from '@clerk/nextjs';
import { Component, Fragment, type ReactNode, useState } from 'react';
import { useQuery } from 'convex/react';

import { api } from '../../../../convex/_generated/api';
import CrmOperator from '../../../components/manage/crm-operator';

const AUTHORIZATION_ERROR_MESSAGES = [
  'Authentication is required.',
  'No canonical user is provisioned',
  'This user is disabled.',
  'Canonical identity mismatch.',
  'Company access is denied.',
  'No active company membership grants access.',
  'Company role does not grant access.',
  'MFA is required for privileged staff access.',
  'An active staff or admin membership is required.',
];

function isAuthorizationFailure(error: Error) {
  return AUTHORIZATION_ERROR_MESSAGES.some((message) =>
    error.message.includes(message)
  );
}

class ManageQueryBoundary extends Component<
  { children: ReactNode },
  { error: Error | null; retryKey: number }
> {
  state: { error: Error | null; retryKey: number } = {
    error: null,
    retryKey: 0,
  };

  static getDerivedStateFromError(error: unknown) {
    return {
      error:
        error instanceof Error
          ? error
          : new Error('The CRM query failed unexpectedly.'),
    };
  }

  retry = () => {
    this.setState(({ retryKey }) => ({
      error: null,
      retryKey: retryKey + 1,
    }));
  };

  renderFailure(error: Error) {
    const denied = isAuthorizationFailure(error);
    const title = denied ? 'CRM access denied' : 'CRM temporarily unavailable';
    const description = denied
      ? 'This console requires an active staff or admin membership and a current MFA claim. Sign in again or ask an administrator to verify your access.'
      : 'The operational query failed before data could be loaded. Retry without changing any pipeline records.';

    return (
      <main className="dark min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
        <section
          role="alert"
          className="mx-auto max-w-3xl border border-[var(--destructive)] bg-[var(--card)] p-6"
        >
          <h1 className="text-xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {description}
          </p>
          {!denied ? (
            <button
              type="button"
              onClick={this.retry}
              className="mt-5 h-10 border border-[var(--border)] px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              Retry
            </button>
          ) : null}
        </section>
      </main>
    );
  }

  render() {
    if (this.state.error) {
      return this.renderFailure(this.state.error);
    }
    return (
      <Fragment key={this.state.retryKey}>{this.props.children}</Fragment>
    );
  }
}

function ManagePageContent() {
  const companies = useQuery(api.crm.staffOverview);
  const [asOf] = useState(() => Date.now());
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const activeCompany =
    companies?.find(
      (company) => company.companyId === selectedCompanyId
    ) ?? companies?.[0];
  const assignments = useQuery(
    api.leadAssignments.slaQueue,
    activeCompany
      ? {
          companyId: activeCompany.companyId,
          asOf,
        }
      : 'skip'
  );

  return (
    <main className="dark min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[90rem]">
        <header className="flex items-start justify-between gap-6 border-b border-[var(--border)] pb-6">
          <div>
            <p className="text-xs font-bold uppercase text-[var(--primary)]">
              Operator console
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              CRM pipeline
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)]">
              Review every opportunity, take the next governed action, and
              inspect its complete timeline.
            </p>
          </div>
          <UserButton />
        </header>

        <section
          aria-labelledby="lead-sla-heading"
          role="status"
          className="mt-8 border border-[var(--border)] bg-[var(--card)] p-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--primary)]">
                First-response SLA
              </p>
              <h2 id="lead-sla-heading" className="mt-1 text-xl font-black">
                Lead follow-up queue
              </h2>
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              {assignments === undefined
                ? 'Loading assignments…'
                : `${assignments.length} active assignment${assignments.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {companies && companies.length > 1 ? (
            <label className="mt-4 grid max-w-xs gap-1.5 text-xs font-semibold text-[var(--muted-foreground)]">
              Company
              <select
                value={activeCompany?.companyId ?? ''}
                onChange={(event) =>
                  setSelectedCompanyId(event.target.value)
                }
                className="h-11 border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]"
              >
                {companies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {assignments?.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--muted-foreground)]">
              No lead assignments are waiting for a first response.
            </p>
          ) : null}
          {assignments && assignments.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {assignments.map((assignment) => {
                const urgent =
                  assignment.slaStatus === 'breached' ||
                  assignment.slaStatus === 'escalated';
                return (
                  <li
                    key={assignment.assignmentId}
                    className={`border p-4 ${
                      urgent
                        ? 'border-[var(--destructive)] bg-[color-mix(in_oklab,var(--destructive)_8%,var(--card))]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          Lead {assignment.leadId}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          Assigned to {assignment.assigneeUserId}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-bold ${
                          urgent
                            ? 'text-[var(--destructive)]'
                            : 'text-[var(--foreground)]'
                        }`}
                      >
                        {assignment.operatorLabel}
                      </p>
                    </div>
                    <p className="mt-3 text-xs text-[var(--muted-foreground)]">
                      Response due{' '}
                      {new Date(
                        assignment.firstResponseDueAt
                      ).toLocaleString()}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <CrmOperator
          key={activeCompany?.companyId ?? 'loading'}
          companies={activeCompany ? [activeCompany] : companies}
        />
      </div>
    </main>
  );
}

export default function ManagePage() {
  return (
    <ManageQueryBoundary>
      <ManagePageContent />
    </ManageQueryBoundary>
  );
}
