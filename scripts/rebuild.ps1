param(
    [string]$VcpkgRoot = (Join-Path $PSScriptRoot '..\vcpkg')
)

Set-StrictMode -Version 3.0
$ErrorActionPreference = 'Stop'

$VcpkgRoot = [System.IO.Path]::GetFullPath($VcpkgRoot)
$commitFile = Join-Path $PSScriptRoot 'commit.txt'
$outputRoot = Join-Path $PSScriptRoot '..\en'

if (-not (Test-Path -LiteralPath $commitFile -PathType Leaf)) {
    throw "Commit file not found: $commitFile"
}

$vcpkgCommit = (Get-Content -LiteralPath $commitFile -Raw).Trim()
if ($vcpkgCommit -notmatch '^[0-9a-f]+$') {
    throw "Invalid vcpkg commit in $commitFile."
}

if (-not (Test-Path -LiteralPath $VcpkgRoot)) {
    git init $VcpkgRoot
    if ($LASTEXITCODE -ne 0) {
        throw "git init failed with exit code $LASTEXITCODE."
    }
}

git -C $VcpkgRoot fetch https://github.com/microsoft/vcpkg $vcpkgCommit
if ($LASTEXITCODE -ne 0) {
    throw "git fetch failed with exit code $LASTEXITCODE."
}

git -C $VcpkgRoot switch -d FETCH_HEAD
if ($LASTEXITCODE -ne 0) {
    throw "git switch failed with exit code $LASTEXITCODE."
}

Push-Location $PSScriptRoot
try {
    npm ci
    if ($LASTEXITCODE -ne 0) {
        throw "npm ci failed with exit code $LASTEXITCODE."
    }

    if (Test-Path -LiteralPath $outputRoot) {
        Remove-Item -LiteralPath $outputRoot -Recurse -Force
    }

    node generateDocs.js
    if ($LASTEXITCODE -ne 0) {
        throw "generateDocs.js failed with exit code $LASTEXITCODE."
    }

    node generatePackages.js $VcpkgRoot
    if ($LASTEXITCODE -ne 0) {
        throw "generatePackages.js failed with exit code $LASTEXITCODE."
    }

    node generateDetailedPages.js $VcpkgRoot
    if ($LASTEXITCODE -ne 0) {
        throw "generateDetailedPages.js failed with exit code $LASTEXITCODE."
    }

    node validateLinks.js
    if ($LASTEXITCODE -ne 0) {
        throw "validateLinks.js failed with exit code $LASTEXITCODE."
    }
}
finally {
    Pop-Location
}
