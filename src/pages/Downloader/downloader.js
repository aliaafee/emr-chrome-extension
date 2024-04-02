class DownloadWorker {
    constructor() {
        this.downloadId = null;
        this.downloadStarting = false;

        this.url = "";
        this.filename = "";
        this.isLastDownload = false;

        this.downloadIdToOpen = null;
    }

    startDownload(url, filename, conflictAction, isLastDownload = false) {
        this.downloadStarting = true;
        this.url = url;
        this.filename = filename;
        this.isLastDownload = isLastDownload;

        console.log(url);

        chrome.downloads.download(
            {
                url: url,
                filename: filename,
                conflictAction: conflictAction,
                saveAs: false,
            },
            (id) => {
                this.downloadStarting = false;
                this.downloadId = id;
            }
        );
    }

    async getStatus() {
        if (this.downloadStarting === true) {
            return "starting";
        }
        if (this.downloadId === null) {
            return "not_started";
        }
        try {
            const [thisDownload] = await chrome.downloads.search({
                id: this.downloadId,
            });
            return thisDownload.state;
        } catch (error) {
            return "not_found";
        }
    }

    show() {
        if (this.isLastDownload) {
            chrome.downloads.show(this.downloadIdToOpen);
            chrome.downloads.erase({ id: this.downloadIdToOpen });
            this.isLastDownload = false;
            this.downloadIdToOpen = null;
        }
    }

    cancel() {
        if (this.downloadId !== null) {
            chrome.downloads.erase({ id: this.downloadId });
            chrome.downloads.cancel(this.downloadId, () => {
                this.downloadId = null;
            });
        }
        if (this.downloadIdToOpen !== null) {
            chrome.downloads.erase({ id: this.downloadIdToOpen });
            chrome.downloads.cancel(this.downloadIdToOpen, () => {
                this.downloadIdToOpen = null;
            });
        }
    }

    async poll() {
        const status = await this.getStatus();

        if (status === "complete") {
            if (!this.isLastDownload) {
                chrome.downloads.erase({ id: this.downloadId });
            } else {
                this.downloadIdToOpen = this.downloadId;
            }
            this.downloadId = null;
            this.downloadStarting = false;
            return "complete";
        }

        if (status === "interrupted") {
            if (!this.isLastDownload) {
                chrome.downloads.erase({ id: this.downloadId });
            } else {
                this.downloadIdToOpen = this.downloadId;
            }
            this.downloadId = null;
            this.downloadStarting = false;
            return "interrupted";
        }

        return status;
    }
}

class Downloader {
    constructor() {
        this.fileList = [];

        this.workers = [];
        const workerCount = 10;
        for (let i = 0; i < workerCount; i++) {
            this.workers.push(new DownloadWorker());
        }

        this.totalCount = this.fileList.length;

        this.interrupted = [];
        this.complete = [];

        this.status = "not_started";
    }

    startDownload(fileList) {
        this.fileList = fileList;
        this.totalCount = this.fileList.length;

        chrome.downloads.setUiOptions({
            enabled: false,
        });

        this.status = "in_progress";

        this.poll();
    }

    getCompletedPercentage() {
        if (this.totalCount == 0) {
            return 0;
        }
        return Math.round((this.getCompletedCount() * 100) / this.totalCount);
    }

    getCompletedCount() {
        return this.complete.length + this.interrupted.length;
    }

    getFailedCount() {
        return this.interrupted.length;
    }

    getTotalCount() {
        return this.totalCount;
    }

    getStatus() {
        if (this.getTotalCount() < 1) {
            return "not_started";
        }
        return this.status;
    }

    show() {
        this.workers.forEach((worker) => {
            worker.show();
        });
    }

    cancel() {
        this.workers.forEach((worker) => {
            worker.cancel();
        });
    }

    async poll() {
        this.workers.forEach(async (worker) => {
            const status = await worker.poll();
            if (status === "in_progress" || status === "starting") {
                return;
            }
            if (status === "complete") {
                this.complete.push({
                    url: worker.url,
                    filename: worker.filename,
                });
            }
            if (status === "interrupted") {
                this.interrupted.push({
                    url: worker.url,
                    filename: worker.filename,
                });
            }
            if (
                status === "complete" ||
                status === "interrupted" ||
                status === "not_started" ||
                status === "not_found"
            ) {
                if (this.fileList.length < 1) {
                    return;
                }

                const nextDownload = this.fileList.pop();

                if (this.fileList.length < 1) {
                    worker.startDownload(
                        nextDownload.url,
                        nextDownload.filename,
                        "overwrite",
                        true
                    );
                    return;
                }

                worker.startDownload(
                    nextDownload.url,
                    nextDownload.filename,
                    "overwrite"
                );
            }
        });

        if (this.fileList.length < 1) {
            if (this.getCompletedCount() == this.getTotalCount()) {
                this.status = "complete";
                return;
            }
        }

        setTimeout(() => {
            this.poll();
        }, 100);
    }
}

export default Downloader;