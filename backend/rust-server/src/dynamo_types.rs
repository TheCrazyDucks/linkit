use std::{fmt, iter::Map};

#[derive(Debug)]
struct Host  {
    id: String,
    name: String,
    // vectorId: String,
    // access_key: String,
    options: Map<String, String>,
    setting: Map<String, String>
}

/**
 * 
 */
struct User {
    id: String,
    name: String,
    mail: String,
    pw: String,
    services: String
}

#[derive(Debug)]
pub struct Service {
    id: String,
    user_id: String,
    access_id: String,
    access_secret: String,
    start_date: u64,
    end_date: u64,
    status: ServiceStatus,
    service_type: ServiceType,
    prefrences: ServicePrefrences
}

#[derive(Debug)]
struct ServicePrefrences {
    instruction: String,
    tools: Vec<String>
}

#[derive(Debug)]
pub enum ServiceType {
    Linkit
}

impl fmt::Display for ServiceType{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

impl fmt::Display for ServiceStatus
{
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}", self)
    }
}

#[derive(Debug)]
enum ServiceStatus {
    Paused,
    Active,
    Deleted,
    Pending
}

struct Usage {
    user_id: String,
    service_id: String,
    month_id: String,
    start_date: u64,
    callls: u64,
    end_date: Option<u64>
}

// impl ServiceStatus {
//     fn as_str(&self) -> &'static str{
//         match self {
//             ServiceStatus::Paused => "Paused",
//             ServiceStatus::Active => "Active",
//             ServiceStatus::Deleted => "Deleted",
//             ServiceStatus::Pending => "Pending",
//         }
//     }
// }
