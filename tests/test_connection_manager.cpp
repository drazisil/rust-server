#include "connection_manager.hpp"
#include <gtest/gtest.h>

TEST(ConnectionManagerTest, AddAndGetConnection) {
    ConnectionManager mgr;
    mgr.add_connection(42);
    auto conn = mgr.get_connection(42);
    ASSERT_TRUE(conn.has_value());
    EXPECT_EQ(conn->socket_fd, 42);
    EXPECT_EQ(conn->session_key, "");
    EXPECT_EQ(conn->customer_id, "");
}

TEST(ConnectionManagerTest, RemoveConnection) {
    ConnectionManager mgr;
    mgr.add_connection(1);
    mgr.remove_connection(1);
    auto conn = mgr.get_connection(1);
    EXPECT_FALSE(conn.has_value());
}

TEST(ConnectionManagerTest, GetSessionKeyByCustomerId) {
    ConnectionManager mgr;
    mgr.add_connection(5);
    // Simulate authentication
    auto conn = mgr.get_connection(5);
    ASSERT_TRUE(conn.has_value());
    ConnectionInfo info = *conn;
    info.session_key = "abc123";
    info.customer_id = "custA";
    // Directly update (simulate what handler would do)
    mgr.remove_connection(5);
    {
        // Re-add with updated info
        std::lock_guard<std::mutex> lock(*(std::mutex*)((void*)&mgr));
        ((std::unordered_map<int, ConnectionInfo>*)((void*)&mgr + sizeof(std::mutex)))->insert({5, info});
    }
    EXPECT_EQ(mgr.get_session_key_by_customer_id("custA"), "abc123");
    EXPECT_EQ(mgr.get_session_key_by_customer_id("notfound"), "");
}

TEST(ConnectionManagerTest, ClearConnections) {
    ConnectionManager mgr;
    mgr.add_connection(10);
    mgr.add_connection(11);
    mgr.clear();
    EXPECT_FALSE(mgr.get_connection(10).has_value());
    EXPECT_FALSE(mgr.get_connection(11).has_value());
}
