use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct ShardStatus {
    pub id: u8,
    pub reason: String,
}

#[derive(Serialize, Clone)]
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

lazy_static! {
    pub static ref SHARD_DATABASE: Arc<Mutex<Vec<ShardListEntry>>> = Arc::new(Mutex::new(vec![
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
    ]));

    pub static ref AUTH_CREDENTIALS: Arc<Mutex<(String, String)>> = Arc::new(Mutex::new((
        "admin".to_string(),
        "password123".to_string(),
    )));
}

impl ShardListEntry {
    pub fn get_all_shards() -> Vec<ShardListEntry> {
        let db = SHARD_DATABASE.lock().unwrap();
        db.clone()
    }

    pub fn get_shard_by_id(id: u32) -> Option<ShardListEntry> {
        let db = SHARD_DATABASE.lock().unwrap();
        db.iter().find(|shard| shard.id == id).cloned()
    }

    pub fn add_shard(shard: ShardListEntry) {
        let mut db = SHARD_DATABASE.lock().unwrap();
        db.push(shard);
    }

    pub fn update_shard(id: u32, updated_shard: ShardListEntry) -> bool {
        let mut db = SHARD_DATABASE.lock().unwrap();
        if let Some(shard) = db.iter_mut().find(|shard| shard.id == id) {
            *shard = updated_shard;
            true
        } else {
            false
        }
    }

    pub fn delete_shard(id: u32) -> bool {
        let mut db = SHARD_DATABASE.lock().unwrap();
        if let Some(pos) = db.iter().position(|shard| shard.id == id) {
            db.remove(pos);
            true
        } else {
            false
        }
    }
}

impl AUTH_CREDENTIALS {
    pub fn get_credentials() -> (String, String) {
        let creds = AUTH_CREDENTIALS.lock().unwrap();
        creds.clone()
    }

    pub fn update_credentials(username: String, password: String) {
        let mut creds = AUTH_CREDENTIALS.lock().unwrap();
        *creds = (username, password);
    }
}
