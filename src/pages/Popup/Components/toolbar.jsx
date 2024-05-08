import React from "react";
import { twMerge } from "tailwind-merge";

const ToolBarButton = ({
    className,
    children,
    disabled,
    title,
    active = false,
    onClick = () => {},
}) => {
    return (
        <button onClick={onClick} title={title} disabled={disabled}>
            <div
                className={twMerge(
                    className,
                    "hover:bg-gray-400 rounded-md flex items-center justify-center px-1.5 py-1.5 gap-1.5 m-0.5",
                    "disabled:text-gray-600",
                    active &&
                        " bg-gray-200 border-b-2 border-b-black mb-0 rounded-b-none"
                )}
            >
                {children}
            </div>
        </button>
    );
};

const ToolBarButtonLabel = ({ children }) => (
    <div className="min-w-[50px] pr-2">{children}</div>
);

const ToolBar = ({ className, children }) => {
    return (
        <div className={twMerge(className, "flex items-center")}>
            {children}
        </div>
    );
};

export { ToolBar, ToolBarButton, ToolBarButtonLabel };
