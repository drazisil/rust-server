// Test fixture for Custom1 Field2 decryption
// Encrypted blob (hex):
// 921bed1340e5b80fa99174cbca17b70bad2a699c69391ca5f0ff86393eb20a5a920840ecc04126c1a15efe226de5b7e3dbb3faf9e8b2e7710fa799b35f4473789080d92c91c393af4d3d327802f212851d888a87c663182554abe32d969eab52957e2bb1539a45c13e1e2ea00941f4f48ca3a11cf9a61c55dad2b08dfd5cf9d4
// Expected decrypted (hex):
// 12b88837609be6fece4967fc8eea92a285ab21b96953de991e90ad2a4917108d

#include <iostream>
#include <vector>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <openssl/err.h>
#include <cassert>

std::vector<unsigned char> hex_to_bytes(const std::string& hex) {
    std::vector<unsigned char> bytes;
    for (size_t i = 0; i < hex.size(); i += 2) {
        unsigned char byte = (unsigned char)((std::stoi(hex.substr(i, 1), nullptr, 16) << 4) | std::stoi(hex.substr(i+1, 1), nullptr, 16));
        bytes.push_back(byte);
    }
    return bytes;
}

int main() {
    std::string encrypted_hex = "921bed1340e5b80fa99174cbca17b70bad2a699c69391ca5f0ff86393eb20a5a920840ecc04126c1a15efe226de5b7e3dbb3faf9e8b2e7710fa799b35f4473789080d92c91c393af4d3d327802f212851d888a87c663182554abe32d969eab52957e2bb1539a45c13e1e2ea00941f4f48ca3a11cf9a61c55dad2b08dfd5cf9d4";
    std::vector<unsigned char> encrypted = hex_to_bytes(encrypted_hex);
    FILE* privkey_file = fopen("data/private_key.pem", "r");
    assert(privkey_file && "Failed to open private key");
    RSA* rsa = PEM_read_RSAPrivateKey(privkey_file, nullptr, nullptr, nullptr);
    fclose(privkey_file);
    assert(rsa && "Failed to read private key");
    int key_size = RSA_size(rsa);
    std::vector<unsigned char> decrypted(key_size);
    int decrypted_len = RSA_private_decrypt(
        encrypted.size(),
        encrypted.data(),
        decrypted.data(),
        rsa,
        RSA_PKCS1_OAEP_PADDING // Try OAEP padding for decryption
    );
    assert(decrypted_len > 0 && "RSA decryption failed");
    // Print full decrypted buffer as hex
    std::cout << "Decrypted (hex): ";
    for (int i = 0; i < decrypted_len; ++i) {
        printf("%02x", decrypted[i]);
    }
    std::cout << std::endl;
    // --- NPSUserStatus.ts session key extraction logic ---
    if (decrypted_len >= 6) { // 2 bytes length + at least 1 byte key + 4 bytes expires
        int session_key_len = (decrypted[0] << 8) | decrypted[1];
        if (session_key_len > 0 && session_key_len + 6 <= decrypted_len) {
            std::string session_key_hex;
            for (int i = 0; i < session_key_len; ++i) {
                char hex[3];
                snprintf(hex, sizeof(hex), "%02x", decrypted[2 + i]);
                session_key_hex += hex;
            }
            uint32_t expires = (decrypted[2 + session_key_len] << 24) |
                               (decrypted[2 + session_key_len + 1] << 16) |
                               (decrypted[2 + session_key_len + 2] << 8) |
                               (decrypted[2 + session_key_len + 3]);
            std::cout << "Parsed session key (hex): " << session_key_hex << std::endl;
            std::cout << "Session key length: " << session_key_len << std::endl;
            std::cout << "Session key expires: " << expires << std::endl;
        } else {
            std::cout << "Decrypted buffer too short or invalid session key length: " << session_key_len << std::endl;
        }
    } else {
        std::cout << "Decrypted buffer too short to contain session key and expiration" << std::endl;
    }
    RSA_free(rsa);
    return 0;
}
