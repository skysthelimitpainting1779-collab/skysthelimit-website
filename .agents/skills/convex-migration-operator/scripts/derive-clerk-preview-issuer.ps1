param(
  [string]$ScratchRoot = "E:\SkysLimitScratch",
  [string]$ResultPath = "E:\SkysLimitScratch\clerk-issuer-result.json"
)

$ErrorActionPreference = "Stop"

function Assert-NoReparsePoint {
  param([Parameter(Mandatory = $true)][string]$Path)

  $fullPath = [IO.Path]::GetFullPath($Path)
  $pathRoot = [IO.Path]::GetPathRoot($fullPath)
  $current = $pathRoot
  $relative = $fullPath.Substring($pathRoot.Length)
  foreach ($segment in $relative.Split([IO.Path]::DirectorySeparatorChar, [StringSplitOptions]::RemoveEmptyEntries)) {
    $current = Join-Path $current $segment
    if (Test-Path -LiteralPath $current) {
      $item = Get-Item -LiteralPath $current -Force
      if (($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
        throw "Scratch paths must not contain reparse points."
      }
    }
  }
  return $fullPath
}

$root = [IO.Path]::GetFullPath($ScratchRoot)
if (-not (Test-Path -LiteralPath $root)) {
  New-Item -ItemType Directory -Path $root -ErrorAction Stop | Out-Null
}
if (-not (Test-Path -LiteralPath $root -PathType Container)) {
  throw "Scratch root must be a directory."
}
$root = Assert-NoReparsePoint -Path $root
$scratch = [IO.Path]::GetFullPath((Join-Path $root "g20-clerk-$([Guid]::NewGuid().ToString('N'))"))
if (-not $scratch.StartsWith($root + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Unsafe scratch path."
}

$createdAt = (Get-Date).ToUniversalTime().ToString("o")
$envFile = Join-Path $scratch "preview.env"
$issuerDomain = $null
$scratchCreated = $false

try {
  Assert-NoReparsePoint -Path $root | Out-Null
  New-Item -ItemType Directory -Path $scratch -ErrorAction Stop | Out-Null
  $scratchCreated = $true
  Assert-NoReparsePoint -Path $root | Out-Null
  Assert-NoReparsePoint -Path $scratch | Out-Null
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
  & icacls $scratch /inheritance:r /grant:r "${identity}:(OI)(CI)F" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Scratch ACL hardening failed." }

  $vercelCli = Resolve-Path "node_modules\vercel\dist\index.js"
  & node.exe $vercelCli env pull $envFile --environment preview --yes *> $null
  if ($LASTEXITCODE -ne 0) { throw "Preview environment pull failed." }

  $line = Get-Content -LiteralPath $envFile |
    Where-Object { $_ -match "^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=" } |
    Select-Object -First 1
  if (-not $line) { throw "Preview Clerk publishable key is missing." }

  $key = $line.Substring($line.IndexOf("=") + 1).Trim().Trim('"')
  if (-not $key.StartsWith("pk_test_", [StringComparison]::Ordinal)) {
    throw "Preview Clerk publishable key is not a test-tier key."
  }

  $encoded = $key.Substring("pk_test_".Length).Replace("-", "+").Replace("_", "/")
  while (($encoded.Length % 4) -ne 0) { $encoded += "=" }
  $decoded = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($encoded)).TrimEnd('$')
  $uri = [Uri]("https://$decoded")
  if ($uri.Scheme -ne "https" -or $uri.UserInfo -or -not $uri.IsDefaultPort -or $uri.AbsolutePath -ne "/" -or
      $uri.Query -or $uri.Fragment -or $uri.HostNameType -ne [UriHostNameType]::Dns) {
    throw "Decoded Clerk issuer is not a safe HTTPS origin."
  }
  $issuerDomain = $uri.GetLeftPart([UriPartial]::Authority)
}
finally {
  $key = $null
  $encoded = $null
  $decoded = $null
  if ($scratchCreated -and (Test-Path -LiteralPath $scratch)) {
    Assert-NoReparsePoint -Path $root | Out-Null
    Assert-NoReparsePoint -Path $scratch | Out-Null
    Remove-Item -LiteralPath $scratch -Recurse -Force
  }
}

if (-not $issuerDomain) { throw "Clerk issuer discovery did not complete." }

$result = [pscustomobject]@{
  issuerDomain = $issuerDomain
  scratchPath = $scratch
  createdAt = $createdAt
  deletedAt = (Get-Date).ToUniversalTime().ToString("o")
  deleted = -not (Test-Path -LiteralPath $scratch)
} | ConvertTo-Json -Compress

[IO.File]::WriteAllText([IO.Path]::GetFullPath($ResultPath), $result)
Write-Output $result
