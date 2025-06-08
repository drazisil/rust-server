#ifndef CUSTOM1_HANDLERS_HPP
#define CUSTOM1_HANDLERS_HPP

#include <string>

// Handles Custom Protocol 1 packets. Returns true if handled, false otherwise.
bool handle_custom1_packet(int client_fd, const std::string& data);

#endif // CUSTOM1_HANDLERS_HPP
