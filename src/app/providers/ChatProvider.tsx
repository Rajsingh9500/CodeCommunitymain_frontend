"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

type ChatContextType = {
  socket: Socket | null;
  socketReady: boolean;
  currentUser: any;
  setCurrentUser: (u: any) => void;
  ready: boolean;
};

export const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);

  const [socketReady, setSocketReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [socketToken, setSocketToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  /* --------------------------
     LOAD COOKIES ONCE ONLY
  -------------------------- */
  useEffect(() => {
    const userCookie = Cookies.get("user");
    const sockCookie = Cookies.get("socketToken");

    if (userCookie) setCurrentUser(JSON.parse(userCookie));
    if (sockCookie) setSocketToken(sockCookie);

    setReady(true);
  }, []);

  /* --------------------------
     STABLE SOCKET CONNECTION
     (Never duplicates)
  -------------------------- */
  useEffect(() => {
    if (!ready || !socketToken) return;

    // Already connected → don't create again
    if (socketRef.current && socketRef.current.connected) return;

    // Cleanup previous dead socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = io(process.env.NEXT_PUBLIC_API_URL!, {
      path: "/socket.io",
      transports: ["websocket"],
      auth: { token: socketToken },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
    });

    socketRef.current = socket;

    socket.on("connect", () => setSocketReady(true));
    socket.on("disconnect", () => setSocketReady(false));

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [ready, socketToken]);

  return (
    <ChatContext.Provider
      value={{
        socket: socketRef.current,
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
