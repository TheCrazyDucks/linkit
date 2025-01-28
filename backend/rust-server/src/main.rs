// use std::io;
#![allow(warnings)]

pub mod auth;
pub mod dynamo;
mod dynamo_types;
mod test;

use std::{sync::Arc, time::Duration};

use auth::handle_token;
use aws_sdk_dynamodb::{config::IntoShared, error::BoxError};
use axum::{
    body::to_bytes, error_handling::HandleErrorLayer, extract::{self, ws::WebSocket, Path, Request, WebSocketUpgrade}, http::{HeaderMap, StatusCode, Uri}, middleware::{self, Next}, response::{IntoResponse, Response}, routing::{any, get, post}, Router
};
use dynamo::connect;
use tokio::{
    io::AsyncReadExt,
    net::TcpListener,
    sync::RwLock,
    time::{error::Error, sleep},
};
use tower::{
    buffer::BufferLayer,
    limit::{RateLimit, RateLimitLayer},
    ServiceBuilder,
};

struct AppState {
    dynamo_client: aws_sdk_dynamodb::Client,
}

#[tokio::main]
async fn main() {
    let dynamo_client = dynamo::connect().await;
    let app_state = AppState { dynamo_client };

    let shared_state = Arc::new(RwLock::new(app_state));
    let rate_limiter = RateLimitLayer::new(100, Duration::from_secs(60));

    let app =
        Router::new()
            .route("/linkit/token", post(handle_token).with_state(shared_state))
            .fallback(fallback)
            .layer(
                ServiceBuilder::new().layer(
                    HandleErrorLayer::new(
                |err: BoxError| async move { (StatusCode::INTERNAL_SERVER_ERROR) }))
                .layer(BufferLayer::new(1024))
                .layer(RateLimitLayer::new(10, Duration::from_secs(60)))
            )
            .route("/", get(home))
            .route("/linkit", any(handler))
            .route("/health", get(healthy));

    let listener = TcpListener::bind("127.0.0.1:8000").await.unwrap();
    println!("Running on port 8000");
    axum::serve(listener, app)
        .await
        .unwrap();
}

const MAX_BODY_SIZE: usize = 1024 * 1024; 

async fn home()-> &'static str{
    "home"
}

async fn fallback(uri: Uri)->(StatusCode, String){
    (StatusCode::NOT_FOUND, format!("Not Found!"))
}

async fn handler(ws: WebSocketUpgrade) -> impl IntoResponse{
    println!("handling..");
    ws.on_failed_upgrade(failure_ws)
    .on_upgrade(handle_ws)
}

fn failure_ws(error: axum::Error){
    println!("failed...");
}

async fn handle_ws(mut ws: WebSocket){
    ws.send("connect".into());
    while let Some(msg) = ws.recv().await{
        let msg = if let Ok(msg) = msg{
            msg
        }else{
            println!("man");
            return;
        };

        if ws.send(msg).await.is_err(){
            println!("idk");
            return;
        }
    }
}

async fn damm(Path(world): Path<String>) -> String {
    world
}

async fn healthy() -> &'static str {
    "Ok"
}

fn take_ownership(str: &Box<String>) {
    println!("{}", str);
}

fn createString() -> Box<String> {
    return Box::new(String::from("lol"));
}
