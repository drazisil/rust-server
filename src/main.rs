use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use tokio::signal;
use serde::Deserialize;
use std::fs;
use std::sync::Arc;
use tokio::sync::RwLock;
use warp::Filter;
use warp::http::Response;
use warp::hyper::body::Bytes;
use warp::hyper::Body;
use hyper::Client;

#[derive(Deserialize)]
struct Config {
    tcp_ports: Vec<u16>,
}

#[tokio::main]
async fn main() {
    // Read the configuration file
    let config_data = fs::read_to_string("config.json").expect("Unable to read config file");
    let config: Config = serde_json::from_str(&config_data).expect("Invalid config format");

    // Define the health check route
    let health_route = warp::path("health").map(|| "Server is running");

    // Start the Warp server in the background
    let warp_server = tokio::spawn(async move {
        warp::serve(health_route).run(([127, 0, 0, 1], 3030)).await;
    });

    // Start the TCP server to forward requests to the Warp server
    for port in config.tcp_ports {
        tokio::spawn(async move {
            let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
            println!("TCP server running on 0.0.0.0:{}", port);

            loop {
                let (mut socket, _) = listener.accept().await.unwrap();
                tokio::spawn(async move {
                    let mut buffer = [0; 1024];

                    match socket.read(&mut buffer).await {
                        Ok(size) => {
                            if size > 0 {
                                let request = String::from_utf8_lossy(&buffer[..size]);
                                if request.starts_with("GET") || request.starts_with("POST") {
                                    println!("HTTP request detected on port {}: {}", port, request);

                                    // Forward the request to the Warp server
                                    let client = Client::new();
                                    let uri = "http://127.0.0.1:3030/health".parse().unwrap();
                                    let response = client.get(uri).await.unwrap();
                                    let body = hyper::body::to_bytes(response.into_body()).await.unwrap();
                                    socket.write_all(&body).await.unwrap();
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

    // Wait for the Warp server to finish
    warp_server.await.unwrap();
}
