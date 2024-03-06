async function getActiveTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getCurrentPatientId(tab = null) {
    try {
        const activeTab = (tab == null) ? (
            await getActiveTab()
        ) : (
            tab
        );

        return await chrome.tabs.sendMessage(
            activeTab.id,
            {
                "action": "getCurrentPatientId"
            }
        );
    } catch (error) {
        return null
    }
}

async function getResource(path, tab = null) {
    try {
        const activeTab = (tab == null) ? (
            await getActiveTab()
        ) : (
            tab
        );

        const response = await chrome.tabs.sendMessage(
            activeTab.id,
            {
                "action": "getResource",
                "path": path
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get resource, ${response.status}, ${response.statusText}`,
                {
                    cause: response
                }
            )
        }

        return response.data

    } catch (error) {
        throw new Error(
            `Could not get resource, ${error.message}`,
            {
                cause: error
            }
        )
    }
}


export default {
    getCurrentPatientId: getCurrentPatientId,
    getResource: getResource
}