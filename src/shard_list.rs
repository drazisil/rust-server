use warp::http::{Response, StatusCode};
use warp::Filter;

pub fn shard_list_filter() -> impl warp::Filter<Extract = impl warp::Reply, Error = warp::Rejection> + Clone {
    warp::path("ShardList").map(|| {
        Response::builder()
            .status(StatusCode::OK)
            .header("Content-Type", "application/json")
            .body("{\"shards\": [1, 2, 3]}")
            .unwrap()
    })
}
