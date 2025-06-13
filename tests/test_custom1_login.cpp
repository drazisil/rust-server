#include "src/custom1_handlers.hpp"
#include "src/custom1_packet.hpp"
#include "src/session_manager.hpp"
#include <gtest/gtest.h>
#include <vector>
#include <string>
#include <memory>

// Extern for global session_manager
extern SessionManager session_manager;

// Helper to create a Custom1Packet for login
Custom1Packet make_login_packet(const std::string& session_id, const std::string& encrypted_hex) {
    Custom1Packet pkt;
    pkt.message_id = 0x501;
    pkt.packet_length = 0; // Not used in handler
    pkt.reserved1 = 0;
    pkt.reserved2 = 0;
    pkt.packet_length_4 = 0;
    pkt.field1.assign(session_id.begin(), session_id.end());
    pkt.field2.assign(encrypted_hex.begin(), encrypted_hex.end());
    return pkt;
}

TEST(Custom1LoginTest, DecryptsAndStoresSessionKey) {
    // Arrange: set up session manager with session_id -> customer_id
    std::string session_id = "testsession";
    std::string customer_id = "customer1";
    session_manager.set(session_id, customer_id);

    // Use the same encrypted_hex and expected session key as the fixture
    std::string encrypted_hex = "921bed1340e5b80fa99174cbca17b70bad2a699c69391ca5f0ff86393eb20a5a920840ecc04126c1a15efe226de5b7e3dbb3faf9e8b2e7710fa799b35f4473789080d92c91c393af4d3d327802f212851d888a87c663182554abe32d969eab52957e2bb1539a45c13e1e2ea00941f4f48ca3a11cf9a61c55dad2b08dfd5cf9d4";
    std::string expected_session_key = "12b88837609be6fece4967fc8eea92a285ab21b96953de991e90ad2a4917108d";

    // Add a connection to the custom1_conn_mgr
    int connection_id = 42;
    custom1_conn_mgr.add_connection(connection_id);

    // Act: call the handler
    Custom1Packet pkt = make_login_packet(session_id, encrypted_hex);
    handle_custom1_login(pkt, connection_id, "data/private_key.pem");

    // Assert: session key and customer_id are stored in the connection info
    auto conn_info_opt = custom1_conn_mgr.get_connection(connection_id);
    ASSERT_TRUE(conn_info_opt.has_value());
    EXPECT_EQ(conn_info_opt->get().session_key, expected_session_key);
    EXPECT_EQ(conn_info_opt->get().customer_id, customer_id);
}
