import React, { useEffect, useState } from "react";

import { getResource } from "../../../api/EmrApi";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import RadiologyStudyItem from "./RadiologyStudyItem";
import { GitCompareArrows } from "lucide-react";
import { JSONTree } from "react-json-tree";
import { viewerUrl, getRadiologyStudyUrl } from "../../../api/EmrApi";

import "../../../styles.css";

const ToolBar = ({ selectedStudies }) => {
    const handleCompareStudies = () => {
        if (selectedStudies.length !== 2) return;
        const studyAUrl = `${viewerUrl}/viewer?url=${getRadiologyStudyUrl(
            selectedStudies[0]
        )}`;
        const studyBUrl = `${viewerUrl}/viewer?url=${getRadiologyStudyUrl(
            selectedStudies[1]
        )}`;
        const win = window.open(
            "",
            "Compare Studies",
            "toolbar=no,location=no,directories=no,status=no,menubar=no"
        );
        win.document.body.style = "padding: 0; margin: 0;";
        win.document.body.innerHTML = `<div style="width: 100%; height: 100%; display: flex;"><iframe src="${studyAUrl}" style="flex-grow:1;">A</iframe><iframe src="${studyBUrl}" style="flex-grow:1;">B</iframe></div>`;
    };
    return (
        <div className="flex bg-gray-400 min-h-[30px]">
            <button
                className="hover:bg-gray-500 px-1.5 py-1 disabled:text-gray-600 flex justify-center items-center gap-0.5"
                disabled={selectedStudies.length !== 2}
                title={`Compare Studies ${
                    selectedStudies.length !== 2
                        ? ": Select two studies to compare"
                        : ""
                }`}
                onClick={handleCompareStudies}
            >
                <div>
                    <GitCompareArrows className="" width={16} height={16} />
                </div>
                <div>Compare Studies</div>
            </button>
        </div>
    );
};

export default function RadiologyBrowser({ patientId, targetTabId = null }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [radiologyStudies, setRadiologyStudies] = useState(null);
    const [selectedStudies, setSelectedStudies] = useState([]);

    useEffect(() => {
        if (!patientId) {
            setRadiologyStudies(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                setRadiologyStudies(
                    await getResource(
                        `/live/df/pcc/widgets/radiologyServices/${patientId}/max?encounterId=`,
                        targetTabId
                    )
                );
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        })();
    }, [patientId]);

    const handleStudySelected = (study) => {
        if (selectedStudies.some((item) => item.id === study.id)) {
            setSelectedStudies(
                selectedStudies.filter((item) => item.id !== study.id)
            );
            return;
        }
        if (selectedStudies.length === 0) {
            setSelectedStudies([study]);
            return;
        }
        setSelectedStudies([selectedStudies.at(-1), study]);
    };

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
                <ErrorMessage title="Error" message={error.message} />
            </div>
        );
    }

    if (!radiologyStudies) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage
                    title="No Studies"
                    message={!patientId && "No Patient Selected"}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-auto">
            <div className="text-lg">Radiology Studies {patientId}</div>
            <ToolBar selectedStudies={selectedStudies} />
            <div className="w-full flex flex-col overflow-auto">
                <ul>
                    {radiologyStudies
                        .filter((study) => !!study.studyDescription)
                        .map((study, index) => (
                            <RadiologyStudyItem
                                study={study}
                                key={index}
                                selected={selectedStudies.some(
                                    (item) => study.id === item.id
                                )}
                                onSelected={handleStudySelected}
                            />
                        ))}
                </ul>
                {/* <JSONTree data={radiologyStudies} /> */}
            </div>
        </div>
    );
}
