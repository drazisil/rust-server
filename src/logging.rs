// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use tracing_subscriber::fmt; // Simplify the configuration
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::Registry;
use tracing_appender::rolling;
use tracing::warn;
use std::env;
use sentry::{ClientInitGuard, init};
use sentry::integrations::tracing::layer as sentry_tracing_layer;
use tracing_appender::non_blocking::NonBlocking;
use tracing_subscriber::fmt::writer::MakeWriterExt; // For combining writers
use tracing_appender::non_blocking;
use tracing_appender::non_blocking::WorkerGuard; // Import WorkerGuard to manage writer lifetimes
use std::fs;
use serde::Deserialize;
use tracing_subscriber::filter::LevelFilter;

#[derive(Deserialize)]
struct Config {
    log_level: String,
    // Other fields...
}

pub fn init_logging() -> Option<ClientInitGuard> {
    let config: Config = serde_json::from_str(&fs::read_to_string("config.json").expect("Failed to read config.json")).expect("Invalid config.json format");
    let log_level = config.log_level.parse::<LevelFilter>().expect("Invalid log level in config.json");

    let file_appender = rolling::daily("logs", "server.log");
    let (file_writer, file_guard): (NonBlocking, WorkerGuard) = non_blocking(file_appender);
    let (stdout_writer, stdout_guard): (NonBlocking, WorkerGuard) = non_blocking(std::io::stdout());

    // Combine stdout and file writers
    let combined_writer = file_writer.and(stdout_writer);

    let dsn = env::var("SENTRY_DSN").ok();

    if let Some(dsn) = dsn {
        if !dsn.is_empty() {
            let sentry_guard = init((dsn, sentry::ClientOptions {
                release: env::var("GIT_COMMIT").ok().map(|s| s.into()),
                traces_sample_rate: 1.0,
                ..Default::default()
            }));

            let subscriber = Registry::default()
                .with(fmt::layer().with_writer(combined_writer))
                .with(sentry_tracing_layer())
                .with(log_level);

            tracing::subscriber::set_global_default(subscriber).expect("Failed to set global subscriber");

            // Keep guards alive to ensure logs are flushed
            std::mem::forget(file_guard);
            std::mem::forget(stdout_guard);

            return Some(sentry_guard);
        } else {
            warn!("SENTRY_DSN is empty. Sentry functionality is disabled.");
        }
    } else {
        warn!("SENTRY_DSN not set. Sentry functionality is disabled.");
    }

    let subscriber = Registry::default()
        .with(fmt::layer().with_writer(combined_writer))
        .with(log_level);

    tracing::subscriber::set_global_default(subscriber).expect("Failed to set global subscriber");

    // Keep guards alive to ensure logs are flushed
    std::mem::forget(file_guard);
    std::mem::forget(stdout_guard);

    None
}
