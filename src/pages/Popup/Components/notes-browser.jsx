import React, { useContext, useEffect, useState } from "react";

import "../../../styles.css";
import { getResource } from "../../../api/emr-api";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import { ToolBar, ToolBarButton, ToolBarButtonLabel } from "./toolbar";
import { ActiveTabContext } from "./activetab-context";
import { HeartIcon } from "lucide-react";
import { JSONTree } from "react-json-tree";

const NoteItem = ({ note }) => {
    return (
        <li className="bg-gray-200 flex flex-col rounded-md">
            <div className="flex p-2 gap-2 border-b-[1px] border-gray-300">
                <div className="font-bold">{note.key}</div>
                <div>{note.employee}</div>
            </div>
            <div className="whitespace-pre-wrap p-2">{note.note}</div>
            <div className="text-gray-600 p-2 border-t-[1px] border-gray-300">
                {note.date}
            </div>
        </li>
    );
};

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
            <ToolBar>
                <ToolBarButton title={`Do It`}>
                    <HeartIcon className="" width={16} height={16} />
                    <ToolBarButtonLabel>Do It</ToolBarButtonLabel>
                </ToolBarButton>
            </ToolBar>
            <div className="w-full flex flex-col overflow-auto">
                <ul className="flex flex-col gap-2 p-2">
                    {notes.data.map((note, index) => (
                        <NoteItem note={note} />
                    ))}
                </ul>
                <JSONTree data={notes} />
            </div>
        </div>
    );
}
