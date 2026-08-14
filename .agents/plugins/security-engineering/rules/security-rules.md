---
trigger: always_on
description: Security engineering rules, adversarial posture, and least-privilege write scope.
---

# Security Engineering Rules

1. Default Mode is Read-Only. Code modifications are permitted only under explicitly assigned security remediation work contracts.
2. Threat Model Required: Any change to auth, sessions, webhooks, or API keys requires threat model evidence.
3. Secret Exposure Zero Tolerance: Detecting hardcoded tokens or private keys triggers an immediate circuit break to `OPEN`.
