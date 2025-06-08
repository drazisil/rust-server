#include "http_handlers.hpp"
#include <string>
#include <cstring>
#include <sys/socket.h>

// Handles HTTP requests for the server. Returns true if handled, false otherwise.
bool handle_http_request(int client_fd, const std::string& request) {
    if (request.find("POST /AuthLogin ") == 0 || request.find("GET /AuthLogin ") == 0) {
        const char* response = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: 22\r\n\r\n{\"status\":\"ok\"}";
        send(client_fd, response, strlen(response), 0);
        return true;
    }
    // Default handler (not /AuthLogin)
    const char* response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 13\r\n\r\nHello, world!";
    send(client_fd, response, strlen(response), 0);
    return true;
}
