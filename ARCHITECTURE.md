# Oxide Project Architecture

## Overview
Oxide is a modular, production-ready TCP socket server written in TypeScript. It is designed for secure, real-time, multi-user applications with protocol detection, authentication, and a robust admin CLI. The project is structured for maintainability, testability, and easy deployment (including systemd integration).

---

## High-Level Server Flow

1. **Startup**
   - The main entry point is `src/server.ts`.
   - Loads configuration from environment variables (via `src/config.ts`).
   - Initializes logging (`src/logger.ts`).
   - Sets up the TCP server and (optionally) Express HTTP endpoints.

2. **Connection Handling**
   - Listens for incoming TCP connections on configured ports.
   - For each connection:
     - Detects protocol (TLS, SSL, or custom) using shared parsing logic (`src/types/`).
     - Routes the connection to the appropriate handler.

3. **Authentication**
   - User authentication is handled via the `src/auth/checkCredentials.ts` module.
   - Passwords are securely hashed with bcrypt and stored in a persistent SQLite database (via Sequelize ORM).
   - All authentication logic is testable and supports in-memory DB for tests.

4. **Admin CLI**
   - The CLI entry point is `src/admin-cli.ts` (POSIX-compliant, uses commander).
   - Supports commands for user management, server health, and protocol parsing.
   - CLI is fully tested for interface stability (`src/auth/admin-cli.guard.test.ts`).

5. **Express Integration (Optional)**
   - `src/express-app.ts` can be used to expose HTTP endpoints for health checks, metrics, or REST APIs.

6. **Logging**
   - All modules use a shared logger (`src/logger.ts`, powered by pino).
   - Logs are written to file and/or stdout as configured.

7. **Testing**
   - All core logic is covered by Vitest tests (see `src/auth/*.test.ts`).
   - Coverage reporting is enabled and configured.

---

## Module Responsibilities

### `src/server.ts`
- Main entry point for the TCP server.
- Sets up listeners, handles new connections, and delegates protocol detection.

### `src/config.ts`
- Loads and validates configuration from environment variables or `.env` files.
- Exports constants for use throughout the project.

### `src/logger.ts`
- Sets up and exports a shared logger instance (pino).
- Used by all modules for consistent logging.

### `src/types/`
- Protocol parsing and type definitions (TLS, SSL2/3, TCP, etc.).
- Shared logic for protocol detection and payload parsing.

### `src/auth/checkCredentials.ts`
- Defines the User model (Sequelize).
- Implements user creation, credential checking, and customerId lookup.
- All logic is injectable/testable (supports in-memory DB for tests).

### `src/auth/checkCredentials.test.ts`
- Unit and regression tests for authentication logic.
- Uses an in-memory SQLite DB for isolation.

### `src/auth/admin-cli.guard.test.ts`
- Guard tests for the CLI interface (help, errors, command stability).
- Ensures CLI changes do not break expected output or behavior.

### `src/admin-cli.ts`
- Admin CLI entry point (POSIX-compliant, commander-based).
- Commands: `adduser`, `checkuser`, `listusers`, `getcustomerid`, `ping`, `parse`.
- Handles CLI argument parsing, help, and error output.

### `src/routes/`
- Express route handlers (e.g., `auth.ts` for HTTP authentication endpoints).
- Optional, used if HTTP/REST endpoints are needed.

### `postinstall.sh` / `uninstall.sh`
- Automation scripts for systemd service install/uninstall.
- Ensures production deployment is repeatable and robust.

### `oxide.service`
- Systemd unit file for running the server as a managed service.

### `.env.example`
- Example environment variable file for configuration.

---

## Extensibility
- New protocols can be added by extending `src/types/` and updating the server flow.
- New CLI commands can be added in `src/admin-cli.ts` and documented in `CLI_COMMANDS.md`.
- Additional authentication methods or storage backends can be implemented in `src/auth/`.

---

## Summary
Oxide is designed for clarity, modularity, and production-readiness. Each module has a clear scope, and the architecture supports robust testing, easy deployment, and future extension.
