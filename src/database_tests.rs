#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_shard_results() {
        let mock_results = vec![
            ShardListEntry {
                id: 1,
                name: "Mock Shard".to_string(),
                description: "A mock shard for testing".to_string(),
                login_server_ip: "127.0.0.1".to_string(),
                login_server_port: 8080,
                lobby_server_ip: "127.0.0.1".to_string(),
                lobby_server_port: 8081,
                mcots_server_ip: "127.0.0.1".to_string(),
                server_group_name: "MockGroup".to_string(),
                population: 0,
                max_personas_per_user: 1,
                diagnostic_server_host: "127.0.0.1".to_string(),
                diagnostic_server_port: 9090,
                status: serde_json::json!({}),
            },
        ];

        let processed_results = process_shard_results(mock_results.clone());
        assert_eq!(processed_results, mock_results);
    }

    #[test]
    fn test_construct_get_all_shards_query() {
        let query = construct_get_all_shards_query();
        assert_eq!(query, "SELECT id, name, description, login_server_ip, login_server_port, lobby_server_ip, lobby_server_port, mcots_server_ip, server_group_name, population, max_personas_per_user, diagnostic_server_host, diagnostic_server_port, status FROM shards");
    }
}
