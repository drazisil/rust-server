#include "shard_manager.hpp"

void ShardManager::add_shard(const ShardInfo& shard) {
    std::lock_guard<std::mutex> lock(mutex_);
    shards_.push_back(shard);
}

std::vector<ShardInfo> ShardManager::list_shards() const {
    std::lock_guard<std::mutex> lock(mutex_);
    return shards_;
}
