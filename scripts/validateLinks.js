'use strict';

const fs = require('fs/promises');
const { dirname } = require('path');
const path = require('path');
const { exit } = require('process');

if (process.argv.length != 2) {
    console.log("Usage: node validateLinks.js")
    exit(1);
}
const destDir = path.dirname(__dirname);

/**
 * @param {string[]} docs_set
 * @param {string} path
 */
async function get_pages_recursive(docs_set, path) {
    var dirents = await fs.readdir(path, { encoding: 'utf-8', withFileTypes: true });
    var promises = [];
    for (var ent of dirents) {
        if (ent.isDirectory()) {
            promises.push(get_pages_recursive(docs_set, path + "/" + ent.name));
        } else if (ent.name.endsWith(".html")) {
            docs_set.push(path + "/" + ent.name);
        }
    }
    for (var promise of promises) {
        await promise;
    }
}

/**
 * @param {string} page
 * @returns {{links: [string,string][], fragments: {string}}}
 */
async function load_page_info(page, relative_path) {
    const ret = { links: [], fragments: {}, other: [] };
    const content = await fs.readFile(page, 'utf-8');
    for (const match of content.matchAll(/ href="([^"?#]*)(#([^"?]*))?([^"]*)?"/g)) {
        if (match[1].length == 0) {
            if (match[3].length > 0) {
                // reference to self anchor
                ret.links.push([relative_path, match[3]]);
            }
            continue;
        }
        // skip external links
        if (match[1].startsWith("https://") || match[1].startsWith("http://")) continue;
        // skip mailto
        if (match[1].startsWith("mailto:")) continue;
        // skip encoded links
        if (match[1].startsWith("&")) continue;
        // skip non-page links for now
        if (match[1].startsWith("/css") || match[1].startsWith("/assets")) continue;
        if (match[1].startsWith("/")) {
            // Link is already relative to doc root
            ret.links.push([match[1], match[3]]);
        } else {
            var dir = dirname(relative_path);
            var subpath = match[1];
            while (subpath.startsWith("../")) {
                dir = dirname(dir);
                subpath = subpath.substring(3);
            }
            ret.links.push([dir + "/" + subpath, match[3]]);
        }
    }
    for (const match of content.matchAll(/ id="([^"]*)"/g)) {
        ret.fragments[match[1]] = true;
    }
    for (const match of content.matchAll(/ name="([^"]*)"/g)) {
        ret.fragments[match[1]] = true;
    }
    for (const match of content.matchAll(/.{0,30}\]\[.{0,30}/g)) {
        ret.other.push(`Incorrect markdown link: ${match[0]}`);
    }
    return ret;
}
/**
 * @param {string} filepath
 * @param {string} page
 * @param {{[index: string]: {links: [string,string][], fragments: {string}, other: [string]}}} pages_info
 * @returns {boolean} true if errors were found
 */
function validate_page(page, pages_info) {
    var rc = false;
    const relpath = page.substring(1);
    const page_info = pages_info[page];
    for (const link of page_info.links) {
        if (!(link[0] in pages_info)) {
            console.log(`::error file=${relpath}::Broken internal link from ${relpath} -> ${link[0]}`);
            rc = true;
        } else if (link[1] !== undefined && !(link[1] in pages_info[link[0]].fragments)) {
            console.log(`::error file=${relpath}::Broken fragment link from ${relpath} -> ${link[0]}#${link[1]}`);
            rc = true;
        }
    }
    for(const other of page_info.other) {
        console.log(`::error file=${relpath}::${other}`);
        rc = true;
    }
    return rc;
}

/** @returns {boolean} true if an error occurred */
async function main() {
    var pages = [];
    await get_pages_recursive(pages, destDir + "/en");

    var pages_info = {};
    for (var page of pages) {
        var relative = page.substring(destDir.length);
        pages_info[relative] = load_page_info(page, relative);
    }

    for (var page in pages_info) {
        pages_info[page] = await pages_info[page];
    }

    var only_docs = !!process.env.VCPKG_VALIDATE_LINKS_ONLY_DOCS;

    var rc = false;
    for (var page in pages_info) {
        if (!page.startsWith("/en/docs") && only_docs) {
            continue;
        }
        rc |= validate_page(page, pages_info);
    }
    exit(rc ? 1 : 0);
}

main()
