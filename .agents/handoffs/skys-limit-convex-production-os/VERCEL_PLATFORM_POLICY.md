# Vercel-First Platform Execution Policy

## Mandatory plugin use

The executor must use the connected **Vercel plugin/connector** as the source of truth for platform state. CLI output alone is not sufficient for deployment acceptance.

Before B00 changes:

1. Read the current Vercel project with the connector.
2. List recent deployments.
3. Read grouped runtime errors.
4. Record the current production deployment and rollback reference.
5. Use Vercel documentation search for every Services, Integrations, Workflow, environment, deployment, routing, or rollback task.

During preview verification:

- inspect the deployment record;
- inspect build logs on failure;
- inspect runtime errors and relevant logs;
- fetch protected preview URLs through the Vercel connector;
- store the deployment URL and evidence in the goal and graph ledger.

Do not promote, alias, modify production project settings, or change domains without the named production gate.

## Target Vercel Services topology

The existing Vercel project currently uses the `nextjs` framework preset. The preview-safe target is a **Vercel Services** project:

```text
Vercel project: website
├── web
│   ├── framework: Next.js 16
│   ├── existing marketing, portal, and operator application
│   └── public route prefix: /
└── integrations
    ├── framework: TypeScript Node/Hono unless current official docs require a different supported adapter
    ├── verified provider webhooks
    ├── integration adapters
    ├── Vercel Workflow entrypoints
    └── internal by default
```

Requirements:

- Use the current official Vercel Services schema, not remembered syntax.
- Set the project framework to `services` only for a preview-safe branch/deployment first.
- Use an internal service binding such as `INTEGRATIONS_URL` from `web` to `integrations`.
- Expose only explicit webhook/integration routes through service rewrites.
- Services without a rewrite remain internal.
- Convex remains the business-state backend; the `integrations` service is an execution/integration boundary, not a second system of record.
- Do not add a service solely for appearance. Every service must have a measurable security, runtime, dependency, or deployment boundary.
- Production conversion from `nextjs` to `services` is part of the G70 approval packet.

## Vercel Marketplace Integrations and Connect

B00 must inventory:

```bash
vercel integration list --all --format=json
vercel integration list website --format=json
vercel env ls
vercel pull --environment=preview
```

Use Vercel Marketplace Integration resources and Vercel Connect where available and appropriate:

- prefer managed project/resource links over manually copied credentials;
- scope resources and variables by development, preview, and production;
- use prefixes when generated environment variables could collide;
- connect existing preview/development resources without creating production resources;
- provisioning a billable or production resource requires explicit approval;
- never disconnect or remove a resource during B00–B60.

The executor must document why each selected integration is connected directly, connected through Vercel Connect, or configured manually.

## Documentation sources

For Vercel platform questions, use both:

1. The Vercel plugin's official documentation search.
2. Context7 for the exact framework/library API involved.

A platform task is not ready until both sources are recorded in its evidence packet.
