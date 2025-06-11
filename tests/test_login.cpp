#include "src/login.hpp"
#include "src/session_manager.hpp"
#include "src/db_handler.hpp"
#include <gtest/gtest.h>
#include <map>
#include <string>
#include <iostream>
#include "third_party/libbcrypt/bcrypt.h"

// Test DBHandler that inherits from the real one
class TestDBHandler : public DBHandler {
public:
    TestDBHandler() : DBHandler("") {}
    bool connect() override { return connect_ok; }
    std::optional<std::string> get_password_hash(const std::string& user) override {
        if (user == valid_user) return valid_hash;
        return std::nullopt;
    }
    bool connect_ok = true;

    std::string valid_user = "admin";
    std::string valid_hash = "";
    std::string valid_customer_id = "cust1";

    bool force_customer_id_fail = false;
    std::optional<std::string> get_customer_id(const std::string& user) override {
        if (force_customer_id_fail) return std::nullopt;
        if (user == valid_user) return valid_customer_id;
        return std::nullopt;
    }
};

TEST(LoginTest, MissingParams) {
    TestDBHandler db;
    SessionManager sm;
    std::map<std::string, std::string> params;
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Missing parameters"), std::string::npos);
}

TEST(LoginTest, DBConnectFail) {
    TestDBHandler db; db.connect_ok = false;
    SessionManager sm;
    std::map<std::string, std::string> params{{"username","admin"},{"password","adminpass"}};
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Database connection error"), std::string::npos);
}

TEST(LoginTest, InvalidUser) {
    TestDBHandler db;
    char salt[BCRYPT_HASHSIZE];
    char hash[BCRYPT_HASHSIZE];
    const char* password = "adminpass";
    int rc1 = bcrypt_gensalt(12, salt);
    if (rc1 != 0) std::cerr << "[TEST][ERROR] bcrypt_gensalt failed, rc=" << rc1 << std::endl;
    int rc2 = bcrypt_hashpw(password, salt, hash);
    if (rc2 != 0) std::cerr << "[TEST][ERROR] bcrypt_hashpw failed, rc=" << rc2 << std::endl;
    db.valid_hash = hash;
    std::cout << "[TEST] InvalidUser bcrypt hash: " << db.valid_hash << std::endl;
    SessionManager sm;
    std::map<std::string, std::string> params{{"username","notfound"},{"password","adminpass"}};
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Username not found"), std::string::npos);
}

TEST(LoginTest, InvalidHash) {
    TestDBHandler db;
    db.valid_hash = "notbcrypt";
    SessionManager sm;
    std::map<std::string, std::string> params{{"username","admin"},{"password","adminpass"}};
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Password hash does not start"), std::string::npos);
}

TEST(LoginTest, InvalidPassword) {
    TestDBHandler db;
    char salt[BCRYPT_HASHSIZE];
    char hash[BCRYPT_HASHSIZE];
    const char* password = "adminpass";
    int rc1 = bcrypt_gensalt(12, salt);
    if (rc1 != 0) std::cerr << "[TEST][ERROR] bcrypt_gensalt failed, rc=" << rc1 << std::endl;
    int rc2 = bcrypt_hashpw(password, salt, hash);
    if (rc2 != 0) std::cerr << "[TEST][ERROR] bcrypt_hashpw failed, rc=" << rc2 << std::endl;
    db.valid_hash = hash;
    std::cout << "[TEST] InvalidPassword bcrypt hash: " << db.valid_hash << std::endl;
    SessionManager sm;
    std::map<std::string, std::string> params{{"username","admin"},{"password","wrongpass"}};
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Username or password is incorrect"), std::string::npos);
}

TEST(LoginTest, CustomerIdFail) {
    TestDBHandler db;
    db.force_customer_id_fail = true;
    char salt[BCRYPT_HASHSIZE];
    char hash[BCRYPT_HASHSIZE];
    const char* password = "adminpass";
    int rc1 = bcrypt_gensalt(12, salt);
    if (rc1 != 0) std::cerr << "[TEST][ERROR] bcrypt_gensalt failed, rc=" << rc1 << std::endl;
    int rc2 = bcrypt_hashpw(password, salt, hash);
    if (rc2 != 0) std::cerr << "[TEST][ERROR] bcrypt_hashpw failed, rc=" << rc2 << std::endl;
    db.valid_hash = hash;
    std::cout << "[TEST] CustomerIdFail bcrypt hash: " << db.valid_hash << std::endl;
    SessionManager sm;
    std::map<std::string, std::string> params{{"username","admin"},{"password","adminpass"}};
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Could not retrieve customer ID"), std::string::npos);
}

TEST(LoginTest, Success) {
    TestDBHandler db;
    char salt[BCRYPT_HASHSIZE];
    char hash[BCRYPT_HASHSIZE];
    const char* password = "adminpass";
    int rc1 = bcrypt_gensalt(12, salt);
    if (rc1 != 0) std::cerr << "[TEST][ERROR] bcrypt_gensalt failed, rc=" << rc1 << std::endl;
    int rc2 = bcrypt_hashpw(password, salt, hash);
    if (rc2 != 0) std::cerr << "[TEST][ERROR] bcrypt_hashpw failed, rc=" << rc2 << std::endl;
    db.valid_hash = hash;
    std::cout << "[TEST] Success bcrypt hash: " << db.valid_hash << std::endl;
    SessionManager sm;
    std::map<std::string, std::string> params{{"username","admin"},{"password","adminpass"}};
    std::string resp = handle_auth_login(params, db, sm);
    EXPECT_NE(resp.find("Valid=TRUE"), std::string::npos);
}
