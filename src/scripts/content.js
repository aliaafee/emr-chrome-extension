chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        
        if (request.action === "getCurrentPatientId") {
            (async () => {
                const patientId = getCurrentPatientId();
                sendResponse(patientId);
            })();
            return true;
        }

        if (request.action === "getResource") {
            (async () => {
                const response = await getResource(request.path);
                sendResponse(response);
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

function getApiRoot() {
    const documentUrl = new URL(window.location.href);

    return documentUrl.origin;
}

async function getResource(resourcePath) {
    const url = `${getApiRoot()}${resourcePath}`

    try {
        const response = await fetch(url);

        if (!response.ok) {
            return {
                ok: false,
                status: response.status,
                statusText: response.statusText,
                data: null
            }
        }

        return {
            ok: true,
            status: response.status,
            statusText: response.statusText,
            data: await response.json()
        }
    } catch (error) {
        return {
            ok: false,
            status: null,
            statusText: error.message,
            data: null
        }
    }
}