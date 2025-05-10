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

pub async fn handle_auth_login(
    query: HashMap<String, String>,
    db: Database,
) -> Result<impl warp::Reply, warp::Rejection> {
    if let (Some(username), Some(password)) = (query.get("username"), query.get("password")) {
        if db.validate_user(username, password).await {
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

impl Database {
    pub async fn validate_user(&self, username: &str, password: &str) -> bool {
        // Replace with actual database validation logic
        username == "valid_user" && password == "valid_password"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use warp::Reply;

    #[tokio::test]
    async fn test_handle_auth_login_success() {
        let mut query = HashMap::new();
        query.insert("username".to_string(), "valid_user".to_string());
        query.insert("password".to_string(), "valid_password".to_string());

        let db = Database;
        let response = handle_auth_login(query, db).await.unwrap();
        let body = response.into_response().into_body();
        let body = hyper::body::to_bytes(body).await.unwrap();
        let body = String::from_utf8(body.to_vec()).unwrap();

        assert!(body.contains("Valid=TRUE"));
        assert!(body.contains("Ticket=<auth_ticket>"));
    }

    #[tokio::test]
    async fn test_handle_auth_login_failure() {
        let mut query = HashMap::new();
        query.insert("username".to_string(), "invalid_user".to_string());
        query.insert("password".to_string(), "wrong_password".to_string());

        let db = Database;
        let response = handle_auth_login(query, db).await.unwrap();
        let body = response.into_response().into_body();
        let body = hyper::body::to_bytes(body).await.unwrap();
        let body = String::from_utf8(body.to_vec()).unwrap();

        assert!(body.contains("reasoncode=INV-100"));
        assert!(body.contains("reasontext=Invalid username or password"));
        assert!(body.contains("reasonurl=https://winehq.com"));
    }
}
