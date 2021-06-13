//get the prefix for language
var lang = 'en'; //Since there is only one language, set all visitors to english
// let lang = navigator.language.substring(0, 2); // TODO: use this later to gets the user's actual current language
function copyCodePanel(id) {
    var temp = document.getElementById(id);
    temp.select();
    document.execCommand('copy');
    clearSelection();
}
// remove the highlight from selected text
function clearSelection() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    }
}
// determine what OS the user is on, used to render corresponding package installation code
// default to Unix unless the user is on a Windows device
function detectOS() {
    if (/Win/.test(navigator.platform)) {
        return 'windows';
    }
    if (/Mac/.test(navigator.platform)) {
        return 'mac';
    }
    return 'linux';
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    var sParameterName;
    var i;
    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if(sParameterName[0].indexOf("<") != -1
        || sParameterName[0].indexOf(">") != -1
        || sParameterName[0].indexOf("(") != -1
        || sParameterName[0].indexOf(")") != -1
        || sParameterName[0].indexOf("'") != -1
        || sParameterName[0].indexOf(";") != -1)
        {
            return "";
        }
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? "" : decodeURIComponent(sParameterName[1]);
        }
    }
    return "";
};

function addMouseOverNavigation() {
    $(".docs-nav").css("display", "block");
}

function addMouseLeave() {
    $(".docs-nav").css("display", "none");
}

function docsNavButton() {
    if(document.getElementsByClassName("docs-nav")[0].style.display == "none") {
        addMouseOverNavigation();
    } else {
        addMouseLeave();
    }
}

function toggleNavIcon() {
    document.getElementsByClassName("navbar-close")[0].classList.toggle("hidden");
    document.getElementsByClassName("navbar-toggler-icon")[0].classList.toggle("hidden");
    document.getElementsByClassName("navbar-close")[0].parentElement.classList.toggle("hidden");
    document.getElementsByClassName("navbar-toggler-icon")[0].parentElement.classList.toggle("hidden");
    document.getElementsByClassName("mobile-nav")[0].classList.toggle("hidden");
    document.getElementById("vcpkg-nav-logo").classList.toggle("vcpkg-nav-color");
}

function toggleDocsOutlineMobile() {
    document.getElementsByClassName("left-side")[0].classList.toggle("show");
    document.getElementsByClassName("docs-mobile-heading")[0].classList.toggle("hidden");
    document.getElementsByClassName("docs-mobile-exit")[0].classList.toggle("hidden");
}

function setScrollFocus (){
    document.getElementById("currentPath").scrollIntoView();
    document.getElementsByClassName("navbar")[0].scrollIntoView();
}

$(document).ready(function(){
    //Analytics
    var siteConsent = null;
    WcpConsent.init("en-US", "banner", function (err, _siteConsent) {
        if (err != undefined) {
            throw "error";
        } else {
            siteConsent = _siteConsent;
        }
    });
    const analytics = new oneDS.ApplicationInsights();
    var config = {
    instrumentationKey: "60f2563fd77547d6bb8e99a31494ecad-f2c1f61d-fc5e-482f-a560-647ca0865b27-7409",
    propertyConfiguration: {
        callback: {
            userConsentDetails: siteConsent ? siteConsent.getConsent : null
        },
    },
    webAnalyticsConfiguration:{
        autoCapture: {
            scroll: true,
            pageView: true,
            onLoad: true,
            onUnload: true,
            click: true,
            scroll: true,
            resize: true,
            jsError: true
        }
    }
    };
    analytics.initialize(config, []);
})