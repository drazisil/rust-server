use warp::http::{Response, StatusCode};

pub fn shard_list_filter() -> warp::http::Response<String> {
    Response::builder()
        .status(StatusCode::OK)
        .header("Content-Type", "application/json")
        .body("{\"shards\": [1, 2, 3]}".to_string())
        .unwrap()
}
