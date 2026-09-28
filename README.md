# Pulse Agent

Pulse Agent is a desktop monitoring application built with Electron, React, and Node.js.

It monitors system information, checks TCP endpoints for reachability and latency, manages a background Node.js worker, stores application event logs, and demonstrates a local auto-update workflow.

---

## Features

### 🖥️ System Overview

The Overview tab displays information about the current computer:

- Hostname
- Operating system / platform
- CPU architecture
- CPU count
- Total memory
- Free memory
- Application version
- Online / Offline application status

The information is collected by the Electron main process using Node.js system APIs.

A Refresh button allows the information to be fetched again.

---

### 🌐 TCP Endpoint Monitoring

The Endpoints tab allows users to manage network endpoints.

Each endpoint contains:

- Name
- Host
- Port
- Status
- Latency

Supported operations:

- Add endpoint
- Edit endpoint
- Delete endpoint
- Check one endpoint
- Check all endpoints

Endpoints are persisted using `electron-store`, so they remain available after restarting the application.

#### TCP Health Check

Pulse Agent uses Node.js `net.Socket` to check TCP connectivity.

The application:

1. Creates a TCP socket.
2. Attempts to connect to the configured host and port.
3. Uses a 2-second connection timeout.
4. Measures connection latency.
5. Reports the endpoint as:
   - `Online`
   - `Unreachable`

Example endpoints:

```text
example.com:443
1.1.1.1:443
127.0.0.1:9
