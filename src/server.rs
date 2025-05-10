// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::signal;
use warp::Filter;
use tracing::{info, error, span, Level};
use crate::config::Config;
use crate::auth::{handle_auth_login, Database};
use crate::shard_list::shard_list_filter;

fn create_response(status: warp::http::StatusCode, body: &str) -> warp::http::Response<String> {
    warp::http::Response::builder()
        .status(status)
        .version(warp::http::Version::HTTP_10)
        .header("Connection", "close")
        .body(body.to_string())
        .unwrap()
}

fn setup_routes(db: Database) -> impl warp::Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    let health_route = warp::path("health").map(|| {
        create_response(warp::http::StatusCode::OK, "Server is running")
    }).boxed();

    let auth_login_route = warp::path("AuthLogin")
        .and(warp::query::<std::collections::HashMap<String, String>>())
        .and(warp::any().map(move || db.clone()))
        .and_then(handle_auth_login)
        .boxed();

    let shard_list_route = warp::path("ShardList").map(|| shard_list_filter()).boxed();

    let not_found_route = warp::any().map(|| {
        create_response(warp::http::StatusCode::NOT_FOUND, "Not Found")
    }).boxed();

    health_route
        .or(auth_login_route)
        .or(shard_list_route)
        .or(not_found_route)
}

fn start_tcp_server(routes: impl warp::Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone + Send + Sync + 'static, config: Config) {
    for port in config.tcp_ports {
        let span = span!(Level::INFO, "tcp_server", port = port);
        let _enter = span.enter();

        let routes = routes.clone();
        tokio::spawn(async move {
            let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
            info!("TCP server running on 0.0.0.0:{}", port);

            loop {
                let span = span!(Level::INFO, "connection_loop", port = port);
                let _enter = span.enter();

                let (mut socket, _) = listener.accept().await.unwrap();
                let routes = routes.clone();
                tokio::spawn(async move {
                    let span = span!(Level::INFO, "handle_request", port = port);
                    let _enter = span.enter();

                    let mut buffer = [0; 1024];

                    match socket.read(&mut buffer).await {
                        Ok(size) => {
                            if size > 0 {
                                let request = String::from_utf8_lossy(&buffer[..size]);
                                if request.starts_with("GET") || request.starts_with("POST") {
                                    if let Some(path) = request.lines().next().and_then(|line| line.split_whitespace().nth(1)) {
                                        let path_without_query: &str = path.split('?').next().unwrap_or(path);
                                        info!("HTTP request detected on port {}: path={}", port, path_without_query);

                                        let response = warp::test::request()
                                            .path(path)
                                            .reply(&routes)
                                            .await;

                                        let http_response = format!(
                                            "HTTP/1.0 {}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                                            response.status(),
                                            response.body().len(),
                                            String::from_utf8_lossy(response.body())
                                        );

                                        socket.write_all(http_response.as_bytes()).await.unwrap();
                                        socket.shutdown().await.unwrap();
                                    } else {
                                        error!("Failed to parse HTTP request path");
                                    }
                                } else {
                                    info!("Non-HTTP request received on port {}", port);
                                }
                            }
                        }
                        Err(e) => error!("Failed to read from socket on port {}: {}", port, e),
                    }
                });
            }
        });
    }
}

pub async fn run_server(config: Config) {
    let span = span!(Level::INFO, "run_server");
    let _enter = span.enter();

    // Setup routes
    let db = Database;
    let routes = setup_routes(db);

    // Start TCP server
    start_tcp_server(routes, config);

    // Wait for a termination signal to keep the runtime alive
    signal::ctrl_c().await.expect("Failed to listen for ctrl_c signal");
    info!("Server shutting down...");
}
