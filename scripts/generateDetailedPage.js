'use strict';
const fss = require('fs');
const fs = require('fs/promises');
const path = require('path');
const Mustache = require('mustache');
const util = require('util');
const rootDir = path.dirname(__dirname);
const enDir = rootDir + "/en"
const pkgDir = rootDir + "/en/package"
const templatesDir = rootDir + "/templates"
const destDir = path.dirname(__dirname);

var triplets = [
    'arm-uwp',
    'arm64-windows',
    'x64-linux',
    'x64-osx',
    'x64-uwp',
    'x64-windows',
    'x64-windows-static',
    'x86-windows',
];

async function renderDetailedPackage() {
    const template = await fs.readFile(templatesDir + "/package.html", 'utf-8');

    console.log("dynamic page");
    const jsonFile = path.join(destDir, 'output.json');
    console.log("dest dir", destDir);
    //const readFile = util.promisify(fs.readFile);

    const navbar = await fs.readFile(templatesDir + "/navbar.html");
    const footer = await fs.readFile(templatesDir + "/footer.html");
    const commonhead = await fs.readFile(templatesDir + "/commonhead.html");
    const { format } = require('date-fns');
    const currentDate = new Date();
    const lastUpdatedts = format(currentDate, "yyyy-MM-dd HH:mm:ss");

    fs.readFile(jsonFile)
        .then((data) => {
            const users = JSON.parse(data);
            // console.log(users.Source.length);
            for (let type of users.Source) {
                (async () => {
                    const packageName = type;

                    packageName.Type = 'Port';
                    // const lastUpdatedts = getLastUpdated(packageName.Homepage);
                    packageName.LastUpdated = lastUpdatedts;
                    let homePageUrl = packageName.Homepage;

                    if (homePageUrl) {

                        //const lastUpdated = await getLastUpdatedTimestamp(repoUrl);
                        //packageName.LastUpdated = lastUpdated;

                        // getLastUpdatedTimestamp(repoUrl)
                        //     .then(lastUpdated => {
                        //         console.log(`Last updated at: ${lastUpdated}`);
                        //         packageName.LastUpdated = lastUpdated;
                        //     })
                    }

                    // Get package versions
                    const packageVersions = GetPackageVersions(packageName.Name);
                    const featuresContent = GetPackageFeatures(packageName);
                    packageName.FeaturesContent = featuresContent;
                    const supportedPlatFormsObj = GetSupportedPlatArch(packageName);
                    packageName.supportedPlatForms = supportedPlatFormsObj.supportedPlatForms;
                    packageName.supportedArchitectures = supportedPlatFormsObj.supportedArchitectures;
                    const dependencies = (packageName.Dependencies || []).map(transform_dep);
                    //packageName.dependencies = dependencies;
                    const vcpkgPortsurl = "https://github.com/microsoft/vcpkg/blob/master/ports/"
                    const portfileCMakeUrl = vcpkgPortsurl + type.Name + '/portfile.cmake';
                    packageName.portfileCmake = portfileCMakeUrl;
                    const result = Mustache.render(template, { navbar: navbar, footer: footer, commonhead: commonhead, packageName: packageName, packageVersions: packageVersions, dependencies: dependencies });
                    const dst = pkgDir + "/" + type.Name + ".html";
                    fs.writeFile(dst, result, function (err) {
                        if (err) throw err;
                        console.info('file saved!');
                    });

                })();

            }
        });

    console.log("from render");
}


async function getLastUpdatedTimestamp(url) {
    try {
        let apiUrl = '';
        const githubUrl = 'https://github.com/';
        if (url.startsWith(githubUrl)) {
            apiUrl = url.replace("https://github.com/", "https://api.github.com/repos/");
        }
        else {
            return 'invalid data ';
        }

        const response = await fetch(url);
        if (!response.ok) {
            console.log(`GitHub API request failed with status: ${response.status}`);
        }

        const data = await response.json();
        const lastUpdated = new Date(data.updated_at);
        return lastUpdated;
    } catch (error) {
        console.error(error);
    }
}

async function main() {
    //await fs.mkdir(enDir, { recursive: true });
    await fs.mkdir(pkgDir, { recursive: true });
    await renderDetailedPackage();
}


const currentWorkingDirectory = process.cwd();
console.log("Current Working Directory:", currentWorkingDirectory);

function GetPackageVersions(pkgName) {
    const pkgFolder = pkgName.charAt(0) + '-';
    //console.log(pkgFolder);
    const pkgJsonFile = path.join('/', pkgName + '.json');
    const versionFile = path.join(currentWorkingDirectory, '/vcpkg/versions/', pkgFolder, pkgJsonFile);
    const rawData = fss.readFileSync(versionFile);
    const versionsInfo = JSON.parse(rawData);
    //console.log(versionsInfo.versions.length);

    var versionObj = {};
    versionObj.availablePkgVersions = versionsInfo.versions.map(function (obj) {
        return obj.version != undefined ? `<a href="${obj["git-tree"]}" class="badge badge-primary">${obj.version}</a>` : `<a href="${obj["git-tree"]}" class="badge badge-primary">${obj["version-string"]}</a>`
        //return obj.version != undefined ? obj.version : obj["version-string"];
    }).join(' ');


    versionObj.availablePortVersions = versionsInfo.versions.map(function (obj) {
        return  `<span class="badge badge-primary">${obj["port-version"]}</span>`;
        //return obj["port-version"];
    }).join(' ');

    /*
        // to get the distinct elements
        versionObj.availablePortVersions = Array.from(new Set(versionsInfo.versions.map(function (obj) {
            return obj["port-version"];
        })));
    */

    return versionObj
}

function GetPackageFeatures(packageObj) {
    let featureList = '';
    if (packageObj.hasOwnProperty('Features')) {
        //if (type.Features !== undefined) {
        var featureKeys = Object.keys(packageObj.Features);
        var keysCount = featureKeys.length;
        if (keysCount > 0) {
            for (const fea of featureKeys) {
                featureList += `• ${fea} : ${packageObj.Features[fea].description}<br>`;
            }
        }
    }

    return featureList;
}

function GetSupportedPlatArch(packageObj) {
    var spaObj = {};
    var platformPassesString = "";
    var archiPassesString = "";
    for (var _i = 0, triplets_1 = triplets; _i < triplets_1.length; _i++) {
        var t = triplets_1[_i];
        var status = packageObj[t];
        if (status === 'pass') {
            platformPassesString += ", " + triplets_1[_i];
            archiPassesString += ", " + triplets_1[_i];
        }
    }
    spaObj.supportedPlatForms = platformPassesString;
    spaObj.supportedArchitectures = archiPassesString;
    return spaObj;
}

function transform_dep(dep) {
    if (typeof (dep) === "string") {
        return { "name": dep, "host": false };
    } else {
        let obj = { "name": dep.name, "host": !!dep.host };
        if (dep.platform) {
            obj.platform = dep.platform;
        }
        return obj;
    }
}


main();
