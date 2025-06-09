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

// Global session manager instance
namespace {
    SessionManager session_manager;
}

std::string invalid_response(const std::string& message) {
    return "HTTP/1.1 400 Bad Request\r\nContent-Type: text/plain\r\nContent-Length: " + std::to_string(message.size()) + "\r\n\r\n" + message;
}

std::string valid_response(const std::string& session_id) {
    return "Valid=TRUE\nTicket=" + session_id + "\n";
}

std::string handle_auth_login(const std::map<std::string, std::string>& params) {
    // Check for 'username' and 'password' params
    auto user_it = params.find("username");
    auto pass_it = params.find("password");
    if (user_it == params.end() || pass_it == params.end()) {
        return invalid_response("Missing username or password");
    }
    if (user_it->second.empty() || pass_it->second.empty()) {
        return invalid_response("Username and password cannot be empty");
    }

    // Connect to database and check credentials
    DBHandler db("data/lotus.db");
    if (!db.connect()) {
        return invalid_response("Database connection failed");
    }
    auto hash_opt = db.get_password_hash(user_it->second);
    if (!hash_opt) {
        return invalid_response("Invalid username or password");
    }
    // Require bcrypt hash (starts with $2, $2a, $2b, $2y)
    if (hash_opt->rfind("$2", 0) != 0) {
        return invalid_response("Invalid password hash format");
    }
    // Use OpenSSL's crypt(3) wrapper for bcrypt (OpenSSL 3.0+ provides crypt_blowfish)
    char* hash = crypt(pass_it->second.c_str(), hash_opt->c_str());
    if (!hash || strcmp(hash, hash_opt->c_str()) != 0) {
        return invalid_response("Invalid username or password");
    }

    // If valid, get the customer ID
    auto customer_id_opt = db.get_customer_id(user_it->second);
    if (!customer_id_opt) {
        return invalid_response("Failed to retrieve customer ID");
    }
    // Generate a session_id (simple random string for now)
    std::string session_id = std::to_string(std::hash<std::string>{}(user_it->second + std::to_string(time(nullptr))));
    // Store the session_id and customer_id pair
    session_manager.set(session_id, customer_id_opt.value());
    return valid_response(session_id);
}
