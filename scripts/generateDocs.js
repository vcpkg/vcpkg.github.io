'use strict';

const fs = require('fs/promises');
const path = require('path');
const { exit } = require('process');
const showdown = require('showdown');

if (process.argv.length != 3) {
    console.log("Usage: node generateDocs.js <path/to/source/docs>")
    exit(1);
}
const sourceDir = process.argv[2]
const destDir = path.dirname(__dirname);

var rootDocsDomain = "/en/"

// Map of documentation files/folders to what should appear in the TreeView
// Empty string means we skip adding this file/folder to the TreeView
var mapTable = {
    "vcpkg_android_example_cmake": "",
    "vcpkg_android_example_cmake_script": "",
    "versioning.getting-started.md": "Get Started with Versioning",
    "portfile-functions.md": "Portfile Helper Functions",
    "pr-review-checklist.md": "PR Checklist"
}

var searchTable = []

/** @param {string} name */
function convertToReadableFormat(name) {
    if (name in mapTable) {
        return mapTable[name];
    }

    if (name.substr(name.length - 3) == ".md") {
        name = name.substr(0, name.length - 3);
    }

    if (name.startsWith("cmake")) {
        name = "CMake" + name.substr(5);
    } else if (!name.startsWith("vcpkg")) {
        name = name[0].toUpperCase() + name.substr(1);
    }

    return name;
}

/**
 * @param {string} link
 * @param {string} currentPath
 */
function handleRelativeLink(link, currentPath) {
    if (!link.startsWith("..")) {
        return link;
    }

    if (link.endsWith(".md") || link.indexOf(".md") != -1) {
        return link;
    }

    var index = currentPath.indexOf("docs");
    return "https://github.com/microsoft/vcpkg/blob/master/" + currentPath.substring(index) + '/../' + link;
}

/**
 * @param {string} fileFullName
 * @param {string=} domainRoot
 */
function relativeToRootDomain(fileFullName, domainRoot) {
    var index = fileFullName.indexOf("docs");
    if (index == -1) {
        return;
    }
    var domainLink = fileFullName.substr(index);
    var forwardSlashDomain = domainLink.replace(/\\/g, "/").replace(/\/\//g, "/");
    if (domainRoot) {
        return domainRoot + forwardSlashDomain;
    }
    return rootDocsDomain + forwardSlashDomain;
}

/**
 * @param {string} name
 */
function markdownToHTMLExtension(name) {
    // modifies the .md extension with .html
    if (!name.endsWith(".md") && !name.match(/\.md#[a-zA-Z_0-9-]+$/)) {
        return name
    }

    if (name.indexOf("http") != -1 && name.indexOf(rootDocsDomain) == -1) {
        // Not in the root domain
        return name
    }

    const i = name.lastIndexOf(".md");
    return name.substr(0, i) + ".html" + name.substr(i + 3);
}

/**
 * @param {string} fileFullName
 */
function generateNavSearchResult(fileFullName) {
    var index = fileFullName.indexOf("docs")
    var navigation = fileFullName.substring(index + "docs".length + 1);

    if (navigation == "" || navigation == "/" || navigation == "\\") {
        return "#";
    }

    var firstIndex = navigation.indexOf("\\");
    if (firstIndex == -1) {
        return "#";
    }
    var firstNav = navigation.substring(0, firstIndex);

    var secondNavigation = navigation.substring(firstIndex + 1);
    var secondIndex = secondNavigation.indexOf("\\");

    if (secondIndex == -1) {
        return "#" + firstNav
    }
    var secondNav = secondNavigation.substring(0, secondIndex)

    return "#" + firstNav + "#" + secondNav
}

/**
 * @param {string} treeViewDir
 */
async function processTreeViewLayer(treeViewDir) {
    var treeViewHTML = ""
    var dirents = await fs.readdir(treeViewDir, { encoding: 'utf-8', withFileTypes: true });
    dirents.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) { return -1; }
        if (!a.isDirectory() && b.isDirectory()) { return 1; }
        const aname = a.name.replace(/_/g, "zz");
        const bname = b.name.replace(/_/g, "zz");
        return (aname > bname) - (aname < bname);
    });

    var html = [];
    var directories = [];

    async function handleFile(filename, fullName) {
        const relativePath = relativeToRootDomain(fullName);
        const relativeHTMLPath = markdownToHTMLExtension(relativePath);

        html.push('<a class="doc-outline-link" href="');
        html.push(relativeHTMLPath);
        html.push('">');
        html.push('<li class="list-can-expand">');
        if (filename in mapTable) {
            html.push(mapTable[filename]);
        } else {
            const data = await fs.readFile(fullName, 'utf-8');
            const lines = data.split(/\r?\n/);
            const matches = lines[0].match(/^#+ +(.*)/);
            if (matches) {
                html.push(matches[1].replace(/`(.*)`/g, '<code>$1</code>'));
            } else {
                html.push(convertToReadableFormat(filename));
            }
        }
        html.push("</li></a>");
        html.push("\n");
    }

    try {
        await (await fs.open(treeViewDir + ".md")).close();
        await handleFile(path.basename(treeViewDir) + ".md", treeViewDir + ".md");
    } catch (e) { }

    for (const file of dirents) {
        if (file.name in mapTable) {
            if (mapTable[file.name] == "") {
                continue;
            }
        }

        const fullName = treeViewDir + '/' + file.name;

        if (file.isDirectory()) {
            directories.push(file.name);
            html.push('<li class="list-can-expand"><button class="button-list-can-expand">');
            html.push(convertToReadableFormat(file.name));
            html.push("</button></li>\n");
            html.push('<ul class="collapse standard-padding">\n');
            html.push(await processTreeViewLayer(fullName));
            html.push("</ul>\n");
        } else if (file.isFile()) {
            if (!file.name.endsWith(".md")) {
                continue;
            } else if (directories.includes(file.name.substr(0, file.name.length - 3))) {
                continue;
            }
            await handleFile(file.name, fullName);
        }
    }

    return html.join('');
}

/**
 * @param {string} treeViewDir
 */
async function generateTreeView(treeViewDir) {
    return "<ul class=docs-navigation>" + await processTreeViewLayer(treeViewDir) + "</ul>\n";
}

function callshowdown(data, currentPath) {
    var translate = new showdown.Converter();
    translate.setFlavor('github');
    translate.setOption('simpleLineBreaks', false);
    translate.setOption('emoji', true);
    translate.setOption('smoothLivePreview', true);
    translate.setOption('encodeEmails', false);

    var html = translate.makeHtml(data);

    html = html
        .replace(/&lt;\/code&gt;/g, "</code>")
        .replace("ports&amp;lt;package&amp;gt;\\", "ports\\&lt;package&gt;\\")
        .replace(/<br \/>/g, " ")
        .replace(/Vcpkg/g, "vcpkg")
        .replace('<a href="mailto:vcpkg@microsoft.com">vcpkg@microsoft.com</a>', '<a href="&#x6d;&#x61;&#105;&#108;&#x74;&#111;&#58;v&#99;&#x70;&#107;&#x67;&#64;&#109;&#x69;&#x63;&#114;&#x6f;&#x73;&#x6f;&#102;&#x74;&#x2e;&#x63;&#x6f;&#x6d;">&#118;&#x63;&#x70;&#x6b;&#103;&#x40;&#109;&#x69;&#x63;&#114;&#111;&#x73;&#111;&#102;&#x74;&#x2e;&#99;&#x6f;&#x6d;</a>')

    html = html.replace(/<a href="([^"]*)"/g, (match, href) => {
        return '<a href="' + markdownToHTMLExtension(handleRelativeLink(href, currentPath)) + '"';
    });

    return html;
}

/**
 * @param {string} markdownFile
 * @param {fs.FileHandle} fd
 */
async function generateHTMLFromMarkdown(markdownFile, fd) {
    const file = await fs.readFile(markdownFile, 'utf-8');

    // Handle search table JSON
    var relativePath = relativeToRootDomain(markdownFile)

    searchTable.push({
        Path: markdownToHTMLExtension(relativePath),
        Name: convertToReadableFormat(path.basename(markdownFile)),
        Source: file,
        Nav: generateNavSearchResult(markdownFile)
    });

    if (markdownFile.indexOf("specifications") != -1) {
        const specLink = relativeToRootDomain(markdownFile, "https://github.com/microsoft/vcpkg/tree/master/")
        await fd.write('</nav><main class="right-side spec-only" id="main">\n'
            + '<div class="docs-mobile-show"><img class="docs-mobile-show-table" src="/assets/misc/table-docs.svg">Table of Contents</div>\n'
            + 'See <a href="' + specLink + '" class="spec-link">' + specLink + '</a>\n'
            + '</main></div><div id="loadFooter"></div></html>\n');
    } else {
        await fd.write('</nav><main class="right-side" id="main">\n'
            + '<div class="docs-mobile-show"><img class="docs-mobile-show-table" src="/assets/misc/table-docs.svg">Table of Contents</div>\n'
            + callshowdown(file, markdownFile)
            + '\n</main></div><div id="loadFooter"></div></html>\n');
    }
}

async function main() {
    const tvhtml = await generateTreeView(sourceDir);
    await fs.mkdir(destDir + rootDocsDomain + 'docs', { recursive: true });
    await fs.writeFile(destDir + rootDocsDomain + 'docs/navpane.html', tvhtml, 'utf-8');

    const template = await fs.readFile(__dirname + "/html-doc-template.txt", 'utf-8');

    async function generateForFile(relSourcePath) {
        const destFullPath = destDir + rootDocsDomain + 'docs' + relSourcePath;
        const pathToWrite = markdownToHTMLExtension(destFullPath);

        var fd = await fs.open(pathToWrite, 'w');
        await fd.write(template);
        await generateHTMLFromMarkdown(sourceDir + relSourcePath, fd);
        await fd.close();

        console.log("generated " + pathToWrite);
    }

    async function generateForDir(relSourcePath) {
        var dirents = await fs.readdir(sourceDir + relSourcePath, { encoding: 'utf-8', withFileTypes: true });

        for (var ent of dirents) {
            if (ent.isDirectory()) {
                await generateForDir(relSourcePath + "/" + ent.name);
            } else if (ent.name.endsWith(".md")) {
                await generateForFile(relSourcePath + "/" + ent.name);
            }
        }
    }

    await generateForDir("");
    await fs.writeFile(destDir + rootDocsDomain + "docs/vcpkg-docs.json", JSON.stringify(searchTable), 'utf-8');
}

main();
