# oxide

This project is a multi-port server written in **C++** using raw sockets. It provides:

- An HTTP server on port **3000**
- Custom protocol 1 servers on ports **8226**, **8228**, and **7003**
- A custom protocol 2 server on port **43300**

## Build Instructions

You can now build and run the project using the provided Makefile:

```sh
make        # Builds the project using CMake
make run    # Builds and runs the server
make clean  # Removes the build directory
make rebuild # Cleans and rebuilds the project
```

Alternatively, you can still use CMake directly:

```sh
cmake -S . -B build
cmake --build build
./build/oxide
```

### Running Tests

This project uses GNU autotools/automake for its build system. The standard way to run the test suite is:

```
make check
```

This will build and run all tests. Note that `make test` is **not** a standard target in automake projects; use `make check` instead.

## Creating the Admin User

To create or update the `admin` user in your oxide database, use the provided shell script:

```sh
./create_admin.sh
```

- The script will prompt you for a password (twice for confirmation).
- It requires Python 3 and the `bcrypt` module (`pip3 install bcrypt`).
- The admin user will be created or updated in `data/lotus.db` with a bcrypt password hash.

If you need to reset the admin password, simply run the script again.

## Features
- Handles multiple TCP ports concurrently using `select()`
- Simple HTTP response on port 3000
- Placeholder responses for custom protocols (extend as needed)

## Requirements
- C++17 or later
- CMake 3.10+
- Linux (tested)
- autotools (autoconf, automake, libtool) for autotools build

## Project Structure
- `main.cpp`: Main server implementation in C++
- `CMakeLists.txt`: CMake build configuration
- `Makefile`: For convenient building and running
- `.gitignore`: Standard CMake and C++ ignores

## License
See `COPYING.md` for license information.

---

**Note:** This project was previously implemented in Node.js/TypeScript. It is now fully C++ and CMake/autotools based. All C++ unit tests use the vendored GoogleTest for maximum reliability and reproducibility.

# Custom Protocol 1

See `CUSTOM1_PROTOCOL.md` for protocol details, implementation notes, and troubleshooting for Custom Protocol 1 (Field2 RSA decryption and session key extraction).