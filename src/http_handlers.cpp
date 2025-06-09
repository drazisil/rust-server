#include "http_handlers.hpp"
#include "logger.hpp"
#include "login.hpp"
#include "shard_manager.hpp"
#include <string>
#include <cstring>
#include <sys/socket.h>
#include <map>
#include <sstream>
#include <functional>
#include <unordered_map>

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

std::string make_http_response(const std::string& body, int status_code = 200) {
    std::string status_text = (status_code == 200) ? "OK" : std::to_string(status_code);
    return "HTTP/1.1 " + std::to_string(status_code) + " " + status_text + "\r\nContent-Type: text/plain\r\nContent-Length: " + std::to_string(body.size()) + "\r\n\r\n" + body;
}

using HandlerFunc = std::function<void(int, const std::string&, const std::map<std::string, std::string>&)>;

// Handler for /AuthLogin
void auth_login_handler(int client_fd, const std::string& request, const std::map<std::string, std::string>& params) {
    std::string login_result = handle_auth_login(params);
    if (login_result.rfind("HTTP/1.1", 0) == 0) {
        send(client_fd, login_result.c_str(), login_result.size(), 0);
    } else {
        std::string http_response = make_http_response(login_result, 200);
        send(client_fd, http_response.c_str(), http_response.size(), 0);
    }
}

ShardInfo initial_start_shard = {
                "88",
                "Shard 1",
                "Main shard for testing",
                "10.10.5.20",
                "8226",
                "10.10.5.20",
                "7003",
                "10.10.5.20",
                "0",
                "",
                "Group-1",
                "100",
                "10",
                "rusty-motors.com",
                "80"
};
// Global shard manager instance
namespace {
    ShardManager shard_manager;
    struct ShardManagerInit {
        ShardManagerInit() {
            shard_manager.add_shard(initial_start_shard);
            LOG("ShardManager initialized with default shard: " + initial_start_shard.name);
        }
    } _shard_manager_init;
}

std::string format_shards_response(const std::vector<ShardInfo>& shards) {
    std::string body;
    for (const auto& shard : shards) {
        body += "[" + shard.name + "]\n"
        + "\tDescription=" + shard.description + "\n"
        + "\tShardId=" + shard.id + "\n"
        + "\tLoginServerIP=" + shard.login_ip + "\n"
        + "\tLoginServerPort=" + shard.login_port + "\n"
        + "\tLobbyServerIP=" + shard.lobby_ip + "\n"
        + "\tLobbyServerPort=" + shard.lobby_port + "\n"
        + "\tMCOTSServerIP=" + shard.mcots_ip + "\n"
        + "\tStatusId=" + shard.status_code + "\n"
        + "\tStatus_Reason=" + shard.status_text + "\n"
        + "\tServerGroup_Name=" + shard.server_group + "\n"
        + "\tPopulation=" + shard.population + "\n"
        + "\tMaxPersonasPerUser=" + shard.max_profile_count + "\n"
        + "\tDiagnosticServerHost=" + shard.diagnostic_hostname + "\n"
        + "\tDiagnosticServerPort=" + shard.diagnostic_port + "\n\n\n";
    }
    if (body.empty()) body = "No shards available\n";
    return body;
}

void shard_list_handler(int client_fd, const std::string& request, const std::map<std::string, std::string>& params) {
    auto shards = shard_manager.list_shards();
    std::string body = format_shards_response(shards);
    std::string http_response = make_http_response(body, 200);
    send(client_fd, http_response.c_str(), http_response.size(), 0);
}

// Handles HTTP requests for the server. Returns true if handled, false otherwise.
bool handle_http_request(int client_fd, const std::string& request) {
    // Map of path to handler
    static const std::unordered_map<std::string, HandlerFunc> handler_map = {
        {"/AuthLogin", auth_login_handler},
        {"/ShardList/", shard_list_handler}
        // Add more path/handler pairs here
    };

    // Parse path and query string
    size_t method_end = request.find(' ');
    if (method_end == std::string::npos) return false;
    size_t path_start = method_end + 1;
    size_t path_end = request.find(' ', path_start);
    if (path_end == std::string::npos) return false;
    std::string full_path = request.substr(path_start, path_end - path_start);
    std::string path = full_path;
    std::string query_string;
    size_t qs_start = full_path.find('?');
    if (qs_start != std::string::npos) {
        path = full_path.substr(0, qs_start);
        query_string = full_path.substr(qs_start + 1);
    }
    std::map<std::string, std::string> params = parse_query_string(query_string);

    // Log the request path, with the query string removed for security
    LOG("Received HTTP request: " + path);
    
    auto it = handler_map.find(path);
    if (it != handler_map.end()) {
        LOG("Handling request for path: " + path);
        it->second(client_fd, request, params);
        return true;
    } else {
        std::string response = make_http_response("Invalid request", 400);
        send(client_fd, response.c_str(), response.size(), 0);
        return true;
    }
}
