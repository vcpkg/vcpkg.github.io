'use strict';

const fs = require('fs/promises');
const path = require('path');
const { exit } = require('process');
const showdown = require('showdown');
const Mustache = require('mustache');

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
        if (link.startsWith("../specifications")) {
            const skip_prefix = "../specifications".length;
            return "https://github.com/microsoft/vcpkg/blob/master/docs/specifications" + link.substring(skip_prefix);
        }

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
    const is_specs_dir = path.basename(treeViewDir) == "specifications";
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

    async function handleFile(filename, fullName, href) {
        if (typeof href == 'undefined') {
            const relativePath = relativeToRootDomain(fullName);
            href = markdownToHTMLExtension(relativePath);
        }

        html.push('<a class="doc-outline-link" href="');
        html.push(href);
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
            html.push('<li class="list-expanded"><button class="button-list-can-expand">');
            html.push(convertToReadableFormat(file.name));
            html.push("</button></li>\n");
            html.push('<ul class="standard-padding collapsable">\n');
            html.push(await processTreeViewLayer(fullName));
            html.push("</ul>\n");
        } else if (file.isFile()) {
            if (!file.name.endsWith(".md")) {
                continue;
            } else if (directories.includes(file.name.substr(0, file.name.length - 3))) {
                continue;
            }
            if (is_specs_dir) {
                await handleFile(file.name, fullName, relativeToRootDomain(fullName, "https://github.com/microsoft/vcpkg/tree/master/"));
            } else {
                await handleFile(file.name, fullName);
            }
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
        .replace(/<a name="([^"]*)"><\/a>/g, '<a name="$1" class="docs-anchor"></a>');

    html = html.replace(/<a href="([^"]*)"/g, (match, href) => {
        return '<a href="' + markdownToHTMLExtension(handleRelativeLink(href, currentPath)) + '"';
    });

    return html;
}

const rootDir = path.dirname(__dirname);
const templatesDir = rootDir + "/templates"
const outDocsDir = destDir + rootDocsDomain + 'docs';

async function main() {
    const navpanehtml = await generateTreeView(sourceDir);
    await fs.mkdir(outDocsDir, { recursive: true });
    await fs.writeFile(outDocsDir + '/navpane.html', navpanehtml, 'utf-8');

    const template = await fs.readFile(templatesDir + "/docpage.template.html", 'utf-8');
    const footertemplate = await fs.readFile(templatesDir + "/footer.html", 'utf-8');
    const navbartemplate = await fs.readFile(templatesDir + "/navbar.html", 'utf-8');

    async function generateForFile(relSourcePath) {
        const markdownFile = sourceDir + relSourcePath;
        if (markdownFile.indexOf("specifications") != -1) {
            return;
        }

        const destFullPath = outDocsDir + relSourcePath;
        const pathToWrite = markdownToHTMLExtension(destFullPath);

        const file = await fs.readFile(markdownFile, 'utf-8');

        // Handle search table JSON
        var relativePath = relativeToRootDomain(markdownFile)

        searchTable.push({
            Path: markdownToHTMLExtension(relativePath),
            Name: convertToReadableFormat(path.basename(markdownFile)),
            Source: file,
            Nav: generateNavSearchResult(markdownFile)
        });

        var view = {
            footer: footertemplate,
            navbar: navbartemplate,
            docsnav: navpanehtml
        };

        view.body = callshowdown(file, markdownFile);
        await fs.mkdir(path.dirname(pathToWrite), { recursive: true });
        await fs.writeFile(pathToWrite, Mustache.render(template, view), 'utf-8');

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
    await fs.writeFile(outDocsDir + "/vcpkg-docs.json", JSON.stringify(searchTable), 'utf-8');
}

main();
