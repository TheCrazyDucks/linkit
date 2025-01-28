use std::error::Error;

use crate::dynamo_types::{self, Service, ServiceType};
use aws_sdk_dynamodb::{self as dynamodb, config, types::AttributeValue};

pub fn add_service(service: Service){
    println!("{service:?}");
}

pub async fn connect() -> dynamodb::Client{
    let config = aws_config::load_from_env().await;
    let client = dynamodb::Client::new(&config);
    client
} 

pub async fn validate_service(client: &dynamodb::Client,
access_id: String, access_key: String, service_type: ServiceType) -> Result<(), aws_sdk_dynamodb::Error> {
    // client.query().table_name(&'static "lol")
    let result = client
    .query()
    .table_name("Services")
    .index_name("ServiceByAccessId")
    .key_condition_expression("#id = :id AND #type = :type")
    .expression_attribute_names("#id", "access_id")
    .expression_attribute_names("#type", "type")
    .expression_attribute_values(":id", AttributeValue::S(access_id))
    .expression_attribute_values(":type", AttributeValue::S(service_type.to_string()))
    .send()
    .await?;

    if let Some(items ) = result.items {
        let first = items.first().unwrap();
        if let Some(value) = first.get("access_key"){
            if  access_key == value.as_s().unwrap().to_owned(){
               return Ok(()) 
            }
        }
    }

    Ok(())
}
