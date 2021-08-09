
function handleDocumentationSearch(searchQuery) {
    $.getJSON('/en/docs/vcpkg-docs.json', function (responseObject) {
        var options = {
            findAllMatches: true,
            ignoreLocation: true,
            threshold: 0.1,
            maxPatternLength: 50,
            minMatchCharLength: 1,
            keys: ['Path', 'Source', 'Name'],
        };
        var fuse = new Fuse(responseObject, options);
        var searchResult = fuse.search(searchQuery);

        handleClearSearch()
        var searchElement = document.getElementsByClassName("search")[0];

        if(searchResult.length == 0) {
            var searchHeading = document.createElement('div');
            searchHeading.className = 'search-heading'
            searchHeading.textContent = "No results found."
            var searchList = document.createElement('li');
            searchList.className = 'search-item-no-results'
            searchList.appendChild(searchHeading)
            searchElement.appendChild(searchList);
        } else {
            for(let i=0;i<searchResult.length;i++) {
                var link = document.createElement('a');
                link.className = 'search-item-docs';
                link.href = searchResult[i].item.Path

                var searchHeading = document.createElement('div');
                searchHeading.className = 'search-heading'
                searchHeading.textContent = searchResult[i].item.Name

                var searchNav = document.createElement('div');
                searchNav.className = 'search-nav'
                searchNav.textContent = searchResult[i].item.Nav.split("#").join(" > ")

                link.appendChild(searchHeading)
                link.appendChild(searchNav)

                var searchList = document.createElement('li');
                searchList.className = 'search-item'
                searchList.appendChild(link)
                searchElement.appendChild(searchList);
            }
        }
    });
}

function handleClearSearch() {
    var searchDiv = document.getElementsByClassName('search')[0];
    while (searchDiv.firstChild) {
        searchDiv.removeChild(searchDiv.firstChild);
    }
}

function handleExpandCollapse(currentElement) {
    currentElement.classList.toggle("collapse");
    currentElement.previousElementSibling.classList.toggle("list-can-expand");
    currentElement.previousElementSibling.classList.toggle("list-expanded");
}

function generateTreeViewHeaderOutline() {

    var tagSize= [$("h1").length, $("h2").length, $("h3").length,
    $("h4").length, $("h5").length, $("h6").length];

    var headerTags = $("*").filter(function() {return this.tagName.match("H[1-6]{1}")});

    if(headerTags.length > 0) {
        for(let i=0; i <headerTags.length; i++) {
            headerTags[i].classList.add("anchor-link");
        }
        var firstLayerTags = 0;

        var indexPos = parseInt(headerTags[0].tagName[1]);
        tagSize[indexPos-1]--;

        var keyIndex = 0;
        for(let i=0; i <tagSize.length; i++) {
            if(tagSize[i] > 0) {
                keyIndex = i + 1;
                break
            }
        }

        var anchorToPosition = {}
        var outlineList = document.createElement('ul');
        outlineList.classList = "anchor-padding"
        var pastSecondLayer = false
        var secondLayerList = document.createElement('ul');
        for(let i=1; i < headerTags.length; i++) {
            //skip first tag, as this should be the title page
            var tagNumber = parseInt(headerTags[i].tagName[1]);
            let id = headerTags[i].id
            let dist = $("#" + id).offset().top
            anchorToPosition[id] = dist;
            let secondLayer = true;
            if(tagNumber <= keyIndex) {
                secondLayer = false;
            }

            var listItem = document.createElement('li');
            listItem.classList.add('docs-section', 'list-no-icon');
            var listLink = document.createElement('a');
            listLink.href = "#" + id
            listLink.textContent = $("#" + id).text()
            listLink.classList.add('treeview-link');
            listItem.appendChild(listLink);

            if(secondLayer && pastSecondLayer) {
                secondLayerList.appendChild(listItem);
            } else if(secondLayer) {
                pastSecondLayer = true;
                secondLayerList = document.createElement('ul');
                secondLayerList.classList = "standard-padding"
                secondLayerList.appendChild(listItem);
                outlineList.appendChild(secondLayerList);
            } else {
                pastSecondLayer = false;
                outlineList.appendChild(listItem);
            }
        }
        var el = document.getElementById("currentPath").parentElement;
        el.classList.remove("list-can-expand")
        el.classList.add("list-expanded")
        el.insertAdjacentElement('afterend', outlineList)
        el.addEventListener("click", function(e) {
            handleExpandCollapse(this.nextElementSibling);
        });
    }

    document.addEventListener("scroll", function(event) {
        var textElements = $("*").filter(function() {return this.tagName.match("H[1-6]{1}")});
        var sideBarElements = $(".docs-section");
        var selectedElement = -1;

        //margin of previous element
        var marginDiff = 100;

        for(let i = 0; i < textElements.length - 1; i++) {
            var elem = textElements[i];
            var nextElem = textElements[i+1]

            var yMin = elem.getBoundingClientRect().y + marginDiff;
            var yMax = nextElem.getBoundingClientRect().y + marginDiff;

            if(yMin > 0 && yMax > 0 && i == 0) {
                selectedElement = 0;
            }

            if(yMin < 0 && yMax < 0 && i == textElements.length - 2) {
                selectedElement = i + 1;
            }

            if(yMin <= 0 && yMax >= 0) {
                selectedElement = i;
            }
        }

        $(".section-selected").removeClass("section-selected");
        if(selectedElement < 0) {
            selectedElement = 0;
        }
        if(selectedElement < sideBarElements.length) {
            sideBarElements[selectedElement].classList.add("section-selected");
            sideBarElements[selectedElement].childNodes[0].classList.add("section-selected");
        }
    })
}

function adjustHeaderOutline() {
    var currentPos = window.scrollY;
        var footerPos = $("#loadFooter").offset().top
        var rightPos = document.getElementsByClassName("right-side")[0].getBoundingClientRect().top;
        var height = $(".left-side").height()
        if(window.innerWidth < 992) {
            $(".left-side").css("position", "")
            $(".left-side").css("top", "")
            $(".left-side").css("height", "")
            return;
        }
        if(currentPos + height + 50 > footerPos) {
            $(".left-side").css("position", "absolute")
            $(".left-side").css("height", height)
            $(".left-side").css("top", Math.max(0, footerPos - height - 50));
        }

        if(currentPos + height + 50  <= footerPos) {
            if(rightPos > 0 ) {
                $(".left-side").css("position", "fixed")
                $(".left-side").css("top", Math.max(rightPos, 100))
                $(".left-side").css("height", "auto")
            } else {
                $(".left-side").css("position", "fixed")
                $(".left-side").css("top", "100")
                $(".left-side").css("height", "auto")
            }
        }
}

function initDocumentation() {
    var curpath = $('#docsNavPane a.doc-outline-link[href="'+window.location.pathname+'"]');
    var li = document.createElement('li');
    li.classList.add('list-can-expand');
    var span = document.createElement('span');
    span.id = "currentPath";
    li.appendChild(span);
    span.innerText = curpath[0].children[0].innerText;
    var ul = curpath[0].parentElement;
    ul.replaceChild(li, curpath[0]);

    generateTreeViewHeaderOutline()
    adjustHeaderOutline();
    document.addEventListener("scroll", function(event) {
        adjustHeaderOutline();
    });

    var docsListElement = document.getElementsByClassName("docs-navigation")[0];

    var collapsibleList = docsListElement.getElementsByClassName("collapse");

    for(var i=0;i<collapsibleList.length;i++) {
        var currElement = collapsibleList[i];
        var previousElement = collapsibleList[i].previousElementSibling;
        previousElement.addEventListener("scroll", function(event) {
            if(event)
                return;
        })
        previousElement.addEventListener("click", handleExpandCollapse.bind(this, currElement));
    }

    // Expand parents of currentPath
    var curpath_parent = ul;
    while (!curpath_parent.classList.contains('docs-navigation')) {
        handleExpandCollapse(curpath_parent);
        curpath_parent = curpath_parent.parentElement;
    }

    document.getElementsByClassName("search-bar")[0].addEventListener("focusout", function(e) {
        if(e.relatedTarget) {
            if(e.relatedTarget.parentElement){
                if(e.relatedTarget.parentElement.className === "search-item") {
                    return;
                }
            }
        }
        document.getElementsByClassName("search")[0].classList.add("hidden");
    });

    $(window).on("resize", function() {
        $(".search").css("width", $(".search-box").css("width"));
    });

    document.getElementsByClassName("search-box")[0].addEventListener("focusin", function(e) {
        // Handle search result width bug
        $(".search").css("width", $(".search-box").css("width"));

        document.getElementsByClassName("search")[0].classList.remove("hidden");
        handleDocumentationSearch(this.value);
    });

    document.getElementsByClassName("search-box")[0].addEventListener("input", function(event) {
        handleDocumentationSearch(this.value);
    })

    document.getElementsByClassName("docs-mobile-exit")[0].addEventListener("click", function() {
        toggleDocsOutlineMobile();
    })

    document.getElementsByClassName("docs-mobile-show")[0].addEventListener("click", function() {
        toggleDocsOutlineMobile();
    })

    hljs.configure({
        languages: ["cmake", "json", "powershell"]
    })
    hljs.highlightAll();
    
    span.scrollIntoView();
}
