#include "session_manager.hpp"

void SessionManager::set(const std::string& session_id, const std::string& customer_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    store_[session_id] = customer_id;
}

// Returns the customer_id for a given session_id, or std::nullopt if not found
std::optional<std::string> SessionManager::get(const std::string& session_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto it = store_.find(session_id);
    if (it != store_.end()) return it->second;
    return std::nullopt;
}

void SessionManager::remove(const std::string& session_id) {
    std::lock_guard<std::mutex> lock(mutex_);
    store_.erase(session_id);
}
