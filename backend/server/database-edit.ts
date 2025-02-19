import { CreateTableCommand, QueryCommand, DynamoDBClient, QueryInput, TransactWriteItemsCommand, TransactWriteItemsCommandInput, PutItemCommand, PutItemCommandInput, PutItemInput, BatchWriteItemCommandInput, WriteRequest } from "@aws-sdk/client-dynamodb"
import { BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient, GetCommand, GetCommandInput, PutCommand, PutCommandInput, QueryCommandInput, QueryCommandOutput, ScanCommandInput, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from "dotenv"
import { BinaryToTextEncoding, createHash } from "node:crypto";
import { webcrypto } from "node:crypto";
// import { MonthId, Service, ServiceStatus, ServiceType, Usage } from "./database.d.ts";
import { table } from "node:console";
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { BatchWriteItemInput } from "aws-sdk/clients/dynamodb";
import { MonthId, Service, ServiceStatus, ServiceType } from "./types/database";
// import { Service } from "aws-sdk/lib/service";
// import {Usage, User, Service, ServicePrefrences, MonthId, ServiceType, ServiceStatus} from "./types/database"
// <refrence 
const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: __dirname + "/.env" })

const client = new DynamoDBClient({
    // region: "eu-central-1",  // Correct region
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.AWS_DYNAMO_ID,
        secretAccessKey: process.env.AWS_DYNAMO_SECRET
    },
    // endpoint: 'https://dynamodb.eu-central-1.amazonaws.com' // Set endpoint explicitly
    endpoint: "https://dynamodb.eu-north-1.amazonaws.com"
});

// @ts-ignore
const docClient = DynamoDBDocumentClient.from(client);

async function createServicesTable() {
    const createTableCommand = new CreateTableCommand({
        TableName: "Services",
        AttributeDefinitions: [
            {
                AttributeName: "id",
                AttributeType: "S",
            },
            {
                AttributeName: "user_id",
                AttributeType: "S"
            },
            {
                AttributeName: "access_id",
                AttributeType: "S"
            },
            {
                AttributeName: "type",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "id",
                KeyType: "HASH"
            },
            {
                AttributeName: "user_id",
                KeyType: "RANGE"
            },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "ServiceByAccessId",
                KeySchema: [{
                    AttributeName: "access_id",
                    KeyType: "HASH"
                },
                {
                    AttributeName: "type",
                    KeyType: "RANGE"
                }],
                Projection: {
                    ProjectionType: "INCLUDE",
                    NonKeyAttributes: ["access_key"]
                }
            },
            {
                IndexName: "ServiceByStatus",
                KeySchema: [
                    {
                        AttributeName: "status",
                        KeyType: "HASH"
                    }
                ],
                Projection: {
                    ProjectionType: "KEYS_ONLY"
                }
            }
        ],
        BillingMode: "PAY_PER_REQUEST"
    })
    let result = await docClient.send(createTableCommand)
    return result
}

async function getAllActiveServices() {
    const input: QueryCommandInput = {
        IndexName: "ServiceByStatus",
        TableName: "Usages",
        KeyConditionExpression: "status = :status",
        ExpressionAttributeValues:
        {
            ":status": {
                S: "Active"
            }
        }
    }

    return await docClient.send(new QueryCommand(input))
}

async function createUsagesTable() {
    const createUsagesTable = new CreateTableCommand({
        TableName: "Usages",
        AttributeDefinitions: [
            {
                AttributeName: "service_id",
                AttributeType: "S"
            },
            {
                AttributeName: "start_date",
                AttributeType: "N"
            },
            {
                AttributeName: "user_id",
                AttributeType: "S"
            },
            {
                AttributeName: "month_id",
                AttributeType: "S"
            }
        ],
        KeySchema: [
            {
                AttributeName: "service_id",
                KeyType: "HASH"
            },
            {
                AttributeName: "start_date",
                KeyType: "RANGE"
            }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: "UsageByUser",
                KeySchema: [
                    {
                        AttributeName: "user_id",
                        KeyType: "HASH"
                    },
                    {
                        AttributeName: "month_id",
                        KeyType: "RANGE"
                    }
                ],
                Projection: {
                    ProjectionType: "ALL"
                }
            }
        ],
        BillingMode: "PAY_PER_REQUEST"
    })

    return await docClient.send(createUsagesTable)
}

/**
 * 
 * @param user_id Make sure the user_id is valid before inserting...
 */
function addService(id: string, user_id: string, type: ServiceType) {
    const service: Service = {
        id: id ?? timeId(),
        user_id,
        type,
        access_id: timeId(),
        access_key: randomKey(),
        start_date: Date.now(),
        tier: undefined,
        status: "Active" //TODO: maybe change this to pending?
    }
    const input: PutCommandInput = {
        Item: service,
        TableName: "Services"
    }
    docClient.send(new PutCommand(input))
}

function randomKey(encoding?: BinaryToTextEncoding) {
    return createHash("sha256").update(webcrypto.randomUUID().replace(/\-/g, "") + Date.now()).digest(encoding ?? "base64url")
}

const TIME_OFFSET = new Date("1/1/2025").getTime();

function timeId() {
    let time = (Date.now() - TIME_OFFSET).toString()

    let maxLength = 24
    let end = maxLength - time.length
    let cut = Math.floor(time.length / 2)

    return time.slice(0, cut) + webcrypto.randomUUID().replace(/\-/g, "").slice(0, end) + time.slice(cut)
    // return createHash("sha1").update(webcrypto.randomUUID() + Date.now()).digest('hex')
    // return time.slice(0,Math.floor(time.length / 2)) + webcrypto.randomUUID().replace(/\-/g,"").slice(0,8)+ time.slice(Math.round(time.length / 2))
}


function updateService(service: Service) {
    let copy = {
        ...service
    }
    delete copy["id"]
    delete copy["access_id"]
    delete copy["access_key"]
    delete copy["user_id"]
    update("Services", { id: service.id, user_id: service.user_id }, copy)
}

function updateServiceStatus(service: Service){
    // update("Services")
}


/**
 * Update item in DynamoDB table
 * @param {string} tableName // Name of the target table
 * @param {object} key // Object containing target item key(s)
 * @param {object} item // Object containing updates for target item
 */
const update = async (tableName: string, key: object, item: object) => {
    const itemKeys = Object.keys(item);

    const input: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        ReturnValues: 'ALL_NEW',
        UpdateExpression: `SET ${itemKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: itemKeys.reduce((accumulator, k, index) => ({ ...accumulator, [`#field${index}`]: k }), {}),
        ExpressionAttributeValues: (itemKeys.reduce((accumulator, k, index) => ({ ...accumulator, [`:value${index}`]: item[k] }), {})),
    }

    console.log(input)
    // return;

    const { Attributes } = await docClient.send(new UpdateCommand(input));

    return Attributes;
};

function formatSet(obj: any) {
    return Object.keys(obj).map((key) => {
        `${key} = ${obj[key]}`
    }).join(' ')
}

async function validateService(params: { type: ServiceType, access_id: string, access_key: string }) {
    const input: QueryInput = {
        TableName: "Services",
        IndexName: "ServiceByAccessId",
        KeyConditionExpression: "#id = :id AND #type = :type",
        ExpressionAttributeNames: {
            "#id": "access_id",
            "#type": "type"
        },
        ExpressionAttributeValues: {
            ":id": { S: params.access_id },
            ":type": { S: params.type }
        },
        Limit: 1
    }

    //TODO: Validate access_key
    /** Make sure to reterive only safe data `[a-zA-Z0-9\_\-]` */

    try {
        const response = await docClient.send(new QueryCommand(input));
        console.log(response.Items)
        if (response.Items.length >= 1) {
            const item = response.Items[0]
            const hased = hashKey(item.access_key.S)
            if (hashKey(params.access_key) !== hased) {
                //TODO: update unsuccessful ?
                return false
            }
            return true
        }
    } catch {
        //Failed
    }
}

async function getServicePrefrences(id: string) {
    const input: QueryCommandInput = {
        TableName: "Services",
        KeyConditionExpression: "#id = :id",
        ExpressionAttributeNames: {
            "#id": "id"
        },
        ExpressionAttributeValues: {
            ":id": {
                S: id
            }
        },
        ProjectionExpression: "prefrences",
        Limit: 1
    }

    const result = await docClient.send(new QueryCommand(input))
    return unmarshall(result.Items[0])
}

async function endAllMonthUsages(month_id: string) {
    //TODO: implement
}

async function startNewMonthUsages() {
    const services = await getAllActiveServices()

    let batches = []
    for(let i = 0; i < (services.Count ?? 0); i += 25){
        batches.push(services.Items.slice(i, i + 25))
    }

    batches.forEach(async (batch)=>{
        let result = await monthUsageBatch(batch);
        if(result.UnprocessedItems){
            await monthUsageBatch(result.UnprocessedItems.PutRequest)
        }
    })
}

function monthUsageBatch(services: Array<Record<string, any>>){
    const month_id = getMonthId()
    let batchItems: BatchWriteCommandInput = {
        RequestItems: {
            "Usages": services.map((service) => {
                return {
                    PutRequest:
                    {
                        Item: {
                            start_date: Date.now(),
                            id: timeId(),
                            user_id: service.user_id,
                            service_id: service.id,
                            month_id: month_id as string,
                            calls: 0
                        }
                    }
                }
            })
        }
    }

    return docClient.send(new BatchWriteCommand(batchItems))
}

async function increaseUsage(id: string, month_id: string, calls: number) {
    const input: UpdateCommandInput = {
        Key: {
            service_id: id,
        },
        TableName: "Usages",
        UpdateExpression: "SET ",
        ConditionExpression: ""
    }
}

async function getUsages(serviceId: string, userId: string, month: number, year: number) {
    const _month = Number(month);
    const _year = Number(year)
    const month_id = _month && _year ? formatMonthId(year, month) : null

    let values: Record<string, any> = {
        ":id": {
            S:
                serviceId ?? userId
        }
    }

    if (month_id !== null) {
        values[":month_id"] = { S: month_id }
    }

    const input: QueryCommandInput = {
        TableName: "Usages",
        KeyConditionExpression: `${serviceId ? "service_id" : "user_id"} = :id ${month_id ? "AND month_id = :month_id" : ""}`,
        ExpressionAttributeValues: values
    }

    const result = await docClient.send(new QueryCommand(input))
    return result
}

async function getUsageByServiceId(id: string, month: number, year: number) {
    return getUsages(id, null, month, year)
}

async function getUsageByUserId(id: string, month: number, year: number) {
    return getUsages(null, id, month, year)
}

const getMonthId = (_date?: Date): MonthId => {
    let date = _date ? _date : new Date()
    return formatMonthId(date.getFullYear(), date.getMonth())
}

const formatMonthId = (year: number, month: number): MonthId => {
    return `${year}-${month}`
}

const hashKey = (key: string) => {
    return createHash("sha512").update(key).digest("base64url")
}

let service: Service = {
    id: "lol",
    user_id: "wambo",
    access_key: "damm",
    access_id: "lol!",
    start_date: 0,
    status: "Active",
    type: "Linkit",
    tier: undefined
}

// addService(service)
// console.log(await validateService({...service, access_key: "dam"}))
// console.log(hashKey("wow"))
// updateService({...service, start_date: '15'})

// console.log(process.env.AWS_DYNAMO_ID)
// console.log(process.env.AWS_DYNAMO_SECRET)
// console.log(await createServicesTable())

// addService("sar_el_tours", "sar_el_tours", "Linkit")
// console.log(JSON.stringify(await getServicePrefrences("sar_el_tours")))
// console.log(await createUsagesTable())
// console.log(createUsagesTable())
