var maxPackageLength = 0;
var standardPkgLength = 10;
var wording = {
    en: {
        version: 'Version: ',
        more: ' More...',
        website: 'Website',
        star: 'Star',
        'total-pkgs': 'Total Packages: ',
        'no-results': 'No results for ',
    },
    zh: {
        version: 'zh-filler',
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
$(document).ready(function () {
    $(".load-results").on("click", function(e) {
        renderMorePackages();
        handleLoadPkgMessage();
        loadTotalPackages();
    });
    $(".load-results").on("keypress", function(event) {
        if (event.keyCode == 13) {
        renderMorePackages();
        handleLoadPkgMessage();
        loadTotalPackages();
        return true;
        }
    });
});

function handleLoadPkgMessage() {
    if(maxPackageLength < currentPackages.length) {
        $(".load-results").html("Load more packages")
    } else {
        $(".load-results").html("")
    }
}

var renderMorePackages = function () {
    var mainDiv = document.getElementsByClassName('package-results')[0];
    var currPkgLen = maxPackageLength;
    maxPackageLength = Math.min(maxPackageLength + standardPkgLength, currentPackages.length);

    if (currentPackages.length > 0) {
        for (var _i = currPkgLen, currentPackages_1 = currentPackages; _i < maxPackageLength; _i++) {
            var package = currentPackages_1[_i];
            setTimeout(renderCard.bind(this, package, mainDiv, cancellationToken), 0);
        }
    }
}

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
function expandText(moreDescSpan, extraDescSpan) {
    extraDescSpan.classList.remove('hide');
    moreDescSpan.className = 'hide';
}
// elements for a package card
var mainPackageFrag = document.createDocumentFragment();
var parentPackageDiv = document.createElement('div');
parentPackageDiv.className = 'card package-card';
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

var vcpkgPackagePage = document.createElement('div');
vcpkgPackagePage.className = 'vcpkg-page-link';
vcpkgPackagePage.textContent = "View Details";
vcpkgPackagePage.role = "button";
vcpkgPackagePage.tabIndex = "0";

function renderPackageDetails(package, packageDiv, isCard) {

    var vcpkgPage = vcpkgPackagePage.cloneNode(true);
    if (isCard === void 0) { isCard = true; }
    var detailFrag = document.createDocumentFragment();
    if (isCard) {
        var cardHeaderDiv = parentCardHeaderDiv.cloneNode(true);
        let viewpkgDetails = "View Details for ".concat(package.Name);
        vcpkgPage.setAttribute("name",viewpkgDetails);
        // Package Name
        var nameDiv = parentNameDiv.cloneNode(true);
        nameDiv.textContent = package.Name + " |";
        cardHeaderDiv.appendChild(nameDiv);
        // Package Version
        var versionDiv = parentVersionDiv.cloneNode(true);
        let versionStr = package.Version || package["Version-semver"] || package["Version-date"];
        versionDiv.textContent = wording[lang]['version'] + versionStr;
        cardHeaderDiv.appendChild(versionDiv);
        detailFrag.appendChild(cardHeaderDiv);
    }
    // Package Description (HTML version)
    var fullDesc = package.Description;
    if (fullDesc) {
        if (Array.isArray(fullDesc)) {
            fullDesc = fullDesc.join("\n");
        }
        var descriptionDiv = isCard
            ? renderCardDescription(fullDesc)
            : renderModalDescription(fullDesc);
        detailFrag.appendChild(descriptionDiv);
    }

    detailFrag.appendChild(vcpkgPage);

    vcpkgPage.addEventListener("click", function() {
        showHideViewDetails.call(this);
    })

    vcpkgPage.addEventListener("keypress", function(event) {
        if (event.keyCode == 13) {
            showHideViewDetails.call(this);
            return true;
        }
    })

    var inst = document.createElement('div');
    inst.className = 'instructions hidden';
    var windowsInst = document.createElement('span');
    windowsInst.className = 'instructions-windows bold-text';
    windowsInst.textContent = "Windows";
    var linuxInst = document.createElement('span');
    linuxInst.className = 'instructions-linux';
    linuxInst.textContent = "MacOS/Linux";
    var featureInst = document.createElement('span');
    featureInst.className = 'instructions-features';
    featureInst.textContent = "Feature List";
    inst.appendChild(windowsInst);
    inst.appendChild(linuxInst);
    inst.appendChild(featureInst);

    windowsInst.addEventListener("click", function() {
        windowsInst.parentNode.parentNode.getElementsByClassName("featureText")[0].classList.add("hidden")
        windowsInst.parentNode.parentNode.getElementsByClassName("linuxText")[0].classList.add("hidden")
        windowsInst.parentNode.parentNode.getElementsByClassName("windowsText")[0].classList.remove("hidden")
        this.classList.add("bold-text");
        windowsInst.parentNode.parentNode.getElementsByClassName("instructions-linux")[0].classList.remove("bold-text");
        windowsInst.parentNode.parentNode.getElementsByClassName("instructions-features")[0].classList.remove("bold-text");

    })

    linuxInst.addEventListener("click", function() {
        windowsInst.parentNode.parentNode.getElementsByClassName("featureText")[0].classList.add("hidden")
        windowsInst.parentNode.parentNode.getElementsByClassName("linuxText")[0].classList.remove("hidden")
        windowsInst.parentNode.parentNode.getElementsByClassName("windowsText")[0].classList.add("hidden")
        this.classList.add("bold-text");
        windowsInst.parentNode.parentNode.getElementsByClassName("instructions-windows")[0].classList.remove("bold-text");
        windowsInst.parentNode.parentNode.getElementsByClassName("instructions-features")[0].classList.remove("bold-text");
    })

    featureInst.addEventListener("click", function() {
        windowsInst.parentNode.parentNode.getElementsByClassName("featureText")[0].classList.remove("hidden")
        windowsInst.parentNode.parentNode.getElementsByClassName("linuxText")[0].classList.add("hidden")
        windowsInst.parentNode.parentNode.getElementsByClassName("windowsText")[0].classList.add("hidden")
        this.classList.add("bold-text");
        windowsInst.parentNode.parentNode.getElementsByClassName("instructions-linux")[0].classList.remove("bold-text");
        windowsInst.parentNode.parentNode.getElementsByClassName("instructions-windows")[0].classList.remove("bold-text");
    })

    var windowsText = document.createElement('div');
    windowsText.className = "windowsText hidden";
    windowsText.textContent = ".\\vcpkg install " + package.Name;

    var linuxText = document.createElement('div');
    linuxText.textContent = "vcpkg install " + package.Name;
    linuxText.className = "linuxText hidden";

    var featureText = document.createElement('div');
    featureText.className = "featureText hidden";

    for(let i in package.Features) {
        var div = document.createElement('div');
        div.className = "div-action-list";
        var group = document.createElement("ul");
        group.className = "feature-list";

        var name = document.createElement("li");
        var desc = document.createElement("li");
        var depends = document.createElement("li");

        name.append("Feature Name: ");
        desc.append("Description: ")

        if(Array.isArray(package.Features)) {
            name.textContent += package.Features[i]["name"] || package.Features[i]["Name"] || ""
        } else {
            name.textContent += i;
        }
        desc.textContent += package.Features[i]["description"] || package.Features[i]["Description"] || ""

        if(package.Features[i]["build-depends"] || package.Features[i]["Build-Depends"] || package.Features[i]["dependencies"]) {
            depends.append("Build-Depends: ")
            depends.textContent += package.Features[i]["build-depends"] || package.Features[i]["Build-Depends"] || package.Features[i]["dependencies"];
        }
        group.appendChild(name);
        group.appendChild(desc);
        group.appendChild(depends);
        div.appendChild(group)
        featureText.appendChild(div);
    }

    if(package.Features.length == 0) {
        featureText.append("No features for this library.")
    }

    detailFrag.appendChild(inst);
    detailFrag.appendChild(windowsText);
    detailFrag.appendChild(linuxText);
    detailFrag.appendChild(featureText);
    // Package Version for modal

    if (!isCard) {
        var versionDiv = parentDescriptionDiv.cloneNode(true);
        versionDiv.textContent = wording[lang]['version'] + package.Version;
        detailFrag.appendChild(versionDiv);
    }
    // Website link (with clause)
    var homepageURL = package.Homepage;
    if (homepageURL) {
        //var cardFooterDiv = parentCardFooterDiv.cloneNode(true);
        var websiteLink = parentWebsiteLink.cloneNode(true);
        websiteLink.href = homepageURL;
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
            cardHeaderDiv.appendChild(fullBtnSpan);
        }
        //detailFrag.appendChild(cardFooterDiv);
    }
    return detailFrag;
}
function renderCard(package, mainDiv, oldCancellationToken) {
    if (oldCancellationToken !== null && oldCancellationToken !== cancellationToken)
        return; //don't render old packages
    // Div for each package
    var packageDiv = parentPackageDiv.cloneNode(true);
    var cardFrag = document.createDocumentFragment();
    //package details (e.g description, website)
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
    maxPackageLength = Math.min(standardPkgLength, currentPackages.length);
    if (currentPackages.length > 0) {
        for (var _i = 0, currentPackages_1 = currentPackages; _i < maxPackageLength; _i++) {
            var package = currentPackages_1[_i];
            setTimeout(renderCard.bind(this, package, mainDiv, cancellationToken), 0);
        }
    }
    else {
        var noResultDiv = document.createElement('div');
        noResultDiv.className = 'card package-card';
        noResultDiv.innerHTML = wording[lang]['no-results'] + '<b>' + query + '</b>';
        mainDiv.appendChild(noResultDiv);
    }
    handleLoadPkgMessage();
    loadTotalPackages();
};

function showHideViewDetails(){
    if(this.parentNode.getElementsByClassName("instructions")[0].classList.contains("hidden")) {
        this.textContent = "Hide Details"
        let nameValue = this.getAttribute("name"); 
        let filteredText = nameValue.replace("View Details","Hide Details");
        this.setAttribute("name",filteredText)
        this.role = "button";
        this.parentNode.getElementsByClassName("featureText")[0].classList.add("hidden");
        this.parentNode.getElementsByClassName("linuxText")[0].classList.add("hidden");
        this.parentNode.getElementsByClassName("windowsText")[0].classList.remove("hidden");
        this.parentNode.getElementsByClassName("instructions")[0].classList.remove("hidden");
        this.parentNode.getElementsByClassName("instructions-windows")[0].classList.add("bold-text");
    } else {
        this.textContent = "View Details";
        let nameValue = this.getAttribute("name"); 
        let filteredText = nameValue.replace("Hide Details","View Details");
        this.setAttribute("name",filteredText)
        this.role = "button";
        this.parentNode.getElementsByClassName("featureText")[0].classList.add("hidden");
        this.parentNode.getElementsByClassName("linuxText")[0].classList.add("hidden");
        this.parentNode.getElementsByClassName("windowsText")[0].classList.add("hidden");
        this.parentNode.getElementsByClassName("instructions")[0].classList.add("hidden");
        this.parentNode.getElementsByClassName("instructions-linux")[0].classList.remove("bold-text");
        this.parentNode.getElementsByClassName("instructions-features")[0].classList.remove("bold-text");
        this.parentNode.getElementsByClassName("instructions-windows")[0].classList.remove("bold-text");
    }
}

function clearPackages() {
    var mainDiv = document.getElementsByClassName('package-results')[0];
    while (mainDiv.firstChild) {
        mainDiv.removeChild(mainDiv.firstChild);
    }
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
    currentPackages.sort(searchRank)
}

var timeoutID = undefined;
function handlePackageInput() {
    if(timeoutID) {
        clearTimeout(timeoutID)
    }
    timeoutID = setTimeout(searchAndRenderPackages, 500);
}

function searchAndRenderPackages() {
    query = document.getElementById('pkg-search').value.trim();
    if (query === '') {
        currentPackages = allPackages;
    }
    else {
        searchPackages(query);
    }
    if (document.getElementById('sortBtn').value !== 'Best Match') {
        sortPackages();
    }
    renderPackages();
    timeoutID = undefined;
}
var sortAlphabetical = function (a, b) {
    var pkgA = a.Name.toUpperCase();
    var pkgB = b.Name.toUpperCase();
    return pkgA >= pkgB ? 1 : -1;
};
var sortStars = function (a, b) {
    return (b.Stars || 0) - (a.Stars || 0);
};

function searchRank(a, b) {
    let query = document.getElementById('pkg-search').value.trim();
    let packages = [a, b];
    let scores = [0, 0];

    for(let i = 0; i < 2; i++) {
        let score = 0;
        let pkg = packages[i];

        // Exact match
        if(pkg.Name === query) {
            score += 1000;
        }

        // Prefix match
        if(pkg.Name.indexOf(query) == 0) {
            score += 500;
        }

        // Substring
        if(pkg.Name.indexOf(query) != -1) {
            score += 100;
        }

        //Description
        if(pkg.Description && pkg.Description.indexOf(query) != -1) {
            score += 50;
        }
        scores[i] = score;
    }
    return scores[1] - scores[0];
}

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

function loadTotalPackages() {
    var totalPackages = document.getElementsByClassName('total-packages')[0];
    var hiddenPackages = new Set();
    let packagesFound = currentPackages.length - hiddenPackages.size;
    totalPackages.textContent = 'Showing 1-' + maxPackageLength + ' of ' + packagesFound + ' packages';
}
