#ifndef HTTP_HANDLERS_HPP
#define HTTP_HANDLERS_HPP

#include <string>

// Handles HTTP requests for the server. Returns true if handled, false otherwise.
bool handle_http_request(int client_fd, const std::string& request);

#endif // HTTP_HANDLERS_HPP
