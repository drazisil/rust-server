#include "connection_manager.hpp"
#include <gtest/gtest.h>

TEST(ConnectionManagerTest, AddAndGetConnection) {
    ConnectionManager mgr;
    mgr.add_connection(42);
    auto conn = mgr.get_connection(42);
    ASSERT_TRUE(conn.has_value());
    EXPECT_EQ(conn->get().socket_fd, 42);
    EXPECT_EQ(conn->get().session_key, "");
    EXPECT_EQ(conn->get().customer_id, "");
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
    auto conn = mgr.get_connection(5);
    ASSERT_TRUE(conn.has_value());
    conn->get().session_key = "abc";
    conn->get().customer_id = "xyz";
    EXPECT_EQ(mgr.get_session_key_by_customer_id("xyz"), "abc");
}

TEST(ConnectionManagerTest, ClearConnections) {
    ConnectionManager mgr;
    mgr.add_connection(10);
    mgr.add_connection(11);
    mgr.clear();
    EXPECT_FALSE(mgr.get_connection(10).has_value());
    EXPECT_FALSE(mgr.get_connection(11).has_value());
}
