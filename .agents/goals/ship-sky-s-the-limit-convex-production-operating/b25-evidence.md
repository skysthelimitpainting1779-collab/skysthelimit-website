# B25 Design Governance Evidence

## Decision

Status: passed

B25 installed the design source of truth, 51 route wireframes, mandatory design
lint, anti-slop lint, evidence verification, pinned design skills, and
host-native skill mirrors. No production service or deployment was changed.

## Discovery and external contract

- Graphifyy was queried before repository navigation for B25, the design
  findings, and the evidence validators.
- Context7 library ID: `/websites/nodejs_latest-v24_x_api`.
- Applied Node 24 contract: `fs.cpSync` may overwrite recursively,
  `fs.rmSync({ recursive: true, force: true })` removes recursively, and the
  copy/remove sequence is not atomic.

## Package and recovery

- Archive: `external-cache://downloads/skys-limit-post-b20-design-governed-execute.zip`
- Entries: 387
- Manifest entries: 386, all verified
- Archive SHA-256:
  `9f2cc094f2613836aea5f225675c026bee3dfe49354e3a2a7c6b2ff6371405c3`
- External pre-install rollback copy:
  `external-cache://b25-preinstall-backup-e330aa5`
- Repository-local vendor checkouts and backups: none

The first skill-install attempt failed closed because the first pinned
UI/UX candidate lacked `SKILL.md`. The cached installer was corrected to
require `SKILL.md` before selecting a single-skill source, the incomplete
destination was quarantined externally, and the preserved skill was restored
before one corrected run.

## Installed sources

- Impeccable:
  `5e572c8b8af3e108ab52ce4180adb4d6eb1c2ebc`, Apache-2.0
- UI/UX Pro Max:
  `3b5df7547964f0cb3424de74cff55b69039250d3`, MIT
- Taste full bundle:
  `e988add20dab0fa97d7a76781c48961c8184288e`, MIT
- Installed destinations: 15
- Installer report errors: 0
- Upstream license and notice texts:
  `docs/design/licenses/`

## Design verification

- Wireframes: 18 public + 11 customer + 22 operator = 51
- `npm run design:gate`: passed, one evidence node verified
- `npm run lint:design:all`: passed with zero warnings
- `npm run lint:slop:all`: passed with zero findings
- Historical `transition-all` findings: five active files were repaired with
  named transition properties after full lint proved the findings still
  existed.
- Desktop/mobile evidence:
  `output/playwright/b25-refer-desktop.png` and
  `output/playwright/b25-refer-mobile.png`

## Repository and graph verification

- Execution-graph skill validation: 7/7 focused tests passed
- Canonical graph validation: 66 nodes, 204 edges, no cycle or dependency-edge
  mismatch
- Critical path: 6,540 minutes, 24 nodes
- Expected budget: soft warning at 93.1375% AI and 79.6875% labor; no hard-stop
  breach. Contingency/retry exposure is reported separately.
- Host compilation: idempotent tree hash
  `04537b2595e2420c3934c2bfc949e5e3e88435027c07df2ac817fabbecaca53f`
- `npm run skills:validate`: passed
- `npm run goal:verify -- --build`: passed at
  `2026-07-27T23:20:32.354Z`
- Tests: 390/390 passed
- Next.js production build: passed, 44 static pages generated
- Nested repository metadata under `.agents` and `.github`: none
