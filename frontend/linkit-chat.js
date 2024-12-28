window.addEventListener("load", () => {
    console.log("linkit version: 0.0.2")
    let isOpened = false
    let chatTimer = null
    /** @type {WebSocket} */
    let websocket
    let lastDelay = 1000
    let ref = null
    let isConnected = false

    /**@type {HTMLDivElement | null}*/
    let isReceiving = false
    let lastData = ""
    let isFocused = false
    let token = null
    const uri = "service.thecrazyducks.com"

    const createChatView = () => {
        const chat = document.createElement("div")
        chat.className = "linkit-container";
        chat.innerHTML = `
    <div class="linkit-chat">
        <div class="linkit-header" style=" vertical-align: middle;">
            <span style="opacity: 0.9;">Sar-EL</span>
            <span
                style="font-style: italic; font-weight: 600; font-size: 0.9m; background: #0000004f; padding: 0.25em 0.5em; margin-left: 0.5em; border-radius: 0.5em; font-size: 0.85em;">A.I
                Tutor
                <span style="opacity: 0.65; font-weight: 500;">
                    &nbsp;beta
                </span>
            </span>
            <span class="linkit-dc-ind">
                <svg viewBox="0 0 100 100">
                    <g>
                        <circle cx="50" cy="50" r="45" fill="none" stroke-width="10" stroke="var(--linkit-ind-bg)">
                        </circle>
                        <circle cx="50" cy="68" r="7" fill="var(--linkit-ind-bg)"></circle>
                        <path d="M50,22 v34" stroke="var(--linkit-ind-bg)" stroke-width="10"></path>
                    </g>
                    <g>
                        <circle cx="50" cy="50" r="45" fill="none" stroke-width="10" stroke="var(--linkit-ind-bg)">
                        </circle>
                        <path d="M28,52 L45,67 L76,38" stroke="var(--linkit-ind-bg)" stroke-width="10" fill="none"></path>
                    </g>
                </svg>
                <div>
                    disconnected
                </div>
            </span>
        </div>
        <div class="linkit-content">
        </div>

        <div class="linkit-chat-bottom linkit-ns">
            <input id="linkit-chat-input" type="text" placeholder="Type something to get some cool information!">
            <div class="linkit-counter">
                <span id="linkit-counter">0</span><span>/150<span>
            </div>
            <svg class="linkit-submit" viewBox="0 0 100 100">
                <path d="M10,10 L90,50 L40,42 Z
                    M10,90 L90,50 L40,57 Z" stroke="#555" fill="#555" stroke-width="5" stroke-linejoin="round"></path>
                <!--<path d="M5,15 L5,40 C8,60 30,60 60,60 L90,60 M55,35 L90,60 L55,85" stroke-linecap="round" stroke-linejoin="round" stroke="#555" stroke-width="14" fill="none"></path>-->
            </svg>
        </div>

        <div class="linkit-notice linkit-ns">
            <span>
                By messaging you agree to LinkiT's
            </span>
            <a href="https://thecrazyducks.com/linkit/terms">
                terms & conditions
            </a>
        </div>
        <div class="linkit-label linkit-ns">
            <span>
                LinkiT
            </span>
            by
            <img src="https://cdn.thecrazyducks.com/tcdlogo.svg" onerror="this.style.display='none'"><span>TCD</span>
        </div>

        <svg class="linkit-scroll-down" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" stroke="#000" stroke-width="6" fill="none"></circle>
            <path d="M50,72 v-40 M35,57 L50,72 L65,57" stroke="#000" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"></path> 
            <!--<path d="M30,45 L50,65 70,45" stroke="#000" stroke-width="6.5" fill="none" stroke-linejoin="round" stroke-linecap="round"></path>-->
        </svg>
        <div class="linkit-disconnected">
            <div>
                <span>reconnecting
                </span>
                <svg viewBox="0 0 100 100">
                    <circle transform="rotate(45, 50, 50)" cx="50" cy="50" r="40" stroke="var(--linkit-err)"
                        stroke-width="15" fill="none">
                        <animateTransform attributeName="transform" type="rotate" values="0, 50, 50; 360, 50, 50"
                            dur="1.5s" calcMode="spline" keySplines="0.4 0 0.2 1" repeatCount="indefinite">
                        </animateTransform>
                    </circle>
                </svg>
            </div>
        </div>
    </div>

    <div class="linkit-toggle">
        <div class="linkit-banner">
   <svg viewBox="0 0 100 100" style="width: 1.1em; transform: scaleX(-1) translateY(0.1em)">
                    <path d="
                             M34,2 q0,20 20,20 q-20,0 -20,20 q0,-20 -20,-20 q20,0 20,-20 
                             M65,8 q0,38 38,38 q-38,0 -38,38 q0,-38 -38,-38 q38,0 38,-38 
                             M20,42 q0,29 29,29 q-29,0 -29,29 q0,-29 -29,-29 q29,0 29,-29 
                    " fill="var(--linkit-primary)"></path>
                </svg> 
                Looking for suggestions? tour?
    <svg viewBox="0 0 100 100" style="width: 1.15em">
                    <path d="
                             M34,2 q0,20 20,20 q-20,0 -20,20 q0,-20 -20,-20 q20,0 20,-20 
                             M65,8 q0,38 38,38 q-38,0 -38,38 q0,-38 -38,-38 q38,0 38,-38 
                             M20,42 q0,29 29,29 q-29,0 -29,29 q0,-29 -29,-29 q29,0 29,-29 
                    " fill="var(--linkit-primary)"></path>
                </svg>
    </div>
        <div style="font-style: italic; vertical-align: middle; display: flex; align-items: center;">Try it now
            <span
                style="padding: 0.2em 0.5em; background: #0000004f; font-size: 0.85em; margin-left: 0.3em; font-style: normal;">Free</span>
        </div>
        <div>
            Sar-EL A.I Tutor
            <span id="linkit-toggle-title">Open</span>
        </div>
    </div>
        `;
        return chat;
        // window.dispatchEvent(new CustomEvent("supply-key-linkit", {key: "a"}))
    }

    const initChat = () => {
        let view = createChatView()
        console.log("hmm")
        document.body.appendChild(view)
        // displayComingSoon()
        document.querySelector(".linkit-toggle").onclick = () => {
            /**@type {HTMLDivElement}*/
            // isOpened = !isOpened
            chatTimer = toggleChat(!isOpened, chatTimer)
        }
        // return
        initInput()
        displayConnection(false)
        clearContent()
        document.querySelector(".linkit-content").innerHTML += `<div class="linkit-update-ind">Info last updated on 8th Oct 2024</div>`
        addSuggestionsView(document.querySelector(".linkit-content"), ["Jerusalem then & now", "The holy country", "Flight issues arise due to war"])
        initScrollDownButton()
        // displayMailBox()
        document.querySelector(".linkit-submit").onclick = () => shouldSendMessage(document.querySelector("#linkit-chat-input"));
        // displayLoadingAnimation(true)
    }

    const displayMailBox = ()=>{
        let div = document.createElement("div")
        div.className = 'linkit-mail-form'
        div.innerHTML = `
            <div>
            </div>
            <div>
            <div style="font-style: italic; font-weight: 500; font-size: 0.95em">Got any questions?</div>
            <div class="linkit-mail-fields">
                <div>Name</div>
                <input placeholder="Your Name"/>
                <div>Email</div>
                <input placeholder="example@mail.com"/>
            </div>

        </div>

            <div class="linkit-mail-bottom">

                    <div>Subscribe & get full experience!</div>

            <div class="linkit-mail-submit">Subscribe Now!</div>
                </div>
        `
        document.querySelector(".linkit-content").appendChild(div)
    }

//     const displayComingSoon = () => {
//         document.querySelector(".linkit-content").innerHTML = `
//         <div class="linkit-soon">
//         <div style="">
//         Comming Very Soon! 
// <svg viewBox="0 0 100 100">
//                     <path d="
//                              M34,2 q0,20 20,20 q-20,0 -20,20 q0,-20 -20,-20 q20,0 20,-20 
//                              M65,8 q0,38 38,38 q-38,0 -38,38 q0,-38 -38,-38 q38,0 38,-38 
//                              M20,42 q0,29 29,29 q-29,0 -29,29 q0,-29 -29,-29 q29,0 29,-29 
//                     " fill="var(--linkit-primary)"></path>
//                 </svg>
//         </div>
//         <div style="font-style: italic">
//         Want us to notify you?
//         </div>
//         <div style="font-style: italic">
//         Fill the form & be one of the firsts!
//         </div>
//         <div class="linkit-soon-form">
//             <div>Name</div>
//             <input id="" placeholder="your name"/>
//             <div>Email</div>
//             <input id="" placeholder="example@site.com"/>
//         </div>
//             <div class="linkit-soon-submit">Let Me Know!</div>
//             </div>
        
//        `

//     }

    const resetChatState = (receiving) => {
        resRef = null
        stack = []
        isFinished = false
        isReceiving = receiving === true
        isInList = false
        isInJSON = false
        reference = null
        previous = null
        lastEnded = false
        levels = []
        isInMarkdown = false
        isBold = false
        lastData = ""
        completeData = ""
        chunkIsComplete = false
    }

    const scrollToBottom = () => {
        let assistantContent = document.querySelector(".linkit-content")
        assistantContent.scrollTo({
            top: assistantContent.scrollHeight - assistantContent.clientHeight,
            behavior: "smooth"
        })
    }

    const formattedHour = () => {
        let date = new Date()
        let h = date.getHours()
        let m = date.getMinutes()
        return `${h < 10 ? "0" + h : h}:${m < 10 ? "0" + m : m}`
    }

    const connectWebSocket = () => {
        if (!token) {
            console.log("hmm")
            return
        }
        console.log("connecting")
        websocket = new WebSocket("wss://" + uri)

        setInterval(()=>{
            websocket.dispatchEvent(new CustomEvent('message', {detail: {data: JSON.stringify({'reason': 'pong'})}}))
        }, 30000)

        websocket.onerror = (e) => {
            console.log("Couldn't connect retrying in: " + (lastDelay / 1000) + "s")
            isConnected = false
            displayConnection(false)
            resetChatState()

            //TODO: show error
            // showError("Disconnected", true)
            setTimeout(() => {
                lastDelay += 1000
                connectWebSocket()
            }, lastDelay)
        }

        let authed = false

        websocket.onmessage = (e) => {
            if(e.detail){
                console.log('::pong')
                return;
            }
            let data = JSON.parse(e.data)
            let reason = data["reason"]
            switch (reason) {
                case "unauth":
                    //TODO: handle unauth
                    authed = false
                    websocket.close()
                    return;
                default:
                    authed = true
                    break;
            }
            isReceiving = true
            let chunk = data["chunk"]
            processV4(e.data)
            // processMessage(e.data)
            isWaitingForChatBot = false
        }

        let reference = undefined

        websocket.onclose = ()=>{
            if(authed){
                connectWebSocket()
            }
            displayConnection(false)
        }

        websocket.onopen = () => {
            //TODO: showError
            // showError("", false)
            isConnected = true
            lastDelay = 1000;
            displayConnection(true)
            // websocket.send(JSON.stringify({ id, token, type: "connection" }))
            websocket.send(JSON.stringify({ token }))
        }

    }

    let pendingMessage = null

    const toggleChat = (shouldOpen, timer) => {
        let chat = document.querySelector(".linkit-chat")
        let _timer

        if (timer) {
            clearTimeout(timer)
        }
        document.querySelector("#linkit-toggle-title").innerText = shouldOpen ? "Close" : "Open"
        isOpened = shouldOpen === true

        if (shouldOpen) {
            // chat.style.display = 'none'
            console.log("opening")
            chat.style.transform = 'scale(0)'
            chat.style.display = 'flex'
            document.querySelector(".linkit-banner").style.opacity = 0
            _timer = setTimeout(() => {
                chat.style.opacity = 1
                chat.style.transform = 'scale(1)'
                chat.classList.toggle("opened", true)
            }, 0);
        } else {
            chat.classList.toggle("opened", false)
            chat.style.display = 'flex'
            chat.style.transform = 'scale(0.5)'
            chat.style.opacity = '0'
            document.querySelector(".linkit-banner").style.opacity = 1
            _timer = setTimeout(() => {
                chat.style.display = 'none'
            }, 1000)
        }

        return _timer
    }

    window.addEventListener("init-linkit", () => {
        initChat()
    })

    window.addEventListener("connect-linkit", (e) => {
        console.log(e.detail.token)
        if (e.detail && typeof e.detail.token === 'string') {
            token = e.detail.token
        } else {
            displayConnection(false)
            return
        }
        connectWebSocket()
    })

    window.addEventListener("finished-linkit", () => {
        isReceiving = false
        // scrollToBottom()
    })

    window.addEventListener("close-linkit", () => {
        toggleChat(false, chatTimer)
    })

    window.addEventListener("open-linkit", () => {
        toggleChat(true, chatTimer)
    })

    const enableSubmit = (enable) => {
        document.querySelector(".linkit-submit").classList.toggle("enabled", enable === true && !isReceiving)
    }

    const initInput = () => {
        /** @type {HTMLInputElement} */
        let input = document.querySelector("#linkit-chat-input")
        input.onfocus = () => {
            isFocused = true
        }
        input.onblur = () => {
            isFocused = false
        }
        input.oninput = (e) => {
            enableSubmit(e.currentTarget.value.trim().length > 0)

            if (e.currentTarget.value.length >= 150) {
                e.currentTarget.value = e.currentTarget.value.slice(0, 150)
            }
            document.querySelector("#linkit-counter").innerText = e.currentTarget.value.length
        }

        input.onchange = (e) => {

        }

        window.addEventListener("keypress", (e) => {
            if (e.key === 'Enter' && isFocused) {
                shouldSendMessage()
                console.log("%c----------------------------", "color: yellow")
            }
        })
    }

    const initScrollDownButton = () => {
        let scrollDown = document.querySelector(".linkit-scroll-down")
        scrollDown.onclick = scrollToBottom

        /**@type {HTMLDivElement} */
        let container = document.querySelector(".linkit-content")
        // container.on
        scrollDown.observer = new MutationObserver(() => {
            let diff = container.scrollHeight - container.clientHeight - container.scrollTop
            if (diff <= 0) {
                scrollDown.style.opacity = 0
            } else {
                scrollDown.style.opacity = 1
            }
        }).observe(container, {
            subtree: true,
            childList: true
        })
        container.onscroll = (e) => {
            let diff = container.scrollHeight - container.clientHeight - container.scrollTop
            if (diff <= 100) {
                scrollDown.style.opacity = 0
            } else {
                scrollDown.style.opacity = 1
            }
        }
    }

    const displayConnection = (connected) => {
        let bottomIndicator = document.querySelector(".linkit-disconnected")
        let topIndicator = document.querySelector(".linkit-dc-ind")
        if (connected) {
            bottomIndicator.style.display = 'none'
            topIndicator.querySelector("div").innerText = "Connected"
            topIndicator.classList.toggle("connected", true)
            // topIndicator.style.display = 'none'
        } else {
            topIndicator.classList.toggle("connected", false)
            bottomIndicator.style.display = 'block'
            topIndicator.querySelector("div").innerText = "Disconnected"
            // topIndicator.style.display = 'flex'
        }
    }

    const shouldSendMessage = (value) => {
        //Cannot send messages while receiving
        //TODO: undo
        // isReceiving = false
        console.log("rec: "+isReceiving + ", con: "+isConnected)
        if (!isConnected || isReceiving) {
            return;
        }
        let data = value
        // let data = isString(value) ? value: input.value
        let input = document.querySelector("#linkit-chat-input")
        if (!isString(value)) {
            data = (input.value ?? "").trim()
        }
        if (data === "") {
            return;
        }
        input.value = ''
        try {
            document.querySelector("#linkit-counter").innerText = 0
        } catch { }
        try {
            resetChatState()
            isReceiving = true
            websocket.send(JSON.stringify({ type: "message", data }))
        } catch (e) {
            //TODO: handle websocket errors
            console.log("%cSocket Error >_<: " + e, "color: #f00")
        }
        addRequestView(document.querySelector(".linkit-content"), data)
        //Add response with loading animation
        //Or display animation
        displayLoadingAnimation(true)

        scrollToBottom()
        isReceiving = true
    }

    const displayLoadingAnimation = (show) => {
        try {
            document.querySelector("#linkit-loading-ind").remove()
        } catch { }
        if (!show) {
            return;
        }
        console.log("LOOOOL!")
        let div = document.createElement("div")
        div.id = "linkit-loading-ind"
        div.className = "linkit-loading-ind"
        div.innerHTML = `
            <div>
            </div>
            <div>
            </div>
            <div>
            </div>
        `
        try {
            document.querySelector(".linkit-content").appendChild(div)
            // console.log("Hmmmmm....")
        }
        catch (e) { console.error(e) }
    }

    const isString = (obj) => typeof obj === 'string';
    const clearContent = () => {
        document.querySelector(".linkit-content").innerHTML = ''
    }

    const appendToListItem = (item, text) => {
        if (item) {
            item.querySelectorAll("span")[1].innerHTML += String(text)
        }
    }

    /**@param {HTMLDivElement} container */
    const addRequestView = (container, text) => {
        container.appendChild(createRequestView(text))
    }

    /**
     * @param {string} text 
     * @returns {HTMLDivElement}
     */
    const createRequestView = (text) => {
        let div = document.createElement("div")
        let date = new Date()
        div.className = "linkit-usr-req"
        div.innerHTML = `
                    <div class="linkit-msg-date">
                        you • at ${formattedHour()}
                    </div>
                    <div class="linkit-req-content">
                        <div>
                        </div>
                        
                    </div>
                `
        div.querySelector(".linkit-req-content").firstElementChild.innerText = text
        return div
    }

    const createResponseView = (text) => {
        let div = document.createElement("div")
        let date = new Date()
        div.className = 'linkit-chat-msg reply'
        div.innerHTML = `
                    <div class="linkit-msg-date" style="">
                        <span>
                            Sar-EL A.I. • at ${formattedHour()}
                        </span>
                    </div>
                    <div>
                    </div>
                `
        // <span
        // style="background: var(--on-secondary); padding: 0.25em 0.75em; border-radius: 1em; color: var(--secondary); font-size: 0.85em; margin-left: auto;">replied</span>
        return div
    }

    let isInMarkdown = false

    const createList = () => {
        const list = document.createElement("div")
        list.style.padding = "1em 1em 1em 4em"
        return list
    }

    const format = (element) => {
        element.innerHTML = element.innerHTML.replace(/\*\*([^*]+)\*\*/, '<strong>$1</strong>')
    }

    const addSuggestionsView = (container, options) => {
        container.appendChild(createSuggestionsView(options))
    }

    /**
     * creates a view for optional questions
     */
    const createSuggestionsView = (options) => {
        let div = document.createElement("div")
        div.className = "linkit-suggestions"
        div.innerHTML = `Welcome to Sar-EL A.I Tutor!<br> <span style='font-style: italic; font-weight: 500'>confused?</span> here are some trending topics:`
        for (let option of options) {
            if (isString(option)) {
                let item = document.createElement("div")
                item.innerText = option
                item.innerHTML += `<svg viewBox="0 0 100 100">
                    <path d="
                             M34,2 q0,20 20,20 q-20,0 -20,20 q0,-20 -20,-20 q20,0 20,-20 
                             M65,8 q0,38 38,38 q-38,0 -38,38 q0,-38 -38,-38 q38,0 38,-38 
                             M20,42 q0,29 29,29 q-29,0 -29,29 q0,-29 -29,-29 q29,0 29,-29 
                    " fill="var(--linkit-primary)"></path>
                </svg>`

                //  M50,60 L65,30 L50,0 L35,30 Z
                //  M70,90 L52.5,65 L70,40 L87.5,65 Z
                item.className = "linkit-suggested-link"
                item.onclick = () => {
                    if(!isConnected){
                        return;
                    }
                    shouldSendMessage(item.innerText)
                    div.style.transform = "translateY(-10px)"
                    div.style.opacity = 0
                    // div.style.maxHeight = 0
                    setTimeout(() => {
                        div.remove()
                    }, 500);
                }
                div.appendChild(item)
            }
        }
        return div
    }


    let chunks = [
        '🚀 Welcome  to the Ultimate Complex List! 🚀\nPrepare for a wild mix of elements designed to challenge your formatter:\n\n1. Item One: **The Beginning**\n   - Subitem \n    1. lol\n\n   ```json\n   {\n       \"description\": \"This subitem introduces the main topic.\",\n       \"priority\": \"high\"\n   }\n   ```\n\n   - Point **A:** \"Crucial Info\"\n\n   ```json\n   {\n       \"key\": \"A\",\n       \"value\": \"Important information.\"\n   }\n   ```\n\n   - Point **B:** \"Additional Insights\"\n       - Insight **1:** True\n\n       ```json\n       {\n           \"insight\": 1,\n           \"status\": \"verified\"\n       }\n       ```\n\n       - Insight **2:** False\n\n   - Subitem **1.2**\n       - Metric **X:** 100%\n\n       ```json\n       {\n           \"metric\": \"X\",\n           \"percentage\": 100\n       }\n       ```\n\n       - Metric **Y:** 75%\n       - Status: **Active**\n\n       ```json\n       {\n           \"status\": \"active\",\n           \"timestamp\": \"2024-10-07T12:00:00Z\"\n       }\n       ```\n\n2. Item Two: **A New Perspective**\n   - Subitem **2.1:** A brief overview\n\n   ```json\n   {\n       \"overview\": \"This section provides insights into new perspectives.\",\n       \"importance\": \"medium\"\n   }\n   ```\n\n   - Subitem **2.2**\n       - Note **A:** \"Keep this in mind\"\n\n       ```json\n       {\n           \"note\": \"A\",\n           \"reminder\": \"Important considerations.\"\n       }\n       ```\n\n      - Note **B:** \"Consider alternatives\"',
        "1. lol ",
        "1. ",
        "it ",
        "works ",
        "- lmao",
        "\n\n",
        "idk what",
        "1. lol\n2. is this whh",
        "\n",
        "   - lol!\n",
        "   - ",
        " ok",
        "       1. hmmm",
        "       1. hmmm",
        "       - hmmm",
        "1. ",
        "sigmaballs",
        "\n",
        "1. ",
        "JSON:\n",
        "```json",
        "{\n",
        "\"some\":\"damm\"",
        "}\n",
        "\n```\nsomething\n",
        "2. cool",
        "\n\n\n",
        "ok",
        " a",
        " lot",
        " of",
        " text",
        "2. ",
        "lol",
        "hmm\n",
        "1. ",
        "namm\n\n",
        "ok",
        "- wtf",
        "   - thats \n```json\n{\"seh\":3}```",
        "   1. thats \n```json\n{\"seh\":3}```",
        "   1. thats \n```json\n{\"seh\":3}```",
        "   - thats \n```json\n{\"seh\":3}```",
        "   5. thats \n```json\n{\"seh\":3}```",
        "   5. thats \n```json\n{\"seh\":3}```\n\n",
        "cool",
    ]

    const testData = () => {
        let chunkId = 0
        let inte = setInterval(() => {
            if (chunkId === chunks.length) {
                clearInterval(inte)
                return;
            }
            processV4(JSON.stringify({ chunk: chunks[chunkId++] }))
        }, 10);
    }

    let reference = undefined
    let breakRecoreded = false
    let isNewLine = true

    let levels = []
    let lastEnded = false
    let previous

    const analyzeJSON = (data) => {
        // console.log("JSON TO ANALYZE: " + data)
        try {
            let json = JSON.parse(data)
            // reference.parentElement.appendChild(createLinkList())
            if (typeof json === "object") {
                if (json.page) {
                    if (Array.isArray(json.page)) {
                        for (let page of json.page) {
                            let a = createLinkView(page)
                            reference.parentElement.appendChild(a)
                        }
                    } else {
                        let a = createLinkView(json.page)
                        reference.parentElement.appendChild(a)
                    }
                }
                if (json.relatedImages) {
                    // console.log(json.relatedImages)
                    for (let image of json.relatedImages) {
                        let img = document.createElement("img")
                        img.src = "https://images.prismic.io/" + image
                        img.className = "linkit-related-img"
                        reference.parentElement.appendChild(img)
                    }
                }
            }
            // else if (Array.isArray(json)) {
            //     for (let item in json) {
            //         let a = createLinkView(item)
            //         reference.parentElement.appendChild(a)
            //     }
            // }
        } catch (e) {
            console.error(e)
        }
    }

    const isIntersecting = () => {
        const observer = new IntersectionObserver((enteries) => {

        })
    }

    const createLinkList = () => {
        let div = document.createElement("div")
        div.className = "related-articles"
        div.innerText = "Might be related:"
        return div
    }

    const createLinkView = (page) => {
        let a = document.createElement("a")
        a.href = "https://sareltours.com/article/" + page.replace(" ", "")
        a.innerText = page.split("-").map((word) => word.slice(0, 1).toUpperCase() + word.slice(1)).join(" ")
        a.innerHTML += `
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 12.5V19C20 20.6569 18.6569 22 17 22H4C2.34315 22 1 20.6569 1 19V6C1 4.34315 2.34315 3 4 3H10.5" stroke="var(--linkit-primary)" stroke-width="3" stroke-linecap="round"/>
<path d="M15 1H21C21.5523 1 22 1.44772 22 2V8" stroke="var(--linkit-primary)" stroke-width="2.5" stroke-linecap="round"/>
<path d="M10 13L21 2" stroke="var(--linkit-primary)" stroke-width="3" stroke-linecap="round"/>
</svg>
        `
        a.className = "linkit-suggested-link"

        return a
    }

    const processV4 = (chunk) => {
        let _data = JSON.parse(chunk)
        console.log(chunk)

        if (_data["reason"] === "connected") {
            window.dispatchEvent(new Event("finished-linkit"))
            return;
        }

        /**@type {String} */
        let _chunk = _data["chunk"]
        let lines = _chunk.split("\n")
        let endsWithBreak = _chunk.endsWith("\n")

        if (!reference) {
            displayLoadingAnimation(false)
            reference = createResponseView()
            document.querySelector(".linkit-content").appendChild(reference)
        }
        // let count = _chunk.search("\n")
        console.log("%c" + JSON.stringify(_chunk) + "\n::" + JSON.stringify(lines), "color: yellow")

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            console.log("%c" + line, "color: green")

            if (isInMarkdown) {
                let index = line.indexOf('```')

                if (index >= 0) {
                    lastData += line.slice(0, index)
                    analyzeJSON(lastData)
                    isInMarkdown = false
                    lastData = ""
                } else {
                    lastData += line
                }

            } else {
                let match;
                let lineBreak = i === lines.length - 1 && !endsWithBreak ? "" : "\n"
                if ((match = line.match(/^\s*```[a-zA-Z\_\-]+/))) {
                    isInMarkdown = true
                    lastData += line.slice(match[0].length)
                }
                else if ((match = isListType(line))) {
                    handleListType(match)
                }
                else {
                    if (i === lines.length - 1 && endsWithBreak) {
                        break;
                    }
                    if (lastEnded && line === "") {
                        console.log("%clast: " + lastEnded + "::" + chunk + "\nprevious:" + previous, "color: purple")
                        levels = []
                    }

                    if (levels.length > 0) {
                        let currentLevel = levels[levels.length - 1]
                        currentLevel.lists[currentLevel.focus].ref.innerHTML += line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') + lineBreak
                    } else {
                        //Double break cuts out of list
                        reference.lastElementChild.innerHTML = (reference.lastElementChild.innerHTML + line).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') + lineBreak
                    }
                }
            }

            lastEnded = lines.length > 1 //&& (lines.length !== 2 && count !== 1 && endsWithBreak) 
        }

        // reference.innerHTML = reference.innerHTML.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        previous = chunk
        lastEnded = endsWithBreak === true

        if (_data["finished"] === true) {
            if (_data["context"]) {
                // reference.lastElementChild.innerHTML += _data["context"]
                /**@type {Array<any>} */
                let data = _data["context"][0]
                console.log("CONTEXT")
                console.log(data)
                console.log(JSON.stringify(data))
                let pages = [], images = []
                let filtered = data.filter((value, index) => {
                    return index === data.findIndex((item) => item.page === value.page)
                })
                filtered.forEach((value) => {
                    if (value.page) {
                        pages.push(value.page)
                    }
                    if (value.relatedImages) {
                        images.push(JSON.parse(value.relatedImages))
                    }
                })
                if (pages.length > 0) {
                    let div = document.createElement("div")
                    div.innerText = "Might be related:"
                    div.className = "linkit-related"
                    reference.parentElement.appendChild(div)
                }
                for (let page of pages) {
                    let a = createLinkView(page)
                    reference.parentElement.appendChild(a)
                }
                let _images = images.flat(Infinity)
                if (_images.length > 0) {
                    reference.parentElement.appendChild(createImageGrid(_images.sort((a, b) => Math.floor(Math.random() * 2) - 1)))
                }
                // for (let image of images.flat(Infinity)) {
                //     console.log(typeof image)
                //     if (image !== '') {
                //         let img = document.createElement("img")
                //         img.src = "https://images.prismic.io/" + image
                //         img.className = "linkit-related-img"
                //         reference.parentElement.appendChild(img)
                //     }
                // }
            }
            reference.lastElementChild.innerHTML = reference.lastElementChild.innerHTML.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            reference = null
            window.dispatchEvent(new Event("finished-linkit"))
        }
    }

    const handleListType = (data) => {
        let { level, type, symbol, content } = data;
        console.log("level: " + level + ", len: " + levels.length)
        //Above level
        if (level > levels.length) {
            levels.push({
                focus: 0,
                lists: [
                    null,
                    null
                ],
            })
        }
        else if (level === levels.length) { //Same level
            console.log("same level")
            if (levels[level - 1].lists[levels[level - 1].focus].type !== type) {
                //switch <->
                console.log("NOT SAME TYPE")
                console.log("last: " + levels[level - 1].type + ", c:" + type + "::" + symbol)
                let currentFocus = levels[level - 1].focus
                if (currentFocus === 1) { //currentFocus == true
                    levels[level - 1].lists[1] = null
                    levels[level - 1].focus = 0
                } else {
                    levels[level - 1].focus = 1
                }
                // levels[level - 1].focus = levels[level = 1].focus === 0 ? 1 : 0
            } else {
                //continue
            }
        }
        else { //Below Current Level
            // if (level !== 1) {
            while (levels.length >= 0 && levels.length > level) {
                levels.pop()
            }
            if (levels.length === 0) {
                levels = [
                    {
                        focus: 0,
                        lists: [
                            null,
                            null
                        ]
                    }
                ]
            }
            // } else {
            // }
        }

        let currentLevel = levels[level - 1]
        let focused = currentLevel.focus
        let currentList = currentLevel.lists[focused]
        const newItem = createListItem(content)

        if (!currentList) {
            console.log(`${level}%2=${level % 2}`)
            const newList = createListContainer(type, symbol, (level % 2 === 0))
            currentLevel.lists[focused] = {
                level,
                type,
                ref: newItem, //List item
                parent: newList //List 
            }
            newList.appendChild(newItem)
            // reference = newItem
            console.log("NEW LIST::" + type)
            if (focused === 1) {
                currentLevel.lists[0].ref.appendChild(newList)
            } else {
                if (level > 1) {
                    // levels[level - 2]
                    let previous = levels[level - 2]
                    previous.lists[previous.focus].ref.appendChild(newList)
                } else {
                    //directly to message
                    reference.lastElementChild.appendChild(newList)
                }
            }
        } else {
            // currentList.type 
            console.log("CURRENT: " + currentList.type)
            if (currentList.ref) {
                currentList.ref.innerHTML = currentList.ref.innerHTML.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            }
            currentList.ref = newItem
            currentList.parent.appendChild(newItem)
        }
    }

    const createListContainer = (type, symbol, isEven) => {
        console.log("isEven: " + isEven)
        let list
        if (type === "number") {
            list = document.createElement("ol")
            list.start = Number(symbol) || 0
        } else {
            list = document.createElement("ul")
        }
        list.className = "linkit-list " + (isEven ? "even" : "odd")
        console.log(list)
        return list
    }

    const createListItem = (content) => {
        const item = document.createElement("li")
        item.innerText = content
        return item
    }

    const isListType = (str, isNewLine) => {
        if (!isString(str)) {
            return null;
        }

        let match;
        let spaces = 0
        let level = 0
        let type = "bullet"
        let content = ""
        let symbolLength = 0

        if ((match = str.match(/^(\s*)((\d+\.)|[\*\-])\s/))) {
            symbolLength = match[0].length
            content = str.slice(symbolLength) //From symbol end till end
            spaces = match[1].length
            level = Math.floor((spaces + 1) / 4) + 1

            if (match[0].match(/\d+/)) {
                type = "number"
            }

            return {
                type,
                level,
                symbol: match[0],
                content
            }
        }
        else if (str.match(/^(\s*)[\*\-]$/) && isNewLine) {
            spaces = match[1].length
            level = Math.floor((spaces + 1) / 4) + 1

            return {
                type,
                level,
                content
            }
        }
        return null
    }

    const createImageGrid = (images) => {
        let className = ""
        if (images.length === 1) {
            className = "single"
        } else if (images.length === 2) {
            className = "double"
        }

        let container = document.createElement("div")
        container.className = "linkit-img-grid " + className
        for (let i = 0; i < images.length; i++) {
            if (i < 3) {
                let div = document.createElement("div")
                div.innerHTML = `
                    <img />
                    ${i === 2 && images.length > 3 ? `<div class="linkit-img-grid-count">${images.length}+</div>` : ""}
                `
                div.querySelector("img").src = "https://images.prismic.io/" + images[i]
                container.appendChild(div)
            }
        }
        return container
    }

    window.dispatchEvent(new Event("linkit-ready"))
})