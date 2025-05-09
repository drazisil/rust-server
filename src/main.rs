use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpListener;
use actix_web::{web, App, HttpServer, Responder};

async fn health_check() -> impl Responder {
    "Server is running"
}

async fn start_tcp_server() -> std::io::Result<()> {
    let listener = TcpListener::bind("127.0.0.1:9000").await?;
    println!("TCP server running on 127.0.0.1:9000");

    loop {
        let (mut socket, _) = listener.accept().await?;
        tokio::spawn(async move {
            let mut buffer = [0; 1024];

            match socket.read(&mut buffer).await {
                Ok(size) => {
                    if size > 0 {
                        let request = String::from_utf8_lossy(&buffer[..size]);
                        if request.starts_with("GET") || request.starts_with("POST") {
                            println!("HTTP request detected: {}", request);
                            // Forward to Actix-web server (not implemented in this example)
                        } else {
                            println!("Non-HTTP request received");
                        }
                    }
                }
                Err(e) => eprintln!("Failed to read from socket: {}", e),
            }
        });
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let http_server = HttpServer::new(|| {
        App::new()
            .route("/health", web::get().to(health_check))
    })
    .bind("127.0.0.1:8080")?
    .run();

    let tcp_server = start_tcp_server();

    tokio::try_join!(http_server, tcp_server)?;

    Ok(())
}
