async function getActiveTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getCurrentPatientId(tabId = null) {
    try {  
        console.log("Tab ID is")
        console.log(tabId);
        const activeTabId = (tabId === null) ? (
            (await getActiveTab()).id
        ) : (
            tabId
        );

        return await chrome.tabs.sendMessage(
            activeTabId,
            {
                "action": "getCurrentPatientId"
            }
        );
    } catch (error) {
        return null
    }
}

async function getResource(path, tabId = null) {
    try {
        const activeTabId = (tabId == null) ? (
            (await getActiveTab()).id
        ) : (
            tabId
        );

        const response = await chrome.tabs.sendMessage(
            activeTabId,
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
    getActiveTab: getActiveTab,
    getCurrentPatientId: getCurrentPatientId,
    getResource: getResource
}