#ifndef CUSTOM1_HANDLERS_HPP
#define CUSTOM1_HANDLERS_HPP

#include <string>
#include "connection_manager.hpp"

// Handles Custom Protocol 1 packets. Returns true if handled, false otherwise.
bool handle_custom1_packet(int client_fd, const std::string& data, int connection_id);

// Global instance for all translation units
extern ConnectionManager custom1_conn_mgr;

#endif // CUSTOM1_HANDLERS_HPP
