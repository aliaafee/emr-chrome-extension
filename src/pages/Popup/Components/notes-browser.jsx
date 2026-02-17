import React, { useContext, useEffect, useMemo, useState } from "react";

import "../../../styles.css";
import { getResource } from "../../../api/emr-api";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import { ToolBar, ToolBarButton, ToolBarButtonLabel } from "./toolbar";
import { ActiveTabContext } from "./activetab-context";
import { JSONTree } from "react-json-tree";
import MiniSearch from "minisearch";
import SearchBox from "./search-box";
import { DownloadIcon, CheckSquare, Square } from "lucide-react";
import { getPatientInfo } from "../Utils/patientinfo";
import { use } from "react";
import Modal from "./modal";

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
                <div>{note.date}</div>
                <div>
                    <div className="font-bold">{note.title}</div>
                    <div>{note.employee}</div>
                </div>
            </div>
            <div className="whitespace-pre-wrap p-2">{note.text}</div>
        </li>
    );
};

export default function NotesBrowser({ patientId }) {
    const activeTab = useContext(ActiveTabContext);
    const [loading, setLoading] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState(null);
    const [encounters, setEncounters] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEncounterId, setSelectedEncounterId] = useState("");
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [selectedEncounterIds, setSelectedEncounterIds] = useState([]);
    const [preparingDownload, setPreparingDownload] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [downloadFilename, setDownloadFilename] = useState(null);

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

    const openDownloadModal = () => {
        setShowDownloadModal(true);
        setDownloadUrl(null);
        setDownloadFilename(null);
        // Initialize with all encounters selected
        if (encounters && encounters.data) {
            setSelectedEncounterIds(encounters.data.map((enc) => enc.id));
        }
    };

    const handleToggleEncounter = (encounterId) => {
        setSelectedEncounterIds((prev) => {
            if (prev.includes(encounterId)) {
                return prev.filter((id) => id !== encounterId);
            } else {
                return [...prev, encounterId];
            }
        });
    };

    const handleToggleAll = () => {
        if (selectedEncounterIds.length === encounters.data.length) {
            setSelectedEncounterIds([]);
        } else {
            setSelectedEncounterIds(encounters.data.map((enc) => enc.id));
        }
    };

    const downloadNotesJSON = async () => {
        setPreparingDownload(true);

        try {
            const patientInfo = await getPatientInfo(patientId, activeTab.id);

            // Fetch notes for selected encounters
            let allNotes = [];
            for (const encounterId of selectedEncounterIds) {
                console.log(`Fetching notes for encounter ${encounterId}...`);
                try {
                    const encounterNotes = sanitizeNotes(
                        await getResource(
                            `/live/df/pcc/widgets/clinicalNotes?encounterId=${encounterId}&patientId=${patientId}&size=max`,
                            activeTab.id,
                        ),
                    );
                    allNotes = allNotes.concat(encounterNotes);
                } catch (err) {
                    console.error(
                        `Error fetching notes for encounter ${encounterId}:`,
                        err,
                    );
                }
            }

            console.log("All Notes for Download:", allNotes);

            //Sort allNotes by date (oldest first) date is stored as string with format like "Feb 17, 2026 7:50:50 AM"
            allNotes.sort((a, b) => new Date(a.date) - new Date(b.date));

            const combined_text = allNotes
                .map(
                    (note) =>
                        `Date: ${note.date}\nSection: ${note.section}\nTitle: ${note.title}\nText: ${note.text}`,
                )
                .join("\n\n");

            console.log("Combined Notes Text:", combined_text);

            const selectedEncounterNames = encounters.data
                .filter((enc) => selectedEncounterIds.includes(enc.id))
                .map((enc) => enc.name);

            const downloadData = {
                patient: {
                    id: patientId,
                    sex: patientInfo.sex,
                    dob: patientInfo.dob,
                },
                encounters: selectedEncounterNames,
                clinical_notes: combined_text,
            };

            console.log("Download Data:", downloadData);

            const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(downloadData, null, 2));

            setDownloadUrl(dataStr);
            setDownloadFilename(`notes-${patientId}.json`);
        } catch (err) {
            console.error("Error preparing download:", err);
            setError(err);
        } finally {
            setPreparingDownload(false);
        }
    };

    const fileterdNotes = useMemo(() => {
        if (searchTerm == "") {
            return notes;
        }
        return searchIndex.search(searchTerm);
    }, [notes, searchTerm]);

    useEffect(() => {
        if (!patientId) {
            setNotes(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                setEncounters(
                    await getResource(
                        `/live/df/pcc/dashboard/previousEncounters/${patientId}`,
                        activeTab.id,
                    ),
                );
                setSelectedEncounterId("");
                console.log("Encounters Response:");
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId]);

    useEffect(() => {
        if (!patientId) {
            setNotes(null);
            return;
        }
        (async () => {
            setLoadingNotes(true);
            try {
                setNotes(
                    sanitizeNotes(
                        await getResource(
                            `/live/df/pcc/widgets/clinicalNotes?encounterId=${selectedEncounterId}&patientId=${patientId}&size=max`,
                            activeTab.id,
                        ),
                    ),
                );
            } catch (err) {
                setError(err);
            } finally {
                setLoadingNotes(false);
            }
        })();
    }, [selectedEncounterId, patientId]);

    const handleSelectSearchTerm = (newSearchTerm) => {
        setSearchTerm(newSearchTerm);
    };

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

    console.log("Encounters:", encounters);

    return (
        <div className="flex flex-col overflow-auto">
            <div className="flex p-0.5 bg-gray-200">
                <select
                    className="p-1 rounded-sm border-gray-300 border grow"
                    onChange={(e) => setSelectedEncounterId(e.target.value)}
                    value={selectedEncounterId}
                >
                    <option value="">All Encounters</option>
                    {encounters &&
                        encounters.data.map((encounter) => (
                            <option value={encounter.id} key={encounter.id}>
                                {`${encounter.name}`}{" "}
                            </option>
                        ))}
                </select>
            </div>
            <ToolBar className="bg-gray-200">
                <SearchBox
                    placeholder="Search Notes"
                    searchIndex={searchIndex}
                    onSelectSearchTerm={handleSelectSearchTerm}
                />
                {/* <ToolBarButton title="Filter">
                    <FilterIcon className="" width={16} height={16} />
                    <ToolBarButtonLabel>Filter</ToolBarButtonLabel>
                </ToolBarButton> */}
                <ToolBarButton
                    title="Downaload Notes as JSON"
                    onClick={openDownloadModal}
                >
                    <DownloadIcon className="" width={16} height={16} />
                    <ToolBarButtonLabel>Download JSON</ToolBarButtonLabel>
                </ToolBarButton>
            </ToolBar>
            <div className="w-full flex flex-col overflow-auto">
                {loadingNotes ? (
                    <div className="w-full h-full flex">
                        <LoadingSpinner message={"Loading Notes..."} />
                    </div>
                ) : fileterdNotes.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-gray-500">No Notes Available</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2 p-2">
                        {fileterdNotes.map((note, index) => (
                            <NoteItem note={note} key={index} />
                        ))}
                    </ul>
                )}

                {/* <JSONTree data={notes} /> */}
            </div>
            <Modal
                isOpen={showDownloadModal}
                onClose={() => setShowDownloadModal(false)}
                title="Select Encounters to Download"
            >
                {preparingDownload ? (
                    <div className="p-4 flex items-center justify-center min-h-[200px] grow">
                        <LoadingSpinner message="Preparing download..." />
                    </div>
                ) : downloadUrl ? (
                    <div className="p-4 flex flex-col items-center justify-center min-h-[200px] gap-4 grow">
                        <div className="text-center grow">
                            <p className="text-lg font-semibold mb-2">
                                Download Ready!
                            </p>
                            <p className="text-gray-600 mb-4">
                                Click the button below to download your notes
                            </p>
                        </div>
                        <a
                            href={downloadUrl}
                            download={downloadFilename}
                            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 rounded-lg flex items-center gap-2 font-semibold"
                        >
                            <DownloadIcon width={20} height={20} />
                            Download {downloadFilename}
                        </a>
                        <button
                            onClick={() => setShowDownloadModal(false)}
                            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <div className="p-4 flex flex-col h-full grow">
                        <div className="mb-4">
                            <button
                                onClick={handleToggleAll}
                                className="flex items-center p-2 hover:bg-gray-100 rounded w-full font-semibold"
                            >
                                {selectedEncounterIds.length ===
                                encounters?.data?.length ? (
                                    <CheckSquare
                                        width={20}
                                        height={20}
                                        className="text-blue-600"
                                    />
                                ) : (
                                    <Square width={20} height={20} />
                                )}
                                Select All
                            </button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-auto flex flex-col">
                            {encounters?.data?.map((encounter) => (
                                <button
                                    key={encounter.id}
                                    onClick={() =>
                                        handleToggleEncounter(encounter.id)
                                    }
                                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded w-full text-left"
                                >
                                    {selectedEncounterIds.includes(
                                        encounter.id,
                                    ) ? (
                                        <CheckSquare
                                            width={20}
                                            height={20}
                                            className="text-blue-600 flex-shrink-0"
                                        />
                                    ) : (
                                        <Square
                                            width={20}
                                            height={20}
                                            className="flex-shrink-0"
                                        />
                                    )}
                                    <span>{encounter.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 flex gap-2 justify-end border-t pt-4">
                            <button
                                onClick={() => setShowDownloadModal(false)}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={downloadNotesJSON}
                                disabled={selectedEncounterIds.length === 0}
                                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                Download ({selectedEncounterIds.length})
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
