use warp::http::{Response, StatusCode};
use serde::Serialize;

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
    pub status_id: u8,
    pub status_reason: String,
    pub server_group_name: String,
    pub population: u32,
    pub max_personas_per_user: u8,
    pub diagnostic_server_host: String,
    pub diagnostic_server_port: u16,
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
            status_id: 1,
            status_reason: "Online".to_string(),
            server_group_name: "GroupA".to_string(),
            population: 100,
            max_personas_per_user: 5,
            diagnostic_server_host: "192.168.1.4".to_string(),
            diagnostic_server_port: 9090,
        },
    ];

    let plain_text = shard_list
        .iter()
        .map(|entry| {
            format!(
                "[{}]\nDescription={}\nShardId={}\nLoginServerIP={}\nLoginServerPort={}\nLobbyServerIp={}\nLobbyServerPort={}\nMCOTSServerIP={}\nStatisId={}\nStatus_Reason={}\nServerGroup_Name={}\nPopulation={}\nMaxPersonasPerUser={}\nDiagnosticServerHost={}\nDiagnosticServerPort={}\n",
                entry.name,
                entry.description,
                entry.id,
                entry.login_server_ip,
                entry.login_server_port,
                entry.lobby_server_ip,
                entry.lobby_server_port,
                entry.mcots_server_ip,
                entry.status_id,
                entry.status_reason,
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
