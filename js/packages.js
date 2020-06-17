let allPackages, currentPackages, cancellationToken;
const triples = ["arm-uwp","arm64-windows","x64-linux","x64-osx","x64-uwp","x64-windows","x64-windows-static","x86-windows"];
let compatFilter = [];

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

// initialize query to result from index.html or blank
let query = getUrlParameter('query') || "";

$.getJSON('./output.json',  function(responseObject){
    allPackages = responseObject.source;
    currentPackages = allPackages;
    document.getElementById("pkg-search").value = query;
    searchAndRenderPackages();
});


var renderCompability = function (pkg, packageDiv){
    var compatRowDiv = document.createElement('div')
    compatRowDiv.className = "package-compatibility"

    // Compatibility text
    var compatDiv = document.createElement('span')
    compatDiv.className = "package-compatibility-text"
    compatDiv.textContent = "Compatibility: "
    compatRowDiv.appendChild(compatDiv)

    // Display processor statuses
    let statusDiv = document.createElement('div');
    statusDiv.className = "processor-status";
    
    var iconDiv = document.createElement('img');
    iconDiv.className = "processor-status-icon";

    let compatRowFrag = document.createDocumentFragment();
    for (var t of triples){
        var procStatusDiv =statusDiv.cloneNode(true);
        var status = pkg[t];
        var simplifiedStatus = (status === "pass" || status === "fail") ? status : "unknown";
        procStatusDiv.classList.add(simplifiedStatus);

        // hide card if it doesn't pass the compatibility filter
        if (simplifiedStatus === "fail" && compatFilter.includes(t)){
             packageDiv.classList.add("hide")
        }
        procStatusFrag = document.createDocumentFragment();
        procStatusIconDiv = iconDiv.cloneNode(true);
        procStatusIconDiv.setAttribute("alt", simplifiedStatus)
        procStatusIconDiv.setAttribute("src", "assets/" + simplifiedStatus + ".png")
        procStatusFrag.appendChild(procStatusIconDiv)

        var procStatusName = document.createElement('span');
        procStatusName.textContent = t;
        procStatusFrag.appendChild(procStatusName);

        procStatusDiv.appendChild(procStatusFrag);
        compatRowFrag.appendChild(procStatusDiv);
    }
    compatRowDiv.appendChild(compatRowFrag);
    return compatRowDiv;
}

var renderPackages = function() {
    cancellationToken = new Object();
    clearPackages();
    // Parent div to hold all the package cards
    var mainDiv = document.getElementsByClassName("package-results")[0];
    
    if (currentPackages.length > 0) {
        let mainPackageFrag = document.createDocumentFragment();

        var parentPackageDiv = document.createElement('div')
        parentPackageDiv.className = "card package-card"

        var parentNameDiv = document.createElement('div')
        parentNameDiv.className = "package-name"

        var parentdescriptionDiv = document.createElement('div')
        parentdescriptionDiv.className = "package-description"

        var parentCardFooterDiv = document.createElement('div')
        parentCardFooterDiv.className = "package-card-footer"

        var parentWebsiteLink = document.createElement('a')
        parentWebsiteLink.className = "package-website"
        parentWebsiteLink.textContent = "Website"
        parentWebsiteLink.target = "_blank"

        var parentVersionDiv = document.createElement('div')
        parentVersionDiv.className = "package-version"

        function renderCard (package, oldCancellationToken){
            if (oldCancellationToken !== cancellationToken) return;
            // Div for each package
            var packageDiv = parentPackageDiv.cloneNode(true);
            let cardFrag = document.createDocumentFragment();

            // Package Name
            var nameDiv = parentNameDiv.cloneNode(true);
            nameDiv.textContent = package.Name
            cardFrag.appendChild(nameDiv)
            
            // Package Description (HTML version)
            var descriptionDiv = parentdescriptionDiv.cloneNode(true);
            descriptionDiv.textContent = package.Description
            cardFrag.appendChild(descriptionDiv)

            // Package Processor Compatibilities
            cardFrag.appendChild(renderCompability(package, packageDiv))

            var cardFooterDiv = parentCardFooterDiv.cloneNode(true);

            // Website link (with clause)
            var homepageURL = package.Homepage;
            if (homepageURL) {
                var websiteLink = parentWebsiteLink.cloneNode(true)
                websiteLink.href = homepageURL
                cardFooterDiv.appendChild(websiteLink)
            }

            // Package Version
            var versionDiv = parentVersionDiv.cloneNode(true)
            versionDiv.textContent = "Version: "+ package.Version
            cardFooterDiv.appendChild(versionDiv)

            cardFrag.appendChild(cardFooterDiv)

            // Add the package card to the page
            packageDiv.appendChild(cardFrag)
            mainDiv.appendChild(packageDiv)
        }

        for (var package of currentPackages) {
            setTimeout(renderCard.bind(this, package, cancellationToken),0);
        }

    } else {
        var noResultDiv = document.createElement('div')
        noResultDiv.className = 'card package-card'
        noResultDiv.innerHTML = "No results for " + '<b>' + query + '</b>'
        mainDiv.appendChild(noResultDiv)
    }
}

function clearPackages() {
    var mainDiv = document.getElementsByClassName("package-results")[0]
    while (mainDiv.firstChild) {
        mainDiv.removeChild(mainDiv.firstChild)
    }
}

function searchPackages(query){
    var options = {
        findAllMatches: true,
        threshold: 0.1,
        location: 0,
        distance: 100,
        maxPatternLength: 50,
        minMatchCharLength: 1,
        keys: [
          "Name",
          "Description"
        ]
      }
      var fuse = new Fuse(allPackages, options);
      var searchResult = fuse.search(query);
      var newPackagesList = [];
      for (var rslt of searchResult) {
          newPackagesList.push(rslt.item)
      }
      currentPackages = newPackagesList;
}

function searchAndRenderPackages() {
    query = document.getElementById("pkg-search").value.trim();
    if (query === '') {
        currentPackages = allPackages;
    } 
    else {
        searchPackages(query);
    }
    renderPackages();
}

const sortAlphabetical = function(a, b) {
    var pkgA = a.Name.toUpperCase();
    var pkgB = b.Name.toUpperCase();
    return pkgA >= pkgB ? 1 : -1
}

function sortPackages(){
    let val = document.getElementById("sortBtn").value
    switch(val){
        case "Best Match":
            searchAndRenderPackages();
            break;
        case "Alphabetical":
            currentPackages.sort(sortAlphabetical);
            renderPackages();
            break;
    }
}

function filterCompat(){
    compatFilter = [...document.querySelectorAll(".compat-card input[type='checkbox']:checked")].map(e=> e.value);
    renderPackages();
}