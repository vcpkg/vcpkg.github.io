'use strict';

const fs = require('fs/promises');
const path = require('path');
const { Octokit } = require('@octokit/rest');
const { exit } = require('process');

async function getGitHubStars(octokit, url) {
    try {
        const githubUrl = 'https://github.com/';
        const regex = /^(?<owner>[a-zA-Z\d][a-zA-Z\d\.\-\_]+)\/(?<repo>[a-zA-Z\d][a-zA-Z\d\.\-\_]+).*$/;

        if (!url.startsWith(githubUrl)) return 0;

        const [_, owner, repo] = regex.exec(url.substr(githubUrl.length)) ?? [];
        if (!owner || !repo) {
            console.log(`Failed to get stars for ${url}\nNot a valid GitHub repository URL.`);
            return 0;
        }

        const response = await octokit.rest.repos.get({ owner, repo });
        if (response.status != 200) {
            console.log(`Failed to get stars for ${url}`);
            return 0;
        }

        return response.data.stargazers_count;
    } catch (error) {
        console.log(error)
    }
}

async function readHomepage(manifestFile) {
    let data = await fs.readFile(manifestFile, { encoding: 'utf-8', flag: 'r' });
    let parsed = JSON.parse(data);
    return parsed.homepage ?? '';
}

async function main(vcpkgDir, destDir, githubToken) {
    if (githubToken.length == 0) {
        console.log('Skipping GitHub stars');
        return;
    }

    const outputFile = path.join(destDir, 'stars.json');
    const portsDir = path.join(vcpkgDir, 'ports');
    const octokit = new Octokit({ auth: githubToken });

    let dirents = await fs.readdir(portsDir, { encoding: 'utf-8', withFileTypes: true });
    let results = {};
    for (let ent of dirents) {
        const manifestFile = path.join(portsDir, ent.name, 'vcpkg.json');
        const url = await readHomepage(manifestFile);
        const stars = await getGitHubStars(octokit, url);
        results[ent.name] = stars;
    }

    await fs.writeFile(outputFile, JSON.stringify(results, null, 2), 'utf-8');
}


const VCPKG_ROOT = 2;
const GITHUB_PAT = 3;
const argc = process.argv.length;
if (argc < 3 || argc > 4) {
    console.log('Usage: node generateGitHubStars.js <vcpkg-root> [GITHUB_PAT]');
    exit(1);
}

const vcpkgDir = process.argv[VCPKG_ROOT];
const destDir = path.dirname(__dirname);
let githubToken = '';
if (argc > GITHUB_PAT) {
    githubToken = process.argv[GITHUB_PAT];
}
main(vcpkgDir, destDir, githubToken);