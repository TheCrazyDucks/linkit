import { WebSocket } from "ws";
import ai from "./ai.js"
import { validateChatToken } from "./auth.js";

let connections = []

console.log("man...")

/**
 * 
 * @param {WebSocket} ws 
 */
const handleConnection = (ws) => {
    
    ws.on('open', () => {
        console.log("dude...")
    })

    ws.on('message', async (message) => {
        //received message
        let json
        try {
            json = JSON.parse(String(message))
        } catch {
            ws.send(JSON.stringify({ "error": "invalid format" }))
            return;
        }
        // console.log("-------------------------")
        // console.log(json)
        if (!ws.host) {
            // console.log("token::"+json.token)
            let {host} = validateChatToken({token:json.token})
            // let host = 'Sar-EL'
            if (host) {
                ws.host = host
                ws.threadId = await ai.createThreadId()
                ws.send(JSON.stringify({ chunk: "", reason: "connected", finished: true }))
            } else {
                //Drop connection
                ws.send(JSON.stringify({ reason: "unauth"}))
                ws.close()
            }
        } else {
            if (json["data"]) {
                ai.sendMessage({
                    message: json["data"],
                    threadId: ws.threadId,
                    host: ws.host,
                    handler: ({ chunk, finished, context, reason }) => {
                        // console.log("Sending: "+chunk)
                        ws.send(JSON.stringify({ chunk, finished: finished === true, context, reason }))
                    }
                })
            }else {
                // ws.send(JSON.stringify({ chunk: "Message hasn't been received", finished: true, reason: "failure" }))
                //IDK... yet
                ws.send(JSON.stringify({ chunk: "", reason: "connected", finished: true }))
            }
          }
    })

    ws.on('close', ()=>{
        console.log('closed')
    })

    ws.on('ping', () => {

    })

    ws.on('pong', () => {

    })
}

export default handleConnection;