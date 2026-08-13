# EXECUTE

The user’s message **Execute** is the complete start instruction. Do not ask for another prompt and do not merely summarize this package.

## 1. Read only the control documents first

Read:

1. `EXECUTE.md`
2. `BRANCH_AND_WORKTREE_POLICY.md`
3. `CURRENT_DECISIONS.md`
4. `VERCEL_PLATFORM_POLICY.md`
5. `SKILL_ROUTING_POLICY.md`
6. `REPO_BASELINE.json`
7. `VERCEL_PLATFORM_BASELINE.json`
8. `AUDIT_SNAPSHOT.md`
9. `EXECUTION_BATCHES.json`

Do not bulk-load the full graph, master audit, or repository map.

## 2. Mandatory integration worktree before any edit

From the existing repository working tree:

- inspect `git status --short`;
- preserve all user work;
- fetch `origin/main`;
- create a **new integration branch and separate worktree** from current `origin/main`;
- never modify or commit on `main`.

Use the included platform-appropriate script:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\create-integration-worktree.ps1 -RepoRoot "C:\path\to\repo" -PackageRoot "C:\path\to\this\extracted-package"
```

or:

```bash
./scripts/create-integration-worktree.sh /path/to/repo /path/to/this/extracted-package
```

If the execution environment makes the script inconvenient, reproduce its behavior exactly with native Git commands.

Continue all implementation inside the returned integration worktree.

## 3. Audit-delta gate

The audit reference is:

```text
c7e94605eefdace7a76ce5145808478df8503dbb
```

The implementation base is current `origin/main`.

- If the audit SHA is an ancestor of `origin/main`, inspect `ORIGIN_MAIN_DELTA.txt` and perform only a targeted delta update to the supplied map and bindings.
- If it is not an ancestor, stop before product edits and report that the repository map requires revalidation.

## 4. The graph is already compiled

Copying the package installs:

```text
.graph/graph.json
.graph/graph.md
.graph/execution-log.jsonl
.graph/RUNTIME_POLICY.md
```

Do **not** install or rerun the Graph Engineer skill. It was used to compile this execution contract.

Use:

- the compiled graph for dependencies, risk, evidence, attempts, and gates;
- `EXECUTION_BATCHES.json` for efficient batching;
- `NODE_BINDINGS.json` for the pre-audited starting scope;
- Graphifyy for live code relationships;
- current official docs through Context7 or official connectors;
- the repository ship-loop for research, plan, implementation, and deterministic verification.

Request graph recompilation only when structural invalidation is proven.

## 5. Mandatory Vercel and skill routing

Before any task is claimed:

- look up the node in `TASK_SKILL_MATRIX.json`;
- load its primary domain skill and required supporting skills;
- run its required Graphify query;
- query Context7 for every external library/API listed;
- use the connected Vercel plugin and Vercel official docs for every Vercel task;
- record these references in the node evidence packet.

During B00:

- install the packaged domain skills into `.agents/skills`;
- verify all repository and installed-plugin skills referenced by the matrix;
- compile host-native adapters;
- validate that all 66 graph nodes resolve to a primary skill;
- use the Vercel plugin to inspect project `prj_L3ZMoQ79YLx9G2o6Lg9OubqO9H8m`;
- inventory Marketplace Integrations, connectors, and environment scopes;
- search current Vercel Services docs.

During B20, implement and preview-verify the Vercel Services topology:

- `web`: existing Next.js application;
- `integrations`: internal TypeScript service for verified webhooks, adapters, and Vercel Workflow entrypoints;
- internal service binding from web to integrations;
- explicit rewrites only for public webhook/integration endpoints.

Do not change the production project framework preset or production resource links before G70.

## 5. Start the master goal

Treat **Execute** as a `/goal` invocation.

Start or resume:

```text
Ship Sky's the Limit Convex production operating system
```

Seed the goal from `goal-template/`.

If `package.json` does not expose the existing goal and Graphify scripts, B00 repairs the control plane first. Do not stop after planning.

## 6. Execute all unblocked safe work

Execute:

```text
B00 → B10 → B20 → B30/B31 as dependencies permit → B50 → B60
```

Follow the compiled graph for actual readiness.

No production data mutation, live communications, live payment, GBP edit, deployment promotion, DNS action, cutover, or provider decommissioning is authorized by the word Execute. Prepare those actions and stop at their named gates.

## 7. Worktree parallelism

Default: one writer.

After B00, use a second writer worktree only when:

- tasks are independent;
- file and resource locks are disjoint;
- both branches start from the current integration branch;
- each worker commits focused verified changes;
- the integration worktree integrates the commits and reruns the full batch gate.

Maximum: two writer worktrees and two bounded read-only agents.

## 8. Completion behavior

Continue until:

- every unblocked local/preview-safe batch passes;
- a deterministic gate fails after the allowed repair loop;
- required credentials are unavailable;
- a structural graph recompile is required; or
- a named production approval is reached.

Return only:

- goal status;
- integration branch and worktree;
- completed batches/nodes;
- files changed;
- verification evidence;
- preview/artifact locations;
- remaining external gates;
- exact next action.

Begin immediately.
