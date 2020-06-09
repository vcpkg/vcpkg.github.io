let allPackages;

$.getJSON('./output.json',  function(responseObject){
    allPackages = responseObject.source;
    initializePackages(allPackages);
    console.log(allPackages)
});

var initializePackages = function(packagesList){
    renderPackages(packagesList);
    let allPackages = packagesList;
}

var renderPackages = function(packagesList, searchString="") {
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

            // Package Version
            var versionDiv = document.createElement('div')
            versionDiv.className = "package-version"
            versionDiv.innerHTML = "Version: "+ package.Version
            packageDiv.appendChild(versionDiv)

            // Package Description (HTML version)
            var descriptionDiv = document.createElement('div')
            descriptionDiv.className = "package-description"
            descriptionDiv.innerHTML = package.Description
            packageDiv.appendChild(descriptionDiv)

            // Website link (with clause)
            var homepageURL = package.Homepage;
            if (homepageURL) {
                var websiteLink = document.createElement('a')
                websiteLink.href = homepageURL
                websiteLink.innerHTML = "Website"
                websiteLink.target = "_blank"
                packageDiv.appendChild(websiteLink)
            }

            // Add the package card to the page
            mainDiv.appendChild(packageDiv)
        }
    } else {
        var noResultDiv = document.createElement('div')
        noResultDiv.className = 'package-card'

        var noResultPara = document.createElement('p')
        noResultPara.innerHTML = "No results for " + '<b>' + searchString + '</b>'
        noResultDiv.appendChild(noResultPara)

        mainDiv.appendChild(noResultDiv)
    }
}

function searchPackages() {
    var query = document.getElementsByClassName("search-box")[0].value.trim();
    console.log(query)
    clearPackages();
    if (query === '') {
        renderPackages(allPackages);
    } 
    else {
        var options = {
          findAllMatches: true,
          threshold: 0.2,
          location: 0,
          distance: 50,
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
        renderPackages(newPackagesList, searchString=query)
    }
}

function clearPackages() {
    var mainDiv = document.getElementsByClassName("package-results")[0]
    while (mainDiv.firstChild) {
        mainDiv.removeChild(mainDiv.firstChild)
    }
}
