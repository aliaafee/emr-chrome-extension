import React, { useContext, useEffect, useMemo, useState } from "react";

import "../../../styles.css";
import { getResource } from "../../../api/emr-api";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import { ToolBar, ToolBarButton, ToolBarButtonLabel } from "./toolbar";
import { ActiveTabContext } from "./activetab-context";
import { FilterIcon, HeartIcon } from "lucide-react";
import { JSONTree } from "react-json-tree";
import MiniSearch from "minisearch";

const sectionCodes = {
    DR_NOTES: "Doctors Note",
    daily_nursing_notes: "Daily Nursing Note",
    Physiotherapy_Notes: "Physiotherapy Note",
    ADVICE: "Advice",
    "Intra-Operative_Nursing_Care": "Intraoperative Nursing Care Note",
    "Peri-Operative_Nursing_Care": "Preioperative Nursing Care Note",
    post_op_Dr_note: "Postoperative Doctors Note",
    Intra_op_Dr_note: "Intraoperative Doctors Note",
};

const sectionColors = {
    DR_NOTES: "bg-blue-100",
};

const sanitizeNotes = (notes) =>
    notes.data.map((note, index) => ({
        id: index,
        employee: note.employee,
        section: sectionCodes[note.sectionCode],
        sectionCode: note.sectionCode,
        date: note.date,
        title: note.key,
        text: note.note,
    }));

const NoteItem = ({ note }) => {
    return (
        <li
            className={
                "bg-gray-200 flex flex-col rounded-md " +
                sectionColors[note.sectionCode]
            }
        >
            <div className="flex p-2 gap-2 border-b-[1px] border-gray-300">
                <div className="font-bold">{note.title}</div>
                <div>{note.employee}</div>
            </div>
            <div className="whitespace-pre-wrap p-2">{note.text}</div>
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
    const [searchText, setSearchText] = useState("");

    const searchIndex = useMemo(() => {
        if (!notes) {
            return null;
        }
        let miniSearch = new MiniSearch({
            fields: ["employee", "section", "date", "title", "text"], // fields to index for full-text search
            storeFields: [
                "employee",
                "section",
                "sectionCode",
                "date",
                "title",
                "text",
            ], // fields to return with search results
        });
        miniSearch.addAll(notes);
        return miniSearch;
    }, [notes]);

    const suggestions = useMemo(() => {
        if (searchText == "") {
            return [];
        }
        return searchIndex.autoSuggest(searchText);
    }, [notes, searchText]);

    const fileterdNotes = useMemo(() => {
        return notes;
        // if (searchText == "") {
        //     return notes;
        // }
        // return searchIndex.search(searchText);
    }, [notes, searchText]);

    useEffect(() => {
        if (!patientId) {
            setNotes(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                setNotes(
                    sanitizeNotes(
                        await getResource(
                            `/live/df/pcc/widgets/clinicalNotes?encounterId=&patientId=${patientId}&size=max`,
                            activeTab.id
                        )
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
                <LoadingSpinner message={"Loading Notes..."} />
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
            <ToolBar className="bg-gray-200 border-b-[1px] border-gray-300">
                {/* <ToolBarButton title={`Do It`}>
                    <HeartIcon className="" width={16} height={16} />
                    <ToolBarButtonLabel>Do It</ToolBarButtonLabel>
                </ToolBarButton> */}
                <div className="p-1.5 m-0.5 bg-white rounded-md w-[400px] border-[1px] border-gray-400">
                    <div className="flex gap-1.5 w-full items-center justify-center">
                        <FilterIcon size={16} />

                        <input
                            className="outline-none bg-transparent grow"
                            placeholder="Search Notes"
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    {suggestions.length > 0 && (
                        <ul className="absolute z-10 float-start max-h-[400px] bg-white border-[1px] border-gray-400 shadow-md overflow-y-auto ml-[-6px] mt-[9px] w-[400px] rounded-md flex flex-col ">
                            {suggestions.map((item, index) => (
                                <li
                                    className="pl-5 p-1.5 hover:bg-gray-400"
                                    key={index}
                                >
                                    {item.suggestion}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </ToolBar>
            <div className="w-full flex flex-col overflow-auto">
                <ul className="flex flex-col gap-2 p-2">
                    {fileterdNotes.map((note, index) => (
                        <NoteItem note={note} />
                    ))}
                </ul>
                {/* <JSONTree data={notes} /> */}
            </div>
        </div>
    );
}
