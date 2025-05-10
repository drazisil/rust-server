// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

mod auth;
mod config;
mod logging;
mod server;
mod shard_list;
pub mod database;
mod admin;

use actix_web::{web, App, HttpServer};
use crate::admin::admin_routes;
use config::Config;
use logging::init_logging;
use dotenv::dotenv;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv().ok();

    let _sentry_guard = init_logging();

    let config = Config::from_file("config.json");

    // Start the TCP server and HTTP server
    tokio::spawn(async move {
        server::run_server(config).await;
    });

    HttpServer::new(|| {
        App::new()
            .configure(admin_routes)
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}
