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

## Features
- Handles multiple TCP ports concurrently using `select()`
- Simple HTTP response on port 3000
- Placeholder responses for custom protocols (extend as needed)

## Requirements
- C++17 or later
- CMake 3.10+
- Linux (tested)

## Project Structure
- `main.cpp`: Main server implementation in C++
- `CMakeLists.txt`: CMake build configuration
- `Makefile`: For convenient building and running
- `.gitignore`: Standard CMake and C++ ignores

## License
See `COPYING.md` for license information.

---

**Note:** This project was previously implemented in Node.js/TypeScript. It is now fully C++ and CMake based.