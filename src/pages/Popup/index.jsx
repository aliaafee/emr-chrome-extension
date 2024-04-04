import React from "react";
import { createRoot } from "react-dom/client";

import App from "./Components/app";

const container = document.getElementById("app-container");
const root = createRoot(container);

root.render(<App />);
