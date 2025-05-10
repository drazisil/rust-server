# Project Feature Requirements

## Overview
This Rust-based server project provides both TCP and HTTP server capabilities. It is designed to handle HTTP requests via Actix-web and custom binary protocols via a TCP server. The project is modular, extensible, and includes structured logging and error tracking.

---

## Features

### 1. **HTTP Server**
- **Framework**: Actix-web is used for routing and handling HTTP requests.
- **Routes**:
  - `/health`: Returns a simple "Server is running" message for health checks.
  - `/AuthLogin`: Returns an "OK" response for authentication login requests.
  - **Default 404 Handler**: Returns a "Not Found" message for undefined routes.
- **Logging**: Structured logging is implemented using the `tracing` crate.

### 2. **TCP Server**
- **Purpose**: Listens on multiple TCP ports and forwards HTTP requests to the HTTP server.
- **Custom Protocol Handling**: Handles non-HTTP binary protocols.
- **Behavior**:
  - Reads incoming data from the socket.
  - Detects whether the request is HTTP (GET/POST).
  - Forwards HTTP requests to the Actix-web server and sends back the response.
  - Logs non-HTTP requests for further processing.
  - Closes the connection after sending an HTTP response.

### 3. **Configuration**
- **File**: Configuration is loaded from a `config.json` file.
- **Structure**:
  - `tcp_ports`: A list of TCP ports the server listens on.
- **Parsing**: Uses the `serde` crate for JSON deserialization.

### 4. **Logging**
- **Framework**: `tracing` crate is used for structured logging.
- **Output**:
  - Logs are written to both stdout and a daily rotating log file (`logs/server.log`).
- **Levels**: Includes `info`, `warn`, and `error` levels for detailed tracing.

### 5. **Error Tracking**
- **Integration**: Sentry is integrated for error tracking and performance monitoring.
- **Configuration**:
  - Sentry DSN is loaded from an environment variable (`SENTRY_DSN`).
  - Logs warnings if the DSN is missing or empty.

### 6. **Graceful Shutdown**
- **Signal Handling**: Listens for `ctrl_c` signals to gracefully shut down the server.
- **Logging**: Logs a shutdown message when the server stops.

---

## HTTP Path Documentation

### `/health`
- **Request**:
  - **Method**: `GET`
  - **Headers**: None required
  - **Body**: None
- **Response**:
  - **Status Code**: `200 OK`
  - **Body**: `"Server is running"`

### `/AuthLogin` Endpoint

**Description:**
The `/AuthLogin` endpoint validates user credentials provided via GET query parameters.

**Query Parameters:**
- `username` (string): The username of the user.
- `password` (string): The password of the user.

**Responses:**
- **200 OK**: If the credentials are valid.
  ```
  Valid=TRUE
  Ticket=<auth_ticket>
  ```
- **401 Unauthorized**: If the credentials are invalid.
  ```
  reasoncode=INVALID_CREDENTIALS
  reasontest=Invalid username or password
  reasonurl=https://example.com/help
  ```

### Default 404 Handler
- **Request**:
  - Any undefined path.
- **Response**:
  - **Status Code**: `404 Not Found`
  - **Body**: `"Not Found"`

---

## Current Behavior
1. **Startup**:
   - Initializes logging and Sentry error tracking.
   - Loads configuration from `config.json`.
   - Starts both the HTTP and TCP servers.

2. **Request Handling**:
   - HTTP requests are routed and handled by Actix-web.
   - TCP requests are processed to detect HTTP or custom binary protocols.
   - HTTP responses are sent back, and the connection is closed.

3. **Error Handling**:
   - Logs errors for invalid requests or socket read/write failures.
   - Tracks errors and performance metrics using Sentry.

4. **Shutdown**:
   - Waits for a termination signal (`ctrl_c`).
   - Logs a shutdown message and exits gracefully.

---

## Future Enhancements
- Add support for additional HTTP routes.
- Implement detailed handling for custom binary protocols.
- Add unit and integration tests for all modules.
- Improve configuration flexibility (e.g., support for YAML or TOML).
- Enhance logging with more granular levels and structured fields.

---

## Dependencies
- **Actix-web**: HTTP server framework.
- **Tokio**: Asynchronous runtime.
- **Warp**: Used for testing HTTP routes.
- **Serde**: JSON serialization/deserialization.
- **Tracing**: Structured logging.
- **Sentry**: Error tracking and performance monitoring.
- **Dotenv**: Loads environment variables from a `.env` file.

---

## File Structure
- `src/config.rs`: Handles configuration loading and parsing.
- `src/logging.rs`: Initializes logging and Sentry integration.
- `src/server.rs`: Contains the main server logic for both HTTP and TCP.
- `src/main.rs`: Entry point of the application.

---

## Logs
- Logs are stored in the `logs/` directory with daily rotation.
- Example log file: `logs/server.log.2025-05-10`.

---

## Configuration Example (`config.json`)
```json
{
  "tcp_ports": [8080, 9090]
}
```

---

## Environment Variables
- `SENTRY_DSN`: Sentry Data Source Name for error tracking.

---

## Build and Run
- **Build**: `cargo build`
- **Run**: `cargo run`

---

## Testing
- **Unit Tests**: To be implemented.
- **Integration Tests**: To be implemented.

---

## Notes
- Ensure the `config.json` file is present in the root directory.
- Set the `SENTRY_DSN` environment variable for Sentry integration.
