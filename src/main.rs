// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

mod auth;
mod config;
mod logging;
mod server;
mod shard_list;
pub mod database;

use config::Config;
use logging::init_logging;
use server::run_server;
use dotenv::dotenv;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let _sentry_guard = init_logging();

    let config = Config::from_file("config.json");

    run_server(config).await;
}
