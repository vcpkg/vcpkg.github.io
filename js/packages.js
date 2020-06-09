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


            // // Metrics button
            // var metricsButton = document.createElement('button')
            // metricsButton.setAttribute("onclick", "window.open('https://opensource.twitter.com/metrics/" + package.nameWithOwner + "/WEEKLY')")
            // metricsButton.type = "button"
            // metricsButton.className = "Button Button--tertiary"
            // metricsButton.innerHTML = "Metrics"
            // packageDiv.appendChild(metricsButton)

            /* Finally Add the package card to the page */
            mainDiv.appendChild(packageDiv)
        }
    } else {
        var noResultDiv = document.createElement('div')
        noResultDiv.className = 'no-results'

        var noResultPara = document.createElement('p')
        noResultPara.innerHTML = "No results for " + '<b>' + searchString + '</b>'
        noResultDiv.appendChild(noResultPara)

        var noResultContainer = document.getElementsByClassName("no-results-container")[0]
        noResultContainer.appendChild(noResultDiv)
    }
}