#pragma once
#include <vector>
#include <string>

class Server {
public:
    Server();
    ~Server();
    void run();
    // Expose for testing
    int create_listener(int port);
private:
    void handle_connections();
    std::vector<std::pair<int, std::string>> listeners;
};
