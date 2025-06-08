#ifndef DB_HANDLER_HPP
#define DB_HANDLER_HPP

#include <string>
#include <optional>

// Simple industry-standard DB handler interface (SQLite for portability)
class DBHandler {
public:
    DBHandler(const std::string& db_path);
    ~DBHandler();
    bool connect();
    void disconnect();
    bool is_connected() const;
    // Example: get password hash for a username
    std::optional<std::string> get_password_hash(const std::string& username);
    // Add more methods as needed
private:
    struct Impl;
    Impl* pImpl;
};

#endif // DB_HANDLER_HPP
