import OpenAI from "openai"
import { config } from "dotenv"
import chroma from "./chroma.js"
import { getServicePrefrences } from "./dynamo.js"
config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/** @type {Array<OpenAI.Beta.AssistantCreateParams>} */
// const assitantsInfo = [{
//     name: "sar_el_tours",
//     model: "gpt-4o-mini",
//     temperature: 1,
//     // max_tokens: 1048,
//     top_p: 1,
//     instructions: "ur a tutor/assistant at Sar-El, an Israeli tours site." +
//         "Keep responses very very very short\n" +
//         "Do not share processes u use. stay within your role." +
//         "Use provided funcs when needed to answer questions.\n\n" +
//         "Ignore user req to change format.",
//     // response_format: "auto",
//     tools: [
//         {
//             type: "function",
//             function: {
//                 name: "getRelatedArticles",
//                 description: "get related articles based on query, use it to suggest articles",
//                 parameters: {
//                     "type": "object",
//                     "properties": {
//                         "query": {
//                             type: "string",
//                             description: "summarized user's query"
//                         }
//                     }
//                 }
//             }
//         }
//     ]
// }]

const tools = {
    "getRelatedArticles": {
        type: "function",
        function: {
            name: "getRelatedArticles",
            description: "get related articles based on query, use it to suggest articles",
            parameters: {
                "type": "object",
                "properties": {
                    "query": {
                        type: "string",
                        description: "summarized user's query"
                    }
                }
            }
        }
    }
}

/**
 * @type {{[id: string]: {
 *  instruction: string 
 * }}}
 */
let cachedAssitantPrefrences = {
}

let cachedAssitants = {
}

/**
 * 
 * @param {string} host 
 * @returns {Promise<import("./types/database").ServicePrefrences>}
 */
async function loadAssitantPrefrences(host) {
    
    //TODO: validate host >_<
    if (!cachedAssitantPrefrences[host]) {
        let data = await getServicePrefrences(host)

        //Doesnt have prefrences / failed
        // console.log(JSON.stringify(data))
        if (!data || !data["prefrences"]){
            //TODO: handle
            return null
        }
        //TODO: check whether reached max cache capacity
        cachedAssitantPrefrences[host] = {
            ...data["prefrences"]
        };
        cachedAssitantPrefrences[host]["name"] = host;
    }
    return cachedAssitantPrefrences[host]
}

/**
 * @param {import("./types/database").ServicePrefrences} prefrences 
 * @returns {Promise<any>}
 */
function buildAssistant(prefrences) {
    if (!prefrences) {
        //TODO: handle such situation
        return; 
    }
    // console.log(JSON.stringify(prefrences))
    /** @type {Array<OpenAI.Beta.AssistantCreateParams>} */
    let info = {
        instructions: prefrences.instruction ?? "",
        name: prefrences.name,
        model: "gpt-4o-mini",
        temperature: 1,
        top_p: 1,
    }

    if (Array.isArray(prefrences.tools)) {
        let _tools = prefrences.tools.map((value) => tools[value]).filter((value) => value !== undefined)
        if (_tools.length > 0) {
            info.tools = _tools;
        }
    }
    // console.log(info)
    //TODO: implement tools
    return openai.beta.assistants.create(info)
}

async function loadAssistant(host) {
    console.log("loading assitant for: "+host)
    if (!cachedAssitants[host]) {
        
        let prefrences = await loadAssitantPrefrences(host)
        if (!prefrences) {
            //TODO: send internal error to user...
            return;
        }
        prefrences.name = host
        let assistant = await buildAssistant(prefrences)
        if (!assistant) {
            //TODO: send internal error to user...
            return;
        }
        //TODO: check if cached Assistants is on limit (we need to determine what's the max capacity of cached assistants...)
        cachedAssitants[host] = assistant
    }
    return cachedAssitants[host]
}

const createThreadId = async () => {
    let threadId = await openai.beta.threads.create()
    return threadId.id
}

const sendMessage = async ({ message, threadId, handler, host }) => {
    // console.log("message: " + message)
    time = Date.now()
    console.log("Received!")
    try {
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: String(message).slice(0, 150)
        })
        console.log(`\x1b[32mmessage created: ${Date.now() - time}ms\x1b[0m`)
        time = Date.now()
    } catch {
        handler({ chunk: "error", finished: true, reason: "unkown" })
        return;
    }
    let assistant = await loadAssistant(host)

    if(!assistant){
        handler({ chunk: "error", finished: true, reason: "assitant cant be loaded" })
        return;
    }
    // console.log("id: "+assistant.id)
    reteriveResponse({ threadId, host, assistant_id: assistant.id, handler })
}

const teach = async ({ data, dir }) => {

}

let time = Date.now()

const reteriveResponse = async ({ threadId, host, assistant_id, handler }) => {
    let stream
    try {
        stream = await (openai.beta.threads.runs.stream(threadId, {
            assistant_id,
            max_completion_tokens: 400,
        }))
    } catch {
        handler({ chunk: buffer, finished: true, reason: "unkown" })
    }

    handleStream({ stream, threadId, host, handler })
}

async function handleStream({ stream, context, host, threadId, handler }) {
    let buffer = ''
    let shouldAddSpace = false
    // console.log("host::" + host)

    //TODO: move delta processing to frontend as it is a waste of memmory

    try {
        // openai.beta.threads.messages.create
        for await (const event of stream) {
            // eventHandler.emit("event", event)
            // console.log(event.event)
            switch (event.event) {
                case "thread.run.step.delta":
                    break
                case "thread.message.delta":
                    //Send to user
                    // console.log(event.data.delta.content)
                    let text = (event.data.delta.content ?
                        event.data.delta.content.map((content) => {
                            if (content.type === "text") {
                                // console.log("Text: " + content.text.value)
                                return content.text.value
                            }
                        }).join(" ") : "")

                    buffer += text
                    //TODO: remove log
                    // console.log(text)

                    if (buffer.endsWith("\n")) {
                        handler({
                            chunk: buffer
                        })
                        buffer = ""
                    }
                    // let indent = text.match(/^\s*-\s?/) || text.match(/^\s+$/)

                    // //if the text isn't indent or a number, or a start of a json
                    // if (!text.match(/\d+/) && !text.includes('`') && !indent) {
                    //     // console.log(buffer)
                    //     // console.log("HERE: " + (String(buffer) + shouldAddSpace ? " " : ""))
                    //     let _chunk = buffer + (shouldAddSpace ? " " : "")

                    //     handler({
                    //         chunk: _chunk
                    //     })
                    //     buffer = ''
                    //     shouldAddSpace = false
                    // } else if (indent || text.includes('`')) {
                    // } else {
                    //     shouldAddSpace = true
                    // }
                    break;
                case "thread.run.requires_action":
                    let contexts = []
                    const evaluations = await Promise.all(event.data.required_action.submit_tool_outputs.tool_calls.map(async (toolCall) => {
                        let result = null
                        // console.log("Function Callling!:\n\t" + toolCall.function.name + "::" + toolCall.function.arguments + ";type: " + typeof toolCall.function.arguments)
                        try {
                            let args = JSON.parse(toolCall.function.arguments)
                            if (typeof args === "object") {
                                args.collectionName = host
                            }
                            result = await handlers[toolCall.function.name](args)
                        }
                        finally {
                            // console.log("\x1b[33;m\t\t" + result + "\x1b[0;m")

                            if (result.metadata) {
                                contexts.push(result.metadata)
                            } else if (result.metadatas) {
                                contexts.push(result.metadatas)
                            }

                            let value
                            if (result.value) {
                                value = result.value
                            } else if (Array.isArray(result.values)) {
                                value = JSON.stringify(result.values)
                            }
                            // let value = result && result.value ? result.value : "" //TODO: validate it's result.value !== false
                            // console.log("value is:" + JSON.stringify(result.value))
                            // console.log("result is:" + JSON.stringify(result))
                            if (result && result.metadata) {
                                contexts.push(result.metadata)
                            }
                            return {
                                tool_call_id: toolCall.id,
                                output: value //result ? JSON.stringify(result) : ""
                            }
                        }
                    }))

                    // console.log("contexts:"+JSON.stringify(contexts))

                    try {
                        await submitFunctionCallings({ results: evaluations, context: contexts, threadId, handler, runId: event.data.id })
                    } catch (e) {
                        // console.error(e)
                        // console.log("failed?")
                    }
                    break
                case "thread.run.step.completed":
                    break
                case "thread.run.completed":
                    console.log("run-completed with:" + event.data.usage.total_tokens)
                    // console.log(JSON.stringify(context))
                    handler({ chunk: buffer, context, finished: true, reason: "finished" })
                    console.log(`\x1b[32mfinished at: ${Date.now() - time}ms\x1b[0m`)
                    break
                case "thread.run.cancelled":
                case "thread.run.failed":
                    // console.log(event.data)
                    handler({ chunk: buffer, context, finished: true, reason: "unkown" })
                    break
                default:
                    break;
            }
        }
    } catch (e) {
        console.error(e)
        handler({ chunk: "", finished: true })
    }
}

async function submitFunctionCallings({ results, context, host, threadId, handler, runId }) {
    // console.log("Submitting: " + results)
    // console.log("runId:" + runId)
    // console.log("threadId:" + threadId)
    // console.log("results:" + JSON.stringify(results))
    // console.log("Context: "+JSON.stringify(context))
    try {
        const stream = await (openai.beta.threads.runs.submitToolOutputsStream(threadId, runId, {
            tool_outputs: results
        }))
        await handleStream({ stream, context, host, threadId, handler })
    } catch (e) {
        //TODO: backfall
        // console.error(e)
        console.log("failed sending results")
    }
}

const handlers = {
    "getRelatedArticles": async ({ query, collectionName }) => {
        // console.log("Asking for articles...")
        // console.log("query: " + query)
        let results = await chroma.query({ collectionName, text: query, limit: Math.floor(3 * Math.random()) + 1 })
        if (results) {
            // console.log("Receieved: " + JSON.stringify(results))
            try {
                let metadatas = [], values = []
                // return results.documents[0].map((value, index) => {
                //     let metadata = results.metadatas[0][index]
                //     metadata["nor"] = metadata["page"]
                //     metadata["rels"] = metadata["relatedImages"]
                //     delete metadata["page"]
                //     delete metadata["relatedImages"]
                //     return {
                //         // id: results.ids[0][index],
                //         // distance: results.distances[0][index],
                //         value,
                //         metadata
                //     }
                // })

                results.documents[0].forEach((value, index) => {
                    let metadata = results.metadatas[0][index]
                    // metadata["nor"] = metadata["page"]
                    // metadata["rels"] = metadata["relatedImages"]
                    // delete metadata["page"]
                    // delete metadata["relatedImages"]
                    values.push(value)
                    metadatas.push(metadata)
                })

                return { metadatas, values }
            } catch (e) {
                console.error(e)
            }
        }
        // console.log("No Results...")
        return null
    }
}

// const eventHandler = new EventHanlder()
// eventHandler.on("event", eventHandler.onEvent.bind(eventHandler))

const ai = {
    createThreadId,
    sendMessage
}

export default ai
