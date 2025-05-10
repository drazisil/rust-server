# Oxide

Oxide is a Rust-based server project that includes both TCP and HTTP capabilities. The HTTP server uses Actix-web for routing and logging, while the TCP server forwards HTTP requests to the HTTP server and handles custom binary protocols for non-HTTP requests.

## Features

- **HTTP Server**: Built with Actix-web for efficient routing and logging.
- **TCP Server**: Handles HTTP forwarding and custom binary protocols.
- **Logging**: Integrated with `tracing` and supports Sentry for error tracking.
- **Serialization**: Uses Serde for efficient data serialization.

## Getting Started

### Prerequisites

- Rust (latest stable version)
- Cargo (Rust's package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd oxide
   ```

2. Build the project:
   ```bash
   make
   ```

3. Run the server:
   ```bash
   cargo run
   ```

### Configuration

- Environment variables:
  - `SENTRY_DSN`: Set this to enable Sentry error tracking.
  - `GIT_COMMIT`: Optional, used for release tracking in Sentry.

## License

This project is licensed under the GNU General Public License v3.0 or later. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Acknowledgments

- [Actix-web](https://actix.rs/)
- [Serde](https://serde.rs/)
- [Sentry](https://sentry.io/)
