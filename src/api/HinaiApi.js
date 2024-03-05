async function getActiveTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getCurrentPatientId(tab = null) {

    const activeTab = (tab == null) ? (
        await getActiveTab()
    ) : (
        tab
    );

    try {
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


export default {
    getCurrentPatientId: getCurrentPatientId
}