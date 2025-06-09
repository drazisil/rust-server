#ifndef SESSION_MANAGER_HPP
#define SESSION_MANAGER_HPP

#include <string>
#include <optional>
#include <unordered_map>
#include <mutex>

class SessionManager {
public:
    void set(const std::string& session_id, const std::string& customer_id);
    std::optional<std::string> get(const std::string& session_id);
    void remove(const std::string& session_id);
private:
    std::unordered_map<std::string, std::string> store_;
    std::mutex mutex_;
};

#endif // SESSION_MANAGER_HPP
