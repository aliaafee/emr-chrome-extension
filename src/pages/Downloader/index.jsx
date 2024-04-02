import Downloader from "./downloader";

const downloader = new Downloader();
var downloadStatus = "starting";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "downloadStudyWindow") {
        downloadStudy(request.studyUrl);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    monitor();

    const cancelButton = document.getElementById("cancel-button");
    cancelButton.onclick = () => {
        downloader.cancel();
        window.close();
    };
});

async function downloadStudy(studyUrl) {
    const statusElem = document.getElementById("status");
    const headerElem = document.getElementById("header");

    try {
        const fileTree = await getFileTree(studyUrl);

        console.log(fileTree);

        if (fileTree === null) {
            console.log("No files found");
            downloadStatus = "failed";
            return;
        }

        const fileList = flattenFileTree(fileTree);

        const patientName = getDicomPatientName(fileTree);

        headerElem.innerText = `Downloading study of ${patientName}`;

        downloader.startDownload(fileList);
    } catch (error) {
        console.log("Failed to download");
        downloadStatus = "failed";
        return;
    }
}

function getDicomStudyInstanceId(fileTree) {
    return fileTree["studies"][0]["StudyInstanceUID"];
}

function getDicomPatientName(fileTree) {
    return fileTree["studies"][0]["PatientName"];
}

function getDownloadFileName(patientName, studyId, url) {
    const parts = url.split("file=");
    const fileName = parts[1].replace(/\//g, "");

    return `${patientName}-${studyId}/${fileName}.dcm`;
}

async function getFileTree(studyUrl) {
    try {
        const response = await fetch(studyUrl);
        if (!response.ok) {
            console.log("Could not get file tree");
            return null;
        }

        const fileTree = await response.json();

        return fileTree;
    } catch (error) {
        return null;
    }
}

function flattenFileTree(fileTree) {
    const studyId = getDicomStudyInstanceId(fileTree);
    const patientName = getDicomPatientName(fileTree);

    const fileList = [];

    fileTree.studies.forEach((study) => {
        study.series.forEach((series) => {
            const instanceUrls = series.instances.map((instance) => {
                const url = instance.url.replace("dicomweb:", "");
                const downloadFilename = getDownloadFileName(
                    patientName,
                    studyId,
                    url
                );
                return {
                    url: url,
                    filename: downloadFilename,
                };
            });
            fileList.push(...instanceUrls);
        });
    });

    return fileList;
}

async function monitor() {
    const progressElement = document.getElementById("progress-completed");
    const statusElem = document.getElementById("status");

    progressElement.style.width = downloader.getCompletedPercentage() + "%";

    if (downloadStatus === "failed") {
        statusElem.innerText = "Download failed";
        return;
    }

    if (downloader.getStatus() === "complete") {
        statusElem.innerText = `Downloads complete, ${
            downloader.getCompletedCount() - downloader.getFailedCount()
        } of ${downloader.getTotalCount()} files downloaded`;
        if (downloader.getFailedCount() > 0) {
            const errorElem = document.getElementById("error");
            errorElem.innerText = `failed to download ${downloader.getFailedCount()} files`;
        }
        const openButton = document.getElementById("open-button");
        openButton.removeAttribute("disabled");
        openButton.onclick = () => {
            downloader.show();
            window.close();
        };
        const cancelButton = document.getElementById("cancel-button");
        cancelButton.innerText = "Close";
        return;
    }

    if (downloader.getTotalCount() < 1) {
        statusElem.innerText = "Starting...";
    } else {
        statusElem.innerText = `${
            downloader.getCompletedCount() - downloader.getFailedCount()
        } of ${downloader.getTotalCount()} files downloaded`;
        if (downloader.getFailedCount() > 0) {
            const errorElem = document.getElementById("error");
            errorElem.innerText = `failed to download ${downloader.getFailedCount()} files`;
        }
    }

    setTimeout(() => {
        monitor();
    }, 100);
}
