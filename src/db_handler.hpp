#ifndef DB_HANDLER_HPP
#define DB_HANDLER_HPP

#include <string>
#include <optional>

// Simple industry-standard DB handler interface (SQLite for portability)
class DBHandler {
public:
    DBHandler(const std::string& db_path);
    virtual ~DBHandler();
    virtual bool connect();
    virtual void disconnect();
    virtual bool is_connected() const;
    // Example: get password hash for a username
    virtual std::optional<std::string> get_password_hash(const std::string& username);
    virtual std::optional<std::string> get_customer_id(const std::string &username);
    // Add more methods as needed
private:
    struct Impl;
    Impl* pImpl;
};

#endif // DB_HANDLER_HPP
