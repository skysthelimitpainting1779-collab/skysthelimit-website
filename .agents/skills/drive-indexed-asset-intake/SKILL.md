---
name: drive-indexed-asset-intake
description: Locate website, brand, content, and media sources through the canonical Google Drive Agent Index before downloading or using them.
---

# Drive Indexed Asset Intake

Use this workflow whenever repository work needs company material from Google
Drive.

## Preconditions

- Use the connected Google Drive integration.
- Read the Google Drive skill and the relevant Docs, Sheets, or Slides skill.
- Treat `00 START HERE - Agent Drive Index` as the navigation authority.

## Procedure

1. Search Drive for the exact Agent Index title and record its observed file ID.
2. Read spreadsheet metadata before any bounded range read.
3. Read `README`, then use `Folder Map` and `File Registry` to locate sources.
4. Prefer rows marked `CANONICAL`, `CANONICAL SOURCE`, or `ACTIVE`.
5. Never use `LEGACY`, `SUPERSEDED`, or `EXPORT` as an editable source of truth.
6. Before public use of creative media, verify the Marketing Agent Execution
   OS `ASSET & PROOF REGISTRY`, then use the indexed Proof & Permission Ledger
   for supporting context. Treat unknown or conflicting permission as
   prohibited.
7. Read file metadata before download. Export native Google files; fetch raw
   bytes for images, PDFs, archives, and other non-native files.
8. Record only sanitized provenance: title, opaque Drive ID, MIME type,
   indexed status, permission result, retrieval time, checksum, and intended
   graph node.
9. Store approved website assets under the repository's existing asset
   convention. Do not duplicate a matching canonical asset.
10. After any Drive mutation, update the Agent Index registry and cleanup log.

## Verification

- Every selected asset traces to an Agent Index row.
- Every public creative asset has an affirmative permission result.
- Canonical sources remain distinguishable from exports.
- Repository references use local assets, not authenticated Drive URLs.
- `npm run skills:validate` and `npm run host:compile` pass.

## Safety and rollback

- Do not inspect indexed sensitive/case areas unless the task explicitly
  requires them.
- Do not move, rename, delete, or overwrite Drive files during read-only
  intake.
- If permission is unclear, stop that asset's intake and retain only its
  sanitized inventory entry.
- Remove an incorrectly retrieved local copy; do not alter its Drive source.
