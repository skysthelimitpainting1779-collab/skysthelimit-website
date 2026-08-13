---
name: node-dependency-restore
description: Restore a missing or incomplete Node.js dependency tree from the repository lockfile and verify required executables. Use after another process removes node_modules, when local package binaries disappear, or before repeated validation in a shared worktree.
---

# Node Dependency Restore

1. Confirm no dependency-mutating package command is running. The scripts fail closed for npm, pnpm, Yarn, Bun, and Corepack mutation commands even when a wrapper or current-directory launch omits the repository path.
2. Preserve `package.json` and the lockfile; do not delete or regenerate either as a recovery shortcut.
3. Check free space on the worktree volume before reinstalling. If extraction previously failed with `ENOSPC`, resolve the exact absolute `node_modules` path and verify it equals `<repo-or-worktree>\node_modules`.
4. Read `package.json` before considering relocation. **Hard deny cross-drive `node_modules` relocation for Next.js or Turbopack projects.** A repository is in scope when `next` is a dependency/devDependency or a package script invokes `next`. Context7 library `/vercel/next.js` documents the governing contract: Turbopack resolves files within its filesystem root and intentionally rejects files outside it. A junction from C: to E: therefore remains outside the root, and Windows drives have no shared parent root that can safely widen the boundary.
5. For a Next.js/Turbopack repository, keep the physical dependency tree at `<repo-or-worktree>\node_modules`. Reclaim space using rebuildable caches outside the repository (for example the npm download cache), not by relocating active dependencies.
6. For a non-Next project only, an E:-native install may be used when C: is constrained: copy only `package.json`, the lockfile, and `.npmrc` into `E:\DevCaches\node_modules\<repo-or-worktree-name>`, then run `npm install --prefix <that-E-project-root> --ignore-scripts` through `hardened-validation`. Rebuild required native dependencies explicitly afterward.
7. For a non-Next project only, if dependencies were installed on C:, run `scripts/relocate-node-modules.ps1 -RepositoryPath <absolute-path> -TargetPath E:\DevCaches\node_modules\<repo-or-worktree-name>\node_modules` after npm exits and no package process remains. The script independently enforces the Next/Turbopack cross-drive denial and rejects overlapping paths, reparse-point sources, and linked target path components.
8. Verify the dependency path is a physical directory for Next/Turbopack projects, required executables resolve from that local path, and `npm ls <package> --depth=0` succeeds.
9. Resume interrupted checks through `hardened-validation`.

## Cross-drive rollback

When a Next/Turbopack checkout already has a cross-drive junction:

1. Confirm no Node/npm process uses the exact checkout, record free space on both drives, and measure the exact junction target.
2. Run `scripts/restore-node-modules-local.ps1 -RepositoryPath <absolute-path> -ExpectedTargetPath <absolute-E-target>`. It rejects linked staging paths, recreates staging empty on the repository drive, compares sorted relative paths, entry types, link targets, file lengths, and SHA-256 content hashes, rechecks the source junction, and only then promotes staging. The E: dependency tree remains untouched.
3. Verify the restored `node_modules` is a physical directory, package tools resolve from the C: path, TypeScript succeeds, and the Next production build succeeds through `hardened-validation`.
4. Keep the E: copy until all checks pass. Afterward, either retain it as a temporary rollback backup or move it to an explicitly named quarantine. Delete it only after separately verifying the active C: tree and exact E: target; never delete through the former junction path.

If installation changes the lockfile unexpectedly, inspect the diff and separate intentional dependency changes from recovery noise before delivery.
