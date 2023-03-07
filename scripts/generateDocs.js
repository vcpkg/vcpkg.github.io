'use strict';

const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const urlMapping = require('./urlMapping');

async function main() {
    const rootDir = path.dirname(__dirname);
    const outDocsDir = rootDir + '/en/docs';

    await fs.mkdir(outDocsDir, { recursive: true });

    const template = await fs.readFile(rootDir + "/templates/redirect.html", 'utf-8');

    for (const k in urlMapping) {
        const redirectUrl = urlMapping[k];
        var pathToWrite;
        if (k.substring(k.length - 3) == ".md") {
            pathToWrite = outDocsDir + "/" + k.substring(0, k.length - 3) + ".html";
        } else if (k.substring(k.length - 5) == ".html") {
            pathToWrite = outDocsDir + "/" + k;
        } else {
            throw "Expected .md or .html extension in url map";
        }

        await fs.mkdir(path.dirname(pathToWrite), { recursive: true });
        await fs.writeFile(pathToWrite, Mustache.render(template, { redirectUrl }), 'utf-8');
    }
}

main();
