use warp::http::{Response, StatusCode};
use serde::Serialize;

#[derive(Serialize)]
pub struct ShardStatus {
    pub id: u8,
    pub reason: String,
}

#[derive(Serialize)]
pub struct ShardListEntry {
    pub name: String,
    pub description: String,
    pub id: u32,
    pub login_server_ip: String,
    pub login_server_port: u16,
    pub lobby_server_ip: String,
    pub lobby_server_port: u16,
    pub mcots_server_ip: String,
    pub server_group_name: String,
    pub population: u32,
    pub max_personas_per_user: u8,
    pub diagnostic_server_host: String,
    pub diagnostic_server_port: u16,
    pub status: Option<ShardStatus>,
}

pub fn shard_list_filter() -> warp::http::Response<String> {
    let shard_list = vec![
        ShardListEntry {
            name: "Shard1".to_string(),
            description: "Primary shard".to_string(),
            id: 1,
            login_server_ip: "192.168.1.1".to_string(),
            login_server_port: 8080,
            lobby_server_ip: "192.168.1.2".to_string(),
            lobby_server_port: 8081,
            mcots_server_ip: "192.168.1.3".to_string(),
            server_group_name: "GroupA".to_string(),
            population: 100,
            max_personas_per_user: 5,
            diagnostic_server_host: "192.168.1.4".to_string(),
            diagnostic_server_port: 9090,
            status: None, // Healthy shard
        },
        ShardListEntry {
            name: "Shard2".to_string(),
            description: "Secondary shard".to_string(),
            id: 2,
            login_server_ip: "192.168.1.5".to_string(),
            login_server_port: 8082,
            lobby_server_ip: "192.168.1.6".to_string(),
            lobby_server_port: 8083,
            mcots_server_ip: "192.168.1.7".to_string(),
            server_group_name: "GroupB".to_string(),
            population: 50,
            max_personas_per_user: 3,
            diagnostic_server_host: "192.168.1.8".to_string(),
            diagnostic_server_port: 9091,
            status: Some(ShardStatus {
                id: 2,
                reason: "Offline".to_string(),
            }),
        },
    ];

    let plain_text = shard_list
        .iter()
        .map(|entry| {
            let (status_id, status_reason) = match &entry.status {
                Some(status) => (status.id.to_string(), status.reason.clone()),
                None => ("".to_string(), "".to_string()),
            };

            format!(
                "[{}]\nDescription={}\nShardId={}\nLoginServerIP={}\nLoginServerPort={}\nLobbyServerIp={}\nLobbyServerPort={}\nMCOTSServerIP={}\nStatusId={}\nStatus_Reason={}\nServerGroup_Name={}\nPopulation={}\nMaxPersonasPerUser={}\nDiagnosticServerHost={}\nDiagnosticServerPort={}\n",
                entry.name,
                entry.description,
                entry.id,
                entry.login_server_ip,
                entry.login_server_port,
                entry.lobby_server_ip,
                entry.lobby_server_port,
                entry.mcots_server_ip,
                status_id,
                status_reason,
                entry.server_group_name,
                entry.population,
                entry.max_personas_per_user,
                entry.diagnostic_server_host,
                entry.diagnostic_server_port
            )
        })
        .collect::<Vec<_>>()
        .join("\n");

    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "text/plain")
        .body(plain_text)
        .unwrap()
}
