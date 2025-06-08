#include "src/Server.hpp"
#include <gtest/gtest.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>

// Test that the Server can be constructed and destructed without error
TEST(ServerTest, ConstructionAndDestruction) {
    Server* server = nullptr;
    ASSERT_NO_THROW(server = new Server());
    ASSERT_NO_THROW(delete server);
}

// Test that create_listener returns a valid socket and can bind to a random port
TEST(ServerTest, CreateListenerValidPort) {
    class TestServer : public Server {
    public:
        using Server::create_listener;
    };
    TestServer ts;
    int sock = ts.create_listener(0); // 0 lets OS pick a free port
    ASSERT_GT(sock, 0);
    close(sock);
}
