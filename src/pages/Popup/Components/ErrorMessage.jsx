import React from "react";

import "../../../styles.css";

export default function ErrorMessage({ title, message, children }) {
    return (
        <div className="w-full h-full flex items-center justify-center">
            <div>
                <div className="text-lg text-center w-80">{title}</div>
                <div className="text-center w-80">{message}</div>
                {children && <div className="text-center w-80">{children}</div>}
            </div>
        </div>
    );
}
