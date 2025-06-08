#include <iostream>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <cstring>
#include <vector>
#include <algorithm>

#define HTTP_PORT 3000
#define CUSTOM_PROTO_PORTS {8226, 8228, 7003}
#define CUSTOM_PROTO2_PORT 43300
#define MAX_CONN 10

int create_listener(int port) {
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

int main(int, char**) {
    std::cout << "Starting multi-port server...\n";
    // HTTP server
    int http_listener = create_listener(HTTP_PORT);
    // Custom protocol 1 servers
    std::vector<int> custom_proto_ports = {8226, 8228, 7003};
    std::vector<int> custom_proto_listeners;
    for (int port : custom_proto_ports) {
        custom_proto_listeners.push_back(create_listener(port));
    }
    // Custom protocol 2 server
    int custom_proto2_listener = create_listener(CUSTOM_PROTO2_PORT);

    // Collect all listeners
    std::vector<std::pair<int, std::string>> listeners = {
        {http_listener, "HTTP"},
        {custom_proto_listeners[0], "CUSTOM1"},
        {custom_proto_listeners[1], "CUSTOM1"},
        {custom_proto_listeners[2], "CUSTOM1"},
        {custom_proto2_listener, "CUSTOM2"}
    };

    std::cout << "Listening on:\n";
    std::cout << "  HTTP: " << HTTP_PORT << "\n";
    std::cout << "  CUSTOM1: 8226, 8228, 7003\n";
    std::cout << "  CUSTOM2: " << CUSTOM_PROTO2_PORT << "\n";

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
                    // Simple HTTP response
                    const char* response = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 13\r\n\r\nHello, world!";
                    send(client_fd, response, strlen(response), 0);
                } else if (l.second == "CUSTOM1") {
                    // Placeholder for custom protocol 1
                    const char* msg = "Custom Protocol 1 Connected\n";
                    send(client_fd, msg, strlen(msg), 0);
                } else if (l.second == "CUSTOM2") {
                    // Placeholder for custom protocol 2
                    const char* msg = "Custom Protocol 2 Connected\n";
                    send(client_fd, msg, strlen(msg), 0);
                }
                close(client_fd);
                std::cout << "Handled connection on port " << ntohs(client_addr.sin_port) << " (" << l.second << ")" << std::endl;
            }
        }
    }
    for (const auto& l : listeners) close(l.first);
    return 0;
}
