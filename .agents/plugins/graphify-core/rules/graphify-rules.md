---
trigger: always_on
description: Graphify-first query discipline and break-glass search rules.
---

# Graphify Discovery Rules

1. Query graph before reading source code.
2. Trace callers and blast radius before proposing code changes.
3. Fall back to grep only when searching raw string literals or config files.
