import React from "react";
import { EyeIcon, DownloadIcon, MonitorDownIcon } from "lucide-react";

import { viewerUrl, getRadiologyStudyUrl } from "../../../api/EmrApi";

const OpenLinkButton = ({
    url,
    className,
    children,
    title,
    newWindow = true,
}) => {
    return (
        <button
            className={className}
            onClick={() => window.open(url, "_blank")}
            title={title}
        >
            {children}
        </button>
    );
};

const RadiologyStudyItem = ({
    study,
    key,
    selected = false,
    onSelected = () => {},
}) => {
    const handleSelect = () => {
        onSelected(study);
    };

    const handleDownloadStudy = () => {
        (async (studyUrl) => {
            chrome.runtime.sendMessage({
                action: "downloadStudy",
                studyUrl: getRadiologyStudyUrl(study),
            });
        })();
    };

    return (
        <li
            key={key}
            className="flex bg-gray-200 odd:bg-gray-100 hover:bg-gray-300 min-h-[30px]"
        >
            <div className="flex grow gap-1.5 p-1.5 cursor-pointer ">
                <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={handleSelect}
                />
                <span className="min-w-[150px]">{study.date}</span>
                <span className="grow">{study.studyDescription}</span>
            </div>

            <div className="flex">
                <OpenLinkButton
                    title={"Open Study"}
                    url={`${viewerUrl}/viewer?url=${getRadiologyStudyUrl(
                        study
                    )}`}
                    className="hover:bg-gray-400 px-1.5 py-1"
                >
                    <EyeIcon width={16} height={16} />
                </OpenLinkButton>
                <button
                    title="Download Study"
                    className="hover:bg-gray-400 px-1.5 py-1"
                    onClick={handleDownloadStudy}
                >
                    <DownloadIcon width={16} height={16} />
                </button>
                <OpenLinkButton
                    title={"Download Study: External"}
                    url={`dldicom:${getRadiologyStudyUrl(study)}`}
                    className="hover:bg-gray-400 px-1.5 py-1"
                >
                    <MonitorDownIcon width={16} height={16} />
                </OpenLinkButton>
            </div>
        </li>
    );
};

export default RadiologyStudyItem;
