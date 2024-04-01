import React from "react";
import { PanelsTopLeftIcon, DownloadIcon } from "lucide-react";

import { viewerUrl, getRadiologyStudyUrl } from "../../../api/EmrApi";

const OpenLinkButton = ({ url, className, children, newWindow = true }) => {
    return (
        <button
            className={className}
            onClick={() => window.open(url, "_blank")}
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
    // const fileServerUrl = "http://10.10.10.197:4000";
    // const viewerUrl = "http://10.10.10.91:3000";

    const handleSelect = () => {
        onSelected(study);
    };

    // const getUrl = () => {
    //     const studyDate = new Date(study.studyDate);

    //     return `${fileServerUrl}/zfpviewer/api/download?file=/zfp/${studyDate.getFullYear()}/${
    //         studyDate.getMonth() + 1
    //     }/${studyDate.getDate()}/${study.studyUid}.json`;
    // };

    return (
        <li key={key} className="flex bg-gray-100 hover:bg-gray-200">
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
                    url={`${viewerUrl}/viewer?url=${getRadiologyStudyUrl(
                        study
                    )}`}
                    className="hover:bg-gray-400 px-1.5 py-1"
                >
                    <PanelsTopLeftIcon width={16} height={16} />
                </OpenLinkButton>
                <OpenLinkButton
                    url={`dldicom:${getRadiologyStudyUrl(study)}`}
                    className="hover:bg-gray-400 px-1.5 py-1"
                >
                    <DownloadIcon width={16} height={16} />
                </OpenLinkButton>
            </div>
        </li>
    );
};

export default RadiologyStudyItem;
