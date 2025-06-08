#pragma once
#include <string>

// Handles HTTP requests for the server. Returns true if handled, false otherwise.
bool handle_http_request(int client_fd, const std::string& request);
