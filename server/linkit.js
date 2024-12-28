import http from "node:http"
import { WebSocketServer } from "ws"
import express from "express"
import handleConnection from "./websocket.js"
import chroma from "./chroma.js"
import bodyParser from "body-parser"
import { handleTokenExchange, loadKeys } from "./auth.js"
import cors from "cors"
// import cors from "cors"

chroma.connect()

//TODO: remove this when database is available
loadKeys()

const app = express()
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(cors({origin: "*",
    methods: ["GET","HEAD","POST"]
}))
// app.options('*', cors()); 

// app.get("/", (req, res) => {
//     // console.log("here")
//     res.send("hmm").end()
// })

// app.use((req, res, next)=>{
//     console.log("Connection made")
//     next()
// })

app.use((req, res, next)=>{
    if(!req.body){
        res.status(401).send().end()
        throw null
    }
    next()
})


app.post("/linkit/token", (req, res) => {
    let key = req.body["key"]    
    console.log(key)
    if(!key){
        sendBadRequest(res)
        return;
    }
    handleTokenExchange({res, key})
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


app.get("/health", (_, res)=>{
    res.status(200).end()
})

app.use((_, res)=>{
    res.status(404).end()
})

// app.get(/\/chat\.(html|css|js)$/, (req, res)=>{
//     streamFile({res, path: "."+req.path})
// })

export const sendUnauthorized = (res)=>{
    res.status(401).send("Not authorized").end()
}

const sendBadRequest = (res)=>{
    res.status(400).send("").end()
}

const securedServer = http.createServer()
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


