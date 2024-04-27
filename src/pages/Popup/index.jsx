import React from "react";
import { createRoot } from "react-dom/client";

import App from "./Components/app";
import { ActiveTabContextProvider } from "./Components/activetab-context";

const container = document.getElementById("app-container");
const root = createRoot(container);

root.render(
    <ActiveTabContextProvider>
        <App />
    </ActiveTabContextProvider>
);
