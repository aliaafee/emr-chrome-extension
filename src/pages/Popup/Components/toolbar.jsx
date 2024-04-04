import React from "react";
import { twMerge } from "tailwind-merge";

const ToolBarButton = ({
    className,
    children,
    disabled,
    title,
    onClick = () => {},
}) => {
    return (
        <button
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={twMerge(
                className,
                "hover:bg-gray-400 rounded-full flex items-center justify-center px-1.5 py-1.5 gap-1.5",
                "disabled:text-gray-600"
            )}
        >
            {children}
        </button>
    );
};

const ToolBar = ({ className, children }) => {
    return (
        <div className={twMerge(className, "flex items-center gap-1.5 p-0.5")}>
            {children}
        </div>
    );
};

export { ToolBar, ToolBarButton };
