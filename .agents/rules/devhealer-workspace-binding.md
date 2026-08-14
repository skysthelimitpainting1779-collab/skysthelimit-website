---
trigger: model_decision
description: Diagnose DevHealer or Graphify MCP startup from portable workspace configuration.
---

# DevHealer workspace binding

`.agents/mcp_config.json` uses workspace-relative commands and arguments. Resolve the active Git root before diagnostics; never commit `C:\Users\...` or another machine-specific prefix.

The former `.agents/sidecars.json` registry is retired because current Antigravity discovers sidecars from individual `sidecar.json` files in global or plugin-sidecar locations, not from a workspace aggregate file. The existing DevHealer code remains an on-demand MCP/skill capability and bounded remediation input, not a self-authorizing background repair loop.

If Graphify reports an implausibly small graph, verify `graphify-out/graph.json`, reload the MCP, and record the failure. Do not rewrite the project path into configuration.
