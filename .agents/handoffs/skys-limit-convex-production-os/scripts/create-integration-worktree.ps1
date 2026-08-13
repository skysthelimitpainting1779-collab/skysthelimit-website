param(
  [Parameter(Mandatory=$false)]
  [string]$RepoRoot = ".",

  [Parameter(Mandatory=$false)]
  [string]$PackageRoot = "",

  [Parameter(Mandatory=$false)]
  [string]$WorktreeParent = ""
)

$ErrorActionPreference = "Stop"
$AuditCommit = "c7e94605eefdace7a76ce5145808478df8503dbb"
$BranchBase = "agent/skys-limit-convex-os"

$RepoRoot = (Resolve-Path $RepoRoot).Path
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
  throw "RepoRoot is not a Git working tree: $RepoRoot"
}

if (-not $PackageRoot) {
  $PackageRoot = Split-Path -Parent $PSScriptRoot
}
$PackageRoot = (Resolve-Path $PackageRoot).Path

if (-not $WorktreeParent) {
  $WorktreeParent = Join-Path (Split-Path -Parent $RepoRoot) "skys-limit-worktrees"
}
New-Item -ItemType Directory -Force -Path $WorktreeParent | Out-Null

git -C $RepoRoot fetch origin main
if ($LASTEXITCODE -ne 0) {
  throw "Failed to fetch origin/main"
}

$OriginMain = (git -C $RepoRoot rev-parse origin/main).Trim()
if (-not $OriginMain) {
  throw "Could not resolve origin/main"
}

git -C $RepoRoot merge-base --is-ancestor $AuditCommit origin/main
$AuditIsAncestor = ($LASTEXITCODE -eq 0)

$Index = 1
while ($true) {
  $Branch = if ($Index -eq 1) { $BranchBase } else { "$BranchBase-$Index" }
  git -C $RepoRoot show-ref --verify --quiet "refs/heads/$Branch"
  $LocalExists = ($LASTEXITCODE -eq 0)
  git -C $RepoRoot ls-remote --exit-code --heads origin $Branch *> $null
  $RemoteExists = ($LASTEXITCODE -eq 0)
  if (-not $LocalExists -and -not $RemoteExists) { break }
  $Index++
}

$SafeName = $Branch.Replace("/", "-")
$WorktreePath = Join-Path $WorktreeParent $SafeName
if (Test-Path $WorktreePath) {
  throw "Chosen worktree path already exists: $WorktreePath"
}

git -C $RepoRoot worktree add $WorktreePath -b $Branch origin/main
if ($LASTEXITCODE -ne 0) {
  throw "Failed to create integration worktree"
}

$HandoffDestination = Join-Path $WorktreePath ".agents\handoffs\skys-limit-convex-production-os"
New-Item -ItemType Directory -Force -Path $HandoffDestination | Out-Null
Get-ChildItem -Force $PackageRoot | ForEach-Object {
  Copy-Item -Recurse -Force $_.FullName $HandoffDestination
}

$GraphDestination = Join-Path $WorktreePath ".graph"
New-Item -ItemType Directory -Force -Path $GraphDestination | Out-Null
Copy-Item -Recurse -Force (Join-Path $PackageRoot "compiled\.graph\*") $GraphDestination

$DeltaPath = Join-Path $HandoffDestination "ORIGIN_MAIN_DELTA.txt"
if ($AuditIsAncestor) {
  git -C $WorktreePath diff --name-status "$AuditCommit..origin/main" | Out-File -Encoding utf8 $DeltaPath
} else {
  "BLOCKED: audited commit is not an ancestor of origin/main. Revalidate repository map before product edits." |
    Out-File -Encoding utf8 $DeltaPath
}

$Result = [ordered]@{
  ok = $true
  repoRoot = $RepoRoot
  packageRoot = $PackageRoot
  auditedCommit = $AuditCommit
  originMain = $OriginMain
  auditCommitIsAncestor = $AuditIsAncestor
  integrationBranch = $Branch
  integrationWorktree = $WorktreePath
  handoff = $HandoffDestination
  graph = $GraphDestination
  implementationBlockedForReaudit = (-not $AuditIsAncestor)
}

$Result | ConvertTo-Json -Depth 4
