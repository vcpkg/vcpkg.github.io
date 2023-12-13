//Detect GPC
const globalPrivacyControlEnabled = navigator.globalPrivacyControl;

// set data sharing opt-in to false when GPC/AMC controls detected
const GPC_DataSharingOptIn = (globalPrivacyControlEnabled) ? false : checkThirdPartyAdsOptOutCookie();
analytics.getPropertyManager().getPropertiesContext().web.gpcDataSharingOptIn = GPC_DataSharingOptIn;
//Detect AMC opt out choice
function checkThirdPartyAdsOptOutCookie() {
    try {
        const ThirdPartyAdsOptOutCookieName = '3PAdsOptOut';
        var cookieValue = getCookie(ThirdPartyAdsOptOutCookieName);
        // for unauthenticated users
        return cookieValue !== 1;
    } catch {
        return true;
    }
}

function getCookie(cookieName) {
    var cookieValue = document.cookie.match('(^|;)\\s' + cookieName + '\\s*=\\s*([^;]+)');
    return (cookieValue) ? cookieValue[2] : '';
}