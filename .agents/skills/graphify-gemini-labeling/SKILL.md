---
name: graphify-gemini-labeling
description: Relabel the existing Graphifyy codebase graph with Gemini through the CLI without exposing credentials or falling back to another provider.
---

# Graphifyy Gemini Labeling

Use after an incremental Graphifyy update changes communities or leaves placeholder labels.

## Prerequisites

- `graphify-out/graph.json` exists.
- `GEMINI_API_KEY` or `GOOGLE_API_KEY` is already set outside the repository.
- Graphifyy's Python environment can import `openai`; Gemini uses Google's OpenAI-compatible transport. Install that transport into the Graphifyy uv-tool environment when missing.

Never print, hash, copy, or pass the credential as a command-line argument.

## Run

```powershell
node .agents/skills/graphify-gemini-labeling/scripts/label.mjs
```

Override the default fast model only through `GRAPHIFY_GEMINI_MODEL`.

## Verification

- The command must report `Done` without a backend failure or placeholder-label fallback.
- `graphify-out/graph.json` and `GRAPH_REPORT.md` must be refreshed.
- Run one bounded `npm run graph:query` against the changed area.

## Recovery

Graphifyy writes dated backups before relabeling. If labeling corrupts graph output, restore the latest pre-run backup and rerun with the previous known-good model.
