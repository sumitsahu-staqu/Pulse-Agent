import { useEffect, useMemo, useState } from "react";

const NAV_ITEMS = [
    {
        id: "overview",
        label: "Overview",
        icon: "⌂"
    },
    {
        id: "endpoints",
        label: "Endpoints",
        icon: "◉"
    },
    {
        id: "worker",
        label: "Worker",
        icon: "⚙"
    },
    {
        id: "updates",
        label: "Updates",
        icon: "↻"
    },
    {
        id: "logs",
        label: "Logs",
        icon: "≡"
    }
];


function App() {
    // ============================================================
    // GENERAL
    // ============================================================

    const [activeTab, setActiveTab] =
        useState("overview");

    const [systemInfo, setSystemInfo] =
        useState(null);

    const [loadingSystemInfo, setLoadingSystemInfo] =
        useState(false);

    const [appLogs, setAppLogs] =
        useState([]);

    const [notification, setNotification] =
        useState(null);


    // ============================================================
    // ENDPOINTS
    // ============================================================

    const [endpoints, setEndpoints] =
        useState([]);

    const [endpointName, setEndpointName] =
        useState("");

    const [endpointHost, setEndpointHost] =
        useState("");

    const [endpointPort, setEndpointPort] =
        useState("");

    const [editingId, setEditingId] =
        useState(null);

    const [editName, setEditName] =
        useState("");

    const [editHost, setEditHost] =
        useState("");

    const [editPort, setEditPort] =
        useState("");

    const [checkingId, setCheckingId] =
        useState(null);

    const [checkingAll, setCheckingAll] =
        useState(false);


    // ============================================================
    // WORKER
    // ============================================================

    const [workerRunning, setWorkerRunning] =
        useState(false);

    const [workerPid, setWorkerPid] =
        useState(null);

    const [workerLogs, setWorkerLogs] =
        useState([]);

    const [workerLoading, setWorkerLoading] =
        useState(false);


    // ============================================================
    // UPDATES
    // ============================================================

    const [updateInfo, setUpdateInfo] =
        useState(null);

    const [updateChecking, setUpdateChecking] =
        useState(false);

    const [updateDownloading, setUpdateDownloading] =
        useState(false);

    const [updateProgress, setUpdateProgress] =
        useState(0);

    const [updatedBanner, setUpdatedBanner] =
        useState(null);


    // ============================================================
    // INITIAL LOAD
    // ============================================================

    useEffect(() => {
        loadSystemInfo();
        loadEndpoints();
        loadAppLogs();
        loadWorkerStatus();
        loadPendingUpdate();


        const cleanupWorkerLog =
            window.api.onWorkerLog(
                (line) => {
                    setWorkerLogs(
                        (previous) => [
                            ...previous,
                            line
                        ].slice(-50)
                    );
                }
            );


        const cleanupWorkerStatus =
            window.api.onWorkerStatus(
                (status) => {
                    setWorkerRunning(
                        status.running
                    );

                    setWorkerPid(
                        status.pid
                    );

                    if (
                        !status.running
                    ) {
                        setWorkerLoading(
                            false
                        );
                    }
                }
            );


        const cleanupUpdateProgress =
            window.api.onUpdateProgress(
                (progress) => {
                    setUpdateProgress(
                        progress
                    );
                }
            );


        return () => {
            cleanupWorkerLog();
            cleanupWorkerStatus();
            cleanupUpdateProgress();
        };
    }, []);


    // ============================================================
    // NOTIFICATION
    // ============================================================

    function showNotification(
        message,
        type = "success"
    ) {
        setNotification({
            message,
            type
        });

        setTimeout(() => {
            setNotification(null);
        }, 3500);
    }


    // ============================================================
    // SYSTEM INFO
    // ============================================================

    async function loadSystemInfo() {
        try {
            setLoadingSystemInfo(true);

            const result =
                await window.api.getSystemInfo();

            setSystemInfo(result);

        } catch (error) {
            showNotification(
                "Unable to load system information",
                "error"
            );
        } finally {
            setLoadingSystemInfo(false);
        }
    }


    // ============================================================
    // ENDPOINTS
    // ============================================================

    async function loadEndpoints() {
        try {
            const result =
                await window.api.getEndpoints();

            setEndpoints(result || []);

        } catch (error) {
            showNotification(
                "Unable to load endpoints",
                "error"
            );
        }
    }


    async function addEndpoint(
        event
    ) {
        event.preventDefault();

        const result =
            await window.api.addEndpoint({
                name:
                    endpointName,

                host:
                    endpointHost,

                port:
                    endpointPort
            });


        if (!result.success) {
            showNotification(
                result.error,
                "error"
            );

            return;
        }


        setEndpointName("");
        setEndpointHost("");
        setEndpointPort("");


        await loadEndpoints();
        await loadAppLogs();


        showNotification(
            "Endpoint added successfully"
        );
    }


    function beginEdit(
        endpoint
    ) {
        setEditingId(
            endpoint.id
        );

        setEditName(
            endpoint.name
        );

        setEditHost(
            endpoint.host
        );

        setEditPort(
            String(endpoint.port)
        );
    }


    function cancelEdit() {
        setEditingId(null);
        setEditName("");
        setEditHost("");
        setEditPort("");
    }


    async function saveEdit(
        id
    ) {
        const result =
            await window.api.updateEndpoint({
                id,

                name:
                    editName,

                host:
                    editHost,

                port:
                    editPort
            });


        if (!result.success) {
            showNotification(
                result.error,
                "error"
            );

            return;
        }


        cancelEdit();

        await loadEndpoints();
        await loadAppLogs();


        showNotification(
            "Endpoint updated"
        );
    }


    async function deleteEndpoint(
        id
    ) {
        const confirmed =
            window.confirm(
                "Delete this endpoint?"
            );

        if (!confirmed) {
            return;
        }


        const result =
            await window.api.deleteEndpoint(
                id
            );


        if (!result.success) {
            showNotification(
                result.error,
                "error"
            );

            return;
        }


        await loadEndpoints();
        await loadAppLogs();


        showNotification(
            "Endpoint deleted"
        );
    }


    async function checkEndpoint(
        id
    ) {
        try {
            setCheckingId(id);

            const result =
                await window.api.checkEndpoint(
                    id
                );


            if (!result.success) {
                showNotification(
                    result.error,
                    "error"
                );

                return;
            }


            await loadEndpoints();
            await loadAppLogs();

        } finally {
            setCheckingId(null);
        }
    }


    async function checkAllEndpoints() {
        try {
            setCheckingAll(true);

            const result =
                await window.api.checkAllEndpoints();


            if (!result.success) {
                showNotification(
                    result.error,
                    "error"
                );

                return;
            }


            setEndpoints(
                result.endpoints || []
            );

            await loadAppLogs();

            showNotification(
                "All endpoints checked"
            );

        } finally {
            setCheckingAll(false);
        }
    }


    // ============================================================
    // WORKER
    // ============================================================

    async function loadWorkerStatus() {
        const status =
            await window.api.getWorkerStatus();


        setWorkerRunning(
            status.running
        );

        setWorkerPid(
            status.pid
        );

        setWorkerLogs(
            status.logs || []
        );
    }


    async function startWorker() {
        try {
            setWorkerLoading(true);

            setWorkerLogs([]);


            const result =
                await window.api.startWorker();


            if (!result.success) {
                showNotification(
                    result.error,
                    "error"
                );

                return;
            }


            setWorkerRunning(true);
            setWorkerPid(result.pid);


            await loadAppLogs();


            showNotification(
                "Worker started"
            );

        } finally {
            setWorkerLoading(false);
        }
    }


    async function stopWorker() {
        try {
            setWorkerLoading(true);

            const result =
                await window.api.stopWorker();


            if (!result.success) {
                showNotification(
                    result.error,
                    "error"
                );

                return;
            }


            await loadAppLogs();

            showNotification(
                "Worker stop requested"
            );

        } finally {
            setWorkerLoading(false);
        }
    }


    // ============================================================
    // LOGS
    // ============================================================

    async function loadAppLogs() {
        const result =
            await window.api.getAppLogs();

        setAppLogs(
            result || []
        );
    }


    async function openLogFolder() {
        const result =
            await window.api.openLogFolder();


        if (!result.success) {
            showNotification(
                result.error ||
                    "Unable to open log folder",
                "error"
            );

            return;
        }


        showNotification(
            "Log folder opened"
        );
    }


    // ============================================================
    // UPDATES
    // ============================================================

    async function loadPendingUpdate() {
        const version =
            await window.api.getPendingUpdate();


        if (version) {
            setUpdatedBanner(
                version
            );
        }
    }


    async function checkForUpdate() {
        try {
            setUpdateChecking(true);

            const result =
                await window.api.checkForUpdate();


            if (!result.success) {
                showNotification(
                    result.error,
                    "error"
                );

                return;
            }


            setUpdateInfo(result);

            await loadAppLogs();


            if (
                result.updateAvailable
            ) {
                showNotification(
                    `Version ${result.latestVersion} is available`
                );
            } else {
                showNotification(
                    "You're already up to date"
                );
            }

        } finally {
            setUpdateChecking(false);
        }
    }


    async function downloadUpdate() {
        try {
            setUpdateDownloading(true);
            setUpdateProgress(0);


            const result =
                await window.api.downloadUpdate();


            if (!result.success) {
                showNotification(
                    result.error,
                    "error"
                );

                return;
            }


            await loadAppLogs();


            showNotification(
                `Version ${result.version} downloaded`
            );

        } finally {
            setUpdateDownloading(false);
        }
    }


    async function applyUpdate() {
        if (
            updateProgress < 100
        ) {
            return;
        }


        const result =
            await window.api.applyUpdate();


        if (!result.success) {
            showNotification(
                result.error,
                "error"
            );

            return;
        }


        showNotification(
            "Applying update..."
        );
    }


    // ============================================================
    // HELPERS
    // ============================================================

    function formatBytes(
        bytes
    ) {
        if (
            bytes === undefined ||
            bytes === null
        ) {
            return "—";
        }


        const units = [
            "B",
            "KB",
            "MB",
            "GB",
            "TB"
        ];

        let value = bytes;
        let unitIndex = 0;


        while (
            value >= 1024 &&
            unitIndex <
                units.length - 1
        ) {
            value /= 1024;
            unitIndex++;
        }


        return `${value.toFixed(
            unitIndex === 0 ? 0 : 1
        )} ${units[unitIndex]}`;
    }


    function formatTime(
        value
    ) {
        if (!value) {
            return "—";
        }


        return new Date(
            value
        ).toLocaleString();
    }


    function statusClass(
        status
    ) {
        if (
            status === "Online"
        ) {
            return "status-online";
        }


        if (
            status === "Unreachable"
        ) {
            return "status-offline";
        }


        return "status-neutral";
    }


    const onlineCount =
        useMemo(
            () =>
                endpoints.filter(
                    (item) =>
                        item.status ===
                        "Online"
                ).length,
            [endpoints]
        );


    const offlineCount =
        useMemo(
            () =>
                endpoints.filter(
                    (item) =>
                        item.status ===
                        "Unreachable"
                ).length,
            [endpoints]
        );


    const healthPercentage =
        endpoints.length > 0
            ? Math.round(
                  (onlineCount /
                      endpoints.length) *
                      100
              )
            : 0;


    // ============================================================
    // RENDER
    // ============================================================

    return (
        <>
            <style>{`

                * {
                    box-sizing: border-box;
                }

                :root {
                    color-scheme: dark;
                }

                body {
                    margin: 0;
                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;

                    background:
                        #0a0f1c;

                    color:
                        #e7edf7;
                }

                button,
                input {
                    font: inherit;
                }

                button {
                    border: 0;
                }

                .app {
                    min-height: 100vh;
                    display: flex;
                    background:
                        radial-gradient(
                            circle at 15% 10%,
                            rgba(77, 126, 255, 0.12),
                            transparent 30%
                        ),
                        radial-gradient(
                            circle at 85% 85%,
                            rgba(0, 210, 180, 0.08),
                            transparent 30%
                        ),
                        #0a0f1c;
                }

                /* SIDEBAR */

                .sidebar {
                    width: 240px;
                    min-height: 100vh;
                    padding: 24px 16px;
                    border-right:
                        1px solid #1b2638;
                    background:
                        rgba(10, 15, 28, 0.92);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                .brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 4px 10px 28px;
                }

                .brand-logo {
                    width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    display: grid;
                    place-items: center;
                    font-size: 20px;
                    font-weight: 800;
                    color: white;
                    background:
                        linear-gradient(
                            135deg,
                            #4f7cff,
                            #22c7b8
                        );
                    box-shadow:
                        0 8px 25px
                        rgba(54, 118, 255, 0.25);
                }

                .brand-name {
                    font-size: 18px;
                    font-weight: 750;
                    letter-spacing: -0.3px;
                }

                .brand-subtitle {
                    color: #71809a;
                    font-size: 11px;
                    margin-top: 2px;
                }

                .nav {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .nav-button {
                    width: 100%;
                    padding: 12px 13px;
                    border-radius: 10px;
                    background: transparent;
                    color: #8e9bb0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-align: left;
                    transition: 0.18s ease;
                }

                .nav-button:hover {
                    background: #111a2b;
                    color: #dce6f5;
                }

                .nav-button.active {
                    color: #ffffff;
                    background:
                        linear-gradient(
                            90deg,
                            rgba(79, 124, 255, 0.18),
                            rgba(79, 124, 255, 0.06)
                        );
                    box-shadow:
                        inset 3px 0 0 #4f7cff;
                }

                .nav-icon {
                    width: 22px;
                    text-align: center;
                    font-size: 17px;
                }

                .sidebar-footer {
                    margin-top: auto;
                    padding: 14px 10px;
                    color: #66758d;
                    font-size: 11px;
                    line-height: 1.5;
                }

                .security-dot {
                    display: inline-block;
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #28d7a3;
                    margin-right: 6px;
                    box-shadow:
                        0 0 10px
                        rgba(40, 215, 163, 0.5);
                }

                /* MAIN */

                .main {
                    flex: 1;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                }

                .topbar {
                    height: 76px;
                    padding: 0 30px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom:
                        1px solid #1b2638;
                    background:
                        rgba(10, 15, 28, 0.7);
                    backdrop-filter: blur(12px);
                }

                .page-title {
                    font-size: 21px;
                    font-weight: 700;
                    letter-spacing: -0.4px;
                }

                .page-description {
                    color: #71809a;
                    font-size: 12px;
                    margin-top: 4px;
                }

                .version-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border: 1px solid #24334a;
                    border-radius: 999px;
                    color: #9eabc0;
                    background: #0e1626;
                    font-size: 12px;
                }

                .version-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #28d7a3;
                    box-shadow:
                        0 0 9px
                        rgba(40, 215, 163, 0.55);
                }

                .content {
                    padding: 28px 30px 40px;
                    max-width: 1500px;
                    width: 100%;
                }

                /* CARDS */

                .card {
                    border: 1px solid #1d2a3f;
                    background:
                        linear-gradient(
                            145deg,
                            rgba(18, 27, 44, 0.95),
                            rgba(13, 20, 34, 0.95)
                        );
                    border-radius: 16px;
                    box-shadow:
                        0 15px 45px
                        rgba(0, 0, 0, 0.16);
                }

                .card-header {
                    padding: 20px 22px;
                    border-bottom:
                        1px solid #1b273a;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 16px;
                }

                .card-title {
                    font-size: 14px;
                    font-weight: 700;
                }

                .card-subtitle {
                    color: #71809a;
                    font-size: 11px;
                    margin-top: 4px;
                }

                .card-body {
                    padding: 20px 22px;
                }

                /* OVERVIEW */

                .hero {
                    padding: 26px;
                    margin-bottom: 20px;
                    border: 1px solid #23324a;
                    border-radius: 18px;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(47, 82, 166, 0.28),
                            rgba(21, 143, 126, 0.12)
                        );
                    position: relative;
                    overflow: hidden;
                }

                .hero::after {
                    content: "";
                    position: absolute;
                    width: 220px;
                    height: 220px;
                    border-radius: 50%;
                    background:
                        rgba(79, 124, 255, 0.12);
                    right: -80px;
                    top: -100px;
                    filter: blur(10px);
                }

                .hero-label {
                    color: #7e9bd8;
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 1.2px;
                }

                .hero-title {
                    font-size: 28px;
                    margin: 7px 0 6px;
                    letter-spacing: -0.8px;
                }

                .hero-text {
                    color: #8d9bb1;
                    font-size: 13px;
                    max-width: 600px;
                }

                .stat-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(4, minmax(0, 1fr));
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .stat-card {
                    padding: 19px;
                    border:
                        1px solid #1d2a3f;
                    background: #0e1626;
                    border-radius: 14px;
                }

                .stat-label {
                    color: #71809a;
                    font-size: 11px;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                }

                .stat-value {
                    margin-top: 9px;
                    font-size: 23px;
                    font-weight: 750;
                    letter-spacing: -0.5px;
                }

                .stat-meta {
                    margin-top: 5px;
                    color: #68768c;
                    font-size: 11px;
                }

                .overview-grid {
                    display: grid;
                    grid-template-columns:
                        1.4fr 0.8fr;
                    gap: 20px;
                }

                .system-grid {
                    display: grid;
                    grid-template-columns:
                        repeat(2, minmax(0, 1fr));
                    gap: 12px;
                }

                .system-item {
                    padding: 14px;
                    border:
                        1px solid #1d2a3f;
                    border-radius: 11px;
                    background: #0c1423;
                }

                .system-item-label {
                    color: #6e7d94;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.7px;
                }

                .system-item-value {
                    color: #dbe5f4;
                    font-size: 13px;
                    font-weight: 650;
                    margin-top: 7px;
                    word-break: break-word;
                }

                /* BUTTONS */

                .button {
                    padding: 9px 14px;
                    border-radius: 9px;
                    cursor: pointer;
                    font-size: 12px;
                    font-weight: 650;
                    color: #dfe8f6;
                    background: #172238;
                    border:
                        1px solid #293a55;
                    transition: 0.18s ease;
                }

                .button:hover:not(:disabled) {
                    background: #20304b;
                    border-color: #385170;
                    transform: translateY(-1px);
                }

                .button:disabled {
                    opacity: 0.45;
                    cursor: not-allowed;
                }

                .button-primary {
                    background:
                        linear-gradient(
                            135deg,
                            #4f7cff,
                            #4168e8
                        );
                    border-color: #4f7cff;
                    color: white;
                    box-shadow:
                        0 8px 20px
                        rgba(79, 124, 255, 0.2);
                }

                .button-primary:hover:not(:disabled) {
                    background:
                        linear-gradient(
                            135deg,
                            #6089ff,
                            #4b73f0
                        );
                }

                .button-danger {
                    color: #ff9b9b;
                    background: #2a171d;
                    border-color: #4a252e;
                }

                .button-success {
                    color: #8de7c6;
                    background: #112b25;
                    border-color: #1e4e42;
                }

                .button-small {
                    padding: 7px 10px;
                    font-size: 11px;
                }

                .button-group {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                /* ENDPOINTS */

                .form-grid {
                    display: grid;
                    grid-template-columns:
                        1.2fr 1.2fr 0.6fr auto;
                    gap: 10px;
                    align-items: end;
                }

                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .field-label {
                    color: #8593a8;
                    font-size: 11px;
                    font-weight: 600;
                }

                .input {
                    width: 100%;
                    padding: 10px 12px;
                    color: #e5edf9;
                    background: #0b1321;
                    border:
                        1px solid #25344b;
                    border-radius: 9px;
                    outline: none;
                    font-size: 12px;
                    transition: 0.18s ease;
                }

                .input:focus {
                    border-color: #4f7cff;
                    box-shadow:
                        0 0 0 3px
                        rgba(79, 124, 255, 0.1);
                }

                .endpoint-actions {
                    padding: 16px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                }

                .table-wrap {
                    overflow-x: auto;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                }

                th {
                    padding: 11px 13px;
                    text-align: left;
                    color: #65758e;
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    font-weight: 700;
                    border-bottom:
                        1px solid #1d2a3f;
                }

                td {
                    padding: 13px;
                    border-bottom:
                        1px solid #162236;
                    color: #bdc9db;
                    font-size: 12px;
                }

                tr:last-child td {
                    border-bottom: 0;
                }

                .endpoint-name {
                    color: #e5edf8;
                    font-weight: 650;
                }

                .endpoint-host {
                    color: #75849a;
                    font-family: monospace;
                    font-size: 11px;
                }

                .status {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 8px;
                    border-radius: 999px;
                    font-size: 10px;
                    font-weight: 700;
                }

                .status::before {
                    content: "";
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }

                .status-online {
                    color: #75e3be;
                    background: #102b25;
                }

                .status-online::before {
                    background: #31d9a3;
                    box-shadow:
                        0 0 7px
                        rgba(49, 217, 163, 0.6);
                }

                .status-offline {
                    color: #ff9b9b;
                    background: #301a21;
                }

                .status-offline::before {
                    background: #ff626e;
                }

                .status-neutral {
                    color: #9aa7b9;
                    background: #192333;
                }

                .status-neutral::before {
                    background: #71809a;
                }

                /* WORKER */

                .worker-header {
                    display: grid;
                    grid-template-columns:
                        1fr 1fr;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .worker-status-card {
                    padding: 22px;
                    border:
                        1px solid #1d2a3f;
                    border-radius: 15px;
                    background: #0e1626;
                }

                .worker-status-label {
                    color: #71809a;
                    font-size: 11px;
                    text-transform: uppercase;
                }

                .worker-status-value {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                    margin-top: 10px;
                    font-size: 21px;
                    font-weight: 750;
                }

                .running-dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    background: #31d9a3;
                    box-shadow:
                        0 0 12px
                        rgba(49, 217, 163, 0.65);
                }

                .stopped-dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    background: #68768c;
                }

                .terminal {
                    min-height: 380px;
                    background: #070b12;
                    border:
                        1px solid #1d293b;
                    border-radius: 14px;
                    overflow: hidden;
                    box-shadow:
                        inset 0 1px 0
                        rgba(255,255,255,0.02);
                }

                .terminal-bar {
                    padding: 10px 13px;
                    border-bottom:
                        1px solid #172235;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #0c121d;
                }

                .terminal-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #4b586d;
                }

                .terminal-title {
                    margin-left: 5px;
                    color: #627188;
                    font-size: 10px;
                    font-family: monospace;
                }

                .terminal-body {
                    padding: 17px;
                    height: 340px;
                    overflow-y: auto;
                    font-family:
                        "Cascadia Code",
                        "Consolas",
                        monospace;
                    font-size: 11px;
                    line-height: 1.8;
                }

                .terminal-line {
                    color: #7fdcbd;
                    word-break: break-word;
                }

                .terminal-empty {
                    color: #4f5e73;
                }

                /* UPDATES */

                .update-hero {
                    padding: 25px;
                    border-radius: 16px;
                    border:
                        1px solid #23334c;
                    background:
                        linear-gradient(
                            135deg,
                            rgba(79, 124, 255, 0.14),
                            rgba(38, 195, 174, 0.08)
                        );
                    margin-bottom: 20px;
                }

                .update-icon {
                    width: 48px;
                    height: 48px;
                    display: grid;
                    place-items: center;
                    border-radius: 13px;
                    background:
                        rgba(79, 124, 255, 0.14);
                    color: #7fa0ff;
                    font-size: 23px;
                    margin-bottom: 14px;
                }

                .update-title {
                    font-size: 21px;
                    font-weight: 750;
                }

                .update-description {
                    color: #7f8da2;
                    font-size: 12px;
                    margin-top: 5px;
                }

                .update-banner {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 16px;
                    margin-bottom: 20px;
                    border-radius: 12px;
                    background: #102b25;
                    border:
                        1px solid #1e4e42;
                    color: #8de7c6;
                    font-size: 12px;
                }

                .update-banner-icon {
                    width: 27px;
                    height: 27px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    background: #1b5849;
                    color: #9af0d2;
                    font-weight: 800;
                }

                .version-grid {
                    display: grid;
                    grid-template-columns:
                        1fr 1fr;
                    gap: 14px;
                    margin-bottom: 20px;
                }

                .version-box {
                    padding: 18px;
                    border-radius: 12px;
                    background: #0d1524;
                    border:
                        1px solid #1d2a3f;
                }

                .version-label {
                    color: #6f7e94;
                    font-size: 10px;
                    text-transform: uppercase;
                }

                .version-value {
                    font-size: 20px;
                    font-weight: 750;
                    margin-top: 7px;
                }

                .notes {
                    display: flex;
                    flex-direction: column;
                    gap: 9px;
                    margin: 15px 0 20px;
                }

                .note {
                    display: flex;
                    gap: 9px;
                    color: #a9b6c9;
                    font-size: 12px;
                }

                .note-check {
                    color: #31d9a3;
                }

                .progress-container {
                    margin: 18px 0;
                }

                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    color: #7c8ba1;
                    font-size: 11px;
                    margin-bottom: 8px;
                }

                .progress-track {
                    height: 8px;
                    border-radius: 999px;
                    background: #172237;
                    overflow: hidden;
                }

                .progress-bar {
                    height: 100%;
                    border-radius: inherit;
                    background:
                        linear-gradient(
                            90deg,
                            #4f7cff,
                            #28d7a3
                        );
                    transition: width 0.18s ease;
                }

                /* LOGS */

                .log-toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 15px;
                }

                .log-count {
                    color: #69788e;
                    font-size: 11px;
                }

                .log-action {
                    display: inline-flex;
                    padding: 4px 7px;
                    border-radius: 5px;
                    background: #182439;
                    color: #9eb0c8;
                    font-family: monospace;
                    font-size: 10px;
                }

                .log-message {
                    color: #9eacc0;
                }

                .log-time {
                    color: #68778d;
                    font-size: 10px;
                    white-space: nowrap;
                }

                .empty {
                    padding: 50px 20px;
                    text-align: center;
                    color: #64738a;
                    font-size: 12px;
                }

                /* TOAST */

                .toast {
                    position: fixed;
                    right: 24px;
                    bottom: 24px;
                    z-index: 100;
                    padding: 12px 15px;
                    border-radius: 10px;
                    border: 1px solid #29405e;
                    background: #101a2b;
                    color: #dbe7f7;
                    box-shadow:
                        0 15px 40px
                        rgba(0,0,0,0.35);
                    font-size: 12px;
                    animation:
                        toastIn 0.2s ease;
                }

                .toast.error {
                    border-color: #63303b;
                    background: #2a171d;
                    color: #ffb0b0;
                }

                @keyframes toastIn {
                    from {
                        opacity: 0;
                        transform:
                            translateY(8px);
                    }

                    to {
                        opacity: 1;
                        transform:
                            translateY(0);
                    }
                }

                /* RESPONSIVE */

                @media (max-width: 1050px) {
                    .sidebar {
                        width: 205px;
                    }

                    .stat-grid {
                        grid-template-columns:
                            repeat(2, 1fr);
                    }

                    .overview-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-grid {
                        grid-template-columns:
                            1fr 1fr;
                    }
                }

                @media (max-width: 760px) {
                    .app {
                        flex-direction: column;
                    }

                    .sidebar {
                        width: 100%;
                        min-height: auto;
                        padding: 12px;
                        border-right: 0;
                        border-bottom:
                            1px solid #1b2638;
                    }

                    .brand {
                        padding-bottom: 12px;
                    }

                    .nav {
                        flex-direction: row;
                        overflow-x: auto;
                    }

                    .nav-button {
                        min-width: max-content;
                    }

                    .sidebar-footer {
                        display: none;
                    }

                    .topbar {
                        padding: 0 18px;
                    }

                    .content {
                        padding: 20px 16px;
                    }

                    .stat-grid,
                    .worker-header,
                    .version-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                }

            `}</style>


            <div className="app">

                {/* ==================================================
                    SIDEBAR
                ================================================== */}

                <aside className="sidebar">

                    <div className="brand">

                        <div className="brand-logo">
                            P
                        </div>

                        <div>
                            <div className="brand-name">
                                Pulse Agent
                            </div>

                            <div className="brand-subtitle">
                                Desktop Monitor
                            </div>
                        </div>

                    </div>


                    <nav className="nav">

                        {NAV_ITEMS.map(
                            (item) => (
                                <button
                                    key={item.id}
                                    className={
                                        `nav-button ${
                                            activeTab ===
                                            item.id
                                                ? "active"
                                                : ""
                                        }`
                                    }
                                    onClick={() =>
                                        setActiveTab(
                                            item.id
                                        )
                                    }
                                >

                                    <span className="nav-icon">
                                        {item.icon}
                                    </span>

                                    <span>
                                        {item.label}
                                    </span>

                                </button>
                            )
                        )}

                    </nav>


                    <div className="sidebar-footer">

                        <div>
                            <span className="security-dot" />
                            Secure IPC enabled
                        </div>

                        <div
                            style={{
                                marginTop: 5
                            }}
                        >
                            Node integration disabled
                        </div>

                    </div>

                </aside>


                {/* ==================================================
                    MAIN
                ================================================== */}

                <main className="main">

                    <header className="topbar">

                        <div>

                            <div className="page-title">

                                {
                                    NAV_ITEMS.find(
                                        (item) =>
                                            item.id ===
                                            activeTab
                                    )?.label
                                }

                            </div>

                            <div className="page-description">

                                {activeTab ===
                                    "overview" &&
                                    "System health and application overview"}

                                {activeTab ===
                                    "endpoints" &&
                                    "Monitor TCP endpoints and connection latency"}

                                {activeTab ===
                                    "worker" &&
                                    "Manage the background monitoring worker"}

                                {activeTab ===
                                    "updates" &&
                                    "Check, download and apply application updates"}

                                {activeTab ===
                                    "logs" &&
                                    "Application event history and diagnostics"}

                            </div>

                        </div>


                        <div className="version-pill">

                            <span className="version-dot" />

                            v
                            {systemInfo?.appVersion ||
                                "—"}

                        </div>

                    </header>


                    <section className="content">

                        {/* ==================================================
                            OVERVIEW
                        ================================================== */}

                        {activeTab ===
                            "overview" && (
                            <>

                                <div className="hero">

                                    <div className="hero-label">
                                        Monitoring console
                                    </div>

                                    <div className="hero-title">
                                        Welcome to Pulse Agent
                                    </div>

                                    <div className="hero-text">
                                        Monitor your machine,
                                        TCP endpoints,
                                        background workers
                                        and application events
                                        from one desktop dashboard.
                                    </div>

                                </div>


                                <div className="stat-grid">

                                    <div className="stat-card">

                                        <div className="stat-label">
                                            Endpoints
                                        </div>

                                        <div className="stat-value">
                                            {endpoints.length}
                                        </div>

                                        <div className="stat-meta">
                                            Saved monitors
                                        </div>

                                    </div>


                                    <div className="stat-card">

                                        <div className="stat-label">
                                            Online
                                        </div>

                                        <div className="stat-value">
                                            {onlineCount}
                                        </div>

                                        <div className="stat-meta">
                                            {healthPercentage}% healthy
                                        </div>

                                    </div>


                                    <div className="stat-card">

                                        <div className="stat-label">
                                            Unreachable
                                        </div>

                                        <div className="stat-value">
                                            {offlineCount}
                                        </div>

                                        <div className="stat-meta">
                                            Failed TCP checks
                                        </div>

                                    </div>


                                    <div className="stat-card">

                                        <div className="stat-label">
                                            Worker
                                        </div>

                                        <div className="stat-value">
                                            {workerRunning
                                                ? "Running"
                                                : "Stopped"}
                                        </div>

                                        <div className="stat-meta">
                                            {workerRunning
                                                ? `PID ${workerPid}`
                                                : "No active process"}
                                        </div>

                                    </div>

                                </div>


                                <div className="overview-grid">

                                    <div className="card">

                                        <div className="card-header">

                                            <div>
                                                <div className="card-title">
                                                    System Information
                                                </div>

                                                <div className="card-subtitle">
                                                    Information collected by
                                                    the Electron main process
                                                </div>
                                            </div>

                                            <button
                                                className="button"
                                                onClick={
                                                    loadSystemInfo
                                                }
                                                disabled={
                                                    loadingSystemInfo
                                                }
                                            >
                                                {loadingSystemInfo
                                                    ? "Refreshing..."
                                                    : "↻ Refresh"}
                                            </button>

                                        </div>


                                        <div className="card-body">

                                            <div className="system-grid">

                                                <div className="system-item">

                                                    <div className="system-item-label">
                                                        Hostname
                                                    </div>

                                                    <div className="system-item-value">
                                                        {systemInfo?.hostname ||
                                                            "—"}
                                                    </div>

                                                </div>


                                                <div className="system-item">

                                                    <div className="system-item-label">
                                                        Platform
                                                    </div>

                                                    <div className="system-item-value">
                                                        {systemInfo?.platform ||
                                                            "—"}
                                                    </div>

                                                </div>


                                                <div className="system-item">

                                                    <div className="system-item-label">
                                                        Architecture
                                                    </div>

                                                    <div className="system-item-value">
                                                        {systemInfo?.architecture ||
                                                            "—"}
                                                    </div>

                                                </div>


                                                <div className="system-item">

                                                    <div className="system-item-label">
                                                        CPU Cores
                                                    </div>

                                                    <div className="system-item-value">
                                                        {systemInfo?.cpuCount ||
                                                            "—"}
                                                    </div>

                                                </div>


                                                <div className="system-item">

                                                    <div className="system-item-label">
                                                        Total Memory
                                                    </div>

                                                    <div className="system-item-value">
                                                        {formatBytes(
                                                            systemInfo?.totalMemory
                                                        )}
                                                    </div>

                                                </div>


                                                <div className="system-item">

                                                    <div className="system-item-label">
                                                        Free Memory
                                                    </div>

                                                    <div className="system-item-value">
                                                        {formatBytes(
                                                            systemInfo?.freeMemory
                                                        )}
                                                    </div>

                                                </div>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="card">

                                        <div className="card-header">

                                            <div>
                                                <div className="card-title">
                                                    Endpoint Health
                                                </div>

                                                <div className="card-subtitle">
                                                    Current monitoring summary
                                                </div>
                                            </div>

                                        </div>


                                        <div className="card-body">

                                            <div
                                                style={{
                                                    textAlign:
                                                        "center",
                                                    padding:
                                                        "15px 0 22px"
                                                }}
                                            >

                                                <div
                                                    style={{
                                                        fontSize:
                                                            46,
                                                        fontWeight:
                                                            800,
                                                        letterSpacing:
                                                            "-2px"
                                                    }}
                                                >
                                                    {healthPercentage}%
                                                </div>

                                                <div
                                                    style={{
                                                        color:
                                                            "#74839a",
                                                        fontSize:
                                                            11
                                                    }}
                                                >
                                                    Overall endpoint health
                                                </div>

                                            </div>


                                            <div className="progress-track">

                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        width:
                                                            `${healthPercentage}%`
                                                    }}
                                                />

                                            </div>


                                            <div
                                                style={{
                                                    display:
                                                        "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginTop:
                                                        15,
                                                    fontSize:
                                                        11,
                                                    color:
                                                        "#75849a"
                                                }}
                                            >

                                                <span>
                                                    {onlineCount} online
                                                </span>

                                                <span>
                                                    {offlineCount} unreachable
                                                </span>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </>
                        )}


                        {/* ==================================================
                            ENDPOINTS
                        ================================================== */}

                        {activeTab ===
                            "endpoints" && (
                            <>

                                <div className="card">

                                    <div className="card-header">

                                        <div>
                                            <div className="card-title">
                                                Add Endpoint
                                            </div>

                                            <div className="card-subtitle">
                                                Save a host and TCP port for
                                                health monitoring
                                            </div>
                                        </div>

                                    </div>


                                    <div className="card-body">

                                        <form
                                            onSubmit={
                                                addEndpoint
                                            }
                                        >

                                            <div className="form-grid">

                                                <div className="field">

                                                    <label className="field-label">
                                                        Name
                                                    </label>

                                                    <input
                                                        className="input"
                                                        value={
                                                            endpointName
                                                        }
                                                        onChange={(event) =>
                                                            setEndpointName(
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Production API"
                                                    />

                                                </div>


                                                <div className="field">

                                                    <label className="field-label">
                                                        Host
                                                    </label>

                                                    <input
                                                        className="input"
                                                        value={
                                                            endpointHost
                                                        }
                                                        onChange={(event) =>
                                                            setEndpointHost(
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="example.com"
                                                    />

                                                </div>


                                                <div className="field">

                                                    <label className="field-label">
                                                        Port
                                                    </label>

                                                    <input
                                                        className="input"
                                                        type="number"
                                                        value={
                                                            endpointPort
                                                        }
                                                        onChange={(event) =>
                                                            setEndpointPort(
                                                                event.target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="443"
                                                        min="1"
                                                        max="65535"
                                                    />

                                                </div>


                                                <button
                                                    className="button button-primary"
                                                    type="submit"
                                                >
                                                    + Add Endpoint
                                                </button>

                                            </div>

                                        </form>

                                    </div>

                                </div>


                                <div
                                    style={{
                                        height: 18
                                    }}
                                />


                                <div className="card">

                                    <div className="card-header">

                                        <div>
                                            <div className="card-title">
                                                Endpoint Monitor
                                            </div>

                                            <div className="card-subtitle">
                                                {endpoints.length} saved endpoint
                                                {endpoints.length === 1
                                                    ? ""
                                                    : "s"}
                                            </div>
                                        </div>


                                        <button
                                            className="button button-primary"
                                            onClick={
                                                checkAllEndpoints
                                            }
                                            disabled={
                                                checkingAll ||
                                                endpoints.length === 0
                                            }
                                        >
                                            {checkingAll
                                                ? "Checking..."
                                                : "↻ Check All"}
                                        </button>

                                    </div>


                                    {endpoints.length ===
                                    0 ? (
                                        <div className="empty">
                                            No endpoints configured yet.
                                        </div>
                                    ) : (
                                        <div className="table-wrap">

                                            <table>

                                                <thead>

                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Host</th>
                                                        <th>Port</th>
                                                        <th>Status</th>
                                                        <th>Latency</th>
                                                        <th>Actions</th>
                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {endpoints.map(
                                                        (endpoint) => {

                                                            const editing =
                                                                editingId ===
                                                                endpoint.id;


                                                            if (
                                                                editing
                                                            ) {
                                                                return (
                                                                    <tr
                                                                        key={
                                                                            endpoint.id
                                                                        }
                                                                    >

                                                                        <td>
                                                                            <input
                                                                                className="input"
                                                                                value={
                                                                                    editName
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    setEditName(
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                            />
                                                                        </td>

                                                                        <td>
                                                                            <input
                                                                                className="input"
                                                                                value={
                                                                                    editHost
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    setEditHost(
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                            />
                                                                        </td>

                                                                        <td>
                                                                            <input
                                                                                className="input"
                                                                                type="number"
                                                                                value={
                                                                                    editPort
                                                                                }
                                                                                onChange={(
                                                                                    event
                                                                                ) =>
                                                                                    setEditPort(
                                                                                        event
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                            />
                                                                        </td>

                                                                        <td>
                                                                            <span
                                                                                className={`status ${statusClass(
                                                                                    endpoint.status
                                                                                )}`}
                                                                            >
                                                                                {
                                                                                    endpoint.status
                                                                                }
                                                                            </span>
                                                                        </td>

                                                                        <td>
                                                                            {endpoint.latency !==
                                                                            null
                                                                                ? `${endpoint.latency} ms`
                                                                                : "—"}
                                                                        </td>

                                                                        <td>

                                                                            <div className="button-group">

                                                                                <button
                                                                                    className="button button-success button-small"
                                                                                    onClick={() =>
                                                                                        saveEdit(
                                                                                            endpoint.id
                                                                                        )
                                                                                    }
                                                                                >
                                                                                    Save
                                                                                </button>

                                                                                <button
                                                                                    className="button button-small"
                                                                                    onClick={
                                                                                        cancelEdit
                                                                                    }
                                                                                >
                                                                                    Cancel
                                                                                </button>

                                                                            </div>

                                                                        </td>

                                                                    </tr>
                                                                );
                                                            }


                                                            return (
                                                                <tr
                                                                    key={
                                                                        endpoint.id
                                                                    }
                                                                >

                                                                    <td>
                                                                        <div className="endpoint-name">
                                                                            {
                                                                                endpoint.name
                                                                            }
                                                                        </div>
                                                                    </td>

                                                                    <td>
                                                                        <div className="endpoint-host">
                                                                            {
                                                                                endpoint.host
                                                                            }
                                                                        </div>
                                                                    </td>

                                                                    <td>
                                                                        {
                                                                            endpoint.port
                                                                        }
                                                                    </td>

                                                                    <td>

                                                                        <span
                                                                            className={`status ${statusClass(
                                                                                endpoint.status
                                                                            )}`}
                                                                        >
                                                                            {
                                                                                endpoint.status
                                                                            }
                                                                        </span>

                                                                    </td>

                                                                    <td>
                                                                        {endpoint.latency !==
                                                                        null
                                                                            ? `${endpoint.latency} ms`
                                                                            : "—"}
                                                                    </td>

                                                                    <td>

                                                                        <div className="button-group">

                                                                            <button
                                                                                className="button button-small"
                                                                                onClick={() =>
                                                                                    checkEndpoint(
                                                                                        endpoint.id
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    checkingId ===
                                                                                    endpoint.id
                                                                                }
                                                                            >
                                                                                {checkingId ===
                                                                                endpoint.id
                                                                                    ? "Checking..."
                                                                                    : "Check"}
                                                                            </button>

                                                                            <button
                                                                                className="button button-small"
                                                                                onClick={() =>
                                                                                    beginEdit(
                                                                                        endpoint
                                                                                    )
                                                                                }
                                                                            >
                                                                                Edit
                                                                            </button>

                                                                            <button
                                                                                className="button button-danger button-small"
                                                                                onClick={() =>
                                                                                    deleteEndpoint(
                                                                                        endpoint.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                Delete
                                                                            </button>

                                                                        </div>

                                                                    </td>

                                                                </tr>
                                                            );
                                                        }
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>
                                    )}

                                </div>

                            </>
                        )}


                        {/* ==================================================
                            WORKER
                        ================================================== */}

                        {activeTab ===
                            "worker" && (
                            <>

                                <div className="worker-header">

                                    <div className="worker-status-card">

                                        <div className="worker-status-label">
                                            Worker Status
                                        </div>

                                        <div className="worker-status-value">

                                            <span
                                                className={
                                                    workerRunning
                                                        ? "running-dot"
                                                        : "stopped-dot"
                                                }
                                            />

                                            {workerRunning
                                                ? "Running"
                                                : "Stopped"}

                                        </div>

                                    </div>


                                    <div className="worker-status-card">

                                        <div className="worker-status-label">
                                            Process ID
                                        </div>

                                        <div className="worker-status-value">

                                            {workerPid ||
                                                "—"}

                                        </div>

                                    </div>

                                </div>


                                <div className="card">

                                    <div className="card-header">

                                        <div>
                                            <div className="card-title">
                                                Worker Control
                                            </div>

                                            <div className="card-subtitle">
                                                Start or stop the bundled
                                                monitoring process
                                            </div>
                                        </div>


                                        <div className="button-group">

                                            <button
                                                className="button button-primary"
                                                onClick={
                                                    startWorker
                                                }
                                                disabled={
                                                    workerRunning ||
                                                    workerLoading
                                                }
                                            >
                                                ▶ Start Worker
                                            </button>

                                            <button
                                                className="button button-danger"
                                                onClick={
                                                    stopWorker
                                                }
                                                disabled={
                                                    !workerRunning ||
                                                    workerLoading
                                                }
                                            >
                                                ■ Stop Worker
                                            </button>

                                        </div>

                                    </div>


                                    <div className="card-body">

                                        <div className="terminal">

                                            <div className="terminal-bar">

                                                <span className="terminal-dot" />
                                                <span className="terminal-dot" />
                                                <span className="terminal-dot" />

                                                <span className="terminal-title">
                                                    worker stdout · last 50 lines
                                                </span>

                                            </div>


                                            <div className="terminal-body">

                                                {workerLogs.length ===
                                                0 ? (
                                                    <div className="terminal-empty">
                                                        Worker output will appear
                                                        here when the worker starts...
                                                    </div>
                                                ) : (
                                                    workerLogs.map(
                                                        (
                                                            line,
                                                            index
                                                        ) => (
                                                            <div
                                                                className="terminal-line"
                                                                key={
                                                                    index
                                                                }
                                                            >
                                                                <span
                                                                    style={{
                                                                        color:
                                                                            "#45536a",
                                                                        marginRight:
                                                                            8
                                                                    }}
                                                                >
                                                                    $
                                                                </span>

                                                                {
                                                                    line
                                                                }
                                                            </div>
                                                        )
                                                    )
                                                )}

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </>
                        )}


                        {/* ==================================================
                            UPDATES
                        ================================================== */}

                        {activeTab ===
                            "updates" && (
                            <>

                                {updatedBanner && (
                                    <div className="update-banner">

                                        <div className="update-banner-icon">
                                            ✓
                                        </div>

                                        <div>

                                            <strong>
                                                Updated successfully!
                                            </strong>

                                            <div
                                                style={{
                                                    marginTop:
                                                        3,
                                                    color:
                                                        "#72cdb2"
                                                }}
                                            >
                                                Pulse Agent was updated to
                                                version{" "}
                                                {updatedBanner}.
                                            </div>

                                        </div>

                                    </div>
                                )}


                                <div className="update-hero">

                                    <div className="update-icon">
                                        ↻
                                    </div>

                                    <div className="update-title">
                                        Software Updates
                                    </div>

                                    <div className="update-description">
                                        Check for a newer local release,
                                        review release notes and simulate
                                        the update process.
                                    </div>

                                    <div
                                        style={{
                                            marginTop:
                                                18
                                        }}
                                    >

                                        <button
                                            className="button button-primary"
                                            onClick={
                                                checkForUpdate
                                            }
                                            disabled={
                                                updateChecking
                                            }
                                        >
                                            {updateChecking
                                                ? "Checking..."
                                                : "↻ Check for Update"}
                                        </button>

                                    </div>

                                </div>


                                {updateInfo && (
                                    <div className="card">

                                        <div className="card-header">

                                            <div>
                                                <div className="card-title">
                                                    Update Details
                                                </div>

                                                <div className="card-subtitle">
                                                    Local update fixture
                                                </div>
                                            </div>

                                            {updateInfo.updateAvailable ? (
                                                <span className="status status-online">
                                                    Update available
                                                </span>
                                            ) : (
                                                <span className="status status-neutral">
                                                    Up to date
                                                </span>
                                            )}

                                        </div>


                                        <div className="card-body">

                                            <div className="version-grid">

                                                <div className="version-box">

                                                    <div className="version-label">
                                                        Current Version
                                                    </div>

                                                    <div className="version-value">
                                                        v
                                                        {
                                                            updateInfo.currentVersion
                                                        }
                                                    </div>

                                                </div>


                                                <div className="version-box">

                                                    <div className="version-label">
                                                        Latest Version
                                                    </div>

                                                    <div className="version-value">
                                                        v
                                                        {
                                                            updateInfo.latestVersion
                                                        }
                                                    </div>

                                                </div>

                                            </div>


                                            {updateInfo.updateAvailable && (
                                                <>

                                                    <div
                                                        style={{
                                                            color:
                                                                "#d9e4f3",
                                                            fontSize:
                                                                12,
                                                            fontWeight:
                                                                650
                                                        }}
                                                    >
                                                        Release Notes
                                                    </div>


                                                    <div className="notes">

                                                        {(
                                                            updateInfo.notes ||
                                                            []
                                                        ).map(
                                                            (
                                                                note,
                                                                index
                                                            ) => (
                                                                <div
                                                                    className="note"
                                                                    key={
                                                                        index
                                                                    }
                                                                >

                                                                    <span className="note-check">
                                                                        ✓
                                                                    </span>

                                                                    <span>
                                                                        {
                                                                            note
                                                                        }
                                                                    </span>

                                                                </div>
                                                            )
                                                        )}

                                                    </div>


                                                    <div className="button-group">

                                                        <button
                                                            className="button button-primary"
                                                            onClick={
                                                                downloadUpdate
                                                            }
                                                            disabled={
                                                                updateDownloading ||
                                                                updateProgress ===
                                                                    100
                                                            }
                                                        >
                                                            {updateDownloading
                                                                ? "Downloading..."
                                                                : updateProgress ===
                                                                    100
                                                                  ? "✓ Downloaded"
                                                                  : "↓ Download Update"}
                                                        </button>


                                                        <button
                                                            className="button button-success"
                                                            onClick={
                                                                applyUpdate
                                                            }
                                                            disabled={
                                                                updateProgress <
                                                                100
                                                            }
                                                        >
                                                            ↻ Apply & Restart
                                                        </button>

                                                    </div>


                                                    {(updateDownloading ||
                                                        updateProgress >
                                                            0) && (
                                                        <div className="progress-container">

                                                            <div className="progress-header">

                                                                <span>
                                                                    Download progress
                                                                </span>

                                                                <span>
                                                                    {
                                                                        updateProgress
                                                                    }
                                                                    %
                                                                </span>

                                                            </div>


                                                            <div className="progress-track">

                                                                <div
                                                                    className="progress-bar"
                                                                    style={{
                                                                        width:
                                                                            `${updateProgress}%`
                                                                    }}
                                                                />

                                                            </div>

                                                        </div>
                                                    )}

                                                </>
                                            )}

                                        </div>

                                    </div>
                                )}

                            </>
                        )}


                        {/* ==================================================
                            LOGS
                        ================================================== */}

                        {activeTab ===
                            "logs" && (
                            <div className="card">

                                <div className="card-header">

                                    <div>
                                        <div className="card-title">
                                            Application Logs
                                        </div>

                                        <div className="card-subtitle">
                                            JSON Lines · newest events first
                                        </div>
                                    </div>


                                    <div className="button-group">

                                        <span className="log-count">
                                            {appLogs.length} event
                                            {appLogs.length === 1
                                                ? ""
                                                : "s"}
                                        </span>

                                        <button
                                            className="button button-small"
                                            onClick={
                                                loadAppLogs
                                            }
                                        >
                                            ↻ Refresh
                                        </button>

                                        <button
                                            className="button button-primary button-small"
                                            onClick={
                                                openLogFolder
                                            }
                                        >
                                            Open Log Folder
                                        </button>

                                    </div>

                                </div>


                                {appLogs.length ===
                                0 ? (
                                    <div className="empty">
                                        No application events yet.
                                    </div>
                                ) : (
                                    <div className="table-wrap">

                                        <table>

                                            <thead>

                                                <tr>
                                                    <th>Time</th>
                                                    <th>Action</th>
                                                    <th>Message</th>
                                                </tr>

                                            </thead>


                                            <tbody>

                                                {appLogs.map(
                                                    (
                                                        log,
                                                        index
                                                    ) => (
                                                        <tr
                                                            key={
                                                                index
                                                            }
                                                        >

                                                            <td>
                                                                <span className="log-time">
                                                                    {formatTime(
                                                                        log.time
                                                                    )}
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <span className="log-action">
                                                                    {
                                                                        log.action
                                                                    }
                                                                </span>
                                                            </td>

                                                            <td>
                                                                <span className="log-message">
                                                                    {
                                                                        log.message
                                                                    }
                                                                </span>
                                                            </td>

                                                        </tr>
                                                    )
                                                )}

                                            </tbody>

                                        </table>

                                    </div>
                                )}

                            </div>
                        )}

                    </section>

                </main>

            </div>


            {/* ============================================================
                TOAST
            ============================================================ */}

            {notification && (
                <div
                    className={`toast ${
                        notification.type ===
                        "error"
                            ? "error"
                            : ""
                    }`}
                >
                    {notification.message}
                </div>
            )}

        </>
    );
}


export default App;