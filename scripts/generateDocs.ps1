[CmdletBinding()]
Param(
   [Parameter(Mandatory=$False)]
   [ValidateScript({Test-Path $_  -PathType Container})]
   # Path to vcpkg docs directory
   [string]$sourceDir = "docs",

   [Parameter(Mandatory=$False)]
   [ValidateScript({Test-Path $_  -PathType Container})]
   # Path to where to put the generated docs/
   [string]$destDir = "vcpkg.github.io"
)

$rootDocsDomain = "/en/"

$mapTable = @{
    # Map of documentation files/folders to what should appear in the TreeView
    # Empty string means we skip adding this file/folder to the TreeView
    "vcpkg_android_example_cmake" = ""
    "vcpkg_android_example_cmake_script" = ""
    "versioning.getting-started.md" = "Get Started with Versioning"
    "portfile-functions.md" = "Portfile Helper Functions"
    "pr-review-checklist.md" = "PR Checklist"
}

$searchTable = [System.Collections.ArrayList]::new()

function convertToReadableFormat {
    param(
        [string]$name
    )
    if($mapTable.ContainsKey($name)) {
        return $mapTable[$name]
    }

    if($name.substring($name.Length - 3) -eq ".md") {
        $name = $name.Substring(0, $name.Length - 3)
    }

    if($name.StartsWith("cmake")) {
        $name = "CMake" + $name.substring(5)
    }
    elseif (!$name.StartsWith("vcpkg")) {
        $name = $name[0].ToString().ToUpper() + $name.substring(1)
    }

    return $name;
}

function handleRelativeLink {
    param(
        [string]$link,
        [string]$currentPath
    )

    if(-Not $link.StartsWith("..")) {
        return $link
    }

    if($link.EndsWith(".md") -or $link.Contains(".md#")) {
        return $link
    }

    # This is a relative link to non-markdown file
    $index = $currentPath.indexOf("docs")
    $newLink = "https://github.com/microsoft/vcpkg/blob/master/" + $currentPath.Substring($index) + '/../' + $link
    return $newLink

}

function relativeToRootDomain {
    param(
        [string]$fileFullName,
        [Parameter(Mandatory=$False)]
        [string]$domainRoot
    )

    $index = $fileFullName.indexOf("docs")
    if($index -lt 0) {
        return
    }
    $domainLink = $fileFullName.Substring($index)
    $forwardSlashDomain = $domainLink.replace("\", "/").replace("//","/");
    if($domainRoot) {
        return $domainRoot + $forwardSlashDomain
    }
    return $rootDocsDomain + $forwardSlashDomain

}

function markdownToHTMLExtension {
    param(
        [string]$name
    )
    # modifies the .md extension with .html
    if(-Not $name.EndsWith(".md") -and -Not $name -match "\.md#[a-zA-Z-]+$") {
        return $name
    }

    if($name.Contains("http")) {
        if(-Not $name.Contains($rootDocsDomain)) {
            # Not in the root domain
            return $name
        }
    }

    $nameWithHTML = $name.Replace(".md", ".html")
    return $nameWithHTML
}

function generateNavSearchResult {
    param(
        [string]$fileFullName
    )
    $index = $fileFullName.indexOf("docs")
    $navigation = $fileFullName.Substring($index + "docs".Length + 1)

    if($navigation -eq "" -or $navigation -eq "/" -or $navigation -eq "\") {
        return "#"
    }
    
    $firstIndex = $navigation.indexOf("\")
    if($firstIndex -lt 0) {
        return "#"
    }
    $firstNav = $navigation.substring(0, $firstIndex)

    $secondNavigation = $navigation.substring($firstIndex + 1)
    $secondIndex = $secondNavigation.indexOf("\")

    if($secondIndex -lt 0) {
        return "#" + $firstNav
    }
    $secondNav = $secondNavigation.substring(0, $secondIndex)

    return "#" + $firstNav + "#" + $secondNav

}


function processTreeViewLayer {
    param(
        [string]$treeViewDir
    )
    $treeViewHTML = ""
    $listLayer = gci -Path $treeViewDir | Sort-Object -Property @{Expression={$_.GetType()}},@{Expression={$_.FullName -replace "_","zz"}}
    if (Test-Path -Path "$treeViewDir.md" -PathType Leaf) {
        $listLayer = @(Get-Item "$treeViewDir.md") + $listLayer
    }
    ForEach($File in $listLayer) {
        if($mapTable.ContainsKey($File.Name)) {
            if($mapTable[$File.Name] -eq "") {
                continue
            }
        }

        if(Test-Path -Path $File.FullName -PathType Container) {
            $treeViewHTML += '<li class="list-can-expand"><button class="button-list-can-expand">'
            $treeViewHTML += convertToReadableFormat -name $File.Name
            $treeViewHTML += "</button></li>`n"

            $treeViewHTML += '<ul class="collapse standard-padding">' + "`n"
            $treeViewHTML += processTreeViewLayer -treeViewDir $File.FullName
            $treeViewHTML += "</ul>`n"
        }
        if(Test-Path -Path $File.FullName -PathType Leaf) {
            if(-Not $File.Name.Contains(".md")) {
                continue;
            }
            $without_md = $File.FullName -replace ".md",""
            if(($without_md -ne $treeViewDir) -and (Test-Path -Path $without_md -PathType Container)) {
                # Skip pages that have a sibling folder of the same name -- that folder will include the file at the top
                continue;
            }

            if ($mapTable.ContainsKey($File.Name)) {
                $readable = $mapTable[$File.Name]
            } else {
                $firstLine = Get-Content $File -TotalCount 1
                if($firstLine -match "^#+ (.*)") {
                    $readable = $Matches.1 -replace "``(.*)``",'<code>$1</code>'
                } else {
                    $readable = convertToReadableFormat -name $File.Name
                }
            }

            $relativePath = relativeToRootDomain -fileFullName $File.FullName
            $relativeHTMLPath = markdownToHTMLExtension -name $relativePath

            $treeViewHTML += '<a class="doc-outline-link" href="'
            $treeViewHTML += $relativeHTMLPath
            $treeViewHTML += '">'
            $treeViewHTML += '<li class="list-can-expand">'
            $treeViewHTML += $readable
            $treeViewHTML += "</li></a>"
            $treeViewHTML += "`n"
        }
    }
    return $treeViewHTML
}

function templateLinks {
    param(
        [System.Collections.Generic.List[System.Object]] $html,
        [string] $relativeDocsDir
    )
    $text = $relativeDocsDir.replace('\', '/').Split('/')
    $defaultTreeExpand = ""
    ForEach($line in $text) {
        $defaultTreeExpand += " > " + $line
    }

    return $html
}

function generateTreeView {
    param(
        #relative dir OK
        [string]$treeViewDir
    )
    $treeViewHTML = "<ul class=docs-navigation>"
    $treeViewHTML += processTreeViewLayer -treeViewDir $treeViewDir
    $treeViewHTML += "</ul>"

    return $treeViewHTML
}

function handleMarkdownIssues {
    param(
        [System.Collections.Generic.List[System.Object]] $html
    )
    # sometimes, the markdown to html library generates invalid html

    $list = [System.Collections.Generic.List[System.Object]]::new()
    ForEach($line in $html) {
        $newLine = $line.Replace("&lt;/code&gt;","</code>");
        $newLine = $line.Replace("ports&amp;lt;package&amp;gt;\","ports\&lt;package&gt;\");
        $newLine = $newLine.Replace("<br />"," ");

        $newLine = $newLine.Replace("Vcpkg","vcpkg");

        $list.Add($newLine)
    }
    return $list
}

function handleLinks {
    param(
        [System.Collections.Generic.List[System.Object]] $html,
        [string] $currentPath
    )
    $list = [System.Collections.Generic.List[System.Object]]::new()
    ForEach($line in $html) {
        $start = 0
        $lineWithUpdatedLink = ""
        while($start -lt $line.Length) {
            $linkStart = $line.indexOf('<a href="', $start)
            if($linkStart -lt 0) {
                $lineWithUpdatedLink += $line.Substring($start)
                break
            } else {
                $linkStart +='<a href="'.Length
            }

            $linkEnd = $line.indexOf('"',$linkStart)

            $newLink = handleRelativeLink -link $line.substring($linkStart, $linkEnd - $linkStart) -currentPath $currentPath
            $newLink = markdownToHTMLExtension -name $newLink

            $lineWithUpdatedLink += $line.Substring($start, $linkStart - $start)
            $lineWithUpdatedLink += $newLink
            $start = $linkEnd
        }
        $list.Add($lineWithUpdatedLink)
    }
    return $list
}

function generateHTMLFromMarkdown {
    param(
        [string] $markdownFile,
        [string] $baseName,
        [string] $pathToWrite
    )

    $file = Get-Content -Path $markdownFile -Encoding UTF8
    $simpleSearch = Get-Content -Raw -Path $markdownFile -Encoding Ascii

    $markdownHTML = ""
    
    [bool]$divStart = $False
    [bool]$inCodeBlock = $False
    [bool]$listMode = $False

    # Handle search table JSON
    $relativePath = relativeToRootDomain -fileFullName $markdownFile

    [void]$searchTable.Add(@"

    {
        "Path":  $(markdownToHTMLExtension -name $relativePath | ConvertTo-Json),
        "Name":  $(convertToReadableFormat -name $baseName | ConvertTo-Json),
        "Source":  $($simpleSearch.ToString() | ConvertTo-Json),
        "Nav":  $(generateNavSearchResult -fileFullName $markdownFile | ConvertTo-Json)
    }
"@)

    if($markdownFile.Contains("specifications")) {
        Out-File -FilePath $pathToWrite -InputObject '</nav><main class="right-side spec-only" id="main">' -Append -Encoding UTF8
        Out-File -FilePath $pathToWrite -InputObject '<div class="docs-mobile-show"><img class="docs-mobile-show-table" src="/assets/misc/table-docs.svg">Table of Contents</div>' -Append -Encoding UTF8
        $specLink = relativeToRootDomain -fileFullName $markdownFile -domainRoot "https://github.com/microsoft/vcpkg/tree/master/"
        $linkTag = 'See <a href="' + $specLink + '" class="spec-link">' + $specLink + '</a>'
        Out-File -FilePath $pathToWrite -InputObject $linkTag -Append -Encoding UTF8
        Out-File -FilePath $pathToWrite -InputObject '</main></div><div id="loadFooter"></div></html>' -Append -Encoding UTF8
    } else {
        $generatedMarkdown = node $PSScriptRoot/generateMarkdown.js $markdownFile
        $firstPass = handleLinks -html $generatedMarkdown -currentPath $markdownFile
        $secondPass = handleMarkdownIssues -html $firstPass
        Out-File -FilePath $pathToWrite -InputObject '</nav><main class="right-side" id="main">' -Append -Encoding UTF8
        Out-File -FilePath $pathToWrite -InputObject '<div class="docs-mobile-show"><img class="docs-mobile-show-table" src="/assets/misc/table-docs.svg">Table of Contents</div>' -Append -Encoding UTF8
        Out-File -FilePath $pathToWrite -InputObject $secondPass -Append -Encoding UTF8
        Out-File -FilePath $pathToWrite -InputObject '</main></div><div id="loadFooter"></div></html>' -Append -Encoding UTF8
    }
    return
}

$treeViewHTML = generateTreeView -treeViewDir $sourceDir
New-Item -Force -ItemType Directory "$destDir/en/docs" | Out-Null
Out-File -FilePath "$destDir/en/docs/navpane.html" -InputObject $treeViewHTML -Encoding UTF8NoBom

$htmlTemplate = Get-Content -Path $PSScriptRoot/html-doc-template.txt -Encoding UTF8

$currentListDirRecursive = gci -Recurse -Path $sourceDir
ForEach($file in $currentListDirRecursive) {
    if(-not $file.Name.EndsWith(".md")) {
            continue
    }

    $index = $file.FullName.indexOf("docs")
    $relativeDocsDir = $file.FullName.substring($index)
    $pathToWrite = markdownToHTMLExtension -name "$destDir/en/$relativeDocsDir"
    $path = $rootDocsDomain + $relativeDocsDir
    $serverPath = markdownToHTMLExtension -name $path
    $serverPath = $serverPath.replace("\", "/");

    $indexFolder = "$destDir/en/$relativeDocsDir".IndexOf($file.Name)
    $folder = "$destDir/en/$relativeDocsDir".Substring(0, $indexFolder)
    New-Item -Force -ItemType Directory $folder | Out-Null

    $htmlTemplate2 = templateLinks -html $htmlTemplate -relativeDocsDir $relativeDocsDir -Encoding UTF8
    Out-File -FilePath $pathToWrite -InputObject $htmlTemplate2 -Encoding UTF8Bom

    generateHTMLFromMarkdown -markdownFile $file.FullName -baseName $file.Name -pathToWrite $pathToWrite

    "generated $pathToWrite"
}

$searchJSON = "[" + $($searchTable -Join ",") + "`n]"
Out-File -FilePath "$destDir/en/docs/vcpkg-docs.json" -InputObject $searchJSON -Encoding UTF8Bom
