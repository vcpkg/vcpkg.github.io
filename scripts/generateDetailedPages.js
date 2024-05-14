'use strict';
const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const rootDir = path.dirname(__dirname);
const pkgDir = rootDir + "/en/package"
const templatesDir = rootDir + "/templates"
const versionsDir = rootDir + "/vcpkg/versions"
const destDir = path.dirname(__dirname);
const commitFilePath = path.join(__dirname, 'commit.txt');
const vcpkgDir = path.join(__dirname, '../vcpkg');

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
    const githubBaseUrl = `https://github.com/microsoft/vcpkg/blob/${commitHash}/ports/${packageInfo.Name}/`;

    return fileNames.map(fileName => {
        return {
            name: fileName,
            url: `${githubBaseUrl}${fileName}`
        };
    });
}


async function GetPackageVersions(pkgName) {
    const pkgFolder = pkgName.charAt(0) + '-';
    const pkgJsonFile = path.join('/', pkgName + '.json');
    const versionFile = path.join(versionsDir, pkgFolder, pkgJsonFile);

    const rawData = await fs.readFile(versionFile);
    const versionsInfo = JSON.parse(rawData);

    var versionsArray = versionsInfo.versions.map(obj => {
        const version = obj.version || obj["version-string"] || obj["version-semver"] || obj["version-date"];
        return version + '#' + obj["port-version"];
    });
    
    return versionsArray;
}

function GetPackageFeatures(packageObj) {
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

async function getSupportedArchitectures(packageInfo, vcpkgDir) {
    const ciBaselinePath = path.join(vcpkgDir, 'scripts', 'ci.baseline.txt');
    const ciBaselineContent = await fs.readFile(ciBaselinePath, 'utf-8');

    // Function to parse ci.baseline.txt and get skipped or failed platforms
    function getSkippedOrFailedPlatforms(packageName, ciBaselineContent) {
        const lines = ciBaselineContent.trim().split('\n');
        const platforms = [];
        for (const line of lines) {
            if (line.startsWith('#')) continue; // Ignore comments
            const [pkgInfo, status] = line.split('=');
            if (pkgInfo.startsWith(packageName) && (status === 'skip' || status === 'fail')) {
                const platform = pkgInfo.split(':')[1];
                platforms.push(`!${platform}`);
            }
        }
        return platforms;
    }

    const skippedOrFailedPlatforms = getSkippedOrFailedPlatforms(packageInfo.Name.toLowerCase(), ciBaselineContent);

    if (packageInfo['Supports']) {
        packageInfo.supportedArchitectures = [packageInfo['Supports'], ...skippedOrFailedPlatforms];
    } else {
        if (skippedOrFailedPlatforms.length > 0) {
            packageInfo.supportedArchitectures = skippedOrFailedPlatforms;
        } else {
            packageInfo.supportedArchitectures = ["Tested on all platforms"];
        }
    }

    return packageInfo.supportedArchitectures;
}


async function renderDetailedPackages() {
    const commitHash = await getCommitHash(commitFilePath);

    // Load all templates and data once at the beginning.
    const [packageTemplate, navbarHtml, footerHtml, commonHeadHtml, packageDataSource] = await Promise.all([
        fs.readFile(templatesDir + "/pretty-package.html", 'utf8'),
        fs.readFile(templatesDir + "/navbar.html"),
        fs.readFile(templatesDir + "/footer.html"),
        fs.readFile(templatesDir + "/commonhead.html"),
        readJsonFile(path.join(destDir, 'output.json'))
    ]);

    for (let packageInfo of packageDataSource.Source) {
        packageInfo.Documentation = packageInfo.Documentation || '';
        packageInfo.LastUpdated = packageInfo.LastModified;
        packageInfo.PortVersion = packageInfo['Port-Version'] || 0;
        packageInfo.FeaturesContent = GetPackageFeatures(packageInfo);
        packageInfo.supportedArchitectures = await getSupportedArchitectures(packageInfo, vcpkgDir);
        packageInfo.dependenciesList = (packageInfo.Dependencies || []).map(transform_dep);
        packageInfo.githubFileUrls = await generateGithubFileUrls(packageInfo, commitHash, vcpkgDir);

        // Gather all data needed for rendering.
        const renderData = {
            navbar: navbarHtml,
            footer: footerHtml,
            commonhead: commonHeadHtml,
            package: packageInfo,
            packageVersions: await GetPackageVersions(packageInfo.Name),
            dependencies: packageInfo.dependenciesList,
            features: packageInfo.FeaturesContent
        };

        const renderedHtml = renderTemplate(packageTemplate, renderData);
        const destinationHtmlPath = path.join(pkgDir, `${packageInfo.Name}.html`);
        await fs.writeFile(destinationHtmlPath, renderedHtml);
    }
}

async function main() {
    await fs.mkdir(pkgDir, { recursive: true });
    await renderDetailedPackages();
}

main();
