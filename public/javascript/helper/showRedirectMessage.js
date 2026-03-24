import { showRedirectMessage } from "/javascript/helper/sweetAlertFunctions.js";

export function displayRedirectMessage() {
    const urlQueryParams = new URLSearchParams(window.location.search);
    const redirectMessage = urlQueryParams.get("redirectMessage");

    if (redirectMessage) {
        showRedirectMessage(redirectMessage);
    }
}