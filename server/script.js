const getShopToken = async () => {
    try {
        let result = await fetch("https://localhost:6969/test_token").then(res => res.json())
        console.log("here:")
        console.log(result)
        if (!result) {
            return undefined
        }
        return result.token
    } catch (e) {
        console.error(e)
        return null
    }
}

window.onload = async () => {
    console.log("loaded!")
    let isWaitingForChatBot = false
    let websocket;
    let lastDelay = 1000;
    const id = crypto.randomUUID().replace(/\-/g, "")

    console.log("hmm")

    const isString = (obj) => {
        return typeof obj === "string" || obj instanceof String
    }

    console.log("there")
    const token = await getShopToken()

    const connectWebSocket = () => {
        websocket = new WebSocket("wss://localhost:8080")

        websocket.onerror = (e) => {
            console.log("Couldn't connect retrying in: " + (lastDelay / 1000) + "s")
            showError("Disconnected", true)
            setTimeout(() => {
                // lastDelay += 1000
                connectWebSocket()
            }, lastDelay)
        }

        websocket.onmessage = (e) => {
            processMessage(e.data)
            isWaitingForChatBot = false
        }

        websocket.onopen = () => {
            showError("", false)
            lastDelay = 1000;
            websocket.send(JSON.stringify({ id, token, type: "connection" }))
        }
    }
    connectWebSocket()

    /**@type {HTMLInputElement} */
    let input = document.querySelector("#chat-assistant-input")
    let isInputFocused = false
    input.onfocus = () => {
        isInputFocused = true
    }
    input.onblur = () => {
        isInputFocused = false
    }
    window.onkeydown = (e) => {
        switch (e.key) {
            case "Enter":
                if (e.shiftKey) {
                    break;
                }
                if (!isWaitingForChatBot) {
                    shouldSendMessage()
                }
                //Send
                break
            default:
                break
        }
    }

    const assistantContent = document.querySelector(".chat-assistant-content")

    const shouldSendMessage = () => {
        if (websocket.readyState !== WebSocket.OPEN) {
            return;
        }
        let value = input.value.trim()
        if (value === "") {
            return;
        }
        input.value = ""

        addRequestView(assistantContent, value)
        enabledLoading(true)
        scrollToBottom()

        isWaitingForChatBot = true
        // websocket.send(new Blob([JSON.stringify({id, request: value})], {type:"application/json"}))
        websocket.send(JSON.stringify({ id, request: value, type: "request" }))
    }

    const processMessage = (message) => {
        /** @type {String | undefined} */
        let response = JSON.parse(message)["response"]
        if (!isString(response)) {
            enabledLoading(false)
            return;
        }
        response = response.trimEnd()
        let indexOfJson = response.indexOf("{")
        let endOfJson = response.lastIndexOf("}")
        let json;
        let parsedJSON;
        if (indexOfJson !== -1 && endOfJson != -1) {
            json = response.slice(indexOfJson, endOfJson + 1)
            console.log("for json: " + json)
            try {
                parsedJSON = JSON.parse(json)
            } catch (e) {
                console.error(e)
            }
            response = response.slice(0, indexOfJson).replace("```json", "")
        }

        addResponseView(assistantContent, response)
        if (parsedJSON) {
            try {
                addProducts(assistantContent, parsedJSON["product_ids"])
            } catch (e) {
                console.error(e)
            }
        }
        console.log("%c" + message, "color: green")
        scrollToBottom()
        enabledLoading(false)
    }

    let isFinished = false
    let isInJSON = false
    let isInList = false
    let isBold = false
    let lastData = ""
    let completeData = ""
    let chunkIsComplete = false

    /**
        well
        ```json
        {
            "cool":"well"
        }
        ```
        1. hhmmmmmm 
        2. hdfalisgdfi
    */
   //TODO: remove

    /**
     * @param {HTMLElement} container
     * @param {String} chunk 
     */
    const receiveChunk = (container, chunk, isFinished) => {
        chunkIsComplete = chunk.endsWith("\n")

        let lines = chunk.split("\n")

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            if (isInJSON) {
                let endOfJSON = line.indexOf('```')
                if (endOfJSON > -1) {
                    isInJSON = false
                    lastData += line.slice(0, endOfJSON)
                    lastData = ""
                } else {
                    lastData += line
                }
            }
            else if (isInList) {
                lastData += line
                if (i === lines.length - 1 && !chunkIsComplete) {
                    isInList = true
                } else {
                    displayListItem({ container, content: line, ends: true})
                    lastData = ""
                }
            }
            else {
                if (line.startsWith("```json")) {
                    isInJSON = true
                    lastData = line.slice("```json".length)
                    displayJSONResult({})
                } else if (line.match(/^d+\.\s/)) {
                    if (i === lines.length - 1 && !chunkIsComplete) {
                        isInList = true
                    }
                    displayListItem({ container, content: lastData, isNew: true })
                    lastData = line
                }
            }
        }

        if (isFinished) {
            isInList = false
            isInJSON = false
        }
    }

    /**
     * @param {{container: HTMLElement, content: string, isNew: boolean, ends: boolean}} params
     * @param {string} content content of the item
     * @param {boolean} isNew continuation of another chunk or a new chunk
     * @returns {{ends: boolean, index: number}}
     */
    const displayListItem = ({ container, content, isNew, ends }) => {
        let _content = content
        if (isNew) {
            container.innerHTML += `<div class="linkit-chat-ol">`
            let match
            if (match = _content.match(/\d\.\s/)) {
                _content = _content.slice(_content.indexOf(match[0]))
            }
        }
        //Handle content
        container.innerHTML += strip(_content)
        if (ends) {
            container.innerHTML += `</div>`
        }
        return {
            ends,
            index: match ? Number(match[0]) : -1
        }
    }

    const strip = (str) => {
        let div = document.createElement("div")
        div.innerText = str
        return div.innerText
    }

    /**
     * @param {{container: HTMLElement, json: string, isNew: boolean}} container
     * @returns {{ends: boolean}}
     */
    const displayJSONResult = ({ container, json, isNew, ends }) => {
        let _json = json
        if (isNew) {
            //Just in case
            let begin = _json.indexOf("```json")
            if (begin > -1) {
                _json = _json.slice(begin)
            }
            container.innerHTML += `<div class="linkit-json-result">`
        }
        if (ends) {
            //slice the last characters of the match which is either ``` or `
            container.innerHTML += "</div>"
        }
        return {
            ends: ends !== null,
            content: _json
        }
    }

    // const receiveWord = ()

    const scrollToBottom = () => {
        assistantContent.scrollTo({
            top: assistantContent.scrollHeight - assistantContent.clientHeight,
            behavior: "smooth"
        })
    }

    const showError = (str, enable) => {
        try {
            document.querySelector(".chat-assistant-error").classList.toggle("enabled", enable === true)
            document.querySelector(".chat-assistant-error div").innerText = String(str ?? "Error Occurred")
        } catch { }
    }

    const enabledLoading = (force) => {
        try {
            document.querySelector(".chat-assistant-loading").classList.toggle("disabled", force !== true)
        }
        catch { }
    }
}