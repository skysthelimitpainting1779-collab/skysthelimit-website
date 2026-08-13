# Domain Skill and Tool Routing Policy

Every graph node must load a **primary domain skill** before implementation or approval. Generic coding ability is not an acceptable substitute.

## Node readiness

A node is not ready until its evidence packet contains:

- primary domain skill;
- supporting skills;
- Graphify query/result;
- current official documentation references;
- required connector/plugin calls;
- focused verification plan;
- independent verifier skill for high-risk work.

The complete mapping is in `TASK_SKILL_MATRIX.json`.

## Installation

During B00:

1. Copy every package skill under `domain-skills/*` into the repository skill SSOT at `.agents/skills/*`.
2. Do not overwrite a newer or more authoritative skill blindly. Compare and merge deliberately.
3. Verify repository/installed plugin skills named in the matrix.
4. Compile host-native adapters.
5. Run the skill-routing validator.
6. Refuse execution for any node without a resolvable primary skill.

## Tool pairing

- **Vercel platform task:** Vercel plugin + Vercel official docs + assigned Vercel skill.
- **External library task:** Context7 + assigned library/domain skill.
- **Repository relationship task:** Graphifyy.
- **GitHub/PR task:** GitHub connector + worktree/review skill.
- **High-risk task:** domain skill + security-verification + independent review.

Context7 and the Vercel plugin are not optional research decorations. Their outputs must be recorded as node evidence before code is written.
