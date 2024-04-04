import React from "react";
import { twMerge } from "tailwind-merge";

const ToolBarButton = ({ className, children, title, onClick = () => {} }) => {
    return (
        <button
            onClick={onClick}
            title={title}
            className={twMerge(
                className,
                "hover:bg-gray-400 rounded-full flex items-center justify-center px-1.5 py-1.5 gap-1.5"
            )}
        >
            {children}
        </button>
    );
};

const ToolBar = ({ className, children }) => {
    return (
        <div
            className={twMerge(
                className,
                "flex justify-end items-center gap-1.5 p-0.5"
            )}
        >
            {children}
        </div>
    );
};

export { ToolBar, ToolBarButton };
