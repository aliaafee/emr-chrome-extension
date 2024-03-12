import React, { useEffect, useState } from "react";

import EmrApi from "../../../api/EmrApi";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";

import "../../../styles.css";

export default function RadiologyBrowser({ patientId }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [radiologyStudies, setRadiologyStudies] = useState(null);

    useEffect(() => {
        if (!patientId) {
            setRadiologyStudies(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                setRadiologyStudies(
                    await EmrApi.getResource(
                        `/live/df/pcc/widgets/radiologyServices/${patientId}/max?encounterId=`
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
        <div className="w-full h-full flex">
            <div>
                <div className="text-lg">{patientId}</div>
                <div className="whitespace-pre-wrap">
                    {JSON.stringify(radiologyStudies, null, 2)}
                </div>
            </div>
        </div>
    );
}
