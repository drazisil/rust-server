#include "session_manager.hpp"
#include <gtest/gtest.h>

TEST(SessionManagerTest, SetAndGet) {
    SessionManager mgr;
    mgr.set("sess1", "cust1");
    auto result = mgr.get("sess1");
    ASSERT_TRUE(result.has_value());
    EXPECT_EQ(result.value(), "cust1");
}

TEST(SessionManagerTest, GetNonexistent) {
    SessionManager mgr;
    auto result = mgr.get("notfound");
    EXPECT_FALSE(result.has_value());
}

TEST(SessionManagerTest, Remove) {
    SessionManager mgr;
    mgr.set("sess2", "cust2");
    mgr.remove("sess2");
    EXPECT_FALSE(mgr.get("sess2").has_value());
}

TEST(SessionManagerTest, Clear) {
    SessionManager mgr;
    mgr.set("a", "1");
    mgr.set("b", "2");
    mgr.clear();
    EXPECT_FALSE(mgr.get("a").has_value());
    EXPECT_FALSE(mgr.get("b").has_value());
}
