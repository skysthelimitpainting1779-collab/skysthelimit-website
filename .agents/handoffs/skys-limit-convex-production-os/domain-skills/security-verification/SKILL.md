---
name: security-verification
description: Use when reviewing authentication, authorization, webhooks, secrets, file access, payments, migrations, production boundaries, or any high-risk node.
---

# Security Verification

Load `test-driven-development`, `systematic-debugging`, and `verification-before-completion`.

Threat-model the boundary, write abuse cases first, and verify denial paths. Check raw-body signatures, replay, idempotency, secret separation, least privilege, resource grants, logging redaction, rollback, and failure defaults. High-risk implementers cannot be their own final verifier. After two failed attempts from one cause, create a diagnostic node.
