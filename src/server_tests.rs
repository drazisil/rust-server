#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_response() {
        let response = create_response(warp::http::StatusCode::OK, "Test Body");
        assert_eq!(response.status(), warp::http::StatusCode::OK);
        assert_eq!(response.body(), "Test Body");
    }

    // Add more tests for extracted pure functions here
}
