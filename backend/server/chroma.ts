import { AddRecordsParams, ChromaClient, OpenAIEmbeddingFunction} from "chromadb";
import type { IncludeEnum } from "chromadb";
import { config } from "dotenv"
config()

let client: ChromaClient;
const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY,
    openai_model: 'text-embedding-3-small'
})

let attempts = 0

let collectionsCache = {}

const connect = async (host?: string | undefined) => {
    client = new ChromaClient({
        path: "http://" + (host ? host : process.env.CHROMA_HOST) + ":8000"
    })

    console.log("HOST: " + process.env.CHROMA_HOST)
    try {
        console.log(await client.heartbeat())
        console.log("chroma::connected")
    } catch {
        console.log("Failed to connect chroma::" + attempts)
        attempts++
        if (attempts > 10) {
            //Something went very bad
            return;
        }
        setTimeout(() => {
            connect(host)
        }, attempts * 1000)
    }
}

const reset = async ()=>{
    await client.reset()
}

const createCollection = ({ name, description }) => {
    try {
        client.createCollection({
            name,
            metadata: {description}
        })
    } catch { }
}

const update = async ({collectionName, id, metadata})=>{
    // collection.update()
    let collection = await client.getCollection({name: collectionName, embeddingFunction})
    let update = await collection.update({ids: [id], metadatas: [metadata]})
}

const get = async ({collectionName, id})=>{
    let collection = await client.getCollection({name: collectionName, embeddingFunction})
    return await collection.get({ids: [id]})
}

const getAll = async ({collectionName})=>{
    let collection = await client.getCollection({name: collectionName, embeddingFunction})
    return await collection.get({where: {page: {"$ne": ""}}, limit: Infinity, include: ["metadatas" as IncludeEnum.Metadatas]})
}

const add = async ({collectionName, id, document, metadata}) =>{
    try{
        let collection = await client.getOrCreateCollection({name: collectionName, embeddingFunction})
        await collection.add({
            ids: [id],
            documents: [document],
            metadatas: [metadata]
        })
    }catch(e){
        console.error(e)
    }
}

type document = {
    document: string,
    metadata: Record<string, string>
}

type addManyParams = {
    collectionName: string,
    documents: Array<document>
}

const addMany = async({collectionName, documents}: addManyParams)=>{
    // let _ids = []
    let _documents: Array<string> = []
    let _metadatas: Array<Record<string, string>>= []
    documents.forEach((value, index)=>{
        // _ids += [value.id]
        _documents.push(value.document)
        _metadatas.push(value.metadata)
    })
    try{
        let collection = await client.getOrCreateCollection({name: collectionName, embeddingFunction})
        //@ts-ignore
        await collection.add({
            // ids: [id],
            documents: _documents,
            metadatas: _metadatas
        })
    }catch{

    }
}

const query = async ({ collectionName, text, limit }:{collectionName: string, text: string, limit: number}): Promise<any | null> => {
    if (!collectionName) {
        console.log("No collection name")
        return null
    }

    let collection = collectionsCache[collectionName]
    if (!collection) {
        try {
            collection = await client.getCollection({ name: collectionName, embeddingFunction })
        } catch(e) {
            console.error(e)
            return null
        }
    }
    try {
        let results = await collection.query({ nResults: limit ?? 1, queryTexts: text})
        return results
    } catch(e){
        console.error(e)
        return null
    }
}

const chroma = {
    connect,
    query,
    add,
    addMany,
    reset,
    getAll,
    get,
    update
}

export default chroma
