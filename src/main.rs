use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::signal;
use serde::Deserialize;
use std::fs;
use warp::Filter;
use sentry::{ClientInitGuard, init};
use sentry_actix::Sentry;
use dotenv::dotenv;
use std::env;

#[derive(Deserialize)]
struct Config {
    tcp_ports: Vec<u16>,
}

async fn run_server() {
    // Read the configuration file
    let config_data = fs::read_to_string("config.json").expect("Unable to read config file");
    let config: Config = serde_json::from_str(&config_data).expect("Invalid config format");

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
        let routes = routes.clone();
        tokio::spawn(async move {
            let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
            println!("TCP server running on 0.0.0.0:{}", port);

            loop {
                let (mut socket, _) = listener.accept().await.unwrap();
                let routes = routes.clone();
                tokio::spawn(async move {
                    let mut buffer = [0; 1024];

                    match socket.read(&mut buffer).await {
                        Ok(size) => {
                            if size > 0 {
                                let request = String::from_utf8_lossy(&buffer[..size]);
                                if request.starts_with("GET") || request.starts_with("POST") {
                                    println!("HTTP request detected on port {}: {}", port, request);

                                    if let Some(path) = request.lines().next().and_then(|line| line.split_whitespace().nth(1)) {
                                        let response = warp::test::request()
                                            .path(path)
                                            .reply(&routes)
                                            .await;

                                        socket.write_all(response.body()).await.unwrap();
                                    } else {
                                        eprintln!("Failed to parse HTTP request path");
                                    }
                                } else {
                                    println!("Non-HTTP request received on port {}", port);
                                }
                            }
                        }
                        Err(e) => eprintln!("Failed to read from socket on port {}: {}", port, e),
                    }
                });
            }
        });
    }

    // Wait for a termination signal to keep the runtime alive
    signal::ctrl_c().await.expect("Failed to listen for ctrl_c signal");
    println!("Server shutting down...");
}

#[tokio::main]
async fn main() {
    dotenv().ok();
    let dsn = env::var("SENTRY_DSN").ok();

    let _guard: Option<ClientInitGuard> = if let Some(dsn) = dsn {
        Some(init((dsn, sentry::ClientOptions::default())))
    } else {
        eprintln!("Warning: SENTRY_DSN not set. Sentry functionality is disabled.");
        None
    };

    let _app = actix_web::App::new()
        .wrap(Sentry::new())
        .configure(|_cfg| {
            // Configure your routes here
        });

    run_server().await;
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::net::TcpStream;
    use tokio::io::{AsyncReadExt, AsyncWriteExt};

    #[tokio::test]
    async fn test_health_route() {
        // Start the server in a background task
        tokio::spawn(async {
            run_server().await;
        });

        // Allow some time for the server to start
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        // Connect to the TCP server
        let mut stream = TcpStream::connect("127.0.0.1:3000").await.expect("Failed to connect to TCP server");

        // Send an HTTP GET request to the /health route
        let request = "GET /health HTTP/1.1\r\nHost: localhost\r\n\r\n";
        stream.write_all(request.as_bytes()).await.expect("Failed to write to stream");

        // Read the response
        let mut buffer = [0; 1024];
        let size = stream.read(&mut buffer).await.expect("Failed to read from stream");
        let response = String::from_utf8_lossy(&buffer[..size]);

        // Assert the response contains the expected body
        assert!(response.contains("Server is running"), "Unexpected response: {}", response);
    }

    #[tokio::test]
    async fn test_auth_login_route() {
        // Start the server in a background task
        tokio::spawn(async {
            run_server().await;
        });

        // Allow some time for the server to start
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        // Connect to the TCP server
        let mut stream = TcpStream::connect("127.0.0.1:3000").await.expect("Failed to connect to TCP server");

        // Send an HTTP GET request to the /AuthLogin route
        let request = "GET /AuthLogin HTTP/1.1\r\nHost: localhost\r\n\r\n";
        stream.write_all(request.as_bytes()).await.expect("Failed to write to stream");

        // Read the response
        let mut buffer = [0; 1024];
        let size = stream.read(&mut buffer).await.expect("Failed to read from stream");
        let response = String::from_utf8_lossy(&buffer[..size]);

        // Assert the response contains the expected body
        assert!(response.contains("OK"), "Unexpected response: {}", response);
    }

    #[tokio::test]
    async fn test_404_handler() {
        // Start the server in a background task
        tokio::spawn(async {
            run_server().await;
        });

        // Allow some time for the server to start
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

        // Connect to the TCP server
        let mut stream = TcpStream::connect("127.0.0.1:3000").await.expect("Failed to connect to TCP server");

        // Send an HTTP GET request to a non-existent route
        let request = "GET /nonexistent HTTP/1.1\r\nHost: localhost\r\n\r\n";
        stream.write_all(request.as_bytes()).await.expect("Failed to write to stream");

        // Read the response
        let mut buffer = [0; 1024];
        let size = stream.read(&mut buffer).await.expect("Failed to read from stream");
        let response = String::from_utf8_lossy(&buffer[..size]);

        // Assert the response contains the expected body
        assert!(response.contains("Not Found"), "Unexpected response: {}", response);
    }
}
