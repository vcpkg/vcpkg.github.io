(function () {
    const PRIVACY_ORIGIN = "https://dotnet.microsoft.com";
    const iFrame = document.createElement("iframe");
    iFrame.style.width = "0";
    iFrame.style.height = "0";
    iFrame.style.position = "absolute";
    iFrame.style.border = "none";
    iFrame.src = PRIVACY_ORIGIN + "/dotnetprivacy.html";
    let messageEventListener;

    window.optOutPromise = new Promise((resolve, reject) => {
        messageEventListener = (event) => {
            if (event.origin === PRIVACY_ORIGIN) {
                const optOutEventData = event.data?.["3PAdsOptOut"];
                if (typeof optOutEventData !== "undefined") {
                    resolve(optOutEventData === "1");
                }
                resolve(false);
                removeEventListener("message", messageEventListener);
                iFrame.remove();
            }
        }
    });
    addEventListener("message", messageEventListener);
    document.body.appendChild(iFrame);
})();