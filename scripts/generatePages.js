'use strict';

const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const rootDir = path.dirname(__dirname);
const enDir = rootDir + "/en"
const pkgDir = rootDir + "/en/package"
const templatesDir = rootDir + "/templates"

async function render(src, dst, view) {
    const content = await fs.readFile(src, 'utf-8');
    const result = Mustache.render(content, view);
    await fs.writeFile(dst, result, 'utf-8');
}

async function main() {
    await fs.mkdir(enDir, { recursive: true });
    await fs.mkdir(pkgDir, { recursive: true });
    const view = {
        navbar: await fs.readFile(templatesDir + "/navbar.html"),
        footer: await fs.readFile(templatesDir + "/footer.html"),
        commonhead: await fs.readFile(templatesDir + "/commonhead.html"),
    };

    for (const t of ["getting-started.html", "index.html", "packages.html"]) {
        await render(templatesDir + "/" + t, enDir + "/" + t, view);
        console.log("Generated " + enDir + "/" + t);
    }
}

main();
