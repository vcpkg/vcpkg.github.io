/*
    This script fetches the assigned value of the 3PAdsOptOut cookie from the dotnet.microsoft.com website.
    It then saves the value to a promise( @optOutPromise ) assigned to the window object, so that it can be consumed by other scripts.
*/
(function () {
    const PRIVACY_ORIGIN = "https://dotnet.microsoft.com";
    const iFrame = document.createElement("iframe");
    iFrame.style.width = "0";
    iFrame.style.height = "0";
    iFrame.style.position = "absolute";
    iFrame.style.border = "none";
    iFrame.src = PRIVACY_ORIGIN + "/dotnetprivacy.html";
    let messageEventListener;

    // Promise storing user's 3PAds opt-out status (true = show ads, false = opt-out)
    window.optOutPromise = new Promise((resolve, reject) => {
        messageEventListener = (event) => {
            if (event.origin === PRIVACY_ORIGIN) {
                const optOutEventData = event.data?.["3PAdsOptOut"];

                // If the user has opted out ("1"), resolves with false (i.e. do not show ads)
                if (typeof optOutEventData !== "undefined" && optOutEventData === "1") {
                    resolve(false);
                } else {
                    resolve(true);
                }
                removeEventListener("message", messageEventListener);
                iFrame.remove();
            }
        }
    });

    addEventListener("message", messageEventListener);

    document.body.appendChild(iFrame);
})();
