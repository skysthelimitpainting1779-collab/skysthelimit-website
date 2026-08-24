---
title: Karpathy LLM Wiki Pattern
type: concept
created: 2026-08-23
updated: 2026-08-23
tags: [knowledge-management, llm-os, second-brain]
---

# Karpathy LLM Wiki Pattern

## Summary
The LLM Wiki pattern treats personal and technical knowledge management as a **compiled software codebase** rather than ad-hoc RAG embeddings. Raw sources (`/raw`) are compiled by the LLM into an interlinked Markdown wiki (`/wiki`).

## Key Principles & Mechanisms
- **Stop Retrieving, Start Compiling**: Instead of searching fragmented chunks at query time, compile knowledge into living articles.
- **Immutable Raw Inbox**: Source materials in `/raw` are never modified directly.
- **Bi-Directional Wikilinks**: Every concept cross-references others via double-bracket wikilink syntax to create a coherent conceptual graph.
- **Directive Source**: The pattern is governed by the [[Karpathy LLM Wiki: Compiler Specification]], which expands `wiki/schema/AGENTS.md` into operational compile/lint/query detail and hard operating constraints.

## Related Concepts & Backlinks
- [[Second Brain Neocortex]] - High-level conceptual model for LLM knowledge synthesis.
- [[Dream Loop Synthesis]] - Autonomous pass that compiles and reconciles pages of this pattern.
- [[DeepSeek Harness]] - The execution environment and runtime host.
- [[Graphify AST Engine]] - Codebase structural knowledge graph tool.
- [[Karpathy LLM Wiki: Compiler Specification]] - Authoritative directives implementing this pattern.
