---
title: Karpathy LLM Wiki: Compiler Specification
type: concept
created: 2026-08-23
updated: 2026-08-23
tags: [knowledge-management, compiler, governance, llm-os]
---

# Karpathy LLM Wiki: Compiler Specification

## Summary
This page is the full compiled expansion of the directive source `wiki/schema/AGENTS.md` ([[Karpathy LLM Wiki: Compiler Specification & Directives]]), turning its four directives into operational detail for this repository. It specifies how the LLM acts as the Knowledge Base Compiler: ingesting immutable raw sources and compiling them into a structured, compounding Markdown wiki instead of retrieving fragmented documents at query time.

## Key Principles & Mechanisms
- **Stop Retrieving, Start Compiling** (source: directive §1): Query-time retrieval over fragmented raw documents causes context rot and hallucinations; the compiler instead converts immutable raw sources into interlinked wiki pages that compound across sessions. This is the operating principle of the whole [[Karpathy LLM Wiki Pattern]].
- **Directory Taxonomy** (directive §2): `/raw` is the IMMUTABLE INBOX - never edit or delete raw files (in this repository the inbox lives at project root `raw/`, currently empty); `/wiki/concepts/` holds core architectural, technical, and mental models; `/wiki/entities/` holds people, services, libraries, databases, and agents; `/wiki/INDEX.md` is the compiled master catalog; `/wiki/wiki-graph.json` is the compiled AST knowledge graph of nodes and wikilink edges for the visualizer.
- **Page Compilation Standard** (directive §3): every note carries YAML frontmatter (`title`, `type: concept | entity | synthesis`, `created`, `updated`, `tags`) followed by `# Title`, a 2-3 sentence `## Summary`, `## Key Principles & Mechanisms` with bold keywords and `[[wikilinks]]`, and `## Related Concepts & Backlinks`. The `updated:` field must bump on every touch; legacy notes receive frontmatter at first recompile while their original content is preserved.
- **Compiler Operations** (directive §4): `ingest <file>` drops raw text into `/raw/<timestamp>-<name>.md` and immediately compiles it; `compile` re-indexes all wiki notes, extracts `[[wikilinks]]`, and regenerates `INDEX.md` and `wiki-graph.json`; `lint` identifies broken links pointing at unwritten pages (kept listed as Needed Concepts) and orphan nodes; `query` answers from the compiled catalog by following wikilinks rather than re-reading sources.
- **Template-Placeholder Exclusion** (lint rule for this repo): the directive page's own example block contains literal `[[Concept Name]]`, `[[Entity Name]]`, `[[Target Concept]]`, and `[[Related Concept 1/2]]` placeholders; the compile step must exclude these template artifacts (and inline-code syntax mentions) from link extraction so they never pollute the catalog or graph.
- **Operating Constraints From the Host Kernel** (source: project `AGENTS.md`, "Behavior (Karpathy)" and Context sections): think before coding (state assumptions, surface tradeoffs - realized here as the `query` op before writes); simplicity first (the minimal page standard above is deliberate); surgical changes (only what the task requires - atomic page edits with `updated:` bumps, never history rewrites); goal-driven (loop until verification passes - realized as compile then lint until clean). Hard denials bind the compiler too: never bulk-load `graphify-out/wiki/**` or any `GRAPH_REPORT.md`, no emoji in product source, and soft environment flags cannot disable these denials. Bounded reads are therefore a correctness requirement, not a preference - the attention-budget mirror of [[Second Brain Neocortex]] claims about context maintenance.
- **Provenance For Graph Claims** (source: `dev/artifacts/graphify-arch-map-skysthelimit-2026-08-23.md`): structural facts about this repository's code graph come from the completed architecture analysis - 11,267 nodes / 23,889 edges built 2026-08-16, with a strict DAG layering (app to views to components to lib) inside `src/`. That map is the citable compiled layer for [[Graphify AST Engine]] claims until a dedicated page exists, and it demonstrates the pattern itself: one bounded compiled artifact replaces bulk graph retrieval.
- **Relation To Autonomous Passes**: [[Dream Loop Synthesis]] schedules periodic compile-lint-reconcile cycles under this specification; [[Gate-Bounded Autonomy]] synthesizes why those knowledge gates and the execution preflight gates are the same control loop; [[DeepSeek Harness]] hosts the runtime and telemetry for both.

## Related Concepts & Backlinks
- [[Karpathy LLM Wiki Pattern]] - The parent pattern this specification operationalizes.
- [[Karpathy LLM Wiki: Compiler Specification & Directives]] - The immutable directive source (`wiki/schema/AGENTS.md`) expanded by this page; never edited by compile passes.
- [[Dream Loop Synthesis]] - The autonomous traversal engine that runs compile/lint under these directives.
- [[Second Brain Neocortex]] - The memory substrate whose consolidation rules mirror the page standard.
- [[DeepSeek Harness]] - The hosting runtime for compiler agents and wiki visualization.
- [[Gate-Bounded Autonomy]] - Synthesis uniting this spec's knowledge gates with execution preflight gates.
- [[Graphify AST Engine]] - Structural graph engine referenced by lint/provenance workflows (not yet compiled).
