#!/usr/bin/env pwsh

[CmdletBinding(PositionalBinding=$False)]
Param(
    [Parameter(Mandatory, ParameterSetName='UseLocalVcpkg')]
    [Parameter(ParameterSetName='GetVcpkgUpstream')]
    [String]$Directory = "$PSScriptRoot/../vcpkg",

    [String]$OutFile = "$PSScriptRoot/../output.json",

    [Parameter(ParameterSetName='GetVcpkgUpstream')]
    [String]$Url = 'https://github.com/microsoft/vcpkg',

    [Parameter(ParameterSetName='GetVcpkgUpstream')]
    [String]$Branch = 'master',

    [Parameter(Mandatory, ParameterSetName='UseLocalVcpkg')]
    [Switch]$UseLocalVcpkg,

    [Switch]$SkipStars,

    [String[]]$Triplets = @(
        'arm64-windows'
        'arm-uwp'
        'x64-linux'
        'x64-osx'
        'x64-uwp'
        'x64-windows'
        'x64-windows-static'
        'x64-windows-static-md'
        'x86-windows'
    )
)

$KnownManifestKeys = [Ordered]@{
    'name' = 'Name'
    'version-string' = 'Version'
    'version' = 'Version'
    'version-date' = 'Version'
    'version-semver' = 'Version'
    'port-version' = 'Port-Version'
    'maintainers' = 'Maintainers'
    'description' = 'Description'
    'homepage' = 'Homepage'
    'documentation' = 'Documentation'
    'license' = 'License'
    'supports' = 'Supports'
    'dependencies' = 'Dependencies'
    'default-features' = 'Default-Features'
    'features' = 'Features'
    'builtin-baseline' = 'Builtin-Baseline'
}
$ManifestKeysToUseAsIs = @('dependencies', 'default-features', 'features')


if (-not $UseLocalVcpkg) {
    git init $Directory
    if (-not $?) {
        throw 'init failed'
    }
    git -C $Directory fetch $Url $Branch
    if (-not $?) {
        throw 'fetch failed'
    }
    git -C $Directory checkout FETCH_HEAD
    if (-not $?) {
        throw 'checkout failed'
    }
    git -C $Directory clean -xdf
    if (-not $?) {
        throw 'clean failed'
    }
}

$Data = [Ordered]@{}
# This is the UniversalSortableDateTime (i.e., ISO 8601 extended format)
$Data.Add('Generated On', (Get-Date -AsUtc).ToString("yyyy'-'MM'-'dd HH':'mm':'ss'Z'"))

$CiData = @{}
Get-Content "$Directory/scripts/ci.baseline.txt" | % {
    if ($_.StartsWith('#') -or $_.Trim() -eq '') {
        return
    }

    if ($_ -match '^([-a-z0-9]+):+([-a-z0-9]+)\s*=\s*([a-z]+)\s*$') {
        $portName = $Matches[1]
        $triplet = $Matches[2].Trim()
        $mode = $Matches[3].Trim()
        $CiData.Add("${portName}:${triplet}", $mode)
    } else {
        Write-Warning "Invalid ci.baseline.txt line: '$_'"
    }
}

if (-not $SkipStars) {
    $cred = Get-Credential -Title 'GitHub Username and PAT' `
        -Message 'In order to avoid rate-limiting from GitHub, you will need to enter a personal access token from https://github.com/settings/tokens :'
    $encodedCred = "$($cred.UserName):$(ConvertFrom-SecureString $cred.Password -AsPlainText)"
    $encodedCred = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes($encodedCred))
    $GithubAuthorization = "Basic $encodedCred"

    $checkAuthorizationRequest = Invoke-WebRequest `
        -Uri 'https://api.github.com/rate_limit' `
        -Header @{'Authorization' = $GithubAuthorization}
    $checkAuthorizationContent = $checkAuthorizationRequest.Content | ConvertFrom-Json -AsHashtable
    if ($checkAuthorizationContent['rate']['limit'] -lt 1000) {
        Write-Error "Authorization failed for user $($cred.UserName); did you enter a PAT?"
        throw
    }
}

# these type annotations ensure that $Ports and $PortsData are arrays no matter what
$PortsDirectory = "$Directory/ports"
[Array]$Ports = Get-ChildItem -LiteralPath $PortsDirectory
$Data.Add('Size', $Ports.Length)

$currentPort = 0
[Array]$PortsData = $Ports | % {
    $portData = [Ordered]@{}
    $portDirectory = $_.FullName
    $portName = $_.Name

    $currentPort += 1
    # try to avoid colliding with Invoke-WebRequest with -Id
    Write-Progress -Id $Ports.Length -Activity "Generating port data" `
        -Status "Port $portName ($currentPort/$($Ports.Length))" `
        -PercentComplete (100 * $currentPort / $Ports.Length)

    $controlPath = "$portDirectory/CONTROL"
    $manifestPath = "$portDirectory/vcpkg.json"
    $controlExists = Test-Path -LiteralPath $controlPath
    $manifestExists = Test-Path -LiteralPath $manifestPath
    if ($controlExists -and $manifestExists) {
        Write-Error "Invalid port $portName; found both CONTROL and vcpkg.json files."
        throw
    } elseif (-not $controlExists -and -not $manifestExists) {
        Write-Error "Invalid port $portName; found neither CONTROL nor vcpkg.json."
        throw
    }

    $features = [System.Collections.ArrayList]@()

    if ($controlExists) {
        $currentKey = $null
        $currentValue = ''
        $currentFeature = $null

        Get-Content -LiteralPath $controlPath | % {
            if ($_ -match '^#') {
                return
            }
            if ($_ -match '^([-a-zA-Z]+):(.*)$') {
                if ($null -ne $currentKey) {
                    if ($null -eq $currentFeature) {
                        $portData.Add($currentKey, $currentValue)
                    } else {
                        $currentFeature.Add($currentKey, $currentValue)
                    }
                }

                if ($Matches[1] -eq 'Feature') {
                    if ($null -ne $currentFeature) {
                        $features.Add($currentFeature) | Out-Null
                    }
                    $currentKey = $null
                    $currentFeature = [Ordered]@{}
                    $currentFeature.Name = $Matches[2].Trim()
                } elseif ($Matches[1] -eq 'Source') {
                    $currentKey = 'Name'
                    $currentValue = $Matches[2].Trim()
                } else {
                    $currentKey = $Matches[1]
                    $currentValue = $Matches[2].Trim()
                }
            } elseif ($null -eq $currentKey) {
                Write-Error "Line '$_' in the CONTROL file for '$portName' is not declaring a new key, and is not in an existing key."
                throw
            } else {
                $currentValue += " $($_.Trim())"
            }
        }

        if ($null -ne $currentKey) {
            if ($null -eq $currentFeature) {
                $portData.Add($currentKey, $currentValue)
            } else {
                $currentFeature.Add($currentKey, $currentValue)
            }
        }
        if ($null -ne $currentFeature) {
            $features.Add($currentFeature) | Out-Null
        }
        $portData.Add('Features', $features.ToArray())
    } else {
        $manifest = Get-Content -LiteralPath $manifestPath | ConvertFrom-Json -AsHashtable
        $manifest.Keys | % {
            if (-not ($_.StartsWith('$') -or $_ -in $KnownManifestKeys.Keys)) {
                Write-Error "Unknown manifest key '$_' in port $portName"
                throw
            }
        }

        $KnownManifestKeys.GetEnumerator() | % {
            $manifestKey,$outputKey = $_.Key,$_.Value
            if ($manifest.Contains($manifestKey)) {
                if ($manifestKey -notin $ManifestKeysToUseAsIs -and $manifest[$manifestKey] -is [Array]) {
                    $portData.Add($outputKey, $manifest[$manifestKey] -join ' ')
                } else {
                    $portData.Add($outputKey, $manifest[$manifestKey])
                }
            }
        }

        if ('Features' -notin $portData.Keys) {
            $portData.Add('Features', @())
        }
    }

    $Triplets | % {
        if ($CiData.Contains("${portName}:$_")) {
            $portData.Add($_, $CiData["${portName}:$_"])
        } else {
            $portData.Add($_, 'pass')
        }
    }

    if (-not $SkipStars -and $portData.Contains('Homepage')) {
        if ($portData['Homepage'] -match 'github.com/(?<username>[-_.a-zA-Z0-9]+)/(?<repo>[-_.a-zA-Z0-9]+)') {
            $url = "https://api.github.com/repos/$($Matches['username'])/$($Matches['repo'])"
            try {
                $request = Invoke-WebRequest -Uri $url -Header @{'Authorization' = $GithubAuthorization}
                $repoData = $request.Content | ConvertFrom-Json -AsHashtable
            } catch {
                Write-Warning "Failed to GET URL: ${url}:`n    $_"
                $repoData = $null
            }
            if ($null -ne $repoData) {
                $portData.Add('Stars', $repoData["stargazers_count"])
            }
        }
    }

    $portData
}
Write-Progress -Completed -Id $Ports.Length -Activity "Generating port data"

$Data.Add('Source', $PortsData)
Set-Content -Path $OutFile -Value ($Data | ConvertTo-Json -Depth 10)
