# Oxide

Oxide is a modular, production-ready TCP socket server built with TypeScript and Node.js. It features protocol detection, secure user authentication (bcrypt + SQLite), a robust admin CLI, and is designed for easy deployment with systemd. Oxide is suitable for real-time applications, custom protocol handling, and secure multi-user environments.

## Features

- Modular TCP socket server with protocol detection (TLS, SSL, custom protocols)
- Secure user authentication (bcrypt, persistent SQLite via Sequelize)
- 12-factor app compliance (environment-based config, stateless server)
- Admin CLI for user and server management (add/check users, list users, parse payloads, etc.)
- POSIX-compliant CLI with robust help, error handling, and guard tests
- Systemd integration for production deployment and service management
- Modern TypeScript codebase with full test coverage (Vitest)
- Logging (pino), environment variable support, and extensible architecture

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Admin CLI](#admin-cli)
- [Production Deployment](#production-deployment)
- [File Structure](#file-structure)
- [License](#license)

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/yourusername/oxide.git
   cd oxide
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
   This will also build the project and (on Linux) install the systemd service.

## Usage

To start the socket server in development:
```sh
npm start
```

The server will run on `http://localhost:3000` (default). Configure ports and other settings via `.env`.

## Admin CLI

Oxide includes a powerful CLI for server and user management. See [`CLI_COMMANDS.md`](CLI_COMMANDS.md) for full documentation.

Example usage:
```sh
npx ts-node src/admin-cli.ts adduser alice secret123 CUST-001
npx ts-node src/admin-cli.ts checkuser alice secret123
npx ts-node src/admin-cli.ts listusers
npx ts-node src/admin-cli.ts getcustomerid alice
```

## Production Deployment

Oxide is ready for production with systemd:
- The `postinstall.sh` script will install and start the `oxide` systemd service on Linux.
- To uninstall, run:
  ```sh
  sh ./uninstall.sh
  ```
- Edit `oxide.service` as needed for your environment.

## File Structure

```
oxide
├── src/
│   ├── server.ts          # TCP server entry point
│   ├── admin-cli.ts       # Admin CLI for oxide
│   ├── config.ts          # Configuration loader
│   ├── express-app.ts     # Express integration (if used)
│   ├── logger.ts          # Logging setup
│   ├── auth/              # Authentication logic and tests
│   ├── routes/            # Express routes (if used)
│   └── types/             # Protocol and type definitions
├── package.json           # npm configuration
├── tsconfig.json          # TypeScript config
├── oxide.service          # systemd service unit
├── postinstall.sh         # Post-install automation
├── uninstall.sh           # Service uninstall script
├── .env.example           # Example environment variables
├── CLI_COMMANDS.md        # CLI documentation
├── README.md              # Project documentation
└── ...
```

## License

This project is licensed under the GNU General Public License v3.0 or later (GPL-3.0-or-later).
See [COPYING.md](COPYING.md) for the full license text.