"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { getSocket } from "@/lib/socket";
import Cookies from "js-cookie";

type ChatContextType = {
  socket: any;
  socketReady: boolean;
  currentUser: any;
  setCurrentUser: (u: any) => void;
  ready: boolean;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [socketReady, setSocketReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  /* --------------------------
     LOAD COOKIES ONCE ONLY
  -------------------------- */
  useEffect(() => {
    const userCookie = Cookies.get("user");

    if (userCookie) setCurrentUser(JSON.parse(userCookie));

    setReady(true);
  }, []);

  /* --------------------------
     USE GLOBAL SOCKET INSTANCE
  -------------------------- */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onConnect = () => setSocketReady(true);
    const onDisconnect = () => setSocketReady(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        socket: getSocket(),   // always return the SINGLE global socket
        socketReady,
        currentUser,
        setCurrentUser,
        ready,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatGlobal() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("ChatProvider missing");
  return ctx;
}
