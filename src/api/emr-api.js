import dayjs from "dayjs";

const fileServerUrl = "http://10.10.10.197:4000";
const viewerUrl = "http://10.10.10.91:3000";

async function getActiveTab() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab;
}

async function getCurrentPatientId(tabId = null) {
    try {  
        console.log(`Tab ID is ${tabId}`);
        const activeTabId = (tabId === null) ? (
            (await getActiveTab()).id
        ) : (
            tabId
        );

        return await chrome.tabs.sendMessage(
            activeTabId,
            {
                "action": "getCurrentPatientId"
            }
        );
    } catch (error) {
        return null
    }
}

async function getResource(path, tabId = null) {
    try {
        const activeTabId = (tabId == null) ? (
            (await getActiveTab()).id
        ) : (
            tabId
        );

        const response = await chrome.tabs.sendMessage(
            activeTabId,
            {
                "action": "getResource",
                "path": path
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get resource, ${response.status}, ${response.statusText}`,
                {
                    cause: response
                }
            )
        }

        return response.data

    } catch (error) {
        throw new Error(
            `Could not get resource, ${error.message}`,
            {
                cause: error
            }
        )
    }
}


async function getText(path, tabId = null) {
    try {
        const activeTabId = (tabId == null) ? (
            (await getActiveTab()).id
        ) : (
            tabId
        );

        const response = await chrome.tabs.sendMessage(
            activeTabId,
            {
                "action": "getText",
                "path": path
            }
        );

        if (!response.ok) {
            throw new Error(
                `Failed to get resource text, ${response.status}, ${response.statusText}`,
                {
                    cause: response
                }
            )
        }

        return response.text

    } catch (error) {
        throw new Error(
            `Could not get resourcem text, ${error.message}`,
            {
                cause: error
            }
        )
    }
}


const getRadiologyStudyUrl = (study) => {
    const studyDate = new Date(study.studyDate);

    return `${fileServerUrl}/zfpviewer/api/download?file=/zfp/${studyDate.getFullYear()}/${
        studyDate.getMonth() + 1
    }/${studyDate.getDate()}/${study.studyUid}.json`;
};

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

async function getDicomFileTree(studyUrl) {
    try {
        const response = await fetch(studyUrl);
        if (!response.ok) {
            throw new Error(
                `Failed to get study details, ${response.status} ${response.statusText}`,
                {
                    cause: response
                }
            )
        }

        const fileTree = await response.json();

        return fileTree;
    } catch (error) {
        throw new Error(error.message);
    }
}

function flattenDicomFileTree(fileTree) {
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

const parseDate = (stringDateTime) =>
    dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A");

const formateDateTime = (stringDateTime) =>
    dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A").format(
        "DD/MM/YYYY HH:mm:ss"
    );

const formateDate = (stringDateTime) =>
    dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A").format("DD/MM/YYYY");

const formateTime = (stringDateTime) =>
    dayjs(stringDateTime, "MMM D, YYYY h:mm:ss A").format("HH:mm:ss");

export {
    getActiveTab,
    getCurrentPatientId,
    getResource,
    getText,
    viewerUrl,
    fileServerUrl,
    getRadiologyStudyUrl,
    getDicomFileTree,
    flattenDicomFileTree,
    getDicomPatientName,
    parseDate,
    formateDateTime,
    formateDate,
    formateTime
};


// export default {
//     getActiveTab: getActiveTab,
//     getCurrentPatientId: getCurrentPatientId,
//     getResource: getResource
// }