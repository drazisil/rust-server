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

// Handler for message_id 0x501 (login)
void handle_custom1_login(const Custom1Packet &pkt, int connection_id)
{
    // Field1 is the session_id. Look up customer_id from SessionManager
    if (pkt.field1.empty())
    {
        LOG_ERROR("Field1 (session_id) is empty, cannot process login.");
        return;
    }
    std::string session_id(pkt.field1.begin(), pkt.field1.end());
    LOG("Processing login for session_id: [" + session_id + "] (len=" + std::to_string(session_id.size()) + ")");

    auto customer_id_opt = session_manager.get(session_id);
    if (!customer_id_opt)
    {
        LOG_ERROR("Session ID not found in SessionManager: [" + session_id + "] (len=" + std::to_string(session_id.size()) + ")");
        return;
    }

    // Field2 is a hex string, each byte is represented by two ASCII hex chars (e.g., '4F').
    // The correct length for a 1024-bit RSA key is 256 hex chars (128 bytes binary).
    if (pkt.field2.size() != 256)
    {
        LOG_ERROR("Field2 hex string length is not 256, got: " + std::to_string(pkt.field2.size()));
        return;
    }
    std::vector<unsigned char> field2_bin;
    field2_bin.reserve(128);
    bool hex_error = false;
    for (size_t i = 0; i < pkt.field2.size(); i += 2)
    {
        char hi = pkt.field2[i];
        char lo = pkt.field2[i + 1];
        if (!isxdigit(hi) || !isxdigit(lo))
        {
            LOG_ERROR(std::string("Non-hex character in Field2 at position ") + std::to_string(i) + ": '" + hi + "' '" + lo + "'");
            hex_error = true;
            break;
        }
        unsigned char byte = (unsigned char)((std::stoi(std::string(1, hi), nullptr, 16) << 4) | std::stoi(std::string(1, lo), nullptr, 16));
        field2_bin.push_back(byte);
    }
    if (hex_error)
    {
        LOG_ERROR("Aborting Field2 decryption due to invalid hex.");
        return;
    }
    std::string privkey_path = "data/private_key.pem";
    FILE *privkey_file = fopen(privkey_path.c_str(), "r");
    if (!privkey_file)
    {
        LOG_ERROR("Failed to open private key file: " + privkey_path);
        return;
    }
    EVP_PKEY *pkey = PEM_read_PrivateKey(privkey_file, nullptr, nullptr, nullptr);
    fclose(privkey_file);
    if (!pkey)
    {
        LOG_ERROR("Failed to read private key from: " + privkey_path);
        return;
    }
    EVP_PKEY_CTX *ctx = EVP_PKEY_CTX_new(pkey, nullptr);
    if (!ctx)
    {
        LOG_ERROR("Failed to create EVP_PKEY_CTX");
        EVP_PKEY_free(pkey);
        return;
    }
    if (EVP_PKEY_decrypt_init(ctx) <= 0)
    {
        LOG_ERROR("EVP_PKEY_decrypt_init failed");
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return;
    }
    if (EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_OAEP_PADDING) <= 0)
    {
        LOG_ERROR("EVP_PKEY_CTX_set_rsa_padding failed");
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return;
    }
    size_t outlen = 0;
    if (EVP_PKEY_decrypt(ctx, nullptr, &outlen, field2_bin.data(), field2_bin.size()) <= 0)
    {
        LOG_ERROR("EVP_PKEY_decrypt (size query) failed");
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return;
    }
    std::vector<unsigned char> decrypted(outlen);
    if (EVP_PKEY_decrypt(ctx, decrypted.data(), &outlen, field2_bin.data(), field2_bin.size()) <= 0)
    {
        LOG_ERROR("EVP_PKEY_decrypt failed");
        EVP_PKEY_free(pkey);
        EVP_PKEY_CTX_free(ctx);
        return;
    }
    decrypted.resize(outlen);
    EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(ctx);
    int decrypted_len = static_cast<int>(decrypted.size());
    if (decrypted_len >= 6)
    {
        int session_key_len = (decrypted[0] << 8) | decrypted[1];
        if (session_key_len > 0 && session_key_len + 6 <= decrypted_len)
        {
            std::string session_key_hex;
            for (int i = 0; i < session_key_len; ++i)
            {
                char hex[3];
                snprintf(hex, sizeof(hex), "%02x", decrypted[2 + i]);
                session_key_hex += hex;
            }
            uint32_t expires = (decrypted[2 + session_key_len] << 24) |
                               (decrypted[2 + session_key_len + 1] << 16) |
                               (decrypted[2 + session_key_len + 2] << 8) |
                               (decrypted[2 + session_key_len + 3]);
            LOG("Session key successfully decrypted for user: " + session_id);

            // Store the session key and customer ID in the connection manager
            ConnectionManager &conn_mgr = custom1_conn_mgr;
            ConnectionInfo *conn_info = conn_mgr.get_connection(connection_id);
            if (conn_info)
            {
                conn_info->session_key = session_key_hex;
                conn_info->customer_id = *customer_id_opt;
                LOG("Session key stored for customer ID: " + conn_info->customer_id);
            }
        }
        else
        {
            LOG_ERROR("Decrypted buffer too short or invalid session key length: " + std::to_string(session_key_len));
        }
    }
    else
    {
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
