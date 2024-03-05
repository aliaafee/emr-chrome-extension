import React from "react";
import { createRoot } from "react-dom/client";

import ErrorMessage from "./Components/ErrorMessage";
import LabBrowser from "./Components/LabBrowser";

const container = document.getElementById("app-container");
const root = createRoot(container);
root.render(
    <LabBrowser />
);
