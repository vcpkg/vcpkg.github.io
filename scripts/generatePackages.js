'use strict';

const fs = require('fs/promises');
const path = require('path');
const { exit } = require('process');

function makeManifestKeyReadable(key) {
    const versionKeys = {
        'version-date': 'Version',
        'version-semver': 'Version',
        'version-string': 'Version',
    }

    const useAsIsKeys = [
        'dependencies',
        'default-features',
        'features'
    ]

    if (key in useAsIsKeys) {
        return key;
    }

    if (key in versionKeys) {
        return versionKeys[key];
    }

    let temp = key.split('-');
    return temp.map(s => {
        return s[0].toUpperCase() + s.substr(1);
    }).join('-');
}

async function readManifest(manifestFile) {
    let data = await fs.readFile(manifestFile, { encoding: 'utf-8', flag: 'r' });
    let parsed = JSON.parse(data);
    let out = {};
    for (let key of Object.keys(parsed)) {
        if (key.startsWith("$")) continue;
        out[makeManifestKeyReadable(key)] = parsed[key];
    }
    return out;
}

async function readPorts(vcpkgDir) {
    const portsDir = path.join(vcpkgDir, 'ports');
    let dirents = await fs.readdir(portsDir, { encoding: 'utf-8', withFileTypes: true });

    let results = {};
    for (let ent of dirents) {
        const manifestFile = path.join(portsDir, ent.name, 'vcpkg.json');
        let temp = await readManifest(manifestFile, results);
        if (!temp) {
            console.log('Failed to read ' + manifestFile);
            continue;
        }
        results[ent.name] = temp;
    }
    return results;
}

async function readStars(starsFile) {
    try {
        let data = await fs.readFile(starsFile, { encoding: 'utf-8', flag: 'r' });
        return JSON.parse(data);
    }
    catch
    {
        console.log(`Failed to parse GitHub data from ${starsFile}`);
        return {};
    }
}

function mergeDataSources(portsData, githubData) {
    // merge and normalize all data sources
    for (let port of Object.keys(portsData)) {
        // website expects an empty array if the package has no features
        if (!('Features' in portsData[port])) {
            portsData[port]['Features'] = [];
        }

        portsData[port]['Stars'] = githubData[port] ?? 0;
    }
}

async function main(vcpkgDir, destDir) {
    const starsFile = path.join(destDir, 'stars.json');
    const outputFile = path.join(destDir, 'output.json');

    let portsData = await readPorts(vcpkgDir);
    let githubData = await readStars(starsFile);
    mergeDataSources(portsData, githubData);
    let mergedData = Object.values(portsData);

    let outputJson = {};
    outputJson['Baseline'] = (await fs.readFile(vcpkgDir + "/.git/HEAD", 'utf-8')).trim();
    outputJson['Size'] = mergedData.length;
    outputJson['Source'] = mergedData;
    await fs.writeFile(outputFile, JSON.stringify(outputJson, null, 2), 'utf-8');
}


// arg processing and main loop
if (process.argv.length < 3) {
    console.log("Usage: node generatePackages.js <vcpkg-root>");
    exit(1);
}
const vcpkgDir = process.argv[2];
const destDir = path.dirname(__dirname);
main(vcpkgDir, destDir);