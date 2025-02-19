import {createServer} from "node:http"
import { WebSocketServer } from "ws"
import express from "express" //@allowSyntheticDefaultImports
import handleConnection from "./websocket.js"
import chroma from "./chroma.js"
import { handleTokenExchange, loadKeys, handleAccessForToken } from "./auth.js"
import { trainer } from "./trainer"
import cors from "cors"
import rateLimit from "express-rate-limit"
import slowDown from "express-slow-down"
// import cors from "cors"

const IS_PRODUCTION = process.env.PRODUCTION ?? false

chroma.connect()

const app = express()

//TODO: check if rate limit settings are good - if not remove it
app.use(rateLimit({
    windowMs: 1000 * 30, //60 seconds
    limit: 30 //60 requests
}))
app.use(slowDown({
    windowMs: 1000 * 60, //60 seconds
    delayAfter: 15, //15 requests
    delayMs: ()=> 1000 //1 second delay between each after 15
}))

app.get("/health", (_, res)=>{
    res.status(200).end()
})

app.use(express.json())
app.use(express.urlencoded())
app.use(cors({origin: "*",
    methods: ["GET","HEAD","POST"]
}))

app.use((req, res, next)=>{
    if(!req.body){
        res.status(401).send().end()
        throw null
    }
    next()
})

app.post("/linkit/train", (req, res)=>{
    let id = req.body["id"] 
    let secret = req.body["secret"];
    let endpoint = req.body["endpoint"];

    if(!id || !secret){
        return;
    }

    if(!endpoint){
        return;
    }
    trainer.handleTrainByEndpoint({res})
})

app.post("/linkit/v0/token", (req, res) => {
    let key = req.body["key"]    
    console.log(key)
    if(!key){
        sendBadRequest(res)
        return;
    }
    handleTokenExchange({res, key})
})

/**
 * onSucess: json { token: String }
 */
app.post("/linkit/token", (req, res)=>{
    console.log("v2")
    let id = req.body["id"]
    let secret = req.body["secret"]

    if(!id || !secret){
        console.log("Nothing!")
        sendBadRequest(res)
        return;
    }
    handleAccessForToken({res, id, secret})
})

// app.get("/chat", (_, res)=>{
//     // res.setHeader("Access-Control-Allow-Origin", "*")
//     // res.setHeader("Content-Type", "text/html; charset=utf-8")
//     streamFile({res, path: "./chat.html"})
// })

// const streamFile = ({ res, path }) => {
//     let stream;
//     stream = fs.createReadStream(path)
//     stream.on("error", () => {
//         res.status(404).end()
//     })
//     stream.on("ready", () => {
//         stream.pipe(res)
//     })
// }

app.use((_, res)=>{
    res.status(404).end()
})

// app.get(/\/chat\.(html|css|js)$/, (req, res)=>{
//     streamFile({res, path: "."+req.path})
// })

export const sendUnauthorized = (res)=>{
    res.status(401).send("Not authorized").end()
}

export const sendBadRequest = (res)=>{
    res.status(400).send("").end()
}

const securedServer = createServer()
// const securedServer = https.createServer({
//     key: process.env.KEY,
//     CERT: process.env.CERT,
//     // key: readFileSync("./key.pem"),
//     // cert: readFileSync("./cert.pem"),
//     passphrase: process.env.pharse
// })

// const server = http.createServer((req, res) => {
//     res.statusCode = 301
//     res.setHeader("location", "https://" + req.headers.host + req.url)
//     res.end()
// })

const wss = new WebSocketServer({
    noServer: true
})

wss.on("connection", (ws) => {
    handleConnection(ws)
})

securedServer.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request)
    })
})

securedServer.on("request", app)

// server.listen("6969")

securedServer.listen("8080", () => {
    console.log("listening: "+8080)
})


