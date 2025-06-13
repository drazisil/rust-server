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

    // Set or update a connection's info by socket_fd
    void set_connection(int socket_fd, const ConnectionInfo& info);

private:
    mutable std::mutex mtx;
    std::unordered_map<int, ConnectionInfo> connections; // key: socket fd
};
