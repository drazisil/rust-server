// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use warp::http::{Response, StatusCode};

use crate::database::SHARD_DATABASE;

pub fn shard_list_filter() -> warp::http::Response<String> {
    let shard_list = SHARD_DATABASE.lock().unwrap();

    let plain_text = shard_list
        .iter()
        .map(|entry| {
            let status_id = entry.status["id"].to_string();
            let status_reason = entry.status["reason"].to_string();

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
