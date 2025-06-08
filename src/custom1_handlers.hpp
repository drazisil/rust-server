#pragma once
#include <string>

// Handles Custom Protocol 1 packets. Returns true if handled, false otherwise.
bool handle_custom1_packet(int client_fd, const std::string& data);
