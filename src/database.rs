// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use std::sync::{Arc, Mutex};
use lazy_static::lazy_static;
use serde::Serialize;
use sqlx::{PgPool, migrate::Migrator};
use once_cell::sync::OnceCell;
use std::path::Path;
use dotenv::dotenv;
use std::env;
use url::Url;

#[derive(Serialize, Clone, sqlx::FromRow)]
pub struct ShardListEntry {
    pub id: i32,
    pub name: String,
    pub description: String,
    pub login_server_ip: String,
    pub login_server_port: i32,
    pub lobby_server_ip: String,
    pub lobby_server_port: i32,
    pub mcots_server_ip: String,
    pub server_group_name: String,
    pub population: i32,
    pub max_personas_per_user: i32,
    pub diagnostic_server_host: String,
    pub diagnostic_server_port: i32,
    pub status: serde_json::Value,
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
            status: serde_json::json!({}), // Healthy shard
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
            status: serde_json::json!({
                "id": 2,
                "reason": "Offline"
            }),
        },
    ]));

    pub static ref AUTH_CREDENTIALS: Arc<Mutex<(String, String)>> = Arc::new(Mutex::new((
        "postgres".to_string(),
        "password".to_string(),
    )));
}

pub static DB_POOL: OnceCell<PgPool> = OnceCell::new();
static MIGRATOR: OnceCell<Migrator> = OnceCell::new();

pub async fn initialize_database() {
    dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    // Parse the database URL to extract username and password
    let parsed_url = Url::parse(&database_url).expect("Invalid DATABASE_URL format");
    let username = parsed_url.username().to_string();
    let password = parsed_url.password().unwrap_or("").to_string();

    // Update the AUTH_CREDENTIALS with the parsed username and password
    AUTH_CREDENTIALS.lock().unwrap().0 = username;
    AUTH_CREDENTIALS.lock().unwrap().1 = password;

    let pool = PgPool::connect(&database_url).await.expect("Failed to create pool");
    DB_POOL.set(pool).expect("Failed to set DB_POOL");

    let migrator = Migrator::new(Path::new("migrations"))
        .await
        .expect("Failed to load migrations");
    MIGRATOR.set(migrator).expect("Failed to set MIGRATOR");

    MIGRATOR.get().unwrap().run(DB_POOL.get().unwrap()).await.expect("Failed to run migrations");
}

impl ShardListEntry {
    pub fn get_all_shards() -> Vec<ShardListEntry> {
        let db = SHARD_DATABASE.lock().unwrap();
        db.clone()
    }

    pub fn get_shard_by_id(id: u32) -> Option<ShardListEntry> {
        let db = SHARD_DATABASE.lock().unwrap();
        db.iter().find(|shard| shard.id == id as i32).cloned()
    }

    pub fn add_shard(shard: ShardListEntry) {
        let mut db = SHARD_DATABASE.lock().unwrap();
        db.push(shard);
    }

    pub fn update_shard(id: u32, updated_shard: ShardListEntry) -> bool {
        let mut db = SHARD_DATABASE.lock().unwrap();
        if let Some(shard) = db.iter_mut().find(|shard| shard.id == id as i32) {
            *shard = updated_shard;
            true
        } else {
            false
        }
    }

    pub fn delete_shard(id: u32) -> bool {
        let mut db = SHARD_DATABASE.lock().unwrap();
        if let Some(pos) = db.iter().position(|shard| shard.id == id as i32) {
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
