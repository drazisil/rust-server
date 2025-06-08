#include "custom2_handlers.hpp"
#include <cstring>
#include <sys/socket.h>

bool handle_custom2_packet(int client_fd, const std::string& data) {
    // Placeholder: always respond with a static message
    const char* msg = "Custom Protocol 2 Connected\n";
    send(client_fd, msg, strlen(msg), 0);
    return true;
}
