// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use actix_web::{web, HttpResponse, Responder};
use serde::Deserialize;
use crate::database::ShardListEntry;
use sqlx::PgPool;

#[derive(Deserialize)]
struct ShardInput {
    name: String,
    description: String,
    login_server_ip: String,
    login_server_port: u16,
    lobby_server_ip: String,
    lobby_server_port: u16,
    mcots_server_ip: String,
    server_group_name: String,
    population: u32,
    max_personas_per_user: u8,
    diagnostic_server_host: String,
    diagnostic_server_port: u16,
}

async fn get_shards(pool: web::Data<PgPool>) -> impl Responder {
    let shards = match sqlx::query_as!(
        ShardListEntry,
        "SELECT id, name, description, login_server_ip, login_server_port, lobby_server_ip, lobby_server_port, mcots_server_ip, server_group_name, population, max_personas_per_user, diagnostic_server_host, diagnostic_server_port, status FROM shards"
    )
    .fetch_all(&**pool)
    .await {
        Ok(result) => result,
        Err(err) => {
            eprintln!("Database query failed: {}", err);
            return HttpResponse::InternalServerError().finish();
        }
    };

    HttpResponse::Ok().json(shards)
}

async fn add_shard(pool: web::Data<PgPool>, shard: web::Json<ShardInput>) -> impl Responder {
    // Fix type mismatches by casting fields to the expected types
    let result = sqlx::query!(
        "INSERT INTO shards (name, description, login_server_ip, login_server_port, lobby_server_ip, lobby_server_port, mcots_server_ip, server_group_name, population, max_personas_per_user, diagnostic_server_host, diagnostic_server_port) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)",
        shard.name,
        shard.description,
        shard.login_server_ip,
        shard.login_server_port as i32,
        shard.lobby_server_ip,
        shard.lobby_server_port as i32,
        shard.mcots_server_ip,
        shard.server_group_name,
        shard.population as i32,
        shard.max_personas_per_user as i32,
        shard.diagnostic_server_host,
        shard.diagnostic_server_port as i32
    )
    .execute(pool.get_ref())
    .await;

    match result {
        Ok(_) => HttpResponse::Created().finish(),
        Err(_) => HttpResponse::InternalServerError().finish(),
    }
}

pub fn admin_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/admin")
            .route("/shards", web::get().to(get_shards))
            .route("/shards", web::post().to(add_shard))
    );
}
