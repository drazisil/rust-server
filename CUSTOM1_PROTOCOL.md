# Custom Protocol 1: Field2 RSA Decryption and Session Key Extraction

## Overview
This document describes the process for handling, decrypting, and extracting the session key from the `Field2` value in Custom Protocol 1 packets. The process is implemented in C++, and this guide explains the protocol, pitfalls, and the correct approach for interoperability.

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
