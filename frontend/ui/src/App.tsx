import React, { useState, useRef, useEffect, createContext } from 'react';
import { Chat, Container } from './Chat';

export type ChatContext = {
  isConnected: boolean;
}

export const ChatContext = createContext<ChatContext>({isConnected: false});

export function App() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState<boolean>(false);
  const [available, setAvailable] = useState();
  const token = useRef<string | null>(null);
  const websocket = useRef<WebSocket | null>(null);
  const debug = true;
  const uri = debug ? "localhost:8090" : "service.thecrazyducks.com";
  const protocol = debug ? "ws" : "wss";
  const lasyDelay = useRef(1000);
  const retryTimer = useRef<NodeJS.Timeout | null>(null)
  const [context, setContext] = useState<ChatContext>({isConnected: true});

  useEffect(() => {
    window["connectLinkit"] = (token?: string, config?: any) => {
      if (typeof token !== 'string' || !token) {
        console.error("Token is either undefined or not a string!");
        return;
      }

      const connectWebScoket = (url: string) => {
        websocket.current = new WebSocket(url);
        let ws = websocket.current;
        if (ws) {
          ws.onopen = () => {
            if (retryTimer.current) {
              clearTimeout(retryTimer.current)
            }
          }
          ws.onerror = () => {
            console.error("Couldn't connect!")
            ws.close();
            if (retryTimer.current) {
              clearTimeout(retryTimer.current)
            }
            retryTimer.current = setTimeout(() => {
              lasyDelay.current += 1000;
              connectWebScoket(url);
            }, lasyDelay.current);
          }
        }

        setContext((previous) => {return {isConnected: !previous.isConnected}})
      }

      connectWebScoket(protocol + "://" + uri)
    };

    return () => { delete window["connectLinkit"]; };
  }, []);

  return (
    <ChatContext.Provider value={context}>
      <Container visible={visible} toggleVisibility={() => setVisible((previous) => !previous)} />
    </ChatContext.Provider>
  );
}
