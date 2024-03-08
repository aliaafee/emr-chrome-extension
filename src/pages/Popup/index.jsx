import React from "react";
import { createRoot } from "react-dom/client";

import EmrApi from "../../api/EmrApi";

import ErrorMessage from "./Components/ErrorMessage";
import RadiologyBrowser from "./Components/RadiologyBrowser";
import LabResultBrowser from "./Components/LabResultBrowser";
import MainWindow from "./Components/MainWindow";

const container = document.getElementById("app-container");
const root = createRoot(container);

root.render(<MainWindow />)


