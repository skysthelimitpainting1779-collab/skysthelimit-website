---
name: vercel-integrations-connect
description: Use when inventorying, provisioning, connecting, scoping, or removing Vercel Marketplace Integration resources, connectors, project links, and generated environment variables.
---

# Vercel Integrations and Connect

Inventory before changing:

```bash
vercel integration list --all --format=json
vercel integration list <project> --format=json
vercel env ls
```

Prefer project/resource links over copied secrets. Scope development, preview, and production separately. Use environment-variable prefixes to avoid collisions.

Never create a billable production resource, disconnect a resource, or remove a resource without explicit approval. Record resource name, integration, connected project, environments, variable names, and rollback path without logging secret values.
