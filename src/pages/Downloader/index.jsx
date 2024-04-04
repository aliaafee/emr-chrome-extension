import {
    flattenDicomFileTree,
    getDicomFileTree,
    getDicomPatientName,
} from "../../api/emr-api";
import Downloader from "./downloader";

const downloader = new Downloader();
var downloadStatus = "starting";

document.addEventListener("DOMContentLoaded", function () {
    monitor();

    downloadStudy(getStudyUrl());

    const cancelButton = document.getElementById("cancel-button");
    cancelButton.onclick = () => {
        downloader.cancel();
        window.close();
    };
});

function getStudyUrl() {
    const queryString = window.location.search;
    console.log(queryString);
    const urlParams = new URLSearchParams(queryString);

    console.log(urlParams.has("studyurl"));
    if (urlParams.has("studyurl")) {
        const studyUrl = urlParams.get("studyurl");
        return studyUrl;
    }

    return null;
}

async function downloadStudy(studyUrl) {
    const statusElem = document.getElementById("status");
    const headerElem = document.getElementById("header");

    try {
        const fileTree = await getDicomFileTree(studyUrl);

        console.log(fileTree);

        if (fileTree === null) {
            console.log("No files found");
            downloadStatus = "failed";
            return;
        }

        const fileList = flattenDicomFileTree(fileTree);

        const patientName = getDicomPatientName(fileTree);

        headerElem.innerText = `Downloading study of ${patientName}`;

        downloader.startDownload(fileList);
    } catch (error) {
        console.log("Failed to download");
        downloadStatus = "failed";
        return;
    }
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
