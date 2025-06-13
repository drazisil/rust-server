#include "logger.hpp"
#include "login.hpp"
#include "db_handler.hpp"
#include "session_manager.hpp"
#include <sstream>
#include <openssl/evp.h>
#include <openssl/crypto.h>
#include <openssl/rand.h>
#include <iomanip>
#include <unistd.h> // For crypt()
#include <stdio.h>
#include <cstring>
#include <unordered_map>
#include <mutex>
#include "third_party/libbcrypt/bcrypt.h"

extern SessionManager session_manager;

std::string invalid_response(const std::string reason_code, const std::string &reason_text, const std::string &reason_url = "")
{
    return "reasoncode=" + reason_code + "\nreasontext=" + reason_text + "\nreasonurl=" + reason_url;
}

std::string valid_response(const std::string &session_id)
{
    return "Valid=TRUE\nTicket=" + session_id + "\n";
}

namespace {
const char *ERR_MISSING_PARAMS = "Missing parameters";
const char *ERR_DB_CONNECT = "Database connection error";
const char *ERR_INVALID_USER = "Invalid username or password";
const char *ERR_INVALID_HASH = "Invalid password hash";
const char *ERR_INVALID_CREDENTIALS = "Invalid credentials";
const char *ERR_CUSTOMER_ID = "Failed to retrieve customer ID";


// Helper for bcrypt hash prefix check
static bool is_bcrypt_hash(const std::string &hash)
{
    return hash.rfind("$2", 0) == 0;
}

bool check_password(const std::string &password, const std::string &hash)
{
    // Only bcrypt hashes are supported (prefix $2, $2a, $2b, $2y)
    // Legacy crypt() fallback is no longer supported.
    if (is_bcrypt_hash(hash)) {
        int rc = bcrypt_checkpw(password.c_str(), hash.c_str());
        if (rc == -1) {
            LOG_ERROR("bcrypt_checkpw() failed – possibly malformed hash");
        }
        return rc == 0;
    }
    // Not a valid bcrypt hash; always fail
    return false;
}

// Helper for parameter validation
static bool validate_login_params(const std::map<std::string, std::string> &params, std::string &username, std::string &password, std::string &error)
{
    auto user_it = params.find("username");
    auto pass_it = params.find("password");
    if (user_it == params.end() || pass_it == params.end() || user_it->second.empty() || pass_it->second.empty())
    {
        error = "Username and password are required";
        return false;
    }
    username = user_it->second;
    password = pass_it->second;
    return true;
}
} // close anonymous namespace

// Modular, testable version
std::string handle_auth_login_modular(const std::map<std::string, std::string> &params, DBHandler &db, SessionManager &session_mgr)
{
    std::string username, password, error;
    if (!validate_login_params(params, username, password, error))
    {
        LOG_ERROR("Missing parameters: Login request for user " + username + " without password or vice versa");
        return invalid_response("Missing parameters", error);
    }
    if (!db.connect())
    {
        LOG_ERROR("Database connection error: Failed to connect to the database");
        return invalid_response("Database connection error", "Failed to connect to the database");
    }
    auto hash_opt = db.get_password_hash(username);
    if (!hash_opt)
    {
        LOG_ERROR("Invalid credentials: Username not found in database: " + username);
        return invalid_response("Invalid username or password", "Username not found in database");
    }
    if (!is_bcrypt_hash(*hash_opt))
    {
        LOG_ERROR("Invalid password hash: The password hash for user " + username + " does not start with $2, $2a, $2b, or $2y");
        return invalid_response("Invalid password hash", "Password hash does not start with $2, $2a, $2b, or $2y");
    }
    if (!check_password(password, *hash_opt))
    {
        LOG_ERROR("Invalid credentials: could not verify password for user " + username);
        return invalid_response("Invalid credentials", "Username or password is incorrect");
    }
    auto customer_id_opt = db.get_customer_id(username);
    if (!customer_id_opt)
    {
        LOG_ERROR("Failed to retrieve customer ID for user " + username);
        return invalid_response("Failed to retrieve customer ID", "Could not retrieve customer ID for user " + username);
    }
    // Generate cryptographically secure random session ID
    unsigned char random_bytes[32];
    if (RAND_bytes(random_bytes, sizeof(random_bytes)) != 1) {
        LOG_ERROR("Failed to generate secure random session ID");
        return invalid_response("Internal error", "Failed to generate session");
    }
    std::stringstream ss;
    for (size_t i = 0; i < sizeof(random_bytes); ++i) {
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)random_bytes[i];
    }
    std::string session_id = ss.str();
    LOG("Storing session_id in SessionManager: [" + session_id + "] (len=" + std::to_string(session_id.size()) + ") for customer_id: [" + customer_id_opt.value() + "]");
    session_mgr.set(session_id, customer_id_opt.value());
    LOG("User " + username + " logged in successfully with session ID: " + session_id);
    return valid_response(session_id);
}

// Legacy wrapper for production use
std::string handle_auth_login(const std::map<std::string, std::string> &params)
{
    static DBHandler db("data/lotus.db");
    extern SessionManager session_manager;
    return handle_auth_login_modular(params, db, session_manager);
}

// Testable overload for unit tests
std::string handle_auth_login(const std::map<std::string, std::string>& params, DBHandler& db, SessionManager& session_mgr) {
    return handle_auth_login_modular(params, db, session_mgr);
}
