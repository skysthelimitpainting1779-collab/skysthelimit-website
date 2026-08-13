#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${1:-.}"
PACKAGE_ROOT="${2:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
WORKTREE_PARENT="${3:-$(cd "$REPO_ROOT/.." && pwd)/skys-limit-worktrees}"
AUDIT_COMMIT="c7e94605eefdace7a76ce5145808478df8503dbb"
BRANCH_BASE="agent/skys-limit-convex-os"

REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
PACKAGE_ROOT="$(cd "$PACKAGE_ROOT" && pwd)"
mkdir -p "$WORKTREE_PARENT"
WORKTREE_PARENT="$(cd "$WORKTREE_PARENT" && pwd)"

git -C "$REPO_ROOT" fetch origin main
ORIGIN_MAIN="$(git -C "$REPO_ROOT" rev-parse origin/main)"

if git -C "$REPO_ROOT" merge-base --is-ancestor "$AUDIT_COMMIT" origin/main; then
  AUDIT_IS_ANCESTOR=true
else
  AUDIT_IS_ANCESTOR=false
fi

if [[ "$AUDIT_IS_ANCESTOR" != true ]]; then
  cat <<JSON
{
  "ok": false,
  "repoRoot": "$REPO_ROOT",
  "packageRoot": "$PACKAGE_ROOT",
  "auditedCommit": "$AUDIT_COMMIT",
  "originMain": "$ORIGIN_MAIN",
  "auditCommitIsAncestor": false,
  "implementationBlockedForReaudit": true
}
JSON
  exit 2
fi

index=1
while true; do
  if [[ "$index" -eq 1 ]]; then
    branch="$BRANCH_BASE"
  else
    branch="${BRANCH_BASE}-${index}"
  fi
  if ! git -C "$REPO_ROOT" show-ref --verify --quiet "refs/heads/$branch" &&
     ! git -C "$REPO_ROOT" ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
    break
  fi
  index=$((index + 1))
done

safe_name="${branch//\//-}"
worktree_path="$WORKTREE_PARENT/$safe_name"
[[ ! -e "$worktree_path" ]] || { echo "Worktree path exists: $worktree_path" >&2; exit 1; }

git -C "$REPO_ROOT" worktree add "$worktree_path" -b "$branch" origin/main >&2

handoff="$worktree_path/.agents/handoffs/skys-limit-convex-production-os"
mkdir -p "$handoff"
cp -R "$PACKAGE_ROOT"/. "$handoff"/

mkdir -p "$worktree_path/.graph"
cp -R "$PACKAGE_ROOT/compiled/.graph"/. "$worktree_path/.graph"/

if [[ "$AUDIT_IS_ANCESTOR" == true ]]; then
  git -C "$worktree_path" diff --name-status "$AUDIT_COMMIT..origin/main" > "$handoff/ORIGIN_MAIN_DELTA.txt"
else
  printf '%s\n' \
    "BLOCKED: audited commit is not an ancestor of origin/main. Revalidate repository map before product edits." \
    > "$handoff/ORIGIN_MAIN_DELTA.txt"
fi

if [[ -f "$worktree_path/scripts/execution/refresh_graphify.py" ]]; then
  python "$worktree_path/scripts/execution/refresh_graphify.py" --root "$worktree_path" >&2
fi

cat <<JSON
{
  "ok": true,
  "repoRoot": "$REPO_ROOT",
  "packageRoot": "$PACKAGE_ROOT",
  "auditedCommit": "$AUDIT_COMMIT",
  "originMain": "$ORIGIN_MAIN",
  "auditCommitIsAncestor": $AUDIT_IS_ANCESTOR,
  "integrationBranch": "$branch",
  "integrationWorktree": "$worktree_path",
  "handoff": "$handoff",
  "graph": "$worktree_path/.graph",
  "codeGraph": "$worktree_path/graphify-out/graph.json",
  "implementationBlockedForReaudit": $([[ "$AUDIT_IS_ANCESTOR" == true ]] && echo false || echo true)
}
JSON
