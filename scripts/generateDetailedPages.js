'use strict';
const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const rootDir = path.dirname(__dirname);
const pkgDir = rootDir + "/en/package"
const templatesDir = rootDir + "/templates"
const destDir = path.dirname(__dirname);
const commitFilePath = path.join(__dirname, 'commit.txt');

async function readJsonFile(filePath) {
    const fileData = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileData);
}

function renderTemplate(template, data) {
    return Mustache.render(template, data);
}

async function getCommitHash(commitFilePath) {
    try {
        const commitHash = await fs.readFile(commitFilePath, 'utf8');
        return commitHash.trim();
    } catch (error) {
        console.error(`Error reading commit hash: ${error}`);
        return 'master'; // Fallback to master if commit hash is unavailable
    }
}

async function generateGithubFileUrls(packageInfo, commitHash, vcpkgDir) {
    const portDirPath = path.join(vcpkgDir, 'ports', packageInfo.Name);
    const fileNames = await fs.readdir(portDirPath);
    fileNames.sort();
    const effectiveCommitHash = commitHash || 'master';
    const githubBaseUrl = `https://github.com/microsoft/vcpkg/blob/${effectiveCommitHash}/ports/${packageInfo.Name}/`;

    return fileNames.map(fileName => {
        return {
            name: fileName,
            url: `${githubBaseUrl}${fileName}`
        };
    });
}


async function getPackageVersions(pkgName, vcpkgDir) {
    const pkgFolder = pkgName.charAt(0) + '-';
    const pkgJsonFile = path.join('/', pkgName + '.json');
    const versionFile = path.join(vcpkgDir, 'versions', pkgFolder, pkgJsonFile);

    const rawData = await fs.readFile(versionFile);
    const versionsInfo = JSON.parse(rawData);

    var versionsArray = versionsInfo.versions.map(obj => {
        const version = obj.version || obj["version-string"] || obj["version-semver"] || obj["version-date"];
        return version + '#' + obj["port-version"];
    });
    
    return versionsArray;
}

function getPackageFeatures(packageObj) {
    let featuresList = [];
    if (packageObj && typeof packageObj.Features === 'object') {
        for (const [featureName, featureDetails] of Object.entries(packageObj.Features)) {
            let feature = {
                name: featureName,
                description: featureDetails.description,
                hasDependencies: Array.isArray(featureDetails.dependencies) && featureDetails.dependencies.length > 0,
                dependencies: Array.isArray(featureDetails.dependencies) ? featureDetails.dependencies.map(transform_dep): []
            };
            featuresList.push(feature);
        }
    }
    return featuresList;
}

function transform_dep(dep) {
    if (typeof (dep) === "string") {
        return { "name": dep };
    } else {
        let obj = { 
            "name": dep.name,
            "platform": dep.platform || "",
            "host": dep.host || false,
            "noDefaultFeatures": dep["default-features"] === false,
            "depFeatures" : dep.features ? dep.features.map((feature, i, arr) =>{return {name: feature, first: i===0, last: i === arr.length - 1};}) : [],
            "hasFeatures": dep.features && dep.features.length > 0
        };

        if (dep["version>="]) {
            obj.versionMinimum = dep["version>="];
        }

        return obj;
    }
}

async function renderAllTemplates(vcpkgDir) {
    const commitHash = await getCommitHash(commitFilePath);

    // Load all templates and data once at the beginning.
    const [packageTemplate, navbarHtml, footerHtml, commonHeadHtml, gettingStartedHtml, indexHtml, packagesHtml, packageDataSource] = await Promise.all([
        fs.readFile(path.join(templatesDir, "package.html"), 'utf8'),
        fs.readFile(path.join(templatesDir, "navbar.html")),
        fs.readFile(path.join(templatesDir, "footer.html")),
        fs.readFile(path.join(templatesDir, "commonhead.html")),
        fs.readFile(path.join(templatesDir, "getting-started.html"), 'utf8'),
        fs.readFile(path.join(templatesDir, "index.html"), 'utf8'),
        fs.readFile(path.join(templatesDir, "packages.html"), 'utf8'),
        readJsonFile(path.join(destDir, 'output.json'))
    ]);

    const sharedData = {
        navbar: navbarHtml,
        footer: footerHtml,
        commonhead: commonHeadHtml
    };

    const view = {
        ...sharedData,
        numPackages: packageDataSource.Source.length
    };

    const commonTemplates = [
        { content: gettingStartedHtml, name: "getting-started.html" },
        { content: indexHtml, name: "index.html" },
        { content: packagesHtml, name: "packages.html" }
    ];

    for (const { content, name } of commonTemplates) {
        const renderedTemplate = renderTemplate(content, view);
        await fs.writeFile(path.join(rootDir, '/en', name), renderedTemplate, 'utf8');
    }

    // Calculate reverse dependencies
    const usedByMap = new Map();
    for (const pkg of packageDataSource.Source) {
        // 1. Core dependencies
        const deps = pkg.Dependencies || [];
        for (const dep of deps) {
            const depName = typeof dep === 'string' ? dep : dep.name;
            if (!usedByMap.has(depName)) {
                usedByMap.set(depName, new Map());
            }
            const dependeeMap = usedByMap.get(depName);
            if (!dependeeMap.has(pkg.Name)) {
                dependeeMap.set(pkg.Name, { core: false, features: [] });
            }
            dependeeMap.get(pkg.Name).core = true;
        }

        // 2. Feature dependencies
        if (pkg.Features) {
            for (const [featureName, featureSpec] of Object.entries(pkg.Features)) {
                const featureDeps = featureSpec.dependencies || [];
                for (const dep of featureDeps) {
                    const depName = typeof dep === 'string' ? dep : dep.name;
                    if (!usedByMap.has(depName)) {
                        usedByMap.set(depName, new Map());
                    }
                    const dependeeMap = usedByMap.get(depName);
                    if (!dependeeMap.has(pkg.Name)) {
                        dependeeMap.set(pkg.Name, { core: false, features: [] });
                    }
                    dependeeMap.get(pkg.Name).features.push(featureName);
                }
            }
        }
    }
    
    for (let packageInfo of packageDataSource.Source) {
        packageInfo.Documentation = packageInfo.Documentation || '';
        packageInfo.LastUpdated = packageInfo.LastModified;
        packageInfo.PortVersion = packageInfo['Port-Version'] || 0;
        packageInfo.FeaturesContent = getPackageFeatures(packageInfo);
        packageInfo.supportedArchitectures = packageInfo['Supports'] ? [packageInfo['Supports']] : ["Supported on all triplets"];
        packageInfo.dependenciesList = (packageInfo.Dependencies || []).map(transform_dep);
        packageInfo.githubFileUrls = await generateGithubFileUrls(packageInfo, packageInfo.LastCommit, vcpkgDir);
        packageInfo.Homepage = packageInfo["homepage"];

        const usedByEntry = usedByMap.get(packageInfo.Name);
        let usedByList = [];
        if (usedByEntry) {
            usedByList = Array.from(usedByEntry.entries()).map(([name, info]) => {
                info.features.sort();
                return {
                    name: name,
                    core: info.core,
                    features: info.features,
                    hasFeatures: info.features.length > 0,
                    featuresList: info.features.map((f, i, arr) => ({
                        name: f,
                        first: i === 0,
                        last: i === arr.length - 1
                    }))
                };
            });
            usedByList.sort((a, b) => a.name.localeCompare(b.name));
        }
        packageInfo.usedBy = usedByList;

        // Gather all data needed for rendering.
        const renderData = {
            ...sharedData,
            package: packageInfo,
            packageVersions: await getPackageVersions(packageInfo.Name, vcpkgDir),
            dependencies: packageInfo.dependenciesList,
            features: packageInfo.FeaturesContent,
            usedBy: packageInfo.usedBy
        };

        const renderedHtml = renderTemplate(packageTemplate, renderData);
        const destinationHtmlPath = path.join(pkgDir, `${packageInfo.Name}.html`);
        await fs.writeFile(destinationHtmlPath, renderedHtml);
    }
}

async function main(vcpkgDir) {
    await fs.mkdir(pkgDir, { recursive: true });
    await renderAllTemplates(vcpkgDir);
}

if (process.argv.length < 3) {
    console.log("Usage: node generateDetailedPages.js <vcpkg-root>");
    process.exit(1);
}

const vcpkgDir = process.argv[2];
main(vcpkgDir);
