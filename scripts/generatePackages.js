'use strict';

const fs = require('fs/promises');
const path = require('path');
const { exit } = require('process');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

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
        if (key === "homepage")
        {
            if (parsed[key].startsWith("https://") || parsed[key].startsWith("http://")){
                out[key] = parsed[key];
            }
        }else{
            out[makeManifestKeyReadable(key)] = parsed[key];
        }
    }
    return out;
}

function toPosixPath(p) {
    return p.split(path.sep).join('/');
}

async function getPortsCommitInfo(repoPath) {
    try {
        const { stdout } = await execAsync(
            `git -C ${repoPath} log --format=%H%x09%cd --date=format:%Y-%m-%d --name-only -- ports/*/vcpkg.json`,
            { maxBuffer: 64 * 1024 * 1024 }
        );
        const commitInfoMap = new Map();
        let currentCommit = null;
        for (const line of stdout.split('\n')) {
            if (!line.trim()) continue;
            const commitMatch = line.match(/^([0-9a-f]{40})\t(.+)$/);
            if (commitMatch) {
                currentCommit = { commitHash: commitMatch[1], lastModifiedDate: commitMatch[2] };
                continue;
            }
            if (currentCommit) {
                const normalizedPath = toPosixPath(line.trim());
                if (!commitInfoMap.has(normalizedPath)) {
                    commitInfoMap.set(normalizedPath, currentCommit);
                }
            }
        }
        return commitInfoMap;
    } catch (error) {
        console.error(`Error getting commit info for ports: ${error}`);
        return new Map();
    }
}


async function readPorts(vcpkgDir, commitInfoMap) {
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
        const relativeManifestPath = toPosixPath(path.relative(vcpkgDir, manifestFile));
        const commitInfo = commitInfoMap.get(relativeManifestPath);

        if (commitInfo){
            temp['LastModified'] = commitInfo.lastModifiedDate;
            temp['LastCommit'] = commitInfo.commitHash;
        }else{
            console.log('Failed to get commit info for ' + manifestFile);
        }

        if (!('Features' in temp)) {
            temp['Features'] = [];
        }

        results[ent.name] = temp;
    }

    return Object.values(results);
}

async function main(vcpkgDir, destDir) {
    const outputFile = path.join(destDir, 'output.json');

    const commitInfoMap = await getPortsCommitInfo(vcpkgDir);
    let portsData = await readPorts(vcpkgDir, commitInfoMap);

    let outputJson = {};
    outputJson['Baseline'] = (await fs.readFile(vcpkgDir + "/.git/HEAD", 'utf-8')).trim();
    outputJson['Size'] = portsData.length;
    outputJson['Source'] = portsData;
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
