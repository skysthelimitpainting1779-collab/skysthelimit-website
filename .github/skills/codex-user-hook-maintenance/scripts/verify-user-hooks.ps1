[CmdletBinding()]
param(
    [string]$ConfigPath = (Join-Path $HOME ".codex/hooks.json")
)

$ErrorActionPreference = "Stop"
$failures = [System.Collections.Generic.List[string]]::new()

if (-not (Test-Path -LiteralPath $ConfigPath)) {
    Write-Error "Codex user hook configuration is missing: $ConfigPath"
    exit 1
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
foreach ($eventProperty in $config.hooks.PSObject.Properties) {
    foreach ($group in @($eventProperty.Value)) {
        foreach ($hook in @($group.hooks)) {
            if ($hook.type -ne "command" -or [string]::IsNullOrWhiteSpace($hook.command)) {
                continue
            }

            $command = [string]$hook.command
            if ($command -match '^\s*node\s+(?<path>[A-Za-z]:\\[^"].*?\s+[^"].*?\.js)(?:\s|$)') {
                $failures.Add("$($eventProperty.Name) contains an unquoted Node script path with spaces.")
                continue
            }

            if ($command -match '^\s*node\s+"(?<path>[A-Za-z]:\\[^"]+\.js)"(?:\s|$)') {
                $scriptPath = $Matches.path
                if (-not (Test-Path -LiteralPath $scriptPath)) {
                    $failures.Add("$($eventProperty.Name) references a missing script: $scriptPath")
                }
                else {
                    & node --check $scriptPath
                    if ($LASTEXITCODE -ne 0) {
                        $failures.Add("$($eventProperty.Name) references a script that fails node --check: $scriptPath")
                    }
                }
            }
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Error ("Codex user-hook verification failed:`n- " + ($failures -join "`n- "))
    exit 1
}

Write-Output "Codex user-hook verification passed."
