#include "connection_manager.hpp"

void ConnectionManager::add_connection(int socket_fd) {
    std::lock_guard<std::mutex> lock(mtx);
    connections[socket_fd] = ConnectionInfo{socket_fd, "", ""};
}

void ConnectionManager::remove_connection(int socket_fd) {
    std::lock_guard<std::mutex> lock(mtx);
    connections.erase(socket_fd);
}

std::optional<ConnectionInfo> ConnectionManager::get_connection(int socket_fd) const {
    std::lock_guard<std::mutex> lock(mtx);
    auto it = connections.find(socket_fd);
    if (it != connections.end()) {
        return it->second;
    }
    return std::nullopt;
}

std::string ConnectionManager::get_session_key_by_customer_id(const std::string& customer_id) const {
    std::lock_guard<std::mutex> lock(mtx);
    for (const auto& [fd, info] : connections) {
        if (info.customer_id == customer_id) {
            return info.session_key;
        }
    }
    return "";
}

void ConnectionManager::clear() {
    std::lock_guard<std::mutex> lock(mtx);
    connections.clear();
}
