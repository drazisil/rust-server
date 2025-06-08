# Architecture

This project is a multi-port TCP server written in C++ using raw sockets and CMake. It listens on:

- HTTP: 3000
- Custom Protocol 1: 8226, 8228, 7003
- Custom Protocol 2: 43300

The server uses `select()` for multiplexing and can be extended to implement custom protocol logic.

## Main Components
- `main.cpp`: Contains all server logic and port handling.
- `CMakeLists.txt`: CMake build configuration.

## Build & Run
See the README for build instructions using CMake or the Makefile for oxide.

---

**Note:** This project was migrated from a Node.js/TypeScript codebase to C++ for performance and system-level control. The project is now named **oxide**.
