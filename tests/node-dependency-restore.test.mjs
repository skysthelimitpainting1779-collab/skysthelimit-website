import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const agentBundle = join(
  repositoryRoot,
  '.agents',
  'skills',
  'node-dependency-restore',
);
const githubBundle = join(
  repositoryRoot,
  '.github',
  'skills',
  'node-dependency-restore',
);
const commonScript = join(
  agentBundle,
  'scripts',
  'node-dependency-restore-common.ps1',
);
const relocateScript = join(
  agentBundle,
  'scripts',
  'relocate-node-modules.ps1',
);
const restoreScript = join(
  agentBundle,
  'scripts',
  'restore-node-modules-local.ps1',
);
const ownedPaths = [];
const ownedLinks = [];
const importCommon = `
if (-not (Test-Path -LiteralPath ${psLiteral(commonScript)} -PathType Leaf)) {
  throw 'Dependency restore common library is missing.'
}
. ${psLiteral(commonScript)}
`;

after(() => {
  for (const ownedLink of ownedLinks.reverse()) {
    try {
      rmdirSync(ownedLink);
    } catch {
      try {
        unlinkSync(ownedLink);
      } catch {
        // A successful restore may already have replaced the link.
      }
    }
  }
  for (const ownedPath of ownedPaths.reverse()) {
    rmSync(ownedPath, { force: true, recursive: true });
  }
});

function psLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function runPowerShell(source, cwd = repositoryRoot) {
  const script = `$ErrorActionPreference = 'Stop'\n${source}`;
  const encodedCommand = Buffer.from(script, 'utf16le').toString('base64');
  return spawnSync(
    'pwsh',
    [
      '-NoLogo',
      '-NoProfile',
      '-NonInteractive',
      '-EncodedCommand',
      encodedCommand,
    ],
    {
      cwd,
      encoding: 'utf8',
      timeout: 30_000,
      windowsHide: true,
    },
  );
}

const powerShellProbe = runPowerShell("'ready'");
const powershellTest = powerShellProbe.status === 0 ? test : test.skip;
const windowsTest =
  process.platform === 'win32' && powerShellProbe.status === 0 ? test : test.skip;

function assertPowerShellPassed(result) {
  assert.equal(
    result.status,
    0,
    `PowerShell failed.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );
}

function createLocalRepository() {
  const root = mkdtempSync(join(tmpdir(), 'node-dependency-restore-'));
  ownedPaths.push(root);
  writeFileSync(join(root, 'package.json'), '{"name":"restore-fixture"}\n');
  return root;
}

function createETarget() {
  const root = `E:\\DevCaches\\node_modules\\codex-test-${randomUUID()}`;
  const target = join(root, 'node_modules');
  mkdirSync(target, { recursive: true });
  ownedPaths.push(root);
  return { root, target };
}

function createJunction(target, link) {
  symlinkSync(target, link, 'junction');
  ownedLinks.push(link);
}

function listFiles(root) {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const fullPath = join(root, entry.name);
    if (entry.isDirectory()) {
      for (const child of listFiles(fullPath)) {
        files.push(join(entry.name, child));
      }
    } else {
      files.push(entry.name);
    }
  }
  return files.sort();
}

function denialHarness(invokeSource, expectedPattern) {
  return `
try {
  ${invokeSource}
  throw '__EXPECTED_DENIAL__'
} catch {
  $message = $_.Exception.Message
  if ($message -eq '__EXPECTED_DENIAL__') {
    throw 'Expected the operation to be denied.'
  }
  if ($message -notmatch ${psLiteral(expectedPattern)}) {
    throw "Unexpected denial: $message"
  }
}
`;
}

test('the agent and GitHub skill bundles are byte-for-byte identical', () => {
  const agentFiles = listFiles(agentBundle);
  const githubFiles = listFiles(githubBundle);
  assert.deepEqual(agentFiles, githubFiles);

  for (const file of agentFiles) {
    assert.deepEqual(
      readFileSync(join(agentBundle, file)),
      readFileSync(join(githubBundle, file)),
      `bundle mismatch: ${file}`,
    );
  }
});

powershellTest('path overlap detection rejects equal, ancestor, and descendant paths', () => {
  const repository = process.platform === 'win32' ? 'C:\\repo' : '/repo';
  const dependencyDirectory = join(repository, 'node_modules');
  const siblingA = process.platform === 'win32' ? 'C:\\repo-a' : '/repo-a';
  const siblingB = process.platform === 'win32' ? 'C:\\repo-b' : '/repo-b';
  const result = runPowerShell(`
${importCommon}
$cases = @(
  @( ${psLiteral(dependencyDirectory)}, ${psLiteral(dependencyDirectory)}, $true ),
  @( ${psLiteral(repository)}, ${psLiteral(dependencyDirectory)}, $true ),
  @( ${psLiteral(dependencyDirectory)}, ${psLiteral(repository)}, $true ),
  @( ${psLiteral(siblingA)}, ${psLiteral(siblingB)}, $false )
)
foreach ($case in $cases) {
  $actual = Test-DependencyPathsOverlap -Left $case[0] -Right $case[1]
  if ($actual -ne $case[2]) {
    throw "Unexpected overlap result for $($case[0]) and $($case[1])"
  }
}
`);
  assertPowerShellPassed(result);
});

powershellTest('physical-directory validation rejects directory reparse points', () => {
  const root = createLocalRepository();
  const physical = join(root, 'physical');
  const linked = join(root, 'linked');
  mkdirSync(physical);
  createJunction(physical, linked);

  const result = runPowerShell(`
${importCommon}
${denialHarness(
  `Assert-PhysicalDirectory -Path ${psLiteral(linked)} -Description 'test directory'`,
  'reparse|physical',
)}
${denialHarness(
  `Assert-PathComponentsArePhysical -Path ${psLiteral(join(linked, 'child'))} -Description 'test path'`,
  'reparse|physical',
)}
`);
  assertPowerShellPassed(result);
});

powershellTest('current-directory validation rejects paths being moved or deleted', () => {
  const root = createLocalRepository();
  const source = join(root, 'node_modules');
  mkdirSync(source);

  const result = runPowerShell(`
${importCommon}
Push-Location ${psLiteral(source)}
try {
  ${denialHarness(
    `Assert-CurrentDirectoryOutside -Paths @( ${psLiteral(source)} )`,
    'current directory',
  )}
} finally {
  Pop-Location
}
`);
  assertPowerShellPassed(result);
});

powershellTest('process validation recognizes Windows wrappers and npm CLI variants', () => {
  const result = runPowerShell(`
${importCommon}
$processes = @(
  [pscustomobject]@{
    Name = 'cmd.exe'
    CommandLine = 'cmd.exe /d /s /c "C:\\Program Files\\nodejs\\npm.cmd" install'
    ProcessId = 4101
    ExecutablePath = 'C:\\Windows\\System32\\cmd.exe'
  },
  [pscustomobject]@{
    Name = 'node.exe'
    CommandLine = '"C:\\Program Files\\nodejs\\node.exe" "C:\\outside\\npm-cli.js" ci'
    ProcessId = 4102
    ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'
  },
  [pscustomobject]@{
    Name = 'cmd.exe'
    CommandLine = 'cmd.exe /c pnpm.cmd add zod'
    ProcessId = 4103
    ExecutablePath = 'C:\\Windows\\System32\\cmd.exe'
  }
)
${denialHarness(
  `Assert-NoActiveDependencyProcesses -SensitivePaths @( ${psLiteral('C:\\repo')} ) -Processes $processes`,
  'dependency process.*4101.*4102.*4103',
)}
`);
  assertPowerShellPassed(result);
});

powershellTest('tree manifests detect same-size content substitutions and stale entries', () => {
  const root = createLocalRepository();
  const source = join(root, 'source');
  const destination = join(root, 'destination');
  mkdirSync(source);
  mkdirSync(destination);
  writeFileSync(join(source, 'package.txt'), 'safe');
  writeFileSync(join(destination, 'package.txt'), 'evil');
  writeFileSync(join(destination, 'stale.txt'), 'stale');

  const result = runPowerShell(`
${importCommon}
$sourceManifest = @(Get-DependencyTreeManifest -Root ${psLiteral(source)})
$destinationManifest = @(Get-DependencyTreeManifest -Root ${psLiteral(destination)})
${denialHarness(
  `Assert-DependencyTreeManifestsEqual -Expected $sourceManifest -Actual $destinationManifest -Description 'fixture trees'`,
  'integrity',
)}
`);
  assertPowerShellPassed(result);
});

powershellTest('resetting physical staging removes stale contents and recreates an empty directory', () => {
  const root = createLocalRepository();
  const staging = join(root, 'node_modules.restore-staging');
  mkdirSync(staging);
  writeFileSync(join(staging, 'stale.txt'), 'stale');

  const result = runPowerShell(`
${importCommon}
Reset-PhysicalDirectory -Path ${psLiteral(staging)} -AllowedParent ${psLiteral(root)} -Description 'restore staging'
$children = @(Get-ChildItem -LiteralPath ${psLiteral(staging)} -Force)
if ($children.Count -ne 0) {
  throw 'Reset staging directory retained stale entries.'
}
Assert-PhysicalDirectory -Path ${psLiteral(staging)} -Description 'restore staging'
`);
  assertPowerShellPassed(result);
});

windowsTest('relocation rejects overlapping source and target paths before process inspection', () => {
  const repository = `E:\\DevCaches\\node_modules\\codex-test-${randomUUID()}`;
  const source = join(repository, 'node_modules');
  mkdirSync(source, { recursive: true });
  writeFileSync(join(repository, 'package.json'), '{"name":"overlap-fixture"}\n');
  writeFileSync(join(source, 'package.txt'), 'safe');
  ownedPaths.push(repository);

  const result = runPowerShell(`
function Get-CimInstance {
  [pscustomobject]@{
    Name = 'node.exe'
    CommandLine = 'node npm-cli.js install'
    ProcessId = 4201
    ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'
  }
}
${denialHarness(
  `& ${psLiteral(relocateScript)} -RepositoryPath ${psLiteral(repository)} -TargetPath ${psLiteral(source)} -BatchSize 1`,
  'overlap',
)}
`);
  assertPowerShellPassed(result);
});

windowsTest('relocation rejects a pre-existing target junction before process inspection', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const { root: targetRoot, target } = createETarget();
  const outside = join(targetRoot, 'outside');
  rmSync(target, { recursive: true });
  mkdirSync(outside);
  createJunction(outside, target);
  mkdirSync(source);
  writeFileSync(join(source, 'package.txt'), 'safe');

  const result = runPowerShell(`
function Get-CimInstance {
  [pscustomobject]@{
    Name = 'node.exe'
    CommandLine = 'node npm-cli.js install'
    ProcessId = 4202
    ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'
  }
}
${denialHarness(
  `& ${psLiteral(relocateScript)} -RepositoryPath ${psLiteral(repository)} -TargetPath ${psLiteral(target)} -BatchSize 1`,
  'reparse|physical',
)}
`);
  assertPowerShellPassed(result);
});

windowsTest('relocation rejects a source link that is not the exact finalized target', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const outside = join(repository, 'outside-node-modules');
  const { target } = createETarget();
  mkdirSync(outside);
  writeFileSync(join(outside, 'package.txt'), 'safe');
  createJunction(outside, source);

  const result = runPowerShell(`
function Get-CimInstance {
  [pscustomobject]@{
    Name = 'node.exe'
    CommandLine = 'node npm-cli.js install'
    ProcessId = 4203
    ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'
  }
}
${denialHarness(
  `& ${psLiteral(relocateScript)} -RepositoryPath ${psLiteral(repository)} -TargetPath ${psLiteral(target)} -BatchSize 1`,
  'junction target mismatch|reparse|physical',
)}
`);
  assertPowerShellPassed(result);
});

windowsTest('relocation rejects npm.cmd install even when the repository is absent from its command line', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const { target } = createETarget();
  mkdirSync(source);
  writeFileSync(join(source, 'package.txt'), 'safe');

  const result = runPowerShell(`
function Get-CimInstance {
  [pscustomobject]@{
    Name = 'cmd.exe'
    CommandLine = 'cmd.exe /d /s /c "C:\\Program Files\\nodejs\\npm.cmd" install'
    ProcessId = 4204
    ExecutablePath = 'C:\\Windows\\System32\\cmd.exe'
  }
}
${denialHarness(
  `& ${psLiteral(relocateScript)} -RepositoryPath ${psLiteral(repository)} -TargetPath ${psLiteral(target)} -BatchSize 0`,
  'dependency process.*4204',
)}
`);
  assertPowerShellPassed(result);
});

windowsTest('rollback rejects npm CLI mutation processes whose current checkout is ambiguous', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const { target } = createETarget();
  writeFileSync(join(target, 'package.txt'), 'safe');
  createJunction(target, source);

  const result = runPowerShell(`
function Get-CimInstance {
  [pscustomobject]@{
    Name = 'node.exe'
    CommandLine = '"C:\\Program Files\\nodejs\\node.exe" "C:\\outside\\npm-cli.js" ci'
    ProcessId = 4205
    ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'
  }
}
function Get-PSDrive {
  [pscustomobject]@{ Free = 0 }
}
${denialHarness(
  `& ${psLiteral(restoreScript)} -RepositoryPath ${psLiteral(repository)} -ExpectedTargetPath ${psLiteral(target)}`,
  'dependency process.*4205',
)}
`);
  assertPowerShellPassed(result);
});

windowsTest('rollback rejects execution from inside a path it will replace', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const staging = join(repository, 'node_modules.restore-staging');
  const { target } = createETarget();
  writeFileSync(join(target, 'package.txt'), 'safe');
  createJunction(target, source);

  const result = runPowerShell(`
function Get-CimInstance { @() }
function Get-PSDrive {
  [pscustomobject]@{ Free = 0 }
}
Push-Location ${psLiteral(source)}
try {
  ${denialHarness(
    `& ${psLiteral(restoreScript)} -RepositoryPath ${psLiteral(repository)} -ExpectedTargetPath ${psLiteral(target)}`,
    'current directory',
  )}
  if (Test-Path -LiteralPath ${psLiteral(staging)}) {
    throw 'Rollback touched staging before rejecting its current directory.'
  }
} finally {
  Pop-Location
}
`);
  assertPowerShellPassed(result);
});

windowsTest('rollback rejects a staging junction before process inspection', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const staging = join(repository, 'node_modules.restore-staging');
  const stagingTarget = join(repository, 'outside-staging');
  const { target } = createETarget();
  mkdirSync(stagingTarget);
  writeFileSync(join(target, 'package.txt'), 'safe');
  createJunction(target, source);
  createJunction(stagingTarget, staging);

  const result = runPowerShell(`
function Get-CimInstance {
  [pscustomobject]@{
    Name = 'node.exe'
    CommandLine = 'node ${repository} npm-cli.js install'
    ProcessId = 4206
    ExecutablePath = 'C:\\Program Files\\nodejs\\node.exe'
  }
}
${denialHarness(
  `& ${psLiteral(restoreScript)} -RepositoryPath ${psLiteral(repository)} -ExpectedTargetPath ${psLiteral(target)}`,
  'staging.*reparse|staging.*physical',
)}
`);
  assertPowerShellPassed(result);
});

windowsTest('rollback rebuilds stale same-size staging and promotes verified source content', () => {
  const repository = createLocalRepository();
  const source = join(repository, 'node_modules');
  const staging = join(repository, 'node_modules.restore-staging');
  const { target } = createETarget();
  mkdirSync(staging);
  writeFileSync(join(target, 'package.txt'), 'safe');
  writeFileSync(join(staging, 'package.txt'), 'evil');
  createJunction(target, source);

  const result = runPowerShell(`
function Get-CimInstance { @() }
$output = & ${psLiteral(restoreScript)} -RepositoryPath ${psLiteral(repository)} -ExpectedTargetPath ${psLiteral(target)}
$content = Get-Content -Raw -LiteralPath ${psLiteral(join(source, 'package.txt'))}
if ($content -ne 'safe') {
  throw "Rollback promoted stale content: $content"
}
if (-not $output.restored) {
  throw 'Rollback did not report a restored dependency tree.'
}
`);
  assertPowerShellPassed(result);
});
