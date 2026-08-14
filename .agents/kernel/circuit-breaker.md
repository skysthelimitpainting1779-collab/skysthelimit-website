# Bounded Loops & Circuit Breakers Specification

**Scope:** Universal across all agents and execution loops.

---

## 1. Bounded Loop Iteration Limits
Autonomous remediation is bounded to prevent infinite cycles, context bloat, and compute waste:
- **`implementationCycles`**: Maximum 3 attempts per task slice.
- **`remediationCycles`**: Maximum 3 fix attempts per failure pattern.
- **`verifierCycles`**: Maximum 2 verifier evaluations before mandatory escalation.
- **`specialistCalls`**: Maximum 1 specialist invocation per phase.

### Materiality Rule:
Every retry cycle MUST introduce something materially novel:
- New code patch or refactor
- New or corrected unit/E2E test
- New Graphify dependency or caller evidence
- Fresh Context7 official documentation proof
- Resolved upstream dependency

Repeating the exact same tool call or test run with unchanged repository state is hard-denied.

---

## 2. Circuit Breaker States & Transitions
The circuit breaker operates across three formal states:

```
      [ Normal Execution ]
               │
               ▼
           ┌────────┐     Repeated Failure / Limit Exhausted
           │ CLOSED │ ──────────────────────────────────────┐
           └────────┘                                      │
               ▲                                           ▼
               │ Successful Verification               ┌──────┐
               │                                       │ OPEN │ ──► Worker Halted,
           ┌───────────┐   1 Authorized Retry          └──────┘     Control returned to A0
           │ HALF_OPEN │ ◄─────────────────────────────────┘
           └───────────┘
               │
               ▼ Failed Attempt
           ┌──────┐
           │ OPEN │
           └──────┘
```

### Trigger Conditions for `OPEN`:
1. Identical failure persists across 2 consecutive remediation attempts.
2. No material progress detected across turns.
3. Verification rejected by blind verifier twice.
4. Total cycle budget exhausted.
5. Secret / credential exposure detected.
6. Scope or write-boundary violation attempted.
7. Production boundary breach attempt (e.g. attempting production deployment or live database migration).

### Recovery Authority:
- **Workers CANNOT reset circuits**: Workers are forbidden from increasing budgets, clearing error histories, or forcing circuit closure.
- **A0 Recovery Actions**: Only A0 can modify task contracts, split slices, change model tiers, invoke higher specialists, authorize a single `HALF_OPEN` trial, or escalate to human review.
