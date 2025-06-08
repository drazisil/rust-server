#include "http_handlers.hpp"
#include <string>
#include <cstring>
#include <sys/socket.h>
#include <map>
#include <sstream>

// Helper to parse query string into key-value pairs
std::map<std::string, std::string> parse_query_string(const std::string& qs) {
    std::map<std::string, std::string> params;
    std::istringstream ss(qs);
    std::string pair;
    while (std::getline(ss, pair, '&')) {
        size_t eq = pair.find('=');
        if (eq != std::string::npos) {
            params[pair.substr(0, eq)] = pair.substr(eq + 1);
        } else if (!pair.empty()) {
            params[pair] = "";
        }
    }
    return params;
}

// Handles HTTP requests for the server. Returns true if handled, false otherwise.
bool handle_http_request(int client_fd, const std::string& request) {
    const char* response = nullptr;
    std::string query_string;
    std::map<std::string, std::string> params;
    if (request.find("GET /AuthLogin") == 0) {
        // Extract query string if present
        size_t path_end = request.find(' ', 4); // after "GET ", find next space
        if (path_end != std::string::npos) {
            size_t qs_start = request.find('?', 4);
            if (qs_start != std::string::npos && qs_start < path_end) {
                query_string = request.substr(qs_start + 1, path_end - qs_start - 1);
                params = parse_query_string(query_string);
                // params now contains key-value pairs from the query string
            }
        }
        response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\n\r\nok";
    } else {
        response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 13\r\n\r\nHello, world!";
    }
    send(client_fd, response, strlen(response), 0);
    return true;
}
