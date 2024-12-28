import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";
import { config } from "dotenv"
config()

// import a from "chr"
/** @type {ChromaClient} */
let client;
const embeddingFunction = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY,
    openai_model: 'text-embedding-3-small'
})


let attempts = 0

let collectionsCache = {}

const connect = async (host) => {
    client = new ChromaClient({
        path: "http://" + (host ? host : process.env.CHROMA_HOST) + ":8000"
    })

    console.log("HOST: " + process.env.CHROMA_HOST)
    try {
        console.log(await client.heartbeat())
        console.log("chroma::connected")
        //TODO: remove
        // try{
        //     console.log(JSON.stringify((await (await client.getCollection({name: "sar_el_tours", embeddingFunction})).peek({limit: 1}))))
        // }catch(e){
        //     console.error(e)
        //     console.log("empty")
        // }
    } catch {
        console.log("Failed to connect chroma::" + attempts)
        attempts++
        if (attempts > 10) {
            //Something went very bad
            return;
        }
        setTimeout(() => {
            connect()
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
            description
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
    return await collection.get({where: {page: {"$ne": ""}}, limit: Infinity, include: ["metadatas"]})
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

const addMany = async({collectionName, documents})=>{
    // let _ids = []
    let _documents = []
    let _metadatas = []
    documents.forEach((value, index)=>{
        // _ids += [value.id]
        _documents += [value.document]
        _metadatas += [value.metadata]
    })
    try{
        let collection = await client.getOrCreateCollection({name: collectionName, embeddingFunction})
        await collection.add({
            // ids: [id],
            documents: _documents,
            metadatas: _metadatas
        })
    }catch{

    }
}

const query = async ({ collectionName, text, limit }) => {
    /**@type {Promise<import("chromadb").> | null} */
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
