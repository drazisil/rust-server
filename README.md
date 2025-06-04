# Oxide

This project is a simple socket server built with TypeScript and Node.js using the `socket.io` library for real-time communication.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [File Structure](#file-structure)
- [License](#license)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/oxide.git
   ```

2. Navigate to the project directory:
   ```
   cd oxide
   ```

3. Install the dependencies:
   ```
   npm install
   ```

## Usage

To start the socket server, run the following command:
```
npm start
```

The server will be running on `http://localhost:3000` by default. You can connect to it using a socket client.

## File Structure

```
oxide
├── src
│   ├── server.ts          # Entry point for the socket server
│   ├── admin-cli.ts       # Admin CLI for oxide
│   ├── config.ts
│   ├── express-app.ts
│   ├── logger.ts
│   ├── auth/
│   │   ├── admin-cli.guard.test.ts
│   │   ├── checkCredentials.test.ts
│   │   ├── checkCredentials.ts
│   │   └── users.sqlite
│   ├── routes/
│   │   └── auth.ts
│   └── types/
│       ├── index.ts
│       ├── ssl2.ts
│       ├── ssl3.ts
│       ├── tcp.ts
│       └── tls.ts
├── package.json           # npm configuration file
├── tsconfig.json          # TypeScript configuration file
├── oxide.service          # systemd service unit
├── postinstall.sh         # Post-install automation
├── uninstall.sh           # Service uninstall script
├── .env.example           # Example environment variables
├── CLI_COMMANDS.md        # CLI documentation
├── README.md              # Project documentation
└── ...
```

## License

This project is licensed under the MIT License.