import React, { useEffect, useState } from "react";

import { getResource } from "../../../api/emr-api";
import ErrorMessage from "./error-message";
import LoadingSpinner from "./loading-spinner";
import RadiologyStudyItem from "./radiology-studyitem";
import { GitCompareArrows } from "lucide-react";
import { JSONTree } from "react-json-tree";
import { viewerUrl, getRadiologyStudyUrl } from "../../../api/emr-api";
import { ToolBar, ToolBarButton, ToolBarButtonLabel } from "./toolbar";

import "../../../styles.css";

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
        win.document.title = "Compare Radiology Studies";
        win.document.body.innerHTML = `<div style="width: 100%; height: 100%; display: flex;"><iframe src="${studyAUrl}" style="flex-grow:1;">A</iframe><iframe src="${studyBUrl}" style="flex-grow:1;">B</iframe></div>`;
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
                <ErrorMessage
                    title="Radiology Browser Error"
                    message={error.message}
                />
            </div>
        );
    }

    if (!radiologyStudies) {
        return (
            <div className="w-full h-full flex">
                <ErrorMessage
                    title="No Radiology Studies"
                    message={!patientId && "No Patient Selected"}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col overflow-auto">
            <div className="text-lg">Radiology Studies</div>
            <ToolBar>
                <ToolBarButton
                    title={`Compare Studies ${
                        selectedStudies.length !== 2
                            ? ": Select two studies to compare"
                            : ""
                    }`}
                    disabled={selectedStudies.length !== 2}
                    onClick={handleCompareStudies}
                >
                    <GitCompareArrows className="" width={16} height={16} />
                    <ToolBarButtonLabel>Compare</ToolBarButtonLabel>
                </ToolBarButton>
            </ToolBar>
            <div className="w-full flex flex-col overflow-auto">
                <ul>
                    {radiologyStudies
                        // .filter((study) => !!study.studyDescription)
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
