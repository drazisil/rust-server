#ifndef CUSTOM2_HANDLERS_HPP
#define CUSTOM2_HANDLERS_HPP

#include <string>

// Handles Custom Protocol 2 packets. Returns true if handled, false otherwise.
bool handle_custom2_packet(int client_fd, const std::string& data);

#endif // CUSTOM2_HANDLERS_HPP
