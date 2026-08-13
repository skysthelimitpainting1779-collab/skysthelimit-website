[CmdletBinding()]
param(
    [switch]$RequireFreshGraph
)

$ErrorActionPreference = "Stop"
$failures = [System.Collections.Generic.List[string]]::new()
$requiredHooks = @(
    "prepare-commit-msg",
    "commit-msg",
    "post-commit",
    "post-rewrite",
    "pre-push"
)

if (-not (Test-Path -LiteralPath ".git")) {
    try {
        $null = git rev-parse --git-dir 2>$null
    }
    catch {
        $failures.Add("Current directory is not a Git worktree.")
    }
}

$hooksPath = (git config --get core.hooksPath).Trim()
if ($hooksPath -ne ".husky") {
    $failures.Add("core.hooksPath is '$hooksPath'; expected '.husky'.")
}

$entireCommand = Get-Command entire -ErrorAction SilentlyContinue
if ($null -eq $entireCommand) {
    $failures.Add("Entire CLI is not available on PATH.")
}
& sh -lc "command -v entire >/dev/null 2>&1"
if ($LASTEXITCODE -ne 0) {
    $failures.Add("Entire CLI is not available in Git's shell environment.")
}

$settingsPath = ".entire/settings.json"
if (-not (Test-Path -LiteralPath $settingsPath)) {
    $failures.Add("$settingsPath is missing.")
}
else {
    $settings = Get-Content -LiteralPath $settingsPath -Raw | ConvertFrom-Json
    if ($settings.enabled -ne $true) {
        $failures.Add("Entire checkpointing is not enabled in $settingsPath.")
    }
}

foreach ($hook in $requiredHooks) {
    $hookPath = ".husky/$hook"
    if (-not (Test-Path -LiteralPath $hookPath)) {
        $failures.Add("$hookPath is missing.")
        continue
    }

    $content = Get-Content -LiteralPath $hookPath -Raw
    $escapedHook = [regex]::Escape($hook)
    $invocationCount = [regex]::Matches(
        $content,
        "entire\s+hooks\s+git\s+$escapedHook(?:\s|`"|')"
    ).Count
    if ($invocationCount -ne 1) {
        $failures.Add("$hookPath contains $invocationCount matching Entire invocations; expected exactly one.")
    }

    $modeLine = git ls-files -s -- $hookPath
    if (-not $modeLine -or -not $modeLine.StartsWith("100755 ")) {
        $failures.Add("$hookPath is not tracked executable (100755).")
    }

    & sh -n $hookPath
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("$hookPath failed shell syntax validation.")
    }

    $legacyPath = "$hookPath.pre-entire"
    if (Test-Path -LiteralPath $legacyPath) {
        $legacyContent = Get-Content -LiteralPath $legacyPath -Raw
        if ($legacyContent -match "entire\s+hooks\s+git") {
            $failures.Add("$legacyPath invokes Entire again and must not remain in the chain.")
        }
    }
}

foreach ($legacyHook in Get-ChildItem -LiteralPath ".husky" -Filter "*.pre-entire" -File -ErrorAction SilentlyContinue) {
    $legacyContent = Get-Content -LiteralPath $legacyHook.FullName -Raw
    if ($legacyContent -match "entire\s+hooks\s+git") {
        $failures.Add("$($legacyHook.FullName) invokes Entire again and must not remain in the chain.")
    }
}

$codexHooksPath = ".codex/hooks.json"
if (-not (Test-Path -LiteralPath $codexHooksPath)) {
    $failures.Add("$codexHooksPath is missing.")
}
else {
    $codexHooks = Get-Content -LiteralPath $codexHooksPath -Raw | ConvertFrom-Json
    $codexEventCommands = [ordered]@{
        SessionStart     = "entire hooks codex session-start"
        UserPromptSubmit = "entire hooks codex user-prompt-submit"
        Stop             = "entire hooks codex stop"
        PostToolUse      = "entire hooks codex post-tool-use"
    }
    foreach ($eventName in $codexEventCommands.Keys) {
        if ($null -eq $codexHooks.hooks.$eventName) {
            $failures.Add("$codexHooksPath does not declare Entire's $eventName hook.")
            continue
        }
        $eventJson = $codexHooks.hooks.$eventName | ConvertTo-Json -Depth 10 -Compress
        $expectedCommand = [regex]::Escape($codexEventCommands[$eventName])
        $commandCount = [regex]::Matches($eventJson, $expectedCommand).Count
        if ($commandCount -ne 1) {
            $failures.Add("$codexHooksPath contains $commandCount '$($codexEventCommands[$eventName])' commands for $eventName; expected exactly one.")
        }
    }
}

$postCommitContent = Get-Content -LiteralPath ".husky/post-commit" -Raw
if ($postCommitContent -notmatch "# graphify-hook-start") {
    $failures.Add(".husky/post-commit does not contain Graphify's native update hook.")
}
if ($postCommitContent -match "_GFY_GITDIR[\s\S]*_GFY_COMMONDIR[\s\S]*exit\s+0") {
    $failures.Add(".husky/post-commit skips Graphify updates in Git worktrees.")
}

$postCheckoutPath = ".husky/post-checkout"
if (-not (Test-Path -LiteralPath $postCheckoutPath)) {
    $failures.Add("$postCheckoutPath is missing.")
}
else {
    $postCheckoutContent = Get-Content -LiteralPath $postCheckoutPath -Raw
    if ($postCheckoutContent -notmatch "# graphify-checkout-hook-start") {
        $failures.Add("$postCheckoutPath does not contain Graphify's native checkout hook.")
    }
    $postCheckoutMode = git ls-files -s -- $postCheckoutPath
    if (-not $postCheckoutMode -or -not $postCheckoutMode.StartsWith("100755 ")) {
        $failures.Add("$postCheckoutPath is not tracked executable (100755).")
    }
    & sh -n $postCheckoutPath
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("$postCheckoutPath failed shell syntax validation.")
    }
}

$graphifyCommand = Get-Command graphify -ErrorAction SilentlyContinue
if ($null -eq $graphifyCommand) {
    $failures.Add("Graphify is not available on PATH.")
}
& sh -lc "command -v graphify >/dev/null 2>&1"
if ($LASTEXITCODE -ne 0) {
    $failures.Add("Graphify is not available in Git's shell environment.")
}

if ($null -ne $graphifyCommand) {
    $graphifyStatus = (& graphify hook status 2>&1 | Out-String).Trim()
    foreach ($expectedStatus in @(
        "post-commit: installed",
        "post-checkout: installed",
        "merge driver: registered"
    )) {
        if ($graphifyStatus -notmatch [regex]::Escape($expectedStatus)) {
            $failures.Add("graphify hook status did not report '$expectedStatus'.")
        }
    }
}

$graphRootPath = "graphify-out/.graphify_root"
if (-not (Test-Path -LiteralPath $graphRootPath)) {
    $failures.Add("$graphRootPath is missing.")
}
elseif ((Get-Content -LiteralPath $graphRootPath -Raw).Trim() -ne ".") {
    $failures.Add("$graphRootPath must resolve to the current repository root (.).")
}

$graphPath = "graphify-out/graph.json"
if (-not (Test-Path -LiteralPath $graphPath)) {
    $failures.Add("$graphPath is missing.")
}
elseif ($RequireFreshGraph) {
    $headTimestamp = [DateTimeOffset]::Parse((git show -s --format=%cI HEAD).Trim()).UtcDateTime
    $graphTimestamp = (Get-Item -LiteralPath $graphPath).LastWriteTimeUtc
    if ($graphTimestamp -lt $headTimestamp) {
        $failures.Add("$graphPath is older than HEAD; wait for or rerun the Graphify update.")
    }
}

if ($null -ne $entireCommand) {
    $statusOutput = (& entire status 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("entire status failed.")
    }
    elseif ($statusOutput -notmatch "Enabled") {
        $failures.Add("entire status did not report checkpointing as enabled.")
    }

    $agentOutput = (& entire agent list 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        $failures.Add("entire agent list failed.")
    }
    elseif ($agentOutput -notmatch "(?m)^\s*✓\s+codex\s*$") {
        $failures.Add("entire agent list did not report the native Codex integration as installed.")
    }
}

if ($failures.Count -gt 0) {
    Write-Error ("Entire hook verification failed:`n- " + ($failures -join "`n- "))
    exit 1
}

Write-Output "Entire hook verification passed for $($requiredHooks.Count) managed Git hooks."
