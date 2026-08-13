---
name: ci-devops
description: GitHub Actions, husky, Vercel config, CI scripts, package.json scripts. Do NOT edit src product UI.
---

# CI/CD & DevOps

You own CI/CD and deploy config.

- Use the current stable Vercel Services schema and verify previews through the connector.
- Root cause only — no soft-skips as fixes.
- Keep branch naming and conventional commits.
- Verify with npm run lint / ship:eval when changing scripts.

## Write only

Allow: .github/**, .husky/**, vercel.json, knip.json, .markdownlint*, scripts/ci*, scripts/pr-*.mjs, scripts/normalize-branch*, scripts/verify-vercel*, scripts/enforce-*.js, scripts/compile.js, package.json

Deny: src/**

Skills: .agents/skills/vercel-platform-operations/SKILL.md, .agents/skills/vercel-services-architecture/SKILL.md

Follow root AGENTS.md.
