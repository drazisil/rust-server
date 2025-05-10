use tracing_subscriber;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_appender::rolling;
use tracing::warn;
use std::env;
use sentry::{ClientInitGuard, init};

pub fn init_logging() -> Option<ClientInitGuard> {
    let file_appender = rolling::daily("logs", "server.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::fmt()
        .with_writer(non_blocking.and(std::io::stdout))
        .init();

    let dsn = env::var("SENTRY_DSN").ok();

    if let Some(dsn) = dsn {
        if !dsn.is_empty() {
            return Some(init((dsn, sentry::ClientOptions::default())));
        } else {
            warn!("SENTRY_DSN is empty. Sentry functionality is disabled.");
        }
    } else {
        warn!("SENTRY_DSN not set. Sentry functionality is disabled.");
    }

    None
}
