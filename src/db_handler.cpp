#include "db_handler.hpp"
#include <sqlite3.h>
#include <memory>

struct DBHandler::Impl {
    sqlite3* db = nullptr;
    std::string db_path;
    bool connected = false;
};

DBHandler::DBHandler(const std::string& db_path) : pImpl(new Impl) {
    pImpl->db_path = db_path;
}

DBHandler::~DBHandler() {
    disconnect();
    delete pImpl;
}

bool DBHandler::connect() {
    if (pImpl->connected) return true;
    int rc = sqlite3_open(pImpl->db_path.c_str(), &pImpl->db);
    pImpl->connected = (rc == SQLITE_OK);
    return pImpl->connected;
}

void DBHandler::disconnect() {
    if (pImpl->db) {
        sqlite3_close(pImpl->db);
        pImpl->db = nullptr;
        pImpl->connected = false;
    }
}

bool DBHandler::is_connected() const {
    return pImpl->connected;
}

std::optional<std::string> DBHandler::get_password_hash(const std::string& username) {
    if (!pImpl->connected) return std::nullopt;
    const char* sql = "SELECT password_hash FROM users WHERE username = ?";
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(pImpl->db, sql, -1, &stmt, nullptr) != SQLITE_OK) return std::nullopt;
    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_STATIC);
    std::optional<std::string> result;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        const unsigned char* text = sqlite3_column_text(stmt, 0);
        if (text) result = reinterpret_cast<const char*>(text);
    }
    sqlite3_finalize(stmt);
    return result;
}

std::optional<std::string> DBHandler::get_customer_id(const std::string& username) {
    if (!pImpl->connected) return std::nullopt;
    const char* sql = "SELECT customer_id FROM users WHERE username = ?";
    sqlite3_stmt* stmt = nullptr;
    if (sqlite3_prepare_v2(pImpl->db, sql, -1, &stmt, nullptr) != SQLITE_OK) return std::nullopt;
    sqlite3_bind_text(stmt, 1, username.c_str(), -1, SQLITE_STATIC);
    std::optional<std::string> result;
    if (sqlite3_step(stmt) == SQLITE_ROW) {
        const unsigned char* text = sqlite3_column_text(stmt, 0);
        if (text) result = reinterpret_cast<const char*>(text);
    }
    sqlite3_finalize(stmt);
    return result;
}
