#ifndef CUSTOM1_HANDLERS_HPP
#define CUSTOM1_HANDLERS_HPP

#include <string>
#include <vector>
#include <openssl/evp.h>
#include "connection_manager.hpp"

// Handles Custom Protocol 1 packets. Returns true if handled, false otherwise.
bool handle_custom1_packet(int client_fd, const std::string& data, int connection_id);

// Helper: decode hex string to binary
// Expose for testing
bool hex_to_bin(const std::string& hex, std::vector<unsigned char>& out, std::string* err);

// Helper: load private key from file
// Expose for testing
EVP_PKEY* load_private_key(const std::string& path, std::string* err);

// Helper: decrypt with OpenSSL EVP
// Expose for testing
bool rsa_oaep_decrypt(EVP_PKEY* pkey, const std::vector<unsigned char>& in, std::vector<unsigned char>& out, std::string* err);

// Global instance for all translation units
extern ConnectionManager custom1_conn_mgr;

#endif // CUSTOM1_HANDLERS_HPP
