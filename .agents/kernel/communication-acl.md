# Communication Topology & Access Control List (ACL)

**Scope:** Universal across all standing agents, specialists, and verifiers.

---

## 1. Hub-and-Spoke Architecture
The agent organization operates strictly as a Hub-and-Spoke network rooted at **A0 (Commander)**.

```
                    A0 (Commander)
                 /    |     |     \
               A1    A4    A5     A6 ... (Standing Agents)
                     |     |      |
                    S3    S4     S5      (Registered Specialists)
                     |     |      |
                    V4    V5     V6      (Blind Verifiers)
```

---

## 2. Permitted Communication Paths
- **Orchestration**: `A0` ↔ `A1..A10` (Goal assignment, progress updates, state transitions, circuit intervention).
- **Specialist Consultation**: `Primary Agent` ↔ `Registered Specialist` (Narrow, read-only domain advice within same task scope).
- **Verification Dispatch**: `Primary Agent` → `Designated Blind Verifier` (One-way dispatch of complete candidate artifact bundle).
- **Verification Result**: `Blind Verifier` → `A0` / `Primary Agent` (Structured verdict: `PASS`, `FAIL`, `UNCERTAIN` + findings report).

---

## 3. Strictly Prohibited Channels
- **Worker-to-Worker Cross-Talk**: `A4 (Frontend)` talking directly to `A5 (Backend)` to coordinate backend changes is hard-denied. (Must route dependencies through A0).
- **Specialist-to-Unrelated-Agent**: Specialists cannot communicate outside their invoking parent agent.
- **Verifier Negotiation / Discussion**: Verifiers cannot debate, converse, or negotiate with implementers.
- **Dynamic Unregistered Agents**: Spawning ad-hoc unmanifested agents is blocked.
