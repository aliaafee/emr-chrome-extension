import React, { useContext, useEffect, useMemo, useState } from "react";

import "../../../styles.css";

import { getActiveTab, getCurrentPatientId } from "../../../api/emr-api";
import LabResultBrowser from "./labresult-browser";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import RadiologyBrowser from "./radiology-browser";
import {
    CopyPlusIcon,
    ExternalLink,
    FileTextIcon,
    FlaskConicalIcon,
    RefreshCwIcon,
    SkullIcon,
} from "lucide-react";
import { ToolBar, ToolBarButton, ToolBarButtonLabel } from "./toolbar";
import { ActiveTabContext } from "./activetab-context";
import NotesBrowser from "./notes-browser";

function getUrlParams() {
    const queryString = window.location.search;
    return new URLSearchParams(queryString);
}

async function getTargetTabId() {
    const urlParams = getUrlParams();

    if (urlParams.has("tabid")) {
        const tabId = Number(urlParams.get("tabid"));
        const tab = await chrome.tabs.get(tabId);

        return tab.id;
    }

    return (await getActiveTab()).id;
}

export default function App() {
    const activeTab = useContext(ActiveTabContext);
    const [patientId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState("radiology");
    const isPopUpWindw = useMemo(() => !getUrlParams().has("tabid"));

    useEffect(() => {
        chrome.storage.sync.get("activeView", function (data) {
            if (!data.activeView) {
                handleSetActiveView("radiology");
                return;
            }
            setActiveView(data.activeView);
        });
        (async () => {
            setLoading(true);
            try {
                setPatientId(await getCurrentPatientId(activeTab.id));
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleNewWindow = () => {
        const url = !!activeTab.id
            ? `popup.html?tabid=${activeTab.id}`
            : `popup.html`;

        chrome.windows.create(
            {
                url: chrome.runtime.getURL(url),
                type: "popup",
            },
            (window) => {}
        );

        if (isPopUpWindw) {
            window.close();
        }
    };

    const handleSyncPatient = async () => {
        setLoading(true);
        try {
            setPatientId(await getCurrentPatientId(activeTab.id));
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSetActiveView = (name) => {
        setActiveView(name);
        chrome.storage.sync.set({ activeView: name });
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
            <div className="flex items-center justify-between">
                <div className=" p-1.5">PatientId: {patientId}</div>
                <ToolBar>
                    {isPopUpWindw ? (
                        <ToolBarButton title="Popout" onClick={handleNewWindow}>
                            <ExternalLink width={16} height={16} />
                        </ToolBarButton>
                    ) : (
                        <>
                            <ToolBarButton
                                title="Sync Patient"
                                onClick={handleSyncPatient}
                            >
                                <RefreshCwIcon width={16} height={16} />
                            </ToolBarButton>
                            <ToolBarButton
                                title="New Window"
                                onClick={handleNewWindow}
                            >
                                <CopyPlusIcon width={16} height={16} />
                            </ToolBarButton>
                        </>
                    )}
                </ToolBar>
            </div>
            <div className="flex items-center justify-between border-b-2 border-gray-300">
                <ToolBar className="">
                    <ToolBarButton
                        title="Radiology Browser"
                        active={activeView === "radiology"}
                        onClick={() => handleSetActiveView("radiology")}
                    >
                        <SkullIcon width={16} height={16} />
                        <ToolBarButtonLabel>Radiology</ToolBarButtonLabel>
                    </ToolBarButton>
                    <ToolBarButton
                        title="Lab Result Browser"
                        active={activeView === "lab"}
                        onClick={() => handleSetActiveView("lab")}
                    >
                        <FlaskConicalIcon width={16} height={16} />
                        <ToolBarButtonLabel>Lab Results</ToolBarButtonLabel>
                    </ToolBarButton>
                    <ToolBarButton
                        title="Notes Browser"
                        active={activeView === "notes"}
                        onClick={() => handleSetActiveView("notes")}
                    >
                        <FileTextIcon width={16} height={16} />
                        <ToolBarButtonLabel>Notes</ToolBarButtonLabel>
                    </ToolBarButton>
                </ToolBar>
            </div>

            {activeView === "radiology" && (
                <RadiologyBrowser patientId={patientId} />
            )}

            {activeView === "lab" && <LabResultBrowser patientId={patientId} />}

            {activeView === "notes" && <NotesBrowser patientId={patientId} />}
        </div>
    );
}
