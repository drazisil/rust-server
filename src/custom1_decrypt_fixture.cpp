#include <iostream>
#include <vector>
#include <string>
#include <cassert>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/err.h>

// Helper: hex string to binary
std::vector<unsigned char> hex_to_bin(const std::string& hex) {
    std::vector<unsigned char> out;
    for (size_t i = 0; i + 1 < hex.size(); i += 2) {
        unsigned char byte = (unsigned char)std::stoi(hex.substr(i, 2), nullptr, 16);
        out.push_back(byte);
    }
    return out;
}

int main() {
    std::string encrypted_hex = "921bed1340e5b80fa99174cbca17b70bad2a699c69391ca5f0ff86393eb20a5a920840ecc04126c1a15efe226de5b7e3dbb3faf9e8b2e7710fa799b35f4473789080d92c91c393af4d3d327802f212851d888a87c663182554abe32d969eab52957e2bb1539a45c13e1e2ea00941f4f48ca3a11cf9a61c55dad2b08dfd5cf9d4";
    std::string expected_decrypted = "12b88837609be6fece4967fc8eea92a285ab21b96953de991e90ad2a4917108d";
    std::vector<unsigned char> encrypted = hex_to_bin(encrypted_hex);

    FILE *privkey_file = fopen("data/private_key.pem", "r");
    if (!privkey_file) {
        std::cerr << "Failed to open private key file!\n";
        return 1;
    }
    EVP_PKEY *pkey = PEM_read_PrivateKey(privkey_file, nullptr, nullptr, nullptr);
    fclose(privkey_file);
    if (!pkey) {
        std::cerr << "Failed to read private key!\n";
        return 1;
    }
    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(pkey, nullptr);
    if (!ctx) {
        std::cerr << "Failed to create EVP_PKEY_CTX!\n";
        EVP_PKEY_free(pkey);
        return 1;
    }
    if (EVP_PKEY_decrypt_init(ctx) <= 0) {
        std::cerr << "EVP_PKEY_decrypt_init failed!\n";
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return 1;
    }
    if (EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING) <= 0) {
        std::cerr << "EVP_PKEY_CTX_set_rsa_padding failed!\n";
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return 1;
    }
    size_t outlen = 0;
    if (EVP_PKEY_decrypt(ctx, nullptr, &outlen, encrypted.data(), encrypted.size()) <= 0) {
        std::cerr << "EVP_PKEY_decrypt (size query) failed!\n";
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return 1;
    }
    std::vector<unsigned char> decrypted(outlen);
    if (EVP_PKEY_decrypt(ctx, decrypted.data(), &outlen, encrypted.data(), encrypted.size()) <= 0) {
        std::cerr << "EVP_PKEY_decrypt failed!\n";
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return 1;
    }
    decrypted.resize(outlen);
    EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(ctx);

    // Extract session key as per protocol: first 2 bytes = length, next N bytes = key
    if (decrypted.size() < 2) {
        std::cerr << "Decrypted buffer too short!\n";
        return 1;
    }
    int session_key_len = (decrypted[0] << 8) | decrypted[1];
    if (static_cast<int>(decrypted.size()) < 2 + session_key_len) {
        std::cerr << "Decrypted buffer too short for session key!\n";
        return 1;
    }
    std::string session_key_hex;
    for (int i = 0; i < session_key_len; ++i) {
        char buf[3];
        snprintf(buf, sizeof(buf), "%02x", decrypted[2 + i]);
        session_key_hex += buf;
    }
    std::cout << "Decrypted:   " << session_key_hex << std::endl;
    std::cout << "Expected:    " << expected_decrypted << std::endl;
    assert(session_key_hex == expected_decrypted && "Decryption did not match expected output!");
    std::cout << "Test passed!\n";
    return 0;
}
