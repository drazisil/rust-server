#include "custom1_handlers.hpp"
#include "logger.hpp"
#include "custom1_packet.hpp"
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <vector>
#include <cstdint>
#include <stdexcept>
#include <openssl/pem.h>
#include <openssl/rsa.h>
#include <openssl/err.h>
#include <openssl/evp.h>
#include <algorithm>
#include "db_handler.hpp"
#include "connection_manager.hpp"
#include "session_manager.hpp"

extern SessionManager session_manager;

// Helper: decode hex string to binary
bool hex_to_bin(const std::string& hex, std::vector<unsigned char>& out, std::string* err) {
    if (hex.size() % 2 != 0) {
        if (err) *err = "Hex string has odd length";
        return false;
    }
    out.clear();
    out.reserve(hex.size() / 2);
    for (size_t i = 0; i < hex.size(); i += 2) {
        char hi = hex[i];
        char lo = hex[i + 1];
        if (!isxdigit(hi) || !isxdigit(lo)) {
            if (err) *err = "Non-hex character at position " + std::to_string(i);
            return false;
        }
        unsigned char byte = static_cast<unsigned char>(std::stoi(hex.substr(i, 2), nullptr, 16));
        out.push_back(byte);
    }
    return true;
}

// Helper: load private key from file
EVP_PKEY* load_private_key(const std::string& path, std::string* err) {
    FILE* f = fopen(path.c_str(), "r");
    if (!f) {
        if (err) *err = "Failed to open private key file: " + path;
        return nullptr;
    }
    EVP_PKEY* pkey = PEM_read_PrivateKey(f, nullptr, nullptr, nullptr);
    fclose(f);
    if (!pkey && err) *err = "Failed to read private key from: " + path;
    return pkey;
}

// Helper: decrypt with OpenSSL EVP
bool rsa_oaep_decrypt(EVP_PKEY* pkey, const std::vector<unsigned char>& in, std::vector<unsigned char>& out, std::string* err) {
    EVP_PKEY_CTX* ctx = EVP_PKEY_CTX_new(pkey, nullptr);
    if (!ctx) {
        if (err) *err = "Failed to create EVP_PKEY_CTX";
        return false;
    }
    if (EVP_PKEY_decrypt_init(ctx) <= 0) {
        if (err) *err = "EVP_PKEY_decrypt_init failed";
        EVP_PKEY_CTX_free(ctx);
        return false;
    }
    if (EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING) <= 0) {
        if (err) *err = "EVP_PKEY_CTX_set_rsa_padding failed";
        EVP_PKEY_CTX_free(ctx);
        return false;
    }
    size_t outlen = 0;
    if (EVP_PKEY_decrypt(ctx, nullptr, &outlen, in.data(), in.size()) <= 0) {
        if (err) *err = "EVP_PKEY_decrypt (size query) failed";
        EVP_PKEY_CTX_free(ctx);
        return false;
    }
    out.resize(outlen);
    if (EVP_PKEY_decrypt(ctx, out.data(), &outlen, in.data(), in.size()) <= 0) {
        if (err) *err = "EVP_PKEY_decrypt failed";
        EVP_PKEY_CTX_free(ctx);
        return false;
    }
    out.resize(outlen);
    EVP_PKEY_CTX_free(ctx);
    return true;
}

// Handler for message_id 0x501 (login)
void handle_custom1_login(const Custom1Packet &pkt, int connection_id, const std::string& privkey_path)
{
    if (pkt.field1.empty()) {
        LOG_ERROR("Field1 (session_id) is empty, cannot process login.");
        return;
    }
    std::string session_id(pkt.field1.begin(), pkt.field1.end());
    LOG("Processing login for session_id: [" + session_id + "] (len=" + std::to_string(session_id.size()) + ")");
    auto customer_id_opt = session_manager.get(session_id);
    if (!customer_id_opt) {
        LOG_ERROR("Session ID not found in SessionManager: [" + session_id + "] (len=" + std::to_string(session_id.size()) + ")");
        return;
    }
    if (pkt.field2.size() != 256) {
        LOG_ERROR("Field2 hex string length is not 256, got: " + std::to_string(pkt.field2.size()));
        return;
    }
    std::vector<unsigned char> field2_bin;
    std::string hex_err;
    if (!hex_to_bin(std::string(pkt.field2.begin(), pkt.field2.end()), field2_bin, &hex_err)) {
        LOG_ERROR("Aborting Field2 decryption: " + hex_err);
        return;
    }
    std::string key_err;
    EVP_PKEY* pkey = load_private_key(privkey_path, &key_err);
    if (!pkey) {
        LOG_ERROR(key_err);
        return;
    }
    std::vector<unsigned char> decrypted;
    std::string dec_err;
    if (!rsa_oaep_decrypt(pkey, field2_bin, decrypted, &dec_err)) {
        LOG_ERROR(dec_err);
        EVP_PKEY_free(pkey);
        return;
    }
    EVP_PKEY_free(pkey);
    int decrypted_len = static_cast<int>(decrypted.size());
    if (decrypted_len >= 6) {
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
            LOG("Session key successfully decrypted for user: " + session_id);
            ConnectionManager &conn_mgr = custom1_conn_mgr;
            auto conn_info_opt = conn_mgr.get_connection(connection_id);
            if (conn_info_opt) {
                conn_mgr.update_connection(connection_id, [&](ConnectionInfo& conn_info) {
                    conn_info.session_key = session_key_hex;
                    conn_info.customer_id = *customer_id_opt;
                    LOG("Session key stored for customer ID: " + conn_info.customer_id);
                });
            }
        } else {
            LOG_ERROR("Decrypted buffer too short or invalid session key length: " + std::to_string(session_key_len));
        }
    } else {
        LOG_ERROR("Decrypted buffer too short to contain session key and expiration");
    }

    // NOTE: If you encounter issues with decryption or session key extraction in the future,
    // check the following:
    // 1. The PEM private key at 'data/private_key.pem' is valid and matches the public key used for encryption.
    // 2. The OAEP padding is used consistently on both encryption and decryption sides.
    // 3. The Field2 hex string is exactly 256 characters (128 bytes binary for 1024-bit RSA).
    // 4. The EVP_PKEY/EVP_PKEY_CTX OpenSSL API is used for decryption (see above for modern usage).
    // 5. The session_id and customer_id are correctly looked up and stored in SessionManager and ConnectionManager.
    // 6. If you upgrade OpenSSL or change key size, update the logic and test with known-good data.
    // 7. Use logs to compare the session_id at storage and lookup points if session lookup fails.
    //
    // This code is compatible with OpenSSL 3.0+ and avoids deprecated APIs.
}

/**
 * Example packet and it's custom format:
 *
 * All fields are BE (Big Endian) encoded.
 *
 * 0501 // Message Id (2 bytes)
 * 012f // Packet Length (2 bytes) - 47 bytes total
 * 0101 // Packet version (2 bytes)
 * 0000 // Reserved (2 bytes)
 * 0000012f // Packet length (4 bytes) - 47 bytes total
 * 0013 // Length of the next field (2 bytes)
 * 39303031363732303531343031343238323530 //
 * 0000 // Reserved (2 bytes)
 * 0100 // Length of the next field (2 bytes)
 * 31443538333746463532313545413135434432333341303546313141363139423144394433333541373538433937454533424637443441414630303645313044394445434241354245384337374230424634433437433834423338364642414633303230424337334245333131434530314132343446324445313133314530343937303542393546463543373133383136373731323645384330414235463941343432413545384332393038433344444342394441434436323732433244323037324635344646363642393146373235373441423336453042393736373435353044413737373730453431394638444233304330413741383243413835373532
 * 0004 // Length of the next field (2 bytes)
 * 32313736
 * fea31c19 // CRC32 checksum (4 bytes) - 0x1c19fea3
 */

bool handle_custom1_packet(int client_fd, const std::string &data, int connection_id)
{

    // Log the received data in hex for debugging with local port it was received on
    sockaddr_in addr;
    socklen_t addr_len = sizeof(addr);
    if (getpeername(client_fd, (struct sockaddr *)&addr, &addr_len) < 0)
    {
        LOG_ERROR("Failed to get peer name for client_fd " + std::to_string(client_fd));
        return false;
    }
    std::string hex_data;
    for (unsigned char c : data)
    {
        char hex[3];
        snprintf(hex, sizeof(hex), "%02x", c);
        hex_data += hex;
    }
    LOG("Received Custom Protocol 1 packet from " + std::string(inet_ntoa(addr.sin_addr)) + ":" + std::to_string(ntohs(addr.sin_port)) + " - Data: " + hex_data);

    // Check the message id (first 2 bytes)
    if (data.size() < 2)
    {
        LOG_ERROR("Received Custom Protocol 1 packet too short to contain message ID");
        return false;
    }
    uint16_t message_id = (static_cast<uint8_t>(data[0]) << 8) | static_cast<uint8_t>(data[1]);

    // Log the message ID
    LOG("Custom Protocol 1 packet message ID: " + std::to_string(message_id));

    // Try to parse and log the packet
    std::vector<uint8_t> buf(data.begin(), data.end());
    static Custom1PacketPacker packer; // Use the new class
    try
    {
        Custom1Packet pkt = packer.unpack(buf);
        LOG("Parsed Custom Protocol 1 packet:");
        LOG("  Message ID: " + std::to_string(pkt.message_id));
        LOG("  Packet Length: " + std::to_string(pkt.packet_length));
        LOG("  Version: " + std::to_string(pkt.reserved1));
        LOG("  Reserved1: " + std::to_string(pkt.reserved1));
        LOG("  Packet Length 4: " + std::to_string(pkt.packet_length_4));
        LOG("  Field1 Length: " + std::to_string(pkt.field1.size()));
        LOG("  Field1 Data: " + std::string(pkt.field1.begin(), pkt.field1.end()));
        LOG("  Reserved2: " + std::to_string(pkt.reserved2));
        LOG("  Field2 Length: " + std::to_string(pkt.field2.size()));
        LOG("  Field2 Data: " + std::string(pkt.field2.begin(), pkt.field2.end()));
        if (pkt.message_id == 0x501)
        {
            handle_custom1_login(pkt, connection_id);
        }
        else
        {
            LOG_ERROR("Custom Protocol 1 message ID " + std::to_string(pkt.message_id) + " not yet supported");
        }
    }
    catch (const std::runtime_error &e)
    {
        LOG_ERROR("Failed to unpack Custom Protocol 1 packet: " + std::string(e.what()));
        return false;
    }
    // Placeholder: always respond with a static message
    const char *msg = "Custom Protocol 1 Connected\n";
    send(client_fd, msg, strlen(msg), 0);
    return true;
}
