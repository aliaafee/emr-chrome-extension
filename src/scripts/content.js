chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.action === "getCurrentPatientId") {
            (async () => {
                const patientId = getCurrentPatientId();
                sendResponse(patientId);
            })();
            return true;
        }
    }
);

function getCurrentPatientId() {
    const idElement = document.getElementById("currentPatientId");
    if (idElement === null) {
        return null;
    }
    return idElement.value;
}