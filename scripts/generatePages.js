'use strict';

const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const rootDir = path.dirname(__dirname);
const enDir = rootDir + "/en"
const templatesDir = rootDir + "/templates"

async function render(src, dst, view) {
    const content = await fs.readFile(src, 'utf-8');
    const result = Mustache.render(content, view);
    await fs.writeFile(dst, result, 'utf-8');
}

async function main() {
    await fs.mkdir(enDir, { recursive: true });
    const view = {
        navbar: await fs.readFile(templatesDir + "/navbar.html"),
        footer: await fs.readFile(templatesDir + "/footer.html"),
        commonhead: await fs.readFile(templatesDir + "/commonhead.html"),
    };

    for (const t of ["getting-started.html", "index.html", "packages.html"]) {
        await render(templatesDir + "/" + t, enDir + "/" + t, view);
        console.log("Generated " + enDir + "/" + t);
    }

    // Redirect from https://vcpkg.io/en/docs/ to https://vcpkg.io/en/docs/README.md
    await fs.copyFile(templatesDir + "/readme-redirect.html", enDir + "/docs/index.html");
    // Redirect from https://vcpkg.io/docs/ to https://vcpkg.io/en/docs/README.md
    await fs.mkdir(rootDir + "/docs");
    await fs.copyFile(templatesDir + "/readme-redirect.html", rootDir + "/docs/index.html");
}

main();
