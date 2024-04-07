import React, { useState } from "react";
import {
    EyeIcon,
    DownloadIcon,
    MonitorDownIcon,
    FileTextIcon,
} from "lucide-react";

import {
    viewerUrl,
    getRadiologyStudyUrl,
    getDicomFileTree,
} from "../../../api/emr-api";
import { JSONTree } from "react-json-tree";

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

const StudyDetail = ({ fileTree, loading, error }) => {
    if (loading) {
        return <div className="bg-white pl-8 pb-2">Loading...</div>;
    }
    if (error) {
        return <div className="bg-white pl-8 pb-2">Error: {error.message}</div>;
    }
    if (!fileTree) {
        return <></>;
    }
    return (
        <>
            <ul className="bg-white pl-8 pb-2">
                {fileTree.studies.map((study) =>
                    study.series.map((series) => (
                        <li>{series.SeriesDescription}</li>
                    ))
                )}
            </ul>
        </>
    );
};

const RadiologyStudyItem = ({
    study,
    key,
    selected = false,
    onSelected = () => {},
}) => {
    const [fileTree, setFileTree] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailError, setDetailError] = useState(null);

    const handleSelect = () => {
        onSelected(study);
    };

    const handleDownloadStudy = () => {
        (async () => {
            chrome.runtime.sendMessage({
                action: "downloadStudy",
                studyUrl: getRadiologyStudyUrl(study),
            });
        })();
    };

    const handleShowDetail = () => {
        if (detailError) {
            setDetailError(null);
            return;
        }
        if (fileTree) {
            setFileTree(null);
            return;
        }
        (async () => {
            setDetailError(null);
            setLoadingDetail(true);
            try {
                setFileTree(
                    await getDicomFileTree(getRadiologyStudyUrl(study))
                );
            } catch (err) {
                setDetailError(err);
            } finally {
                setLoadingDetail(false);
            }
        })();
    };

    return (
        <li
            key={key}
            className="flex flex-col bg-gray-200 odd:bg-gray-100 hover:bg-gray-300 "
        >
            <div className="flex min-h-[30px]">
                <div className="flex grow gap-1.5 p-1.5 cursor-pointer ">
                    <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={handleSelect}
                    />
                    <span className="min-w-[150px]" onClick={handleShowDetail}>
                        {study.date}
                    </span>
                    <span className="grow" onClick={handleShowDetail}>
                        {study.studyDescription}
                    </span>
                </div>

                <div className="flex">
                    {study.reportMode === 1 && (
                        <OpenLinkButton
                            title={"Download Report"}
                            url={`${study.pacsUrl}/radReport?orderId=${study.id}`}
                            className="hover:bg-gray-400 px-1.5 py-1"
                        >
                            <FileTextIcon width={16} height={16} />
                        </OpenLinkButton>
                    )}
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
            </div>
            <StudyDetail
                fileTree={fileTree}
                loading={loadingDetail}
                error={detailError}
            />
        </li>
    );
};

export default RadiologyStudyItem;
