import { QueryCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb"
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from "dotenv"
import { createHash } from "node:crypto";
import { webcrypto } from "node:crypto";
import { unmarshall } from "@aws-sdk/util-dynamodb"
import { ServicePrefrences } from "./types/database";
const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: __dirname + "/.env" })

const client = new DynamoDBClient({
    region: "eu-central-1",  // Correct region
    credentials: {
        accessKeyId: process.env.AWS_DYNAMO_ID,
        secretAccessKey: process.env.AWS_DYNAMO_SECRET
    },
    endpoint: 'https://dynamodb.eu-central-1.amazonaws.com' // Set endpoint explicitly
});

// @ts-ignore
const docClient = DynamoDBDocumentClient.from(client);

/**
 * 
 * @param {{user_id: string, type: ServiceType}} params Make sure the user_id is valid before inserting...
 */
function addService({ user_id, type }) {
    const service = {
        id: randomKey("hex"),
        user_id,
        type,
        access_id: randomKey(),
        access_key: randomKey(),
        start_date: Date.now(),
        status: "Active" //TODO: maybe change this to pending?
    }
    const input = {
        Item: service,
        TableName: "Services"
    }
    docClient.send(new PutCommand(input))
}

function randomKey(encoding?): string {
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


// console.log(timeId())

function updateService(service) {
    let copy = {
        ...service
    }
    delete copy["id"]
    delete copy["access_id"]
    delete copy["access_key"]
    delete copy["user_id"]
    update("Services", { id: service.id, user_id: service.user_id }, copy)
}


/**
 * Update item in DynamoDB table
 * @param {string} tableName // Name of the target table
 * @param {object} key // Object containing target item key(s)
 * @param {object} item // Object containing updates for target item
 */
const update = async (tableName, key, item) => {
    const itemKeys = Object.keys(item);

    const input: UpdateCommandInput = {
        TableName: tableName,
        Key: key,
        ReturnValues: 'ALL_NEW',
        UpdateExpression: `SET ${itemKeys.map((k, index) => `#field${index} = :value${index}`).join(', ')}`,
        ExpressionAttributeNames: itemKeys.reduce((accumulator, k, index) => ({ ...accumulator, [`#field${index}`]: k }), {}),
        ExpressionAttributeValues: (itemKeys.reduce((accumulator, k, index) => ({ ...accumulator, [`:value${index}`]: item[k] }), {})),
    }

    const { Attributes } = await docClient.send(new UpdateCommand(input));

    return Attributes;
};

function formatSet(obj) {
    return Object.keys(obj).map((key) => {
        `${key} = ${obj[key]}`
    }).join(' ')
}

export async function validateService({ type, access_id, access_key }) {
    /** @type {QueryInput} */
    const input = {
        TableName: "Services",
        IndexName: "ServiceByAccessId",
        KeyConditionExpression: "#id = :id AND #type = :type",
        ExpressionAttributeNames: {
            "#id": "access_id",
            "#type": "type"
        },
        ExpressionAttributeValues: {
            ":id": { S: access_id },
            ":type": { S: type }
        },
        Limit: 1
    }

    try {
        const response = await docClient.send(new QueryCommand(input));
        // console.log(response.Items)
        if (response.Items.length >= 1) {
            const item = response.Items[0]
            const hased = hashKey(item.access_key.S)
            if (hashKey(access_key) !== hased) {
                //TODO: update unsuccessful ?
                return null
            }
            return item.id.S
        }
    } catch (e) {
        //TODO: Failed - let user know it's an internal error
        console.error(e)
        return undefined
    }
}

const hashKey = (key) => {
    return createHash("sha512").update(key).digest("base64url")
}

export async function updateFaq(){

}

export async function getFaqs(serviceId){
    //TODO: fetch faqs from aws
    
}

export async function updateFaqs(){

}

export async function getServicePrefrences(id: string, type?:any): Promise<ServicePrefrences | undefined | null | {}> {
    const input = {
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

    try {
        const result = await docClient.send(new QueryCommand(input))
        if (result.Items.length > 0) {
            try{
                // console.log(JSON.stringify(result.Items[0]))
                return unmarshall(result.Items[0]) as unknown as ServicePrefrences
            }catch{
                return null
            }
        }
        return {}
    } catch {
        return undefined
    }
}

export async function updateServiceUsage(id, amount){
    let _amount = amount ?? 1

    /** @type {import("@aws-sdk/lib-dynamodb").UpdateCommandInput} */
    const input = {
        Key: {
            id
        },
        ExpressionAttributeValues: {
            ":inc": {
                N: "1"
            }
        },
        UpdateExpression: "ADD calls :inc"
    }
}

/**
 * @type {Service}
 */
let service = {
    id: "lol",
    user_id: "wambo",
    access_key: "damm",
    access_id: "lol!",
    start_date: 0,
    status: "Active",
    type: "Linkit"
}

// addService(service)
// console.log(await validateService({...service, access_key: "dam"}))
// console.log(hashKey("wow"))
// updateService({...service, start_date: '15'})

// console.log(process.env.AWS_DYNAMO_ID)
// console.log(process.env.AWS_DYNAMO_SECRET)
// console.log(await createServicesTable())