---
name: legacy-data-reconciliation
description: Use when inventorying, exporting, transforming, dual-reading, dual-writing, reconciling, restoring, or decommissioning Supabase, Payload, Directus, Postgres, S3, or other legacy data.
---

# Legacy Data Reconciliation

Use read-only inventory first. Record source version, counts, checksums, IDs, files, and unmapped records.

Classify raw legacy exports and import handoffs as restricted personal data.
Keep raw exports, credentials, or PII outside the repository and approved
sanitized evidence.
Reports may contain only pseudonymous IDs, checksums, counts, and
classifications; treat those reports as restricted personal data because stable
hashes can remain linkable. Never copy raw source payloads or direct personal
identifiers into them.

Migration phases:
1. Export and normalize.
2. Dry-run transform.
3. Import into preview.
4. Reconcile counts and checksums.
5. Shadow read.
6. Controlled dual-write only after approval.
7. Canary and rollback rehearsal.
8. Retain restore evidence before decommissioning.

Never silently drop ambiguous rows. Every exception becomes an explicit reconciliation record.
