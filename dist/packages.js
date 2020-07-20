var wording = {
    'en': {
        'version': 'Version: ',
        'more': ' More...',
        'compat': 'Compatibility:',
        'website': 'Website',
        'star': 'Star',
        'total-pkgs': 'Total Packages: ',
        'no-results': 'No results for ',
    },
    'zh': {
        'version': 'zh-filler',
    },
};
var allPackages, currentPackages, cancellationToken, hiddenCount, selectedPackage;
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
var compatFilter = [];
$(document).ready(function () {
    $('.install-tab-btn').click(function () {
        clickInstallTab($(this).attr('id').substring(12));
    });
    $('#install-copy').click(function () {
        copyCodePanel('install-code');
    });
});
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    var sParameterName;
    var i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined
                ? true
                : decodeURIComponent(sParameterName[1]);
        }
    }
    return true;
};
// initialize query to result from index.html or blank
var res = getUrlParameter('query');
var query = res === true ? '' : res;
$.getJSON('../output.json', function (responseObject) {
    allPackages = responseObject.Source;
    currentPackages = allPackages;
    document.getElementById('pkg-search').value = query;
    searchAndRenderPackages();
});
var renderModalDescription = function (fullDesc) {
    var cutoff = 400; //character cut off
    var descriptionDiv = parentDescriptionDiv.cloneNode(true);
    var shortDescSpan = parentShortDescSpan.cloneNode(true);
    shortDescSpan.textContent = fullDesc.substring(0, cutoff);
    descriptionDiv.appendChild(shortDescSpan);
    var extraText = fullDesc.substring(cutoff);
    if (extraText) {
        //modal should have expandable description
        var extraDescSpan = parentExtraDescSpan.cloneNode(true);
        extraDescSpan.textContent = fullDesc.substring(cutoff);
        var moreDescSpan = parentMoreDescSpan.cloneNode(true);
        moreDescSpan.addEventListener('click', expandText.bind(this, moreDescSpan, extraDescSpan));
        moreDescSpan.textContent = wording[lang]['more'];
        descriptionDiv.appendChild(moreDescSpan);
        descriptionDiv.appendChild(extraDescSpan);
    }
    return descriptionDiv;
};
var renderCardDescription = function (fullDesc) {
    var cutoff = 200; //character cut off
    var descriptionDiv = parentDescriptionDiv.cloneNode(true);
    var shortDescSpan = parentShortDescSpan.cloneNode(true);
    shortDescSpan.textContent = fullDesc.substring(0, cutoff);
    var extraText = fullDesc.substring(cutoff);
    if (extraText) {
        //card cuts off the content
        shortDescSpan.textContent += '...';
    }
    descriptionDiv.appendChild(shortDescSpan);
    return descriptionDiv;
};
var renderCompability = function (pkg, packageDiv) {
    var compatRowDiv = document.createElement('div');
    compatRowDiv.className = 'package-compatibility';
    // Compatibility text
    var compatDiv = document.createElement('span');
    compatDiv.className = 'package-compatibility-text';
    compatDiv.textContent = wording[lang]['compat'];
    compatRowDiv.appendChild(compatDiv);
    // Display processor statuses
    var statusDiv = document.createElement('div');
    statusDiv.className = 'processor-status';
    var compatRowFrag = document.createDocumentFragment();
    for (var _i = 0, triplets_1 = triplets; _i < triplets_1.length; _i++) {
        var t = triplets_1[_i];
        var procStatusDiv = statusDiv.cloneNode(true);
        var status = pkg[t];
        var simplifiedStatus = status === 'pass' || status === 'fail' ? status : 'unknown';
        procStatusDiv.classList.add(simplifiedStatus);
        // hide card if it doesn't pass the compatibility filter
        if (packageDiv &&
            simplifiedStatus === 'fail' &&
            compatFilter.indexOf(t) !== -1) {
            packageDiv.classList.add('hide');
        }
        var statusIcon = void 0;
        switch (simplifiedStatus) {
            case "pass":
                statusIcon = "✓";
                break;
            case "fail":
                statusIcon = "!";
                break;
            default:
                statusIcon = "?";
        }
        procStatusDiv.textContent = statusIcon + ' ' + t;
        compatRowFrag.appendChild(procStatusDiv);
    }
    compatRowDiv.appendChild(compatRowFrag);
    return compatRowDiv;
};
function expandText(moreDescSpan, extraDescSpan) {
    extraDescSpan.classList.remove('hide');
    moreDescSpan.className = 'hide';
}
// elements for a package card
var mainPackageFrag = document.createDocumentFragment();
var parentPackageDiv = document.createElement('div');
parentPackageDiv.className = 'card package-card';
parentPackageDiv.setAttribute('data-toggle', 'modal');
parentPackageDiv.setAttribute('data-target', '#pkg-modal');
var parentCardHeaderDiv = document.createElement('div');
parentCardHeaderDiv.className = 'package-card-header';
var parentNameDiv = document.createElement('div');
parentNameDiv.className = 'package-name';
var parentDescriptionDiv = document.createElement('div');
parentDescriptionDiv.className = 'package-text';
var parentShortDescSpan = document.createElement('span');
parentShortDescSpan.className = 'package-description-short';
var parentMoreDescSpan = document.createElement('span');
parentMoreDescSpan.className = 'package-description-more';
var parentExtraDescSpan = document.createElement('span');
parentExtraDescSpan.className = 'hide';
var parentCardFooterDiv = document.createElement('div');
parentCardFooterDiv.className = 'package-card-footer';
var parentWebsiteLink = document.createElement('a');
parentWebsiteLink.className = 'package-website align-bottom';
parentWebsiteLink.textContent = wording[lang]['website'];
parentWebsiteLink.target = '_blank';
var parentFullBtnSpan = document.createElement('span');
parentFullBtnSpan.className = 'github-btn';
var parentGitHub = document.createElement('a');
parentGitHub.className = 'gh-btn';
parentGitHub.target = '_blank';
var parentBtnIcoSpan = document.createElement('span');
parentBtnIcoSpan.className = 'gh-ico';
var parentBtnTxtSpan = document.createElement('span');
parentBtnTxtSpan.className = 'gh-text';
parentBtnTxtSpan.textContent = wording[lang]['star'];
var parentGitHubCount = document.createElement('a');
parentGitHubCount.className = 'gh-count';
parentGitHubCount.target = '_blank';
parentGitHubCount.style.display = 'block';
var parentVersionDiv = document.createElement('div');
parentVersionDiv.className = 'package-version';
function renderPackageDetails(package, packageDiv, isCard) {
    if (isCard === void 0) { isCard = true; }
    var detailFrag = document.createDocumentFragment();
    if (isCard) {
        var cardHeaderDiv = parentCardHeaderDiv.cloneNode(true);
        // Package Name
        var nameDiv = parentNameDiv.cloneNode(true);
        nameDiv.textContent = package.Name;
        cardHeaderDiv.appendChild(nameDiv);
        // Package Version
        var versionDiv = parentVersionDiv.cloneNode(true);
        versionDiv.textContent = wording[lang]['version'] + package.Version;
        cardHeaderDiv.appendChild(versionDiv);
        detailFrag.appendChild(cardHeaderDiv);
    }
    // Package Description (HTML version)
    var fullDesc = package.Description;
    if (fullDesc) {
        var descriptionDiv = isCard
            ? renderCardDescription(fullDesc)
            : renderModalDescription(fullDesc);
        detailFrag.appendChild(descriptionDiv);
    }
    // Package Processor Compatibilities
    detailFrag.appendChild(renderCompability(package, packageDiv));
    // Package Version for modal
    if (!isCard) {
        var versionDiv = parentDescriptionDiv.cloneNode(true);
        versionDiv.textContent = wording[lang]['version'] + package.Version;
        detailFrag.appendChild(versionDiv);
    }
    // Website link (with clause)
    var homepageURL = package.Homepage;
    if (homepageURL) {
        var cardFooterDiv = parentCardFooterDiv.cloneNode(true);
        var websiteLink = parentWebsiteLink.cloneNode(true);
        websiteLink.href = homepageURL;
        cardFooterDiv.appendChild(websiteLink);
        if (package.Stars) {
            var fullBtnSpan = parentFullBtnSpan.cloneNode(true);
            var btnSpan = parentGitHub.cloneNode(true);
            btnSpan.href = homepageURL;
            var btnIcoSpan = parentBtnIcoSpan.cloneNode(true);
            var btnTxtSpan = parentBtnTxtSpan.cloneNode(true);
            btnSpan.appendChild(btnIcoSpan);
            btnSpan.appendChild(btnTxtSpan);
            fullBtnSpan.appendChild(btnSpan);
            var ghCount = parentGitHubCount.cloneNode(true);
            ghCount.textContent = package.Stars;
            ghCount.setAttribute('aria-label', package.Stars);
            ghCount.href = homepageURL;
            fullBtnSpan.appendChild(ghCount);
            cardFooterDiv.appendChild(fullBtnSpan);
        }
        detailFrag.appendChild(cardFooterDiv);
    }
    return detailFrag;
}
function renderCard(package, mainDiv, oldCancellationToken) {
    if (oldCancellationToken !== null &&
        oldCancellationToken !== cancellationToken)
        return; //don't render old packages
    // Div for each package
    var packageDiv = parentPackageDiv.cloneNode(true);
    packageDiv.addEventListener('click', updateModal.bind(this, package));
    packageDiv.setAttribute('data-details', package);
    var cardFrag = document.createDocumentFragment();
    //package details (e.g description, compatibility, website)
    cardFrag.appendChild(renderPackageDetails(package, packageDiv));
    // Add the package card to the page
    packageDiv.appendChild(cardFrag);
    // Parent div to hold all the package cards
    mainDiv.appendChild(packageDiv);
}
var renderPackages = function () {
    cancellationToken = new Object();
    clearPackages();
    // Parent div to hold all the package cards
    var mainDiv = document.getElementsByClassName('package-results')[0];
    if (currentPackages.length > 0) {
        for (var _i = 0, currentPackages_1 = currentPackages; _i < currentPackages_1.length; _i++) {
            var package = currentPackages_1[_i];
            setTimeout(renderCard.bind(this, package, mainDiv, cancellationToken), 0);
        }
    }
    else {
        var noResultDiv = document.createElement('div');
        noResultDiv.className = 'card package-card';
        noResultDiv.innerHTML =
            wording[lang]['no-results'] + '<b>' + query + '</b>';
        mainDiv.appendChild(noResultDiv);
    }
    loadTotalPackages();
};
function clearPackages() {
    var mainDiv = document.getElementsByClassName('package-results')[0];
    while (mainDiv.firstChild) {
        mainDiv.removeChild(mainDiv.firstChild);
    }
    var totalPackages = document.getElementsByClassName('total-packages')[0];
    totalPackages.textContent = '';
}
function searchPackages(query) {
    var options = {
        findAllMatches: true,
        ignoreLocation: true,
        threshold: 0.1,
        maxPatternLength: 50,
        minMatchCharLength: 1,
        keys: ['Name', 'Description', 'Files'],
    };
    var fuse = new Fuse(allPackages, options);
    var searchResult = fuse.search(query);
    var newPackagesList = [];
    for (var _i = 0, searchResult_1 = searchResult; _i < searchResult_1.length; _i++) {
        var rslt = searchResult_1[_i];
        newPackagesList.push(rslt.item);
    }
    currentPackages = newPackagesList;
}
function searchAndRenderPackages() {
    query = (document.getElementById('pkg-search')).value.trim();
    if (query === '') {
        currentPackages = allPackages;
    }
    else {
        searchPackages(query);
    }
    if (document.getElementById('sortBtn').value !==
        'Best Match') {
        sortPackages();
    }
    renderPackages();
}
var sortAlphabetical = function (a, b) {
    var pkgA = a.Name.toUpperCase();
    var pkgB = b.Name.toUpperCase();
    return pkgA >= pkgB ? 1 : -1;
};
var sortStars = function (a, b) {
    return (b.Stars || 0) - (a.Stars || 0);
};
function sortPackages() {
    var val = document.getElementById('sortBtn').value;
    switch (val) {
        case 'Best Match':
            searchAndRenderPackages();
            break;
        case 'Alphabetical':
            currentPackages.sort(sortAlphabetical);
            renderPackages();
            break;
        case 'GitHub Stars':
            currentPackages.sort(sortStars);
            renderPackages();
            break;
    }
}
function filterCompat() {
    compatFilter = Array.from(document.querySelectorAll(".compat-card input[type='checkbox']:checked")).map(function (e) { return e.value; });
    renderPackages();
}
function updateModal(pkg) {
    selectedPackage = pkg;
    // Package name
    document.getElementById('pkg-modal-title').textContent =
        selectedPackage.Name;
    // Package details
    var modalDetails = document.getElementById('pkg-modal-details');
    var newDetails = document.createElement('div');
    newDetails.appendChild(renderPackageDetails(selectedPackage, null, false));
    newDetails.id = 'pkg-modal-details';
    modalDetails.replaceWith(newDetails);
    //Package installation code
    var os = detectOS();
    clickInstallTab(os); //default to platform that user is on
    var fileDiv = document.createElement('div');
    fileDiv.id = 'pkg-modal-files';
    // Package files
    var fileList = selectedPackage.Files;
    if (fileList !== undefined) {
        var fileTitle = document.createElement('p');
        fileTitle.textContent = 'Files';
        fileTitle.className = 'pkg-modal-file-title';
        fileDiv.appendChild(fileTitle);
        for (var _i = 0, fileList_1 = fileList; _i < fileList_1.length; _i++) {
            var file = fileList_1[_i];
            var listItem = document.createElement('li');
            listItem.textContent = file;
            fileDiv.appendChild(listItem);
        }
    }
    document.getElementById('pkg-modal-files').replaceWith(fileDiv);
}
function clickInstallTab(platform) {
    var installCode = document.getElementById('install-code');
    installCode.setAttribute('readonly', 'false');
    var windowsTab = document.getElementById('install-tab-windows');
    var unixTab = document.getElementById('install-tab-unix');
    switch (platform) {
        case 'windows':
            installCode.textContent =
                '.\\vcpkg\\vcpkg install ' + selectedPackage.Name;
            windowsTab.classList.add('selected');
            unixTab.classList.remove('selected');
            break;
        case 'unix':
            installCode.textContent =
                './vcpkg/vcpkg install ' + selectedPackage.Name;
            windowsTab.classList.remove('selected');
            unixTab.classList.add('selected');
            break;
        default:
            console.log('Error: unexpected platform', platform);
    }
    installCode.setAttribute('readonly', 'true');
}
function loadTotalPackages() {
    var totalPackages = document.getElementsByClassName('total-packages')[0];
    var hiddenPackages = new Set();
    for (var i = 0; i < currentPackages.length; i++) {
        for (var _i = 0, triplets_2 = triplets; _i < triplets_2.length; _i++) {
            var t = triplets_2[_i];
            var status_1 = currentPackages[i][t];
            var simplifiedStatus = status_1 === 'pass' || status_1 === 'fail' ? status_1 : 'unknown';
            if (simplifiedStatus === 'fail' && compatFilter.indexOf(t) !== -1) {
                hiddenPackages.add(currentPackages[i]);
            }
        }
    }
    totalPackages.textContent =
        wording[lang]['total-pkgs'] +
            (currentPackages.length - hiddenPackages.size);
}
