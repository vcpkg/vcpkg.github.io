param(
    [string]$VcpkgRoot = (Join-Path $PSScriptRoot '..\vcpkg')
)

Set-StrictMode -Version 3.0
$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    $remote = git ls-remote https://github.com/microsoft/vcpkg master
    if ($LASTEXITCODE -ne 0) {
        throw "git ls-remote failed with exit code $LASTEXITCODE."
    }

    $commit = ($remote | Select-Object -First 1) -split '\s+' | Select-Object -First 1
    if ($commit -notmatch '^[0-9a-f]+$') {
        throw 'Unable to determine the vcpkg master commit.'
    }

    Set-Content -LiteralPath commit.txt -Value $commit -Encoding ascii
    & (Join-Path $PSScriptRoot 'rebuild.ps1') -VcpkgRoot $VcpkgRoot
}
finally {
    Pop-Location
}
