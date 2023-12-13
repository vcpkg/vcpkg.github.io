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
            userConsentDetails: siteConsent ? siteConsent.getConsent : undefined
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

//Initialize SDK
analytics.initialize(config, []);

window.addEventListener('DOMContentLoaded', function () {
    function onConsentChanged(categoryPreferences) { console.log("onConsentChanged", categoryPreferences); }
    WcpConsent.init("en-US", "cookie-banner", function (err, _siteConsent) {
        if (err != undefined) {
            return error;
        } else {
            siteConsent = _siteConsent; //siteConsent is used to get the current consent
        }
    });
});
