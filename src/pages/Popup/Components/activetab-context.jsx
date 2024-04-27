import React, { createContext, useEffect, useState } from "react";

import LoadingSpinner from "./loading-spinner";
import ErrorMessage from "./error-message";

const ActiveTabContext = createContext({ tabid: null });

const getActiveTabId = async () => {
    try {
        const queryString = window.location.search;

        const urlParams = new URLSearchParams(queryString);

        if (urlParams.has("tabid")) {
            const tabId = Number(urlParams.get("tabid"));
            const tab = await chrome.tabs.get(tabId);

            return tab.id;
        }

        let queryOptions = { active: true, currentWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);

        return tab.id;
    } catch (Error) {
        return null;
    }
};

const ActiveTabContextProvider = ({ children }) => {
    const [isLoading, setLoading] = useState(false);
    const [activeTabId, setActiveTabId] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const tabId = await getActiveTabId();
                setActiveTabId(tabId);
            } catch (error) {
                setActiveTabId(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!activeTabId) {
        return <ErrorMessage title="Error" message="Cannot find tab" />;
    }

    return (
        <ActiveTabContext.Provider value={{ id: activeTabId }}>
            {children}
        </ActiveTabContext.Provider>
    );
};

export { ActiveTabContext, ActiveTabContextProvider };
