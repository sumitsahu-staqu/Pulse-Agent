const {
    app,
    BrowserWindow,
    ipcMain,
    shell
} = require("electron");

const path = require("path");
const fs = require("fs");
const os = require("os");
const net = require("net");
const { spawn } = require("child_process");
const Store = require("electron-store");


// ============================================================
// GLOBAL STATE
// ============================================================

let mainWindow = null;
let workerProcess = null;
let workerLogs = [];
let store = null;


// ============================================================
// LOGGING
// ============================================================

function getLogDirectory() {
    return path.join(
        app.getPath("userData"),
        "logs"
    );
}


function getLogFile() {
    return path.join(
        getLogDirectory(),
        "agent.log"
    );
}


function writeAppLog(action, message) {
    try {
        const logDirectory =
            getLogDirectory();

        fs.mkdirSync(
            logDirectory,
            {
                recursive: true
            }
        );

        const entry = {
            time:
                new Date().toISOString(),

            action,

            message
        };

        fs.appendFileSync(
            getLogFile(),
            JSON.stringify(entry) + "\n",
            "utf8"
        );

    } catch (error) {
        console.error(
            "LOG_ERROR:",
            error.message
        );
    }
}


function readAppLogs() {
    try {
        const file =
            getLogFile();

        if (!fs.existsSync(file)) {
            return [];
        }

        const content =
            fs.readFileSync(
                file,
                "utf8"
            );

        return content
            .split("\n")
            .filter(
                (line) =>
                    line.trim() !== ""
            )
            .map((line) => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            })
            .filter(
                (entry) =>
                    entry !== null
            )
            .reverse();

    } catch (error) {
        console.error(
            "READ_LOG_ERROR:",
            error.message
        );

        return [];
    }
}


ipcMain.handle(
    "get-app-logs",
    async () => {
        return readAppLogs();
    }
);


ipcMain.handle(
    "open-log-folder",
    async () => {
        const directory =
            getLogDirectory();

        fs.mkdirSync(
            directory,
            {
                recursive: true
            }
        );

        const result =
            await shell.openPath(
                directory
            );

        return {
            success:
                result === "",

            error:
                result || null
        };
    }
);


// ============================================================
// EFFECTIVE APP VERSION
// ============================================================

function getEffectiveAppVersion() {
    if (store) {
        const simulatedVersion =
            store.get(
                "simulatedVersion",
                null
            );

        if (simulatedVersion) {
            return simulatedVersion;
        }
    }

    return app.getVersion();
}


// ============================================================
// CREATE WINDOW
// ============================================================

function createWindow() {
    mainWindow =
        new BrowserWindow({
            width: 1100,
            height: 750,

            webPreferences: {
                preload:
                    path.join(
                        __dirname,
                        "preload.js"
                    ),

                contextIsolation:
                    true,

                nodeIntegration:
                    false
            }
        });

    mainWindow.loadURL(
        "http://localhost:5173"
    );
}


// ============================================================
// SYSTEM INFORMATION
// ============================================================

ipcMain.handle(
    "get-system-info",
    async () => {
        return {
            hostname:
                os.hostname(),

            platform:
                os.platform(),

            architecture:
                os.arch(),

            cpuCount:
                os.cpus().length,

            totalMemory:
                os.totalmem(),

            freeMemory:
                os.freemem(),

            appVersion:
                getEffectiveAppVersion()
        };
    }
);


// ============================================================
// ENDPOINT STORAGE
// ============================================================

function getEndpoints() {
    return store.get(
        "endpoints",
        []
    );
}


function saveEndpoints(endpoints) {
    store.set(
        "endpoints",
        endpoints
    );
}


// ============================================================
// GET ENDPOINTS
// ============================================================

ipcMain.handle(
    "get-endpoints",
    async () => {
        return getEndpoints();
    }
);


// ============================================================
// ADD ENDPOINT
// ============================================================

ipcMain.handle(
    "add-endpoint",
    async (
        event,
        endpoint
    ) => {

        const name =
            String(
                endpoint.name || ""
            ).trim();

        const host =
            String(
                endpoint.host || ""
            ).trim();

        const port =
            Number(
                endpoint.port
            );

        if (!name) {
            return {
                success: false,
                error:
                    "Endpoint name is required"
            };
        }

        if (!host) {
            return {
                success: false,
                error:
                    "Host is required"
            };
        }

        if (
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535
        ) {
            return {
                success: false,
                error:
                    "Port must be between 1 and 65535"
            };
        }

        const endpoints =
            getEndpoints();

        const newEndpoint = {
            id:
                Date.now().toString(),

            name,

            host,

            port,

            status:
                "Not Checked",

            latency:
                null
        };

        endpoints.push(
            newEndpoint
        );

        saveEndpoints(
            endpoints
        );

        return {
            success: true,
            endpoint:
                newEndpoint
        };
    }
);


// ============================================================
// UPDATE ENDPOINT
// ============================================================

ipcMain.handle(
    "update-endpoint",
    async (
        event,
        endpoint
    ) => {

        const name =
            String(
                endpoint.name || ""
            ).trim();

        const host =
            String(
                endpoint.host || ""
            ).trim();

        const port =
            Number(
                endpoint.port
            );

        if (!name) {
            return {
                success: false,
                error:
                    "Endpoint name is required"
            };
        }

        if (!host) {
            return {
                success: false,
                error:
                    "Host is required"
            };
        }

        if (
            !Number.isInteger(port) ||
            port < 1 ||
            port > 65535
        ) {
            return {
                success: false,
                error:
                    "Port must be between 1 and 65535"
            };
        }

        const endpoints =
            getEndpoints();

        const index =
            endpoints.findIndex(
                (item) =>
                    item.id === endpoint.id
            );

        if (index === -1) {
            return {
                success: false,
                error:
                    "Endpoint not found"
            };
        }

        endpoints[index] = {
            ...endpoints[index],

            name,

            host,

            port,

            status:
                "Not Checked",

            latency:
                null
        };

        saveEndpoints(
            endpoints
        );

        return {
            success: true,
            endpoint:
                endpoints[index]
        };
    }
);


// ============================================================
// DELETE ENDPOINT
// ============================================================

ipcMain.handle(
    "delete-endpoint",
    async (
        event,
        id
    ) => {

        const endpoints =
            getEndpoints();

        const filtered =
            endpoints.filter(
                (endpoint) =>
                    endpoint.id !== id
            );

        saveEndpoints(
            filtered
        );

        return {
            success: true
        };
    }
);


// ============================================================
// TCP ENDPOINT CHECK
// ============================================================

function checkTcpEndpoint(
    host,
    port
) {
    return new Promise(
        (resolve) => {

            const socket =
                new net.Socket();

            const startTime =
                Date.now();

            let finished =
                false;


            const finish =
                (result) => {

                    if (finished) {
                        return;
                    }

                    finished = true;

                    socket.destroy();

                    resolve(result);
                };


            socket.setTimeout(
                2000
            );


            socket.once(
                "connect",
                () => {

                    const latency =
                        Date.now() -
                        startTime;

                    finish({
                        success: true,

                        status:
                            "Online",

                        latency
                    });
                }
            );


            socket.once(
                "error",
                (error) => {

                    finish({
                        success: false,

                        status:
                            "Unreachable",

                        latency:
                            null,

                        error:
                            error.message
                    });
                }
            );


            socket.once(
                "timeout",
                () => {

                    finish({
                        success: false,

                        status:
                            "Unreachable",

                        latency:
                            null,

                        error:
                            "Connection timed out"
                    });
                }
            );


            socket.connect(
                port,
                host
            );
        }
    );
}


// ============================================================
// CHECK ONE ENDPOINT
// ============================================================

ipcMain.handle(
    "check-endpoint",
    async (
        event,
        id
    ) => {

        const endpoints =
            getEndpoints();

        const endpoint =
            endpoints.find(
                (item) =>
                    item.id === id
            );

        if (!endpoint) {
            return {
                success: false,
                error:
                    "Endpoint not found"
            };
        }

        const result =
            await checkTcpEndpoint(
                endpoint.host,
                endpoint.port
            );


        endpoint.status =
            result.status;

        endpoint.latency =
            result.latency;


        saveEndpoints(
            endpoints
        );


        if (result.success) {

            writeAppLog(
                "HEALTH_OK",

                `${endpoint.name} (${endpoint.host}:${endpoint.port}) is Online - ${result.latency} ms`
            );

        } else {

            writeAppLog(
                "HEALTH_FAIL",

                `${endpoint.name} (${endpoint.host}:${endpoint.port}) is Unreachable - ${result.error}`
            );
        }


        return {
            success: true,

            endpoint
        };
    }
);


// ============================================================
// CHECK ALL ENDPOINTS
// ============================================================

ipcMain.handle(
    "check-all-endpoints",
    async () => {

        const endpoints =
            getEndpoints();

        const results =
            await Promise.all(
                endpoints.map(
                    async (endpoint) => {

                        const result =
                            await checkTcpEndpoint(
                                endpoint.host,
                                endpoint.port
                            );


                        endpoint.status =
                            result.status;

                        endpoint.latency =
                            result.latency;


                        if (
                            result.success
                        ) {

                            writeAppLog(
                                "HEALTH_OK",

                                `${endpoint.name} (${endpoint.host}:${endpoint.port}) is Online - ${result.latency} ms`
                            );

                        } else {

                            writeAppLog(
                                "HEALTH_FAIL",

                                `${endpoint.name} (${endpoint.host}:${endpoint.port}) is Unreachable - ${result.error}`
                            );
                        }


                        return endpoint;
                    }
                )
            );


        saveEndpoints(
            endpoints
        );


        return {
            success: true,

            endpoints:
                results
        };
    }
);


// ============================================================
// WORKER LOG HELPERS
// ============================================================

function sendWorkerLog(line) {

    if (mainWindow) {

        mainWindow.webContents.send(
            "worker-log",
            line
        );
    }
}


function sendWorkerStatus(status) {

    if (mainWindow) {

        mainWindow.webContents.send(
            "worker-status",
            status
        );
    }
}


// ============================================================
// START WORKER
// ============================================================

function startWorker() {

    if (workerProcess) {

        return {
            success: false,

            error:
                "Worker is already running"
        };
    }


    const workerPath =
        path.join(
            __dirname,
            "worker-script.js"
        );


    workerLogs = [];


    workerProcess =
        spawn(
            process.execPath,

            [
                workerPath
            ],

            {
                env: {
                    ...process.env,

                    ELECTRON_RUN_AS_NODE:
                        "1"
                },

                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ],

                windowsHide:
                    true
            }
        );


    writeAppLog(
        "WORKER_START",

        `Worker started with PID ${workerProcess.pid}`
    );


    sendWorkerStatus({
        running: true,

        pid:
            workerProcess.pid
    });


    workerProcess.stdout.on(
        "data",
        (data) => {

            const lines =
                data
                    .toString()
                    .split("\n")
                    .filter(
                        (line) =>
                            line.trim() !== ""
                    );


            lines.forEach(
                (line) => {

                    workerLogs.push(
                        line
                    );


                    if (
                        workerLogs.length >
                        50
                    ) {
                        workerLogs.shift();
                    }


                    sendWorkerLog(
                        line
                    );
                }
            );
        }
    );


    workerProcess.stderr.on(
        "data",
        (data) => {

            const lines =
                data
                    .toString()
                    .split("\n")
                    .filter(
                        (line) =>
                            line.trim() !== ""
                    );


            lines.forEach(
                (line) => {

                    workerLogs.push(
                        `ERROR: ${line}`
                    );


                    if (
                        workerLogs.length >
                        50
                    ) {
                        workerLogs.shift();
                    }


                    sendWorkerLog(
                        `ERROR: ${line}`
                    );
                }
            );
        }
    );


    workerProcess.on(
        "exit",
        (
            code,
            signal
        ) => {

            const pid =
                workerProcess
                    ? workerProcess.pid
                    : null;


            workerProcess =
                null;


            sendWorkerStatus({
                running: false,

                pid: null
            });


            sendWorkerLog(
                `WORKER_EXIT code=${code} signal=${signal}`
            );


            if (pid) {

                writeAppLog(
                    "WORKER_STOP",

                    `Worker stopped. PID ${pid}`
                );
            }
        }
    );


    return {
        success: true,

        pid:
            workerProcess.pid
    };
}


// ============================================================
// STOP WORKER
// ============================================================

function stopWorker() {

    if (!workerProcess) {

        return {
            success: false,

            error:
                "Worker is not running"
        };
    }


    const pid =
        workerProcess.pid;


    workerProcess.kill();


    writeAppLog(
        "WORKER_STOP",

        `Worker stop requested. PID ${pid}`
    );


    return {
        success: true
    };
}


// ============================================================
// WORKER IPC
// ============================================================

ipcMain.handle(
    "start-worker",
    async () => {

        return startWorker();
    }
);


ipcMain.handle(
    "stop-worker",
    async () => {

        return stopWorker();
    }
);


ipcMain.handle(
    "get-worker-status",
    async () => {

        if (!workerProcess) {

            return {
                running: false,

                pid: null,

                logs:
                    workerLogs
            };
        }


        return {
            running: true,

            pid:
                workerProcess.pid,

            logs:
                workerLogs
        };
    }
);


// ============================================================
// UPDATE FILE PATHS
// ============================================================

function getUpdateFixturePath() {

    return path.join(
        __dirname,
        "..",
        "update-fixture.json"
    );
}


function getUpdatePayloadPath() {

    return path.join(
        __dirname,
        "..",
        "update-payload.txt"
    );
}


function getDownloadedUpdatePath() {

    return path.join(
        app.getPath("userData"),
        "update-payload.txt"
    );
}


// ============================================================
// VERSION COMPARISON
// ============================================================

function compareVersions(
    versionA,
    versionB
) {

    const a =
        String(versionA)
            .split(".")
            .map(Number);

    const b =
        String(versionB)
            .split(".")
            .map(Number);


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const partA =
            a[i] || 0;

        const partB =
            b[i] || 0;


        if (partA > partB) {
            return 1;
        }


        if (partA < partB) {
            return -1;
        }
    }


    return 0;
}


// ============================================================
// CHECK FOR UPDATE
// ============================================================

ipcMain.handle(
    "check-for-update",
    async () => {

        try {

            const fixturePath =
                getUpdateFixturePath();


            if (
                !fs.existsSync(
                    fixturePath
                )
            ) {

                return {
                    success: false,

                    error:
                        "Update fixture not found"
                };
            }


            const fixture =
                JSON.parse(
                    fs.readFileSync(
                        fixturePath,
                        "utf8"
                    )
                );


            const currentVersion =
                getEffectiveAppVersion();


            const latestVersion =
                fixture.version;


            const updateAvailable =
                compareVersions(
                    latestVersion,
                    currentVersion
                ) > 0;


            writeAppLog(
                "UPDATE_CHECK",

                `Checked for updates. Current: ${currentVersion}, Latest: ${latestVersion}, Available: ${updateAvailable}`
            );


            return {
                success: true,

                currentVersion,

                latestVersion,

                updateAvailable,

                notes:
                    fixture.notes || []
            };

        } catch (error) {

            return {
                success: false,

                error:
                    error.message
            };
        }
    }
);


// ============================================================
// DOWNLOAD UPDATE
// ============================================================

ipcMain.handle(
    "download-update",
    async () => {

        try {

            const fixturePath =
                getUpdateFixturePath();


            if (
                !fs.existsSync(
                    fixturePath
                )
            ) {

                return {
                    success: false,

                    error:
                        "Update fixture not found"
                };
            }


            const fixture =
                JSON.parse(
                    fs.readFileSync(
                        fixturePath,
                        "utf8"
                    )
                );


            const currentVersion =
                getEffectiveAppVersion();


            if (
                compareVersions(
                    fixture.version,
                    currentVersion
                ) <= 0
            ) {

                return {
                    success: false,

                    error:
                        "No newer update is available"
                };
            }


            // Simulated download progress
            for (
                let progress = 0;
                progress <= 100;
                progress += 10
            ) {

                if (mainWindow) {

                    mainWindow.webContents.send(
                        "update-progress",
                        progress
                    );
                }


                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            150
                        )
                );
            }


            const source =
                getUpdatePayloadPath();


            const destination =
                getDownloadedUpdatePath();


            if (
                fs.existsSync(
                    source
                )
            ) {

                fs.copyFileSync(
                    source,
                    destination
                );

            } else {

                fs.writeFileSync(
                    destination,

                    `Pulse Agent ${fixture.version} dummy update package`,
                    "utf8"
                );
            }


            store.set(
                "downloadedUpdateVersion",
                fixture.version
            );


            writeAppLog(
                "UPDATE_DOWNLOAD",

                `Downloaded update ${fixture.version}`
            );


            return {
                success: true,

                version:
                    fixture.version
            };

        } catch (error) {

            return {
                success: false,

                error:
                    error.message
            };
        }
    }
);


// ============================================================
// APPLY UPDATE
// ============================================================

ipcMain.handle(
    "apply-update",
    async () => {

        try {

            const downloadedVersion =
                store.get(
                    "downloadedUpdateVersion",
                    null
                );


            if (!downloadedVersion) {

                return {
                    success: false,

                    error:
                        "No downloaded update found"
                };
            }


            // Remember the simulated version.
            // This makes the UI show the new
            // version after the application restarts.
            store.set(
                "simulatedVersion",
                downloadedVersion
            );


            // Save this so the renderer can
            // display the success banner after restart.
            store.set(
                "pendingUpdateVersion",
                downloadedVersion
            );


            // The downloaded update has now
            // been consumed by the simulated
            // update process.
            store.delete(
                "downloadedUpdateVersion"
            );


            writeAppLog(
                "UPDATE_APPLY",

                `Applying update ${downloadedVersion}`
            );


            setTimeout(
                () => {

                    app.relaunch();

                    app.exit(0);

                },
                500
            );


            return {
                success: true,

                version:
                    downloadedVersion
            };

        } catch (error) {

            return {
                success: false,

                error:
                    error.message
            };
        }
    }
);


// ============================================================
// PENDING UPDATE
// ============================================================

ipcMain.handle(
    "get-pending-update",
    async () => {

        const version =
            store.get(
                "pendingUpdateVersion",
                null
            );


        if (version) {

            store.delete(
                "pendingUpdateVersion"
            );
        }


        return version;
    }
);


// ============================================================
// APPLICATION READY
// ============================================================

app.whenReady().then(
    () => {

        store =
            new Store({
                defaults: {

                    endpoints: [

                        {
                            id:
                                "default-1",

                            name:
                                "Example HTTPS",

                            host:
                                "example.com",

                            port:
                                443,

                            status:
                                "Not Checked",

                            latency:
                                null
                        },


                        {
                            id:
                                "default-2",

                            name:
                                "Cloudflare DNS",

                            host:
                                "1.1.1.1",

                            port:
                                443,

                            status:
                                "Not Checked",

                            latency:
                                null
                        },


                        {
                            id:
                                "default-3",

                            name:
                                "Local Test",

                            host:
                                "127.0.0.1",

                            port:
                                9,

                            status:
                                "Not Checked",

                            latency:
                                null
                        }

                    ]
                }
            });


        writeAppLog(
            "APP_START",

            `Pulse Agent ${getEffectiveAppVersion()} started`
        );


        createWindow();
    }
);


// ============================================================
// BEFORE QUIT
// ============================================================

app.on(
    "before-quit",
    () => {

        if (workerProcess) {

            workerProcess.kill();

            workerProcess =
                null;
        }
    }
);


// ============================================================
// MACOS WINDOW BEHAVIOR
// ============================================================

app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !==
            "darwin"
        ) {

            app.quit();
        }
    }
);