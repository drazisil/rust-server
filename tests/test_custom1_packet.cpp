#include "src/custom1_handlers.hpp"
#include "src/custom1_packet.hpp"
#include "src/session_manager.hpp"
#include <gtest/gtest.h>
#include <vector>
#include <string>
#include <memory>
#include <cstring>
#include <sys/socket.h>
#include <unistd.h>

// Helper to create a valid Custom1Packet buffer for login
std::vector<uint8_t> make_login_packet_buffer(const std::string& session_id, const std::string& encrypted_hex) {
    std::vector<uint8_t> buf;
    // Message ID (0x501)
    buf.push_back(0x05); buf.push_back(0x01);
    // Packet Length (dummy)
    buf.push_back(0x01); buf.push_back(0x2f);
    // Version
    buf.push_back(0x01); buf.push_back(0x01);
    // Reserved1
    buf.push_back(0x00); buf.push_back(0x00);
    // Packet Length 4 (dummy)
    buf.push_back(0x00); buf.push_back(0x00); buf.push_back(0x01); buf.push_back(0x2f);
    // Field1 length
    buf.push_back(0x00); buf.push_back(static_cast<uint8_t>(session_id.size()));
    // Field1 data
    buf.insert(buf.end(), session_id.begin(), session_id.end());
    // Reserved2
    buf.push_back(0x00); buf.push_back(0x00);
    // Field2 length
    buf.push_back(0x01); buf.push_back(0x00); // 256 bytes
    // Field2 data (hex string as ASCII)
    buf.insert(buf.end(), encrypted_hex.begin(), encrypted_hex.end());
    // Field3 length (0)
    buf.push_back(0x00); buf.push_back(0x00);
    // No field3 data
    // CRC32 (dummy)
    buf.push_back(0x00); buf.push_back(0x00); buf.push_back(0x00); buf.push_back(0x00);
    return buf;
}

TEST(Custom1PacketTest, HandleCustom1PacketLogin) {
    // Arrange
    std::string session_id = "testsession";
    std::string customer_id = "customer1";
    extern SessionManager session_manager;
    session_manager.set(session_id, customer_id);
    std::string encrypted_hex = "921bed1340e5b80fa99174cbca17b70bad2a699c69391ca5f0ff86393eb20a5a920840ecc04126c1a15efe226de5b7e3dbb3faf9e8b2e7710fa799b35f4473789080d92c91c393af4d3d327802f212851d888a87c663182554abe32d969eab52957e2bb1539a45c13e1e2ea00941f4f48ca3a11cf9a61c55dad2b08dfd5cf9d4";
    std::string expected_session_key = "12b88837609be6fece4967fc8eea92a285ab21b96953de991e90ad2a4917108d";
    int connection_id = 43;
    custom1_conn_mgr.add_connection(connection_id);
    // Create a socketpair for client_fd
    int sv[2];
    ASSERT_EQ(socketpair(AF_UNIX, SOCK_STREAM, 0, sv), 0);
    int client_fd = sv[0];
    // Act
    std::vector<uint8_t> buf = make_login_packet_buffer(session_id, encrypted_hex);
    std::string data(buf.begin(), buf.end());
    bool result = handle_custom1_packet(client_fd, data, connection_id);
    // Assert
    EXPECT_TRUE(result);
    auto conn_info_opt = custom1_conn_mgr.get_connection(connection_id);
    ASSERT_TRUE(conn_info_opt.has_value());
    EXPECT_EQ(conn_info_opt->get().session_key, expected_session_key);
    EXPECT_EQ(conn_info_opt->get().customer_id, customer_id);
    close(sv[0]); close(sv[1]);
}
