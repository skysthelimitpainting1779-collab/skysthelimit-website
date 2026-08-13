---
name: private-file-boundaries
description: Use when implementing uploads, downloads, signed URLs, media publication, customer documents, retention, MIME validation, scanning, or file authorization.
---

# Private File Boundaries

Files are private unless explicitly published.

Validate server-side: MIME, extension, byte size, ownership, resource grant, privacy class, retention, and scan state. Return opaque file IDs rather than permanent public URLs. Generate short-lived authorized transfer URLs only after access checks. Test cross-user and cross-project denial, expired URLs, malicious names, content mismatch, and retention state.
