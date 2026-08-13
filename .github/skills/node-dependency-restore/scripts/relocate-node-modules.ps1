param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryPath,

  [Parameter(Mandatory = $true)]
  [string]$TargetPath,

  [int]$BatchSize = 75
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'node-dependency-restore-common.ps1')

$repository = Get-NormalizedDependencyPath -Path $RepositoryPath
$source = Get-NormalizedDependencyPath -Path (Join-Path $repository 'node_modules')
$expected = "$repository\node_modules"
$target = Get-NormalizedDependencyPath -Path $TargetPath
$residualRoot = "$target-residual"
$packageJsonPath = Join-Path $repository 'package.json'

if (-not $source.Equals($expected, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Unexpected node_modules path: $source"
}
if (
  -not $target.StartsWith('E:\DevCaches\node_modules\', [StringComparison]::OrdinalIgnoreCase) -or
  [System.IO.Path]::GetFileName($target) -ne 'node_modules'
) {
  throw "Target must be dedicated E:\DevCaches\node_modules storage: $target"
}
if (-not (Test-Path -LiteralPath $packageJsonPath -PathType Leaf)) {
  throw "Repository package.json not found: $packageJsonPath"
}
if (Test-DependencyPathsOverlap -Left $source -Right $target) {
  throw "Source and target paths overlap: $source -> $target"
}

Assert-PathComponentsArePhysical `
  -Path $repository `
  -Description 'Repository path'
Assert-PathComponentsArePhysical `
  -Path $target `
  -Description 'Relocation target'
Assert-PathComponentsArePhysical `
  -Path $residualRoot `
  -Description 'Relocation residual path'

$packageJson = Get-Content -Raw -LiteralPath $packageJsonPath | ConvertFrom-Json
$hasNextDependency =
  $null -ne $packageJson.dependencies.next -or
  $null -ne $packageJson.devDependencies.next
$hasNextScript = @($packageJson.scripts.PSObject.Properties.Value) |
  Where-Object { $_ -match '(^|\s)next(?:\s|$)' } |
  Select-Object -First 1
$isCrossDrive =
  [System.IO.Path]::GetPathRoot($source) -ne
  [System.IO.Path]::GetPathRoot($target)
if (($hasNextDependency -or $hasNextScript) -and $isCrossDrive) {
  throw "Cross-drive node_modules relocation is prohibited for Next.js/Turbopack repositories: $source -> $target"
}

$sourceItem = Get-Item -LiteralPath $source -Force
if ($sourceItem.LinkType -eq 'Junction') {
  $actualTarget = Get-NormalizedDependencyPath -Path ([string]$sourceItem.Target)
  if (-not $actualTarget.Equals($target, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Junction target mismatch. Expected $target but found $actualTarget"
  }
  Assert-PhysicalDirectory -Path $target -Description 'Relocation target'
  [pscustomobject]@{
    finalized = $true
    source = $source
    target = $actualTarget
    remaining = 0
  }
  exit 0
}
Assert-PhysicalDirectory -Path $source -Description 'Relocation source'

Assert-NoActiveDependencyProcesses `
  -SensitivePaths @($repository, $source, $target, $residualRoot)
Assert-CurrentDirectoryOutside -Paths @($source, $target, $residualRoot)

New-Item -ItemType Directory -Path $target -Force | Out-Null
New-Item -ItemType Directory -Path $residualRoot -Force | Out-Null
Assert-PhysicalDirectory -Path $target -Description 'Relocation target'
Assert-PhysicalDirectory -Path $residualRoot -Description 'Relocation residual path'

$children = @(
  Get-ChildItem -LiteralPath $source -Force |
    Sort-Object Name |
    Select-Object -First $BatchSize
)
foreach ($child in $children) {
  $destination = Join-Path $target $child.Name
  if (Test-Path -LiteralPath $destination) {
    $residual = Join-Path $residualRoot $child.Name
    if (Test-Path -LiteralPath $residual) {
      $residual = Join-Path $residualRoot "$($child.Name)-$([Guid]::NewGuid().ToString('N'))"
    }
    # Preserve a colliding target entry as residual, then promote the completed
    # local package into the canonical target.
    Move-Item -LiteralPath $destination -Destination $residual
    Move-Item -LiteralPath $child.FullName -Destination $destination
  } else {
    Move-Item -LiteralPath $child.FullName -Destination $destination
  }
}

$remaining = @(Get-ChildItem -LiteralPath $source -Force).Count
if ($remaining -eq 0) {
  Remove-Item -LiteralPath $source -Force
  New-Item -ItemType Junction -Path $source -Target $target | Out-Null
}

[pscustomobject]@{
  finalized = $remaining -eq 0
  source = $source
  target = $target
  remaining = $remaining
  movedThisRun = $children.Count
  residualRoot = $residualRoot
}
