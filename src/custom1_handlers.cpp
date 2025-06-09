#include "custom1_handlers.hpp"
#include "logger.hpp"
#include <cstring>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>

bool handle_custom1_packet(int client_fd, const std::string& data) {

    // Log the received data in hex for debugging with local port it was received on
    sockaddr_in addr;
    socklen_t addr_len = sizeof(addr);
    if (getpeername(client_fd, (struct sockaddr*)&addr, &addr_len) < 0) {
        LOG_ERROR("Failed to get peer name for client_fd " + std::to_string(client_fd));
        return false;
    }
    std::string hex_data;
    for (unsigned char c : data) {
        char hex[3];
        snprintf(hex, sizeof(hex), "%02x", c);
        hex_data += hex;
    }
    LOG("Received Custom Protocol 1 packet from " + std::string(inet_ntoa(addr.sin_addr)) + ":" + std::to_string(ntohs(addr.sin_port)) + " - Data: " + hex_data);


    // Placeholder: always respond with a static message
    const char* msg = "Custom Protocol 1 Connected\n";
    send(client_fd, msg, strlen(msg), 0);
    return true;
}
