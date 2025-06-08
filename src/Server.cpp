#include "Server.hpp"
#include "http_handlers.hpp"
#include "custom1_handlers.hpp"
#include "custom2_handlers.hpp"
#include <iostream>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include <algorithm>

#define HTTP_PORT 3000
#define CUSTOM_PROTO2_PORT 43300
#define MAX_CONN 10

Server::Server() {
    // HTTP server
    int http_listener = create_listener(HTTP_PORT);
    // Custom protocol 1 servers
    std::vector<int> custom_proto_ports = {8226, 8228, 7003};
    for (int port : custom_proto_ports) {
        listeners.emplace_back(create_listener(port), "CUSTOM1");
    }
    listeners.emplace_back(http_listener, "HTTP");
    // Custom protocol 2 server
    int custom_proto2_listener = create_listener(CUSTOM_PROTO2_PORT);
    listeners.emplace_back(custom_proto2_listener, "CUSTOM2");
}

Server::~Server() {
    for (const auto& l : listeners) close(l.first);
}

int Server::create_listener(int port) {
    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0) {
        perror("socket");
        exit(EXIT_FAILURE);
    }
    int opt = 1;
    setsockopt(sockfd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = INADDR_ANY;
    addr.sin_port = htons(port);
    if (bind(sockfd, (sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        close(sockfd);
        exit(EXIT_FAILURE);
    }
    if (listen(sockfd, MAX_CONN) < 0) {
        perror("listen");
        close(sockfd);
        exit(EXIT_FAILURE);
    }
    return sockfd;
}

void Server::run() {
    std::cout << "Starting multi-port server...\n";
    std::cout << "Listening on:\n";
    std::cout << "  HTTP: " << HTTP_PORT << "\n";
    std::cout << "  CUSTOM1: 8226, 8228, 7003\n";
    std::cout << "  CUSTOM2: " << CUSTOM_PROTO2_PORT << "\n";
    handle_connections();
}

void Server::handle_connections() {
    fd_set master_set, read_fds;
    FD_ZERO(&master_set);
    int fdmax = 0;
    for (const auto& l : listeners) {
        FD_SET(l.first, &master_set);
        if (l.first > fdmax) fdmax = l.first;
    }
    while (true) {
        read_fds = master_set;
        if (select(fdmax+1, &read_fds, nullptr, nullptr, nullptr) < 0) {
            perror("select");
            break;
        }
        for (const auto& l : listeners) {
            if (FD_ISSET(l.first, &read_fds)) {
                sockaddr_in client_addr;
                socklen_t addrlen = sizeof(client_addr);
                int client_fd = accept(l.first, (sockaddr*)&client_addr, &addrlen);
                if (client_fd < 0) {
                    perror("accept");
                    continue;
                }
                if (l.second == "HTTP") {
                    char buffer[1024] = {0};
                    ssize_t bytes = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
                    std::string request(buffer, bytes > 0 ? bytes : 0);
                    handle_http_request(client_fd, request);
                } else if (l.second == "CUSTOM1") {
                    char buffer[1024] = {0};
                    ssize_t bytes = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
                    std::string data(buffer, bytes > 0 ? bytes : 0);
                    handle_custom1_packet(client_fd, data);
                } else if (l.second == "CUSTOM2") {
                    char buffer[1024] = {0};
                    ssize_t bytes = recv(client_fd, buffer, sizeof(buffer) - 1, 0);
                    std::string data(buffer, bytes > 0 ? bytes : 0);
                    handle_custom2_packet(client_fd, data);
                }
                close(client_fd);
                std::cout << "Handled connection on port " << ntohs(client_addr.sin_port) << " (" << l.second << ")" << std::endl;
            }
        }
    }
}
