#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;
    use warp::Reply;
    use futures::StreamExt;
    use oxide::auth::{handle_auth_login, UserValidator};

    #[derive(Clone)]
    struct MockDatabase;

    impl UserValidator for MockDatabase {
        fn validate_user(&self, username: &str, password: &str) -> bool {
            username == "valid_user" && password == "valid_password"
        }
    }

    #[tokio::test]
    async fn test_handle_auth_login_success() {
        let mut query = HashMap::new();
        query.insert("username".to_string(), "valid_user".to_string());
        query.insert("password".to_string(), "valid_password".to_string());

        let db = MockDatabase;
        let response = handle_auth_login(query, db).await.unwrap();
        let mut body = response.into_response().into_body();

        let mut body_content = Vec::new();
        while let Some(chunk) = body.next().await {
            let chunk = chunk.unwrap();
            body_content.extend_from_slice(&chunk);
        }
        let body = String::from_utf8(body_content).unwrap();

        println!("Body content: {}", body);
        assert!(body.contains("Valid=TRUE"));
        assert!(body.contains("Ticket=<auth_ticket>"));
    }

    #[tokio::test]
    async fn test_handle_auth_login_failure() {
        let mut query = HashMap::new();
        query.insert("username".to_string(), "invalid_user".to_string());
        query.insert("password".to_string(), "wrong_password".to_string());

        let db = MockDatabase;
        let response = handle_auth_login(query, db).await.unwrap();
        let mut body = response.into_response().into_body();

        let mut body_content = Vec::new();
        while let Some(chunk) = body.next().await {
            let chunk = chunk.unwrap();
            body_content.extend_from_slice(&chunk);
        }
        let body = String::from_utf8(body_content).unwrap();

        println!("Body content: {}", body);
        assert!(body.contains("reasoncode=INV-100"));
        assert!(body.contains("reasontext=Invalid username or password"));
        assert!(body.contains("reasonurl=https://winehq.com"));
    }
}
