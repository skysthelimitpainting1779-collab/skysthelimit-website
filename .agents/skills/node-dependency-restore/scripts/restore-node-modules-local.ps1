param(
  [Parameter(Mandatory = $true)]
  [string]$RepositoryPath,

  [Parameter(Mandatory = $true)]
  [string]$ExpectedTargetPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'node-dependency-restore-common.ps1')

$repository = Get-NormalizedDependencyPath -Path $RepositoryPath
$source = Get-NormalizedDependencyPath -Path (Join-Path $repository 'node_modules')
$expectedSource = "$repository\node_modules"
$expectedTarget = Get-NormalizedDependencyPath -Path $ExpectedTargetPath
$staging = Get-NormalizedDependencyPath -Path (
  Join-Path $repository 'node_modules.restore-staging'
)

if (-not $source.Equals($expectedSource, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Unexpected node_modules path: $source"
}
if (-not (Test-Path -LiteralPath (Join-Path $repository 'package.json') -PathType Leaf)) {
  throw "Repository package.json not found: $repository"
}

Assert-PathComponentsArePhysical `
  -Path $repository `
  -Description 'Repository path'
$stagingItem = Get-Item -LiteralPath $staging -Force -ErrorAction SilentlyContinue
if ($null -ne $stagingItem) {
  Assert-PhysicalDirectory -Path $staging -Description 'Restore staging'
}

$sourceItem = Get-Item -LiteralPath $source -Force
if ($sourceItem.LinkType -ne 'Junction') {
  throw "Source is not a junction: $source"
}
$actualTarget = Get-NormalizedDependencyPath -Path ([string]$sourceItem.Target)
if (-not $actualTarget.Equals($expectedTarget, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Junction target mismatch. Expected $expectedTarget but found $actualTarget"
}
Assert-PathComponentsArePhysical `
  -Path $actualTarget `
  -Description 'Rollback target'
Assert-PhysicalDirectory -Path $actualTarget -Description 'Rollback target'
if (
  [System.IO.Path]::GetPathRoot($source) -eq
  [System.IO.Path]::GetPathRoot($actualTarget)
) {
  throw "Rollback helper is only for cross-drive junctions: $source -> $actualTarget"
}

Assert-NoActiveDependencyProcesses `
  -SensitivePaths @($repository, $source, $staging, $actualTarget)
Assert-CurrentDirectoryOutside -Paths @($source, $staging, $actualTarget)

$sourceBeforeCopy = @(Get-DependencyTreeManifest -Root $actualTarget)
$sourceMeasure = Get-ChildItem -LiteralPath $actualTarget -Recurse -Force -File |
  Measure-Object -Property Length -Sum
$repositoryDrive = Get-PSDrive -Name (
  [System.IO.Path]::GetPathRoot($repository).TrimEnd(':\')
)
$requiredBytes = [int64]$sourceMeasure.Sum + 536870912
if ([int64]$repositoryDrive.Free -lt $requiredBytes) {
  throw "Insufficient repository-drive space. Required $requiredBytes bytes; free $($repositoryDrive.Free) bytes."
}

Reset-PhysicalDirectory `
  -Path $staging `
  -AllowedParent $repository `
  -Description 'Restore staging'

$robocopyArgs = @(
  $actualTarget,
  $staging,
  '/E',
  '/COPY:DAT',
  '/DCOPY:DAT',
  '/SL',
  '/SJ',
  '/R:2',
  '/W:1',
  '/NFL',
  '/NDL',
  '/NJH',
  '/NJS',
  '/NP'
)
& robocopy.exe @robocopyArgs
$robocopyExit = $LASTEXITCODE
if ($robocopyExit -gt 7) {
  throw "Robocopy failed with exit code $robocopyExit. Staging preserved at $staging"
}

$sourceAfterCopy = @(Get-DependencyTreeManifest -Root $actualTarget)
$stagingManifest = @(Get-DependencyTreeManifest -Root $staging)
Assert-DependencyTreeManifestsEqual `
  -Expected $sourceBeforeCopy `
  -Actual $sourceAfterCopy `
  -Description 'Rollback source stability'
Assert-DependencyTreeManifestsEqual `
  -Expected $sourceAfterCopy `
  -Actual $stagingManifest `
  -Description 'Staged dependency tree'

$stagingMeasure = Get-ChildItem -LiteralPath $staging -Recurse -Force -File |
  Measure-Object -Property Length -Sum
$sourceItemAfterCopy = Get-Item -LiteralPath $source -Force
if ($sourceItemAfterCopy.LinkType -ne 'Junction') {
  throw "Source changed before promotion: $source"
}
$targetAfterCopy = Get-NormalizedDependencyPath -Path (
  [string]$sourceItemAfterCopy.Target
)
if (-not $targetAfterCopy.Equals($actualTarget, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Junction target changed before promotion. Expected $actualTarget but found $targetAfterCopy"
}

[System.IO.Directory]::Delete($source, $false)
try {
  Move-Item -LiteralPath $staging -Destination $source
} catch {
  if (-not (Test-Path -LiteralPath $source)) {
    New-Item -ItemType Junction -Path $source -Target $actualTarget | Out-Null
  }
  throw
}

Assert-PhysicalDirectory -Path $source -Description 'Restored node_modules'
$restoredManifest = @(Get-DependencyTreeManifest -Root $source)
Assert-DependencyTreeManifestsEqual `
  -Expected $sourceAfterCopy `
  -Actual $restoredManifest `
  -Description 'Restored dependency tree'

[pscustomobject]@{
  restored = $true
  source = $source
  backup = $actualTarget
  files = $stagingMeasure.Count
  bytes = [int64]$stagingMeasure.Sum
  repositoryDriveFree = [int64](
    Get-PSDrive -Name (
      [System.IO.Path]::GetPathRoot($repository).TrimEnd(':\')
    )
  ).Free
}
