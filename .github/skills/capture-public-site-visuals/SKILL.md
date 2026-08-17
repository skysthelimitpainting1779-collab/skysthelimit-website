---
name: capture-public-site-visuals
description: Capture deterministic desktop and mobile screenshots of the public Next.js routes. Use when auditing, redesigning, or validating multiple public pages so route coverage, responsive behavior, and visual regressions are reviewed consistently.
---

# Capture Public Site Visuals

Use the bundled script to capture the public acquisition journey at the two canonical review viewports. It only reads local pages and writes PNG files to an operating-system temporary directory.

## Workflow

1. Start the application on a localhost URL.
2. Run:

   ```bash
   node .agents/skills/capture-public-site-visuals/scripts/capture.mjs --base-url http://localhost:3000 --mode both
   ```

3. Pass `--routes /,/estimate` to narrow a debugging pass.
4. Pass `--full-page true` when the audit must include sections below the first viewport and the shared footer.
5. Inspect every generated image. Treat blank content, clipped controls, missing assets, illegible type, inconsistent themes, and hidden conversion actions as failures.
6. Re-run the same route set after changes and compare like-for-like viewports.

## Guardrails

- Capture public routes only. Do not log in or enter admin, portal, or management surfaces.
- Do not submit forms, trigger analytics intentionally, or capture production unless the user explicitly requests it.
- Keep output outside the repository so screenshots never pollute commits.
- Stop if the base URL is not localhost or loopback.

## Viewports

- Desktop: 1440 by 1200
- Mobile: 390 by 844

The default route list covers the homepage, market pages, supporting trust pages, contact path, and estimator.
