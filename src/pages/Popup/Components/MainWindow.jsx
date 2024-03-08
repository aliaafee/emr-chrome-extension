import React, { useEffect, useState } from "react";

import EmrApi from "../../../api/EmrApi";
import LabResultBrowser from "./LabResultBrowser";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";

import "../../../styles.css";

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

    return (await EmrApi.getActiveTab()).id;
}

function ToolBar({ targetTabId }) {
    const onNewWindow = () => {
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

    return (
        <div className="flex justify-end grow">
            <button
                onClick={onNewWindow}
                title="Open New Window"
                className="pop-out bg-black"
            ></button>
        </div>
    );
}

export default function MainWindow() {
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
                setPatientId(await EmrApi.getCurrentPatientId(tabId));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
                <ErrorMessage title="Error" message={error.message} />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex">
                <div className="grow">
                    tabId: {targetTabId} patientId: {patientId}
                </div>
                <ToolBar targetTabId={targetTabId} />
            </div>

            <LabResultBrowser patientId={patientId} targetTabId={targetTabId} />
        </div>
    );
}
