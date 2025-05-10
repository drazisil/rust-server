mod auth;
mod config;
mod logging;
mod server;

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
