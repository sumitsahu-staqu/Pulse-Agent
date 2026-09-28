const {
    contextBridge,
    ipcRenderer
} = require("electron");


contextBridge.exposeInMainWorld(
    "api",
    {

        /*
            ====================
            SYSTEM
            ====================
        */

        getSystemInfo: () =>
            ipcRenderer.invoke(
                "get-system-info"
            ),


        /*
            ====================
            ENDPOINTS
            ====================
        */

        getEndpoints: () =>
            ipcRenderer.invoke(
                "get-endpoints"
            ),


        addEndpoint: (
            endpoint
        ) =>
            ipcRenderer.invoke(
                "add-endpoint",
                endpoint
            ),


        updateEndpoint: (
            endpoint
        ) =>
            ipcRenderer.invoke(
                "update-endpoint",
                endpoint
            ),


        deleteEndpoint: (
            id
        ) =>
            ipcRenderer.invoke(
                "delete-endpoint",
                id
            ),


        checkEndpoint: (
            id
        ) =>
            ipcRenderer.invoke(
                "check-endpoint",
                id
            ),


        checkAllEndpoints: () =>
            ipcRenderer.invoke(
                "check-all-endpoints"
            ),


        /*
            ====================
            WORKER
            ====================
        */

        startWorker: () =>
            ipcRenderer.invoke(
                "start-worker"
            ),


        stopWorker: () =>
            ipcRenderer.invoke(
                "stop-worker"
            ),


        getWorkerStatus: () =>
            ipcRenderer.invoke(
                "get-worker-status"
            ),


        /*
            ====================
            APPLICATION LOGS
            ====================
        */

        getAppLogs: () =>
            ipcRenderer.invoke(
                "get-app-logs"
            ),


        openLogFolder: () =>
            ipcRenderer.invoke(
                "open-log-folder"
            ),


        /*
            ====================
            AUTO UPDATE
            ====================
        */

        checkForUpdate: () =>
            ipcRenderer.invoke(
                "check-for-update"
            ),


        downloadUpdate: () =>
            ipcRenderer.invoke(
                "download-update"
            ),


        applyUpdate: () =>
            ipcRenderer.invoke(
                "apply-update"
            ),


        getPendingUpdate: () =>
            ipcRenderer.invoke(
                "get-pending-update"
            ),


        onUpdateProgress: (
            callback
        ) => {

            const listener =
                (
                    event,
                    progress
                ) =>
                    callback(progress);


            ipcRenderer.on(
                "update-progress",
                listener
            );


            return () => {

                ipcRenderer.removeListener(
                    "update-progress",
                    listener
                );
            };
        },


        /*
            ====================
            WORKER LOG LISTENER
            ====================
        */

        onWorkerLog: (
            callback
        ) => {

            const listener =
                (
                    event,
                    line
                ) =>
                    callback(line);


            ipcRenderer.on(
                "worker-log",
                listener
            );


            return () => {

                ipcRenderer.removeListener(
                    "worker-log",
                    listener
                );
            };
        },


        /*
            ====================
            WORKER STATUS LISTENER
            ====================
        */

        onWorkerStatus: (
            callback
        ) => {

            const listener =
                (
                    event,
                    status
                ) =>
                    callback(status);


            ipcRenderer.on(
                "worker-status",
                listener
            );


            return () => {

                ipcRenderer.removeListener(
                    "worker-status",
                    listener
                );
            };
        }
    }
);