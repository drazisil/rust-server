#ifndef SERVER_HPP
#define SERVER_HPP

#include <vector>
#include <string>

class Server {
public:
    // Construction does not bind or listen on any ports
    Server();
    ~Server();
    void run();
    // Expose for testing
    int create_listener(int port);
private:
    void handle_connections();
    std::vector<std::pair<int, std::string>> listeners;
};

#endif // SERVER_HPP
