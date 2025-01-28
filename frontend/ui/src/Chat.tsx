import './App.css'
import React, { useContext, useEffect, useRef } from 'react'
import { App, ChatContext } from './App'

type ChatParams = {
  visible: boolean
}

type ContainerParams = {
  visible: boolean,
  toggleVisibility: () => void
}

type ChatToggleParams = {
  visible: boolean,
  toggleVisibility: () => void
}

declare const MessageType: {
  readonly Chat: "Chat",
  readonly User: "User"
}

type MessageType = (typeof MessageType)[keyof typeof MessageType];

type Message = {
  sender: MessageType ,
  content: string
}


export function Container({ visible, toggleVisibility }: ContainerParams) {
  return (<div className='linkit-container'>
    <Chat visible={visible} />
    <ChatToggle visible={visible} toggleVisibility={toggleVisibility} />
  </div>)
}

export function Chat({ visible }: ChatParams) {
  const chatRef = useRef<HTMLDivElement | null>(null)
  const timer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!chatRef.current) {
      return;
    }
    if (timer.current) {
      clearTimeout(timer.current);
    }
    let chat = chatRef.current;
    chat.style.display = "flex"
    if (visible) {
      chat.style.transform = 'scale(0)'
      timer.current = setTimeout(() => {
        if (chat) {
          chat.style.opacity = "1"
          chat.style.transform = 'scale(1)'
          chat.classList.toggle("opened", true)
        }
      }, 0);
    } else {
      chat.classList.toggle("opened", false)
      chat.style.transform = 'scale(0.5)'
      chat.style.opacity = '0'
      timer.current = setTimeout(() => {
        chat.style.display = 'none'
      }, 1000)
    }

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    }
  }, [visible]);

  return (<div className="linkit-chat" ref={chatRef}>
    <ChatHeader />
    <ChatContent />
    <ChatFooter />
  </div>)

}

function ChatHeader() {
  return (
    <div className="linkit-header" style={{ verticalAlign: "middle" }}>
      <span style={{ opacity: "0.9" }} className="linkit-name">Sar-EL</span>
      <span
        style={{ fontStyle: "italic", fontWeight: "600", background: "#0000004f", padding: "0.25em 0.5em", marginLeft: "0.5em", borderRadius: "0.5em", fontSize: "0.85em" }}>A.I
        Tutor
        <span style={{ opacity: "0.65", fontWeight: "500" }}>
          &nbsp;beta
        </span>
      </span>
      <ConnectionIndicator />
    </div>)
}

function ConnectionIndicator() {
  const { isConnected } = useContext(ChatContext);

  return <span className={`linkit-dc-ind ${isConnected ? "connected" : ""}`}>
    <svg viewBox="0 0 100 100">
      <g>
        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="10" stroke="var(--linkit-ind-bg)">
        </circle>
        <circle cx="50" cy="68" r="7" fill="var(--linkit-ind-bg)"></circle>
        <path d="M50,22 v34" stroke="var(--linkit-ind-bg)" strokeWidth="10"></path>
      </g>
      <g>
        <circle cx="50" cy="50" r="45" fill="none" strokeWidth="10" stroke="var(--linkit-ind-bg)">
        </circle>
        <path d="M28,52 L45,67 L76,38" stroke="var(--linkit-ind-bg)" strokeWidth="10" fill="none"></path>
      </g>
    </svg>
    <div>
      {isConnected ? "Connected" : "Disconnected"}
    </div>
  </span>
}

function ChatContent() {
  //TODO: Implement messages reterive
  const context = useContext(ChatContext);
  return (<div className="linkit-content">
    {context.isConnected ? "lol" : "bruh"}
  </div>)
}

function ChatInput() {
  const {isConnected} = useContext(ChatContext);
  const inputRef = useRef<HTMLInputElement | null>();

  useEffect(()=>{
    //TODO: Implement send -> If pressed enter && connected send data
    ()=>{
    } 
  })

  return <div className="linkit-chat-bottom linkit-ns">
    <input id="linkit-chat-input" type="text" placeholder="Type something to get some cool information!" />
    <div className="linkit-counter">
      <span id="linkit-counter">0</span><span>/150</span>
    </div>
    <svg className="linkit-submit" viewBox="0 0 100 100">
      <path d="M10,10 L90,50 L40,42 Z
                    M10,90 L90,50 L40,57 Z" stroke="#555" fill="#555" strokeWidth="5" strokeLinejoin="round"></path>
      {/* <!--<path d="M5,15 L5,40 C8,60 30,60 60,60 L90,60 M55,35 L90,60 L55,85" strokeLinecap="round" stroke-linejoin="round" stroke="#555" strokeWidth="14" fill="none"></path>--> */}
    </svg>
  </div>
}

type ChatFooterParams = {
  // isConnected: boolean
}

function ChatFooter({ }: ChatFooterParams) {
  const { isConnected } = useContext(ChatContext);
  return (<>
    <ChatInput />
    <div className="linkit-notice linkit-ns">
      <span>
        By messaging you agree to LinkiT's
      </span>&nbsp;
      <a href="https://thecrazyducks.com/linkit/terms">
        terms & conditions
      </a>
    </div>
    <div className="linkit-label linkit-ns">
      <span>
        LinkiT
      </span>&nbsp;
      by
      <img src="https://cdn.thecrazyducks.com/tcdlogo.svg" onError={(e) => e.currentTarget.style.display = 'none'} /><span>TCD</span>
    </div>

    <svg className="linkit-scroll-down" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" stroke="#000" strokeWidth="6" fill="none"></circle>
      <path d="M50,72 v-40 M35,57 L50,72 L65,57" stroke="#000" strokeWidth="6" fill="none" strokeLinejoin="round" strokeLinecap="round"></path>
      {/* <!--<path d="M30,45 L50,65 70,45" stroke="#000" strokeWidth="6.5" fill="none" stroke-linejoin="round" stroke-linecap="round"></path>--> */}
    </svg>
    <div className="linkit-disconnected" style={{ display: !isConnected ? "block" : "none" }}>
      <div>
        <span>reconnecting
        </span>
        <svg viewBox="0 0 100 100">
          <circle transform="rotate(45, 50, 50)" cx="50" cy="50" r="40" stroke="var(--linkit-err)"
            strokeWidth="15" fill="none">
            <animateTransform attributeName="transform" type="rotate" values="0, 50, 50; 360, 50, 50"
              dur="1.5s" calcMode="spline" keySplines="0.4 0 0.2 1" repeatCount="indefinite">
            </animateTransform>
          </circle>
        </svg>
      </div>
    </div>
  </>)
}

function ChatToggle({ visible, toggleVisibility }: ChatToggleParams) {


  return (<>
    <div className="linkit-toggle" onClick={toggleVisibility}>
      <div className="linkit-banner" style={{ opacity: visible ? "0" : "1" }}>
        <svg viewBox="0 0 100 100" style={{ width: "1.1em", transform: "scaleX(-1) translateY(0.1em)" }}>
          <path d="
                             M34,2 q0,20 20,20 q-20,0 -20,20 q0,-20 -20,-20 q20,0 20,-20 
                             M65,8 q0,38 38,38 q-38,0 -38,38 q0,-38 -38,-38 q38,0 38,-38 
                             M20,42 q0,29 29,29 q-29,0 -29,29 q0,-29 -29,-29 q29,0 29,-29 
                    " fill="var(--linkit-primary)"></path>
        </svg>
        Looking for suggestions? tour?
        <svg viewBox="0 0 100 100" style={{ width: "1.15em" }}>
          <path d="
                             M34,2 q0,20 20,20 q-20,0 -20,20 q0,-20 -20,-20 q20,0 20,-20 
                             M65,8 q0,38 38,38 q-38,0 -38,38 q0,-38 -38,-38 q38,0 38,-38 
                             M20,42 q0,29 29,29 q-29,0 -29,29 q0,-29 -29,-29 q29,0 29,-29 
                    " fill="var(--linkit-primary)"></path>
        </svg>
      </div>
      <div style={{ fontStyle: "italic", verticalAlign: "middle", display: "flex", alignItems: "center" }}>Try it now
        <span
          style={{ padding: "0.2em 0.5em", background: "#0000004f", fontSize: "0.85em", marginLeft: "0.3em", fontStyle: "normal" }}>Free</span>
      </div>
      <div>
        <span className="linkit-name">Sar-EL</span> A.I Tutor
        <span id="linkit-toggle-title">{!visible ? "Open" : "Close"}</span>
      </div>
    </div>
  </>)
}



{/* export default Chat; */ }
