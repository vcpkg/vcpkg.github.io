'use strict';

const fs = require('fs/promises');
const path = require('path');
const { exit } = require('process');
const dayjs = require('dayjs');
const { Octokit } = require("@octokit/rest");

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
    for (var key of Object.keys(parsed)) {
        if (key.startsWith("$")) continue;
        out[makeManifestKeyReadable(key)] = parsed[key];
    }
    return out;
}

async function readPorts(vcpkgDir) {
    const portsDir = `${vcpkgDir}/ports`;
    var dirents = await fs.readdir(portsDir, { encoding: 'utf-8', withFileTypes: true });

    var results = {};
    for (var ent of dirents) {
        const manifestFile = `${portsDir}/${ent.name}/vcpkg.json`;
        let temp = await readManifest(manifestFile, results);
        if (!temp) {
            console.log('Failed to read ' + manifestFile);
            continue;
        }
        results[ent.name] = temp;
    }
    return results;
}

async function readBaseline(vcpkgDir) {
    const baselineFile = `${vcpkgDir}/scripts/ci.baseline.txt`;

    let data = await fs.readFile(baselineFile, { encoding: 'utf-8', flag: 'r' });
    let baseline = {};
    const lines = data.split(/\r?\n/);
    for (var tmp of lines) {
        let line = tmp.trim();
        if (line.length == 0 || line.startsWith('#')) continue;

        let index = 0;

        let port = '';
        while (index < line.length && line[index] != ':') {
            port += line[index++];
        }
        port = port.trim();
        ++index;

        let triplet = '';
        while (index < line.length && line[index] != '=') {
            triplet += line[index++];
        }
        triplet = triplet.trim();
        ++index;

        let result = '';
        while (index < line.length && line[index] != '#') {
            result += line[index++];
        }
        result = result.trim();

        if (port.length == 0 || triplet.length == 0 || result.length == 0) continue;
        if (!(result == 'pass' || result == 'fail' || result == 'skip')) continue;

        if (!(port in baseline)) {
            baseline[port] = {};
        }
        baseline[port][triplet] = result;
    }
    return baseline;
}

async function getGitHubStars(portsData, githubToken) {
    const githubUrl = 'https://github.com/';
    const regex = /^(?<owner>[a-zA-Z\d][a-zA-Z\d\.\-\_]+)\/(?<repo>[a-zA-Z\d][a-zA-Z\d\.\-\_]+).*$/;

    const octokit = new Octokit({ auth: githubToken });
    for (var key of Object.keys(portsData)) {
        console.log(`Generating data for ${key}`);
        let port = portsData[key];
        if ('Homepage' in port && port['Homepage'].startsWith(githubUrl)) {
            const url = port['Homepage'].substr(githubUrl.length);
            const [_, owner, repo] = regex.exec(url) ?? [];
            try {
                const response = await octokit.rest.repos.get({ owner, repo });
                if (response.status != 200) continue;
                const stars = response.data.stargazers_count;
                port['Stars'] = stars;
            } catch (err) {
                console.log(`Failed to get stars for ${port['Homepage']}`);
            }
        }
    }
}

function mergeDataSources(portsData, baselineData) {
    const allTriplets = [
        'arm-uwp',
        'arm64-windows',
        'x64-linux',
        'x64-osx',
        'x64-uwp',
        'x64-windows-static-md',
        'x64-windows-static',
        'x64-windows',
        'x86-windows'
    ];

    // merge and normalize all data sources
    for (var port of Object.keys(portsData)) {
        // website expects an empty array if the package has no features
        if (!('Features' in portsData[port])) {
            portsData[port]['Features'] = [];
        }

        // website expects all known triplets to be listed
        for (var triplet of allTriplets) {
            if (port in baselineData && triplet in baselineData[port]) {
                portsData[port][triplet] = baselineData[port][triplet];
            }
            else {
                portsData[port][triplet] = 'pass';
            }
        }
    }
}

async function main(vcpkgDir, destDir, githubToken) {
    let outputJson = {};

    let today = dayjs();
    outputJson['Generated On'] = today.format();

    let portsData = await readPorts(vcpkgDir);
    let baselineData = await readBaseline(vcpkgDir);
    if (githubToken.length > 0) {
        await getGitHubStars(portsData, githubToken);
    }
    mergeDataSources(portsData, baselineData);

    let mergedData = Object.values(portsData);
    outputJson['Size'] = mergedData.length;
    outputJson['Source'] = mergedData;
    await fs.writeFile(destDir + '/output.json', JSON.stringify(outputJson, null, 2), 'utf-8');
}


// arg processing and main loop
if (process.argv.length < 3) {
    console.log("Usage: node generatePackages.js <path/to/source/docs> [GITHUB_PAT]");
    exit(1);
}
const vcpkgDir = process.argv[2];
const destDir = path.dirname(__dirname);
let githubToken = '';
if (process.argv.length >= 4) {
    githubToken = process.argv[3];
}
main(vcpkgDir, destDir, githubToken);