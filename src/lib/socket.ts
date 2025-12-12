// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(token?: string): Socket {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Create socket once
  if (!socket) {
    socket = io(API_URL!, {
      path: "/socket.io",
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false, // Never auto-connect
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
    });

    socket.on("connect", () => {
      console.log("🟢 Socket Connected:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.error("🔴 Socket Error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.warn("⚠ Socket Disconnected:", reason);
    });
  }

  // 🔥 IMPORTANT FIX:
  // backend expects socket.auth.token
  // but ALSO uses cookie fallback socketToken
  socket.auth = {
    token: token || null,        // primary token for backend
    socketToken: token || null,  // fallback for cookie-based logic
  };

  return socket;
}
