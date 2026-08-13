function Get-NormalizedDependencyPath {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $fullPath = [System.IO.Path]::GetFullPath($Path)
  $root = [System.IO.Path]::GetPathRoot($fullPath)
  if ($fullPath.Equals($root, [StringComparison]::OrdinalIgnoreCase)) {
    return $root
  }

  return $fullPath.TrimEnd([char[]]'\/')
}

function Test-DependencyPathsOverlap {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Left,

    [Parameter(Mandatory = $true)]
    [string]$Right
  )

  $leftPath = Get-NormalizedDependencyPath -Path $Left
  $rightPath = Get-NormalizedDependencyPath -Path $Right
  if ($leftPath.Equals($rightPath, [StringComparison]::OrdinalIgnoreCase)) {
    return $true
  }

  $separator = [System.IO.Path]::DirectorySeparatorChar
  $leftPrefix = "$leftPath$separator"
  $rightPrefix = "$rightPath$separator"
  return (
    $leftPrefix.StartsWith($rightPrefix, [StringComparison]::OrdinalIgnoreCase) -or
    $rightPrefix.StartsWith($leftPrefix, [StringComparison]::OrdinalIgnoreCase)
  )
}

function Test-IsDependencyReparsePoint {
  param(
    [Parameter(Mandatory = $true)]
    $Item
  )

  $linkType = $null
  if ($Item.PSObject.Properties.Name -contains 'LinkType') {
    $linkType = $Item.LinkType
  }
  $hasLinkType = -not [string]::IsNullOrWhiteSpace([string]$linkType)
  $hasReparseAttribute =
    ([System.IO.FileAttributes]$Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0
  return $hasLinkType -or $hasReparseAttribute
}

function Assert-PhysicalDirectory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  $item = Get-Item -LiteralPath $Path -Force -ErrorAction Stop
  if (-not $item.PSIsContainer) {
    throw "$Description is not a directory: $Path"
  }
  if (Test-IsDependencyReparsePoint -Item $item) {
    throw "$Description must be a physical directory; reparse point found: $Path"
  }
}

function Assert-PathComponentsArePhysical {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  $fullPath = Get-NormalizedDependencyPath -Path $Path
  $root = [System.IO.Path]::GetPathRoot($fullPath)
  $relativePath = $fullPath.Substring($root.Length)
  $segments = $relativePath.Split(
    [char[]]'\/',
    [StringSplitOptions]::RemoveEmptyEntries
  )
  $current = $root

  foreach ($segment in $segments) {
    $current = Join-Path $current $segment
    $item = Get-Item -LiteralPath $current -Force -ErrorAction SilentlyContinue
    if ($null -eq $item) {
      break
    }
    if (Test-IsDependencyReparsePoint -Item $item) {
      throw "$Description contains a reparse point: $current"
    }
    if (-not $item.PSIsContainer -and $current -ne $fullPath) {
      throw "$Description contains a non-directory path component: $current"
    }
  }
}

function Assert-CurrentDirectoryOutside {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Paths
  )

  $currentDirectories = @()
  $location = Get-Location
  if (
    $location.Provider.Name -eq 'FileSystem' -and
    -not [string]::IsNullOrWhiteSpace([string]$location.ProviderPath)
  ) {
    $currentDirectories += [string]$location.ProviderPath
  }
  if (-not [string]::IsNullOrWhiteSpace([Environment]::CurrentDirectory)) {
    $currentDirectories += [Environment]::CurrentDirectory
  }

  foreach ($currentDirectory in @($currentDirectories | Select-Object -Unique)) {
    foreach ($path in $Paths) {
      if (Test-DependencyPathsOverlap -Left $currentDirectory -Right $path) {
        throw "Current directory overlaps a dependency path that will be moved or replaced: $currentDirectory"
      }
    }
  }
}

function Test-IsDependencyMutationProcess {
  param(
    [Parameter(Mandatory = $true)]
    $Process
  )

  $name = [string]$Process.Name
  $commandLine = [string]$Process.CommandLine
  $managerNamePattern = '^(npm|pnpm|yarn|bun|corepack)(\.cmd|\.exe)?$'
  if (
    [string]::IsNullOrWhiteSpace($commandLine) -and
    $name -match $managerNamePattern
  ) {
    return $true
  }

  $mutationRegex = @'
(?i)(?:^|[\s"'\\/])(?:npm(?:-cli\.js|\.cmd|\.exe)?|pnpm(?:\.c?js|\.cmd|\.exe)?|yarn(?:\.c?js|\.cmd|\.exe)?|bun(?:\.cmd|\.exe)?|corepack(?:\.c?js|\.cmd|\.exe)?)["']?\s+(?:--[^\s]+\s+)*(?:install|i|ci|add|remove|rm|uninstall|update|upgrade|up|rebuild|prune|dedupe|link|unlink)(?:[\s"']|$)
'@
  return $commandLine -match $mutationRegex.Trim()
}

function Test-IsDependencyProcessUsingPath {
  param(
    [Parameter(Mandatory = $true)]
    $Process,

    [Parameter(Mandatory = $true)]
    [string[]]$Paths
  )

  $name = [string]$Process.Name
  $commandLine = [string]$Process.CommandLine
  $nodeInvocationRegex = @'
(?i)(?:^|[\s"'\\/])(?:npm|npx|pnpm|pnpx|yarn|bun|corepack)(?:-cli\.js|\.c?js|\.cmd|\.exe)?(?:[\s"']|$)
'@
  $isNodeProcess =
    $name -match '^(node|npm|npx|pnpm|pnpx|yarn|bun|corepack)(\.exe|\.cmd)?$' -or
    $commandLine -match $nodeInvocationRegex.Trim()
  if (-not $isNodeProcess -or [string]::IsNullOrWhiteSpace($commandLine)) {
    return $false
  }

  foreach ($path in $Paths) {
    $fullPath = Get-NormalizedDependencyPath -Path $path
    if ($commandLine.IndexOf($fullPath, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
      return $true
    }
    $alternatePath = $fullPath.Replace('\', '/')
    if ($commandLine.IndexOf($alternatePath, [StringComparison]::OrdinalIgnoreCase) -ge 0) {
      return $true
    }
  }

  return $false
}

function Assert-NoActiveDependencyProcesses {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$SensitivePaths,

    [AllowEmptyCollection()]
    [object[]]$Processes = $null
  )

  if ($null -eq $Processes) {
    $Processes = @(Get-CimInstance Win32_Process)
  }

  $blocked = @(
    $Processes |
      Where-Object {
        (Test-IsDependencyMutationProcess -Process $_) -or
        (Test-IsDependencyProcessUsingPath -Process $_ -Paths $SensitivePaths)
      }
  )
  if ($blocked.Count -gt 0) {
    $processIds = @($blocked | ForEach-Object { $_.ProcessId }) -join ', '
    throw "Active dependency process must exit before dependency relocation or rollback: $processIds"
  }
}

function Reset-PhysicalDirectory {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,

    [Parameter(Mandatory = $true)]
    [string]$AllowedParent,

    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  $fullPath = Get-NormalizedDependencyPath -Path $Path
  $parent = Get-NormalizedDependencyPath -Path ([System.IO.Path]::GetDirectoryName($fullPath))
  $expectedParent = Get-NormalizedDependencyPath -Path $AllowedParent
  if (-not $parent.Equals($expectedParent, [StringComparison]::OrdinalIgnoreCase)) {
    throw "$Description is outside its approved parent: $fullPath"
  }

  $existing = Get-Item -LiteralPath $fullPath -Force -ErrorAction SilentlyContinue
  if ($null -ne $existing) {
    Assert-PhysicalDirectory -Path $fullPath -Description $Description
    Remove-Item -LiteralPath $fullPath -Recurse -Force
  }

  New-Item -ItemType Directory -Path $fullPath | Out-Null
  Assert-PhysicalDirectory -Path $fullPath -Description $Description
}

function Get-DependencyTreeManifest {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Root
  )

  $physicalRoot = Get-NormalizedDependencyPath -Path $Root
  Assert-PhysicalDirectory -Path $physicalRoot -Description 'Dependency tree'

  $entries = @(
    Get-ChildItem -LiteralPath $physicalRoot -Recurse -Force |
      ForEach-Object {
        $relativePath = [System.IO.Path]::GetRelativePath(
          $physicalRoot,
          $_.FullName
        )
        if (Test-IsDependencyReparsePoint -Item $_) {
          [pscustomobject]@{
            RelativePath = $relativePath
            Kind = "Link:$($_.LinkType)"
            Length = [int64]0
            Sha256 = ''
            LinkTarget = @($_.Target) -join '|'
          }
        } elseif ($_.PSIsContainer) {
          [pscustomobject]@{
            RelativePath = $relativePath
            Kind = 'Directory'
            Length = [int64]0
            Sha256 = ''
            LinkTarget = ''
          }
        } else {
          [pscustomobject]@{
            RelativePath = $relativePath
            Kind = 'File'
            Length = [int64]$_.Length
            Sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash
            LinkTarget = ''
          }
        }
      }
  )

  return @($entries | Sort-Object RelativePath, Kind)
}

function Assert-DependencyTreeManifestsEqual {
  param(
    [Parameter(Mandatory = $true)]
    [AllowEmptyCollection()]
    [object[]]$Expected,

    [Parameter(Mandatory = $true)]
    [AllowEmptyCollection()]
    [object[]]$Actual,

    [Parameter(Mandatory = $true)]
    [string]$Description
  )

  $expectedEntries = @($Expected | Sort-Object RelativePath, Kind)
  $actualEntries = @($Actual | Sort-Object RelativePath, Kind)
  if ($expectedEntries.Count -ne $actualEntries.Count) {
    throw "$Description failed integrity validation: expected $($expectedEntries.Count) entries but found $($actualEntries.Count)."
  }

  $properties = @('RelativePath', 'Kind', 'Length', 'Sha256', 'LinkTarget')
  for ($index = 0; $index -lt $expectedEntries.Count; $index += 1) {
    foreach ($property in $properties) {
      $expectedValue = [string]$expectedEntries[$index].$property
      $actualValue = [string]$actualEntries[$index].$property
      if (-not $expectedValue.Equals($actualValue, [StringComparison]::Ordinal)) {
        throw "$Description failed integrity validation at $($expectedEntries[$index].RelativePath) ($property)."
      }
    }
  }
}
