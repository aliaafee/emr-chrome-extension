import React, { useContext, useEffect, useState } from "react";

import "../../../styles.css";
import { getResource } from "../../../api/emr-api";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import { ToolBar, ToolBarButton, ToolBarButtonLabel } from "./toolbar";
import { ActiveTabContext } from "./activetab-context";
import { HeartIcon } from "lucide-react";
import { JSONTree } from "react-json-tree";

export default function NotesBrowser({ patientId }) {
    const activeTab = useContext(ActiveTabContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setNotes(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                setNotes(
                    await getResource(
                        `/live/df/pcc/widgets/clinicalNotes?encounterId=&patientId=${patientId}&size=max`,
                        activeTab.id
                    )
                );
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId]);

    if (loading) {
        return (
            <div className="w-full h-full flex">
                <LoadingSpinner message={"Loading Radiology Studies..."} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage
                    title="Notes Browser Error"
                    message={error.message}
                />
            </div>
        );
    }

    if (!notes) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage
                    title="No Notes"
                    message={!patientId && "No Patient Selected"}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-auto">
            <div className="text-lg">Radiology Studies</div>
            <ToolBar>
                <ToolBarButton title={`Do It`}>
                    <HeartIcon className="" width={16} height={16} />
                    <ToolBarButtonLabel>Do It</ToolBarButtonLabel>
                </ToolBarButton>
            </ToolBar>
            <div className="w-full flex flex-col overflow-auto">
                <JSONTree data={notes} />
            </div>
        </div>
    );
}
