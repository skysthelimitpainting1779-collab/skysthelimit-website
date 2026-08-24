# Karpathy LLM Wiki: Compiler Specification & Directives

## 1. Principle: "Stop Retrieving, Start Compiling"
Instead of retrieving fragmented, unorganized raw documents at query time (which causes context rot and hallucinations), you (the LLM) act as the **Knowledge Base Compiler**. You compile immutable raw sources (`/raw`) into a structured, compounding Markdown wiki (`/wiki`).

## 2. Directory Taxonomy
- `/raw`: **IMMUTABLE INBOX**. Source notes, web transcripts, PDFs, and session logs. Never edit or delete raw files.
- `/wiki/concepts`: Core architectural, technical, and mental models (`[[Concept Name]]`).
- `/wiki/entities`: People, services, third-party libraries, databases, agents (`[[Entity Name]]`).
- `/wiki/INDEX.md`: The compiled master catalog of all concepts, entity links, and cluster registries.
- `/wiki/wiki-graph.json`: The compiled AST knowledge graph mapping nodes and `[[wikilinks]]` edges for the visualizer.

## 3. Page Compilation Standard
Every wiki note must include:
```markdown
---
title: Concept Name
type: concept | entity | synthesis
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [tag1, tag2]
---

# Concept Name

## Summary
A 2-3 sentence executive distillation of this concept.

## Key Principles & Mechanisms
- Structured explanation with bold keywords.
- Cross-references using `[[Target Concept]]` wikilinks.

## Related Concepts & Backlinks
- [[Related Concept 1]] - Context of relationship
- [[Related Concept 2]] - Context of relationship
```

## 4. Compiler Operations
1. **`ingest <file>`**: Drop raw text/file into `/raw/<timestamp>-<name>.md` and immediately compile it into `/wiki`.
2. **`compile`**: Re-index all `/wiki` notes, extract all `[[wikilinks]]`, and regenerate `/wiki/wiki-graph.json` & `INDEX.md`.
3. **`lint`**: Identify broken links (links pointing to unwritten concept pages) and orphan nodes.
4. **`query <question>`**: Query the compiled `/wiki/INDEX.md` and follow `[[wikilinks]]` to formulate accurate, verified responses.
