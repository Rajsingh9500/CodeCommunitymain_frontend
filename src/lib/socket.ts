// lib/socket.ts
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

let socket: Socket | null = null;
let isConnecting = false;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const API = process.env.NEXT_PUBLIC_API_URL;

  // Already created → reuse
  if (socket) return socket;

  if (isConnecting) return socket;
  isConnecting = true;

  // Get socket token from cookie
  const token = Cookies.get("socketToken");

  socket = io(API!, {
    path: "/socket.io",
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,

    // FIX: server requires this!
    auth: { token },

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

  return socket;
}
