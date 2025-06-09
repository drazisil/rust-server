#pragma once
#include <string>
#include <unordered_map>
#include <mutex>

struct ConnectionInfo {
    int socket_fd; // Unique per connection
    std::string session_key; // To be set after authentication
    std::string customer_id; // To be set after authentication
};

class ConnectionManager {
public:
    void add_connection(int socket_fd);
    void remove_connection(int socket_fd);
    ConnectionInfo* get_connection(int socket_fd);
    // Returns the session_key for a given customer_id, or empty string if not found
    std::string get_session_key_by_customer_id(const std::string& customer_id);

private:
    std::unordered_map<int, ConnectionInfo> connections; // key: socket fd
    std::mutex mtx;
};
