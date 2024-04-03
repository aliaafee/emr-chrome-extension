
var downloadUrlToWindows = {};
var windowsToDownloadUrls = {};

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if( request.action === "downloadFilelist") {
            downloadFileList(request.fileList);
        }
        if( request.action === "downloadStudy") {
            downloadStudy(request.studyUrl);
        }
    }
);

chrome.windows.onRemoved.addListener(
    function(windowId) {
        if (windowId in windowsToDownloadUrls) {
            delete downloadUrlToWindows[windowsToDownloadUrls[windowId]];
            delete windowsToDownloadUrls[windowId];
        }
        console.log(Object.keys(windowsToDownloadUrls));
        if (Object.keys(windowsToDownloadUrls).length < 1) {
            chrome.downloads.setUiOptions({
                enabled: true
            });
        }
    }
)

async function downloadFileList(fileList) {
    console.log("Downloading file list");

    fileList.forEach((item) => {
        console.log(item.url, item.filename);
        chrome.downloads.download(
            {
                url: item.url, 
                filename: item.filename, 
                conflictAction: "overwrite"
            },
            function(id) {
                console.log(id);
            }
        );
    })
}

async function downloadStudy(studyUrl) {
    console.log("Download study " + studyUrl);

    if (studyUrl in downloadUrlToWindows) {
        const windowId = downloadUrlToWindows[studyUrl];
        var updateProperties = {'focused': true , "drawAttention": true};
        chrome.windows.update(windowId, updateProperties, () => { });
        
        return;
    }

    chrome.windows.create({
        url: chrome.runtime.getURL(`downloader.html?studyurl=${encodeURIComponent(studyUrl)}`),
        width: 400,
        height: 170,
        type: "popup"
    }, (window) => {});
}
