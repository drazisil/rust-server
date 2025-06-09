#ifndef SHARD_MANAGER_HPP
#define SHARD_MANAGER_HPP

#include <vector>
#include <string>
#include <mutex>

struct ShardInfo {
    std::string id;
    std::string name;
    std::string description;
    std::string login_ip;
    std::string login_port;
    std::string lobby_ip;
    std::string lobby_port;
    std::string mcots_ip;
    std::string status_code;
    std::string status_text;
    std::string server_group;
    std::string population;
    std::string max_profile_count;
    std::string diagnostic_hostname;
    std::string diagnostic_port;
};

class ShardManager {
public:
    void add_shard(const ShardInfo& shard);
    std::vector<ShardInfo> list_shards() const;
private:
    std::vector<ShardInfo> shards_;
    mutable std::mutex mutex_;
};

#endif // SHARD_MANAGER_HPP
