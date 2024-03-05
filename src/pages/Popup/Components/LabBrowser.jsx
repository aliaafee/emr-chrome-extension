import React, { useEffect, useState } from "react";

import HinaiApi from "../../../api/HinaiApi";
import "../../../styles.css";

export default function LabBrowser() {
    const [patientId, setPatientId] = useState(null);

    useEffect(() => {
        (async () => {
            const currentPatientId = await HinaiApi.getCurrentPatientId();
            setPatientId(currentPatientId);
        })();
    }, [])

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div>
                <div className="text-lg text-center w-80">{patientId}</div>
            </div>
        </div>
    );
}
