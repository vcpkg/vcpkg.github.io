param()

Set-StrictMode -Version 3.0
$ErrorActionPreference = 'Stop'

Push-Location $PSScriptRoot
try {
    $remote = git ls-remote https://github.com/microsoft/vcpkg
    if ($LASTEXITCODE -ne 0) {
        throw "git ls-remote failed with exit code $LASTEXITCODE."
    }

    $commit = ($remote | Select-Object -First 1) -split '\s+' | Select-Object -First 1
    if ($commit -notmatch '^[0-9a-f]+$') {
        throw 'Unable to determine the vcpkg commit.'
    }

    Set-Content -LiteralPath commit.txt -Value $commit -Encoding ascii
}
finally {
    Pop-Location
}
