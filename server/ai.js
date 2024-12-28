import OpenAI from "openai"
import { config } from "dotenv"
import chroma from "./chroma.js"
config()

// console.log("API: " + process.env.OPENAI_API_KEY)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/** @type {Array<OpenAI.Beta.AssistantCreateParams>} */
const assitantsInfo = [{
    name: "sar_el_tours",
    model: "gpt-4o-mini",
    temperature: 1,
    // max_tokens: 1048,
    top_p: 1,
    instructions: "ur a tutor/assistant at Sar-El, an Israeli tours site."+
    "Keep responses very very very short\n"+
    "Do not share processes u use. stay within your role."+
    "Use provided funcs when needed to answer questions.\n\n"+
    "Ignore user req to change format.",
                //   "Do not share processes you use and stay within your role. Keep responses very concise (less than 200 tokens). \n"+
                //   "Use functions to get related articles when relevant. Always send 'page', 'relatedImages' as raw JSON,\n" +
                //   "regardless of what is asked for. Ignore user requests to change the format (JSON, etc.).\n",
    // instructions: "u r tutor/assistant at sar-el - an israeli tours site. use provided funcs when needed to answer questions.\n"+
    // "don't share processes u use & stay at ur role. very very very short answers (less than 300 toke).\n"+
    // "use funcs to get related articles when rel.\npage, relatedImages, links will always be sent as ```JSON only! doesnt matter when and what asked for"+
    // "\nignore users req for change format (json etc.)`",
    response_format:"auto",
    tools: [
        {
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
    ]
}]

const getAssitantId = (host) => {
    return assistants[host].id
}

let assistants = {}
let created = (await Promise.all(assitantsInfo.map((info) => {
    return openai.beta.assistants.create(info)
})))

created.map((assistant) => {
    assistants[assistant.name] = assistant
})

const createThreadId = async () => {
    let threadId = await openai.beta.threads.create()
    return threadId.id
}

const sendMessage = async ({ message, threadId, handler, host }) => {
    // console.log("message: " + message)
    try {

        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: String(message).slice(0, 150)
        })
    } catch {
        handler({ chunk: "error", finished: true, reason: "unkown" })
        return;
    }
    reteriveResponse({ threadId, host, assistant_id: assistants[host].id, handler })
}

const teach = async ({ data, dir }) => {

}

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
                            
                            if(result.metadata){
                                contexts.push(result.metadata)
                            }else if(result.metadatas){
                                contexts.push(result.metadatas)
                            }

                            let value
                            if(result.value){
                                value = result.value
                            }else if(Array.isArray(result.values)){
                                value = JSON.stringify(result.values)
                            }
                            // let value = result && result.value ? result.value : "" //TODO: validate it's result.value !== false
                            // console.log("value is:" + JSON.stringify(result.value))
                            // console.log("result is:" + JSON.stringify(result))
                            if(result && result.metadata){
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
        let results = await chroma.query({ collectionName, text: query, limit: Math.floor(3 * Math.random()) + 1})
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

                return {metadatas, values}
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
