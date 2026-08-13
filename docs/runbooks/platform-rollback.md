# Platform Rollback Runbook

Use this runbook for a failed or harmful production deployment. Do not rewrite protected
Git history.

## 1. Declare and contain

Record:

- incident start time;
- current `main` commit;
- Vercel deployment ID;
- affected routes, users, and external effects;
- last known-good deployment;
- incident owner.

Immediately pause the smallest relevant effect boundary:

- outbound email/SMS/calls;
- payments and refunds;
- Vercel Workflows or scheduled effects;
- webhook consumers;
- public writes or administrative mutations.

Do not destroy evidence or rotate credentials unless compromise is suspected.

## 2. Choose the recovery path

### Application-only regression

Prefer promoting the last known-good canonical deployment:

```bash
npx vercel promote <known-good-deployment-url>
```

Or use Vercel rollback when the current project state supports it:

```bash
npx vercel rollback --yes
```

Then create a Git revert on a short-lived `hotfix/*` or `fix/*` branch. Never force-push
`main`.

### Convex schema or data regression

- Stop affected writes.
- Identify the exact migration and affected records.
- Run the tested compensating migration or verified restore procedure.
- Reconcile counts, checksums, authorization, and event uniqueness.
- Do not use a destructive local reset as production recovery.

### Provider or secret regression

- Disable the affected integration.
- Restore the prior environment-variable version or rotate the compromised credential.
- Re-verify webhook signatures, callback URLs, environment scope, and least privilege.
- Redeploy the known-good application revision if runtime variables changed.

### Customer-facing effect regression

- Disable the workflow or sender.
- Deduplicate queued and already-processed events.
- Cancel or compensate reversible operations.
- Require human review before replay.

## 3. Verify recovery

Verify against the canonical project only:

```text
Team:    team_bseTA2AuCO6A2fCOVY9ubrJo
Project: prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m
```

Required:

- deployment READY;
- production custom domain resolves to intended deployment;
- critical route smoke tests pass;
- Convex health and authorization checks pass;
- webhook and scheduled effects are either safely paused or healthy;
- no duplicate processing;
- monitoring and error rate return to baseline.

## 4. Restore effects deliberately

Re-enable effects one class at a time:

1. read-only traffic;
2. internal writes;
3. approved webhooks;
4. transactional communication;
5. payment or contractual effects.

Observe each stage before proceeding.

## 5. Close the incident

Record:

- root cause;
- detection gap;
- exact rollback action;
- affected data and customers;
- verification evidence;
- permanent regression test;
- owner and due date for follow-up.

A rollback is complete only when the permanent fix enters through `dev`, passes the full
Preview gate, and releases through `main`.
