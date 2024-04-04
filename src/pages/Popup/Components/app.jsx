import React, { useEffect, useState } from "react";

import "../../../styles.css";

import { getActiveTab, getCurrentPatientId } from "../../../api/emr-api";
import LabResultBrowser from "./labresult-browser";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import RadiologyBrowser from "./radiology-browser";
import { ExternalLink } from "lucide-react";
import { ToolBar, ToolBarButton } from "./toolbar";

async function getTargetTabId() {
    const queryString = window.location.search;
    console.log(queryString);
    const urlParams = new URLSearchParams(queryString);

    console.log(urlParams.has("tabid"));
    if (urlParams.has("tabid")) {
        const tabId = Number(urlParams.get("tabid"));
        const tab = await chrome.tabs.get(tabId);

        return tab.id;
    }

    return (await getActiveTab()).id;
}

export default function App() {
    const [targetTabId, setTargetTabId] = useState(null);
    const [patientId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const tabId = await getTargetTabId();
                setTargetTabId(tabId);
                setPatientId(await getCurrentPatientId(tabId));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleNewWindow = () => {
        const url = targetTabId
            ? `popup.html?tabid=${targetTabId}`
            : `popup.html`;

        chrome.windows.create(
            {
                url: chrome.runtime.getURL(url),
                type: "popup",
            },
            (window) => {}
        );
    };

    if (loading) {
        return (
            <div className="w-full h-full flex">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage title="-Error" message={error.message} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex items-center border-b-2 border-gray-300">
                <div className="grow p-1.5">PatientId: {patientId}</div>
                <ToolBar>
                    <ToolBarButton
                        title="Open New Window"
                        onClick={handleNewWindow}
                    >
                        <ExternalLink width={16} height={16} />
                    </ToolBarButton>
                </ToolBar>
            </div>

            {/* <LabResultBrowser patientId={patientId} targetTabId={targetTabId} /> */}
            <RadiologyBrowser patientId={patientId} targetTabId={targetTabId} />
        </div>
    );
}
