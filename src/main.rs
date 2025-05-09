use tokio::net::TcpListener;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::signal;
use std::sync::Arc;
use actix_web::{web, App, HttpServer, Responder};
use serde::Deserialize;
use std::fs;

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
            let listener = TcpListener::bind(format!("127.0.0.1:{}", port)).await.unwrap();
            println!("TCP server running on 127.0.0.1:{}", port);

            loop {
                let (mut socket, _) = listener.accept().await.unwrap();
                tokio::spawn(async move {
                    let mut buffer = [0; 1024];

                    match socket.read(&mut buffer).await {
                        Ok(size) => {
                            if size > 0 {
                                println!("Received on port {}: {:?}", port, &buffer[..size]);
                                if let Err(e) = socket.write_all(&buffer[..size]).await {
                                    eprintln!("Failed to write to socket: {}", e);
                                }
                            }
                        }
                        Err(e) => eprintln!("Failed to read from socket: {}", e),
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
        _ = tokio::signal::ctrl_c() => {
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
