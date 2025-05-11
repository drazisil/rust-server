// This file is part of the Oxide project, licensed under GPL-3.0-or-later.
// See the COPYING.md file in the project root for more information.

use std::collections::HashMap;
use warp::http::{Response, StatusCode};

#[derive(Debug)]
pub struct AuthLoginSuccess {
    pub ticket: String,
}

impl AuthLoginSuccess {
    pub fn to_response(&self) -> String {
        format!("Valid=TRUE\nTicket={}", self.ticket)
    }
}

#[derive(Debug)]
pub struct AuthLoginFailure {
    pub reason_code: String,
    pub reason_text: String,
    pub reason_url: String,
}

impl AuthLoginFailure {
    pub fn to_response(&self) -> String {
        format!(
            "reasoncode={}\nreasontext={}\nreasonurl={}",
            self.reason_code, self.reason_text, self.reason_url
        )
    }
}

pub trait UserValidator: Send + Sync {
    fn validate_user(&self, username: &str, password: &str) -> bool;
}

impl UserValidator for Database {
    fn validate_user(&self, username: &str, password: &str) -> bool {
        username == "valid_user" && password == "valid_password"
    }
}

pub fn generate_success_response(ticket: &str) -> String {
    format!("Valid=TRUE\nTicket={}", ticket)
}

pub fn generate_failure_response(reason_code: &str, reason_text: &str, reason_url: &str) -> String {
    format!(
        "reasoncode={}\nreasontext={}\nreasonurl={}",
        reason_code, reason_text, reason_url
    )
}

pub async fn handle_auth_login<V: UserValidator + 'static>(
    query: HashMap<String, String>,
    db: V,
) -> Result<impl warp::Reply, warp::Rejection> {
    if let (Some(username), Some(password)) = (query.get("username"), query.get("password")) {
        if db.validate_user(username, password) {
            let response_body = generate_success_response("<auth_ticket>");
            return Ok(Response::builder()
                .status(StatusCode::OK)
                .version(warp::http::Version::HTTP_10)
                .header("Connection", "close")
                .header("Content-Type", "text/plain; charset=utf-8")
                .body(response_body)
                .unwrap());
        }
    }
    let response_body = generate_failure_response(
        "INV-100",
        "Invalid username or password",
        "https://winehq.com",
    );
    Ok(Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .version(warp::http::Version::HTTP_10)
        .header("Connection", "close")
        .header("Content-Type", "text/plain; charset=utf-8")
        .body(response_body)
        .unwrap())
}

#[derive(Clone)]
pub struct Database;
