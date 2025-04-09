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

    // Creating a javascipt promise assigned to the window object, that will store user's preference for displaying third party Ads (3PAds)
    window.optOutPromise = new Promise((resolve, reject) => {
        messageEventListener = (event) => {
            if (event.origin === PRIVACY_ORIGIN) {
                const optOutEventData = event.data?.["3PAdsOptOut"];

                // If the value received is not undefined and is set to "1", that means signifies that the user has opted out for data sharing 
                if (typeof optOutEventData !== "undefined" && optOutEventData === "1") {
                    resolve(false);
                }

                resolve(true);
                removeEventListener("message", messageEventListener);
                iFrame.remove();
            }
        }
    });

    // An event listener, listening for message from the embedded iFrame
    addEventListener("message", messageEventListener);

    // Embedding the dotnet.microsoft.com website as a headless iFrame
    document.body.appendChild(iFrame);
})();
