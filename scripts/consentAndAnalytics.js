// WCP initialization
var siteConsent = null;
var url = window.location.href;
const analytics = new oneDS.ApplicationInsights();
var config = {
    instrumentationKey: "60f2563fd77547d6bb8e99a31494ecad-f2c1f61d-fc5e-482f-a560-647ca0865b27-7409",
    channelConfiguration: { // Post channel configuration
        eventsLimitInMem: 5000
    },
    propertyConfiguration: { // Properties Plugin configuration
        env: "PROD", // Environment can be set to PPE or PROD as needed.
        gpcDataSharingOptIn: false, // Include the CCPA "GPC_DataSharingOptIn" property as false
        callback: {
			userConsentDetails: typeof WcpConsent !== 'undefined' && WcpConsent.siteConsent ? WcpConsent.siteConsent.getConsent : undefined
        },
    },
    webAnalyticsConfiguration: { // Web Analytics Plugin configuration
        urlCollectQuery: true,
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


window.addEventListener('DOMContentLoaded', function () {
    function onConsentChanged(categoryPreferences) { console.log("onConsentChanged", categoryPreferences); }
    WcpConsent.init("en-US", "cookie-banner", function (err, _siteConsent) {
        if (err != undefined) {
            return err;
        } else {
            siteConsent = _siteConsent; //siteConsent is used to get the current consent
        }
    });

    siteConsent.onConsentChanged(watchConsentChanges);

    if (siteConsent.isConsentRequired) {
        document.getElementsByClassName('manageCookieChoice')[0].style.display = 'inline-block';
    }
    else {
        //$(".manageCookieChoice").css("display", "none");
        document.getElementsByClassName('manageCookieChoice')[0].style.display = 'none';
    }

    if (!siteConsent.getConsentFor(WcpConsent.consentCategories.Analytics)) {
        dropAnalyticsCookies();
    }

    function watchConsentChanges(consents) {
        //scan through the categories and take action based on user consent.
        if (!siteConsent.getConsentFor(WcpConsent.consentCategories.Analytics)) {
            dropAnalyticsCookies();
        }
    }

    //Initialize SDK
    analytics.initialize(config, []);
});

function dropAnalyticsCookies() {
    clearCookie('_ga', document.domain, '/');
    clearCookie('_gid', document.domain, '/');
    clearCookie('_gat', document.domain, '/');
}

function manageConsent() {
    if (siteConsent.isConsentRequired) {
        siteConsent.manageConsent();
    }
}

//Detect GPC
const globalPrivacyControlEnabled = navigator.globalPrivacyControl;

// Set data sharing opt-in to false when GPC/3PAds controls detected
(async function() {
    const GPC_DataSharingOptIn = (globalPrivacyControlEnabled) ? false : await window.optOutPromise;
    window.GPC_value = GPC_DataSharingOptIn;
    analytics.getPropertyManager().getPropertiesContext().web.gpcDataSharingOptIn = GPC_DataSharingOptIn;
})();

function clearCookie(cookieName, domain, path) {
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`
}
