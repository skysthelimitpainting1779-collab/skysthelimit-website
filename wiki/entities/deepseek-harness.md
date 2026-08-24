---
title: DeepSeek Harness
type: entity
created: 2026-08-23
updated: 2026-08-23
tags: [runtime, host, ai-agent]
---

# DeepSeek Harness

## Summary
DeepSeek Harness (`dsh`) is the primary orchestration environment and Web UI host for running autonomous AI agents, live telemetry, and knowledge compilation.

## Key Principles & Mechanisms
- **Real-Time Web UI**: Runs a fast, reactive front-end with live WebSocket telemetry.
- **Graph & Wiki Visualizer**: Real-time neural canvas rendering both Codebase ASTs and Second Brain Wikis.

## Related Concepts & Backlinks
- [[Second Brain Neocortex]] - The cognitive layer powered by the harness.
- [[Karpathy LLM Wiki Pattern]] - The knowledge structure maintained by DSH.
- [[Karpathy LLM Wiki: Compiler Specification]] - The directive set executed by compiler agents hosted here.
- [[Gate-Bounded Autonomy]] - Harness telemetry makes every preflight and lint gate observable across sessions.
