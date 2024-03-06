import React, { useEffect, useState } from "react";

import HinaiApi from "../../../api/HinaiApi";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";

import "../../../styles.css";

export default function RadiologyBrowser() {
    const [patientId, setPatientId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [radiologyStudies, setRadiologyStudies] = useState(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const currentPatientId = await HinaiApi.getCurrentPatientId();
                setPatientId(currentPatientId);
                const radiology = await HinaiApi.getResource(
                    `/live/df/pcc/widgets/radiologyServices/${currentPatientId}/max?encounterId=`
                )
                setRadiologyStudies(radiology);
            } catch(err) {
                setError(err);
            } finally {
                setLoading(false);
            }
            
        })();
    }, [])

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
                <ErrorMessage title="No Studies" />
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
