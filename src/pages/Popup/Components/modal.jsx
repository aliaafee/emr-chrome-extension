import React from "react";
import { X } from "lucide-react";

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white rounded shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between py-1.5 pl-2 pr-1.5 border-b border-gray-200">
                    <h2 className="text-sm font-semibold">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Close"
                    >
                        <X width={16} height={16} />
                    </button>
                </div>
                <div className="flex overflow-hidden">{children}</div>
            </div>
        </div>
    );
}
