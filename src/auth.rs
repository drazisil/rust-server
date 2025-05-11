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

pub async fn handle_auth_login<V: UserValidator + 'static>(
    query: HashMap<String, String>,
    db: V,
) -> Result<impl warp::Reply, warp::Rejection> {
    if let (Some(username), Some(password)) = (query.get("username"), query.get("password")) {
        if db.validate_user(username, password) {
            let success_response = AuthLoginSuccess {
                ticket: "<auth_ticket>".to_string(),
            };
            return Ok(Response::builder()
                .status(StatusCode::OK)
                .version(warp::http::Version::HTTP_10)
                .header("Connection", "close")
                .header("Content-Type", "text/plain; charset=utf-8")
                .body(success_response.to_response())
                .unwrap());
        }
    }
    let failure_response = AuthLoginFailure {
        reason_code: "INV-100".to_string(),
        reason_text: "Invalid username or password".to_string(),
        reason_url: "https://winehq.com".to_string(),
    };
    Ok(Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .version(warp::http::Version::HTTP_10)
        .header("Connection", "close")
        .header("Content-Type", "text/plain; charset=utf-8")
        .body(failure_response.to_response())
        .unwrap())
}

#[derive(Clone)]
pub struct Database;
