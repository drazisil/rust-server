#include "login.hpp"
#include "db_handler.hpp"
#include <sstream>
#include <openssl/evp.h>
#include <openssl/crypto.h>
#include <unistd.h> // For crypt()
#include <cstring>

std::string handle_auth_login(const std::map<std::string, std::string>& params) {
    // Check for 'username' and 'password' params
    auto user_it = params.find("username");
    auto pass_it = params.find("password");
    if (user_it == params.end() || pass_it == params.end()) {
        return "Missing username or password";
    }
    if (user_it->second.empty() || pass_it->second.empty()) {
        return "Username or password cannot be empty";
    }

    // Connect to database and check credentials
    DBHandler db("data/lotus.db");
    if (!db.connect()) {
        return "Database connection failed";
    }
    auto hash_opt = db.get_password_hash(user_it->second);
    if (!hash_opt) {
        return "Invalid username or password";
    }
    // Require bcrypt hash (starts with $2, $2a, $2b, $2y)
    if (hash_opt->rfind("$2", 0) != 0) {
        return "Password hash must use bcrypt";
    }
    // Use OpenSSL's crypt(3) wrapper for bcrypt (OpenSSL 3.0+ provides crypt_blowfish)
    char* hash = crypt(pass_it->second.c_str(), hash_opt->c_str());
    if (!hash || strcmp(hash, hash_opt->c_str()) != 0) {
        return "Invalid username or password";
    }

    // If no limit or valid, return ok
    return "ok";
}
