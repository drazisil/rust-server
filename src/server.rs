use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::signal;
use warp::Filter;
use tracing::{info, error, span, Level};
use crate::config::Config;

pub async fn run_server(config: Config) {
    let span = span!(Level::INFO, "run_server");
    let _enter = span.enter();

    // Define the health check route
    let health_route = warp::path("health").map(|| "Server is running");

    // Define the /AuthLogin route
    let auth_login_route = warp::path("AuthLogin").map(|| "OK");

    // Define a default 404 handler
    let not_found_route = warp::any().map(|| warp::reply::with_status("Not Found", warp::http::StatusCode::NOT_FOUND));

    // Combine all routes
    let routes = health_route.or(auth_login_route).or(not_found_route);

    // Start the TCP server to forward requests to the Warp server
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
                                    info!("HTTP request detected on port {}: {}", port, request);

                                    if let Some(path) = request.lines().next().and_then(|line| line.split_whitespace().nth(1)) {
                                        let response = warp::test::request()
                                            .path(path)
                                            .reply(&routes)
                                            .await;

                                        socket.write_all(response.body()).await.unwrap();
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

    // Wait for a termination signal to keep the runtime alive
    signal::ctrl_c().await.expect("Failed to listen for ctrl_c signal");
    info!("Server shutting down...");
}
