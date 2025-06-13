#pragma once
#include <string>
#include <unordered_map>
#include <mutex>
#include <optional>
#include <functional> // For std::reference_wrapper

struct ConnectionInfo {
    int socket_fd; // Unique per connection
    std::string session_key; // To be set after authentication
    std::string customer_id; // To be set after authentication
};

class ConnectionManager {
public:
    void add_connection(int socket_fd);
    void remove_connection(int socket_fd);
    std::optional<ConnectionInfo> get_connection(int socket_fd) const;
    // Returns the session_key for a given customer_id, or empty string if not found
    std::string get_session_key_by_customer_id(const std::string& customer_id) const;
    void clear(); // For testability

    // Thread-safe in-place update method for a connection
    template<typename Func>
    void update_connection(int socket_fd, Func mutator) {
        std::lock_guard<std::mutex> lock(mtx);
        auto it = connections.find(socket_fd);
        if (it != connections.end()) {
            mutator(it->second);
        }
    }

private:
    mutable std::mutex mtx;
    std::unordered_map<int, ConnectionInfo> connections; // key: socket fd
};
