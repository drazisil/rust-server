use tokio::io::AsyncReadExt;
use tokio::net::TcpListener;
use tokio::signal;
use serde::Deserialize;
use std::fs;
use actix_web::{web, App, HttpServer, Responder};

#[derive(Deserialize)]
struct Config {
    tcp_ports: Vec<u16>,
}

async fn health_check() -> impl Responder {
    "Server is running"
}

async fn start_tcp_servers(ports: Vec<u16>) -> std::io::Result<()> {
    let mut handles = vec![];

    for port in ports {
        let handle = tokio::spawn(async move {
            let listener = TcpListener::bind(format!("0.0.0.0:{}", port)).await.unwrap();
            println!("TCP server running on 127.0.0.1:{}", port);

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

        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }

    Ok(())
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let config_data = fs::read_to_string("config.json").expect("Unable to read config file");
    let config: Config = serde_json::from_str(&config_data).expect("Invalid config format");

    let http_server = HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health_check))
    })
    .bind("127.0.0.1:8080")?
    .run();

    let tcp_server = start_tcp_servers(config.tcp_ports);

    tokio::select! {
        _ = signal::ctrl_c() => {
            println!("Shutting down gracefully...");
        }
        _ = async {
            if let Err(e) = tokio::try_join!(http_server, tcp_server) {
                eprintln!("Error: {}", e);
            }
        } => {}
    }

    Ok(())
}
