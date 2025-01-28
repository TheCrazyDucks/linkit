use std::sync::Arc;

use crate::{dynamo, dynamo_types::ServiceType, AppState};
use axum::{
    extract::{self, Path, State}, http::StatusCode, response::{IntoResponse, Response}, Json
};
use serde::Deserialize;
use serde_json::{json, Value};
use tokio::sync::RwLock;

async fn generate_token() -> String {
    String::from("nigger")
}

pub async fn handle_token(
    State(app_state): State<Arc<RwLock<AppState>>>,
    Json(payload): Json<TokenPayload>
) -> Response{
    // let authed = dynamo::validate_service(_, payload.key, payload.secret, ServiceType::Linkit).await;
    let state = app_state.read().await;
    let client = &state.dynamo_client;
    println!("{:?}", payload.secret);
    if(true){
        return Json(json!({
            "lol": payload.secret
        })).into_response()
    }
    StatusCode::UNAUTHORIZED.into_response()
}

#[derive(Debug, Deserialize)]
pub struct TokenPayload {
    key: String,
    secret: String,
}
