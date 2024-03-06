import React from "react";
import { createRoot } from "react-dom/client";

import EmrApi from "../../api/EmrApi";

import ErrorMessage from "./Components/ErrorMessage";
import RadiologyBrowser from "./Components/RadiologyBrowser";
import LabResultBrowser from "./Components/LabResultBrowser";

const container = document.getElementById("app-container");
const root = createRoot(container);

try {
    const patientId = await EmrApi.getCurrentPatientId();
    if (!patientId) {
        root.render(
            <ErrorMessage title={"No Patient"} />
        )
    }

    root.render(
        <LabResultBrowser patientId={patientId} />
    );
} catch(err) {
    root.render(
        <ErrorMessage title={"Error"} message={err.message} />
    )
}


