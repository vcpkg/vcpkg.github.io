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

    [String[]]$Triplets = @(
        'arm64-windows'
        'arm-uwp'
        'x64-linux'
        'x64-osx'
        'x64-uwp'
        'x64-windows'
        'x64-windows-static'
        'x86-windows'
    )
)

$KnownManifestKeys = @{
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
$Data.Add('Generated On', (Get-Date -AsUtc).ToString("yyyy'-'MM'-'dd'T'HH':'mm':'ss'Z'"))

# these type annotations ensure that $Ports and $PortsData are arrays no matter what
$PortsDirectory = "$Directory/ports"
[Array]$Ports = Get-ChildItem -LiteralPath $PortsDirectory
$Data.Add('Size', $Ports.Length)

[Array]$PortsData = $Ports | % {
    $portData = [Ordered]@{}
    $portDirectory = $_.FullName
    $portName = $_.Name

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

    $portData
}

$Data.Add('Source', $PortsData)
Set-Content -Path $OutFile -Value ($Data | ConvertTo-Json -Depth 10)
