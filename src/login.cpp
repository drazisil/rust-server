#include "logger.hpp"
#include "login.hpp"
#include "db_handler.hpp"
#include "session_manager.hpp"
#include <sstream>
#include <openssl/evp.h>
#include <openssl/crypto.h>
#include <unistd.h> // For crypt()
#include <stdio.h>
#include <cstring>
#include <unordered_map>
#include <mutex>

extern SessionManager session_manager;

std::string invalid_response(const std::string reason_code, const std::string &reason_text, const std::string &reason_url = "")
{
    return "reasoncode=" + reason_code + "\nreasontext=" + reason_text + "\nreasonurl=" + reason_url;
}

std::string valid_response(const std::string &session_id)
{
    return "Valid=TRUE\nTicket=" + session_id + "\n";
}

std::string handle_auth_login(const std::map<std::string, std::string> &params)
{
    // Check for 'username' and 'password' params
    auto user_it = params.find("username");
    auto pass_it = params.find("password");
    if (user_it == params.end() || pass_it == params.end() || user_it->second.empty() || pass_it->second.empty())
    {
        LOG_ERROR("Missing parameters: Login request for user " +
                  (user_it != params.end() ? user_it->second : "N/A") +
                  " without password or vice versa");
        return invalid_response("Missing parameters", "Username and password are required");
    }

    // Connect to database and check credentials
    DBHandler db("data/lotus.db");
    if (!db.connect())
    {
        LOG_ERROR("Database connection error: Failed to connect to the database");
        return invalid_response("Database connection error", "Failed to connect to the database");
    }
    auto hash_opt = db.get_password_hash(user_it->second);
    if (!hash_opt)
    {
        LOG_ERROR("Invalid credentials: Username not found in database: " + user_it->second);
        return invalid_response("Invalid username or password", "Username not found in database");
    }
    // Require bcrypt hash (starts with $2, $2a, $2b, $2y)
    if (hash_opt->rfind("$2", 0) != 0)
    {
        LOG_ERROR("Invalid password hash: The password hash for user " + user_it->second + " does not start with $2, $2a, $2b, or $2y");
        return invalid_response("Invalid password hash", "Password hash does not start with $2, $2a, $2b, or $2y");
    }
    // Use OpenSSL's crypt(3) wrapper for bcrypt (OpenSSL 3.0+ provides crypt_blowfish)
    char *hash = crypt(pass_it->second.c_str(), hash_opt->c_str());
    if (!hash || strcmp(hash, hash_opt->c_str()) != 0)
    {
        LOG_ERROR("Invalid credentials: could not verify password for user " + user_it->second);
        return invalid_response("Invalid credentials", "Username or password is incorrect");
    }

    // If valid, get the customer ID
    auto customer_id_opt = db.get_customer_id(user_it->second);
    if (!customer_id_opt)
    {
        LOG_ERROR("Failed to retrieve customer ID for user " + user_it->second);
        return invalid_response("Failed to retrieve customer ID", "Could not retrieve customer ID for user " + user_it->second);
    }
    // Generate a session_id (simple random string for now)
    std::string session_id = std::to_string(std::hash<std::string>{}(user_it->second + std::to_string(time(nullptr))));
    // Store the session_id and customer_id pair
    LOG("Storing session_id in SessionManager: [" + session_id + "] (len=" + std::to_string(session_id.size()) + ") for customer_id: [" + customer_id_opt.value() + "]");
    session_manager.set(session_id, customer_id_opt.value());
    LOG("User " + user_it->second + " logged in successfully with session ID: " + session_id);
    return valid_response(session_id);
}
