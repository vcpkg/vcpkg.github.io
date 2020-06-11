let allPackages, currentPackages;

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
    searchPackages();
});


var renderCompability = function (pkg){
    const processors = ["arm-uwp","arm64-windows","x64-linux","x64-osx","x64-uwp","x64-windows","x64-windows-static","x86-windows"];
    var compatRowDiv = document.createElement('div')
    compatRowDiv.className = "package-compatibility"

    // Compatibility text
    var compatDiv = document.createElement('span')
    compatDiv.className = "package-compatibility-text"
    compatDiv.innerHTML = "Compatibility: "
    compatRowDiv.appendChild(compatDiv)

    // Display processor statuses
    for (var proc of processors){
        var procStatusDiv = document.createElement('div');
        procStatusDiv.className = "processor-status";
        var status = pkg[proc];
        var simplifiedStatus = (status === "pass" || status === "fail") ? status : "unknown";
        procStatusDiv.classList.add(simplifiedStatus);

        var procStatusIconDiv = document.createElement('img');
        procStatusIconDiv.className = "processor-status-icon";
        procStatusIconDiv.setAttribute("alt", simplifiedStatus)
        procStatusIconDiv.setAttribute("src", "assets/" + simplifiedStatus + ".png")
        procStatusDiv.appendChild(procStatusIconDiv);

        var procStatusName = document.createElement('span');
        procStatusName.innerHTML = proc;
        procStatusDiv.appendChild(procStatusName);
        
        compatRowDiv.appendChild(procStatusDiv);
    }
    return compatRowDiv;
}
var renderPackages = function(packagesList) {
    clearPackages();
    // Parent div to hold all the package cards
    var mainDiv = document.getElementsByClassName("package-results")[0];
    if (packagesList.length > 0) {
        for (var package of packagesList) {
            // Div for each package
            var packageDiv = document.createElement('div')
            packageDiv.className = "package-card"

            // Package Name
            var nameDiv = document.createElement('div')
            nameDiv.className = "package-name"
            nameDiv.innerHTML = package.Name
            packageDiv.appendChild(nameDiv)
            
            // Package Description (HTML version)
            var descriptionDiv = document.createElement('div')
            descriptionDiv.className = "package-description"
            descriptionDiv.innerHTML = package.Description
            packageDiv.appendChild(descriptionDiv)

            // Package Processor Compatibilities
            packageDiv.appendChild(renderCompability(package))

            cardFooterDiv = document.createElement('div')
            cardFooterDiv.className = "package-card-footer"

            // Website link (with clause)
            var homepageURL = package.Homepage;
            if (homepageURL) {
                var websiteLink = document.createElement('a')
                websiteLink.className = "package-website"
                websiteLink.href = homepageURL
                websiteLink.innerHTML = "Website"
                websiteLink.target = "_blank"
                cardFooterDiv.appendChild(websiteLink)
            }

            // Package Version
            var versionDiv = document.createElement('div')
            versionDiv.className = "package-version"
            versionDiv.innerHTML = "Version: "+ package.Version
            cardFooterDiv.appendChild(versionDiv)

            packageDiv.appendChild(cardFooterDiv)

            // Add the package card to the page
            mainDiv.appendChild(packageDiv)
        }
    } else {
        var noResultDiv = document.createElement('div')
        noResultDiv.className = 'package-card'

        var noResultPara = document.createElement('p')
        noResultPara.innerHTML = "No results for " + '<b>' + query + '</b>'
        noResultDiv.appendChild(noResultPara)

        mainDiv.appendChild(noResultDiv)
    }
}

function clearPackages() {
    var mainDiv = document.getElementsByClassName("package-results")[0]
    while (mainDiv.firstChild) {
        mainDiv.removeChild(mainDiv.firstChild)
    }
}

function searchPackages() {
    query = document.getElementsByClassName("search-box")[0].value.trim();
    if (query === '') {
        renderPackages(allPackages);
    } 
    else {
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
        sortPackages();
    }
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
            renderPackages(currentPackages);
            break;
        case "Alphabetical":
            let sortedPackages = currentPackages.slice(); // make a deep copy of the array
            sortedPackages.sort(sortAlphabetical);
            renderPackages(sortedPackages);
            break;
    }
}