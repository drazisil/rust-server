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

Unit tests are built and run using either CMake or autotools. **GoogleTest is vendored in `third_party/googletest` and built from source automatically; you do NOT need to install any system gtest package.**

- With autotools:
  ```sh
  autoreconf -i
  ./configure
  make check
  ```
- With CMake:
  ```sh
  cmake -S . -B build
  cmake --build build
  ctest --test-dir build
  ```

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

# Custom Protocol 1: Field2 RSA Decryption and Session Key Extraction

## Overview
This document describes the process for handling, decrypting, and extracting the session key from the `Field2` value in Custom Protocol 1 packets. The process is implemented in both C++ and TypeScript, and this guide explains the protocol, pitfalls, and the correct approach for interoperability.

## Protocol Details
- **Field2** in the packet is a 256-character ASCII hex string (representing 128 bytes of binary data).
- This string is the hex encoding of an RSA-encrypted blob, using the server's public key.
- The encryption uses **RSA with OAEP padding** (RSA_PKCS1_OAEP_PADDING).
- The decrypted blob contains:
  - 2 bytes: session key length (big-endian)
  - N bytes: session key (N = session key length)
  - 4 bytes: session key expiration (big-endian uint32)

## C++ Implementation
1. **Hex decode** Field2 to get a 128-byte binary buffer.
2. **Decrypt** the buffer using OpenSSL's `RSA_private_decrypt` with `RSA_PKCS1_OAEP_PADDING` and the server's private key.
3. **Parse** the decrypted buffer:
   - Read the first 2 bytes as a big-endian integer for the session key length.
   - Extract the next N bytes as the session key.
   - Read the next 4 bytes as the expiration timestamp.
4. **Log** the session key and expiration for debugging.

### Example C++ Snippet
```cpp
// Hex decode Field2 (256 ASCII chars -> 128 bytes)
// ...
int decrypted_len = RSA_private_decrypt(
    field2_bin.size(),
    field2_bin.data(),
    decrypted.data(),
    rsa,
    RSA_PKCS1_OAEP_PADDING
);
// Parse session key
if (decrypted_len >= 6) {
    int session_key_len = (decrypted[0] << 8) | decrypted[1];
    // ... extract session key and expiration ...
}
```

## TypeScript Implementation
- The logic is mirrored in `NPSUserStatus.ts` using Node.js's `privateDecrypt` with OAEP padding.
- The session key is extracted from the decrypted buffer using the same structure as above.

## Common Pitfalls
- **Padding Mismatch:** The encryption and decryption must use the same padding. OAEP is required for this protocol.
- **Hex/Binary Confusion:** Field2 is not raw binary; it is a hex string of the encrypted blob.
- **Session Key Offset:** The session key is not the entire decrypted buffer; it must be parsed out as described.

## Troubleshooting
- If the decrypted output does not match expectations, verify:
  - The correct padding is used (`RSA_PKCS1_OAEP_PADDING`).
  - The input is properly hex-decoded to binary before decryption.
  - The private key matches the public key used for encryption.
- Use the provided test fixture (`src/custom1_decrypt_fixture.cpp`) to validate the process with known-good data.

## References
- See `src/custom1_handlers.cpp` for the C++ handler logic.
- See `src/custom1_decrypt_fixture.cpp` for a standalone test.
- See `server/packages/login/src/NPSUserStatus.ts` for the TypeScript implementation.