// lib/socket.ts
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

// Prevents multiple reconnections
let isConnecting = false;

export function getSocket(): Socket | null {
  if (typeof window === "undefined") return null;

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  // If already created, always return same socket instance
  if (socket) return socket;

  // Prevent multiple initializations during rapid renders
  if (isConnecting) return socket;
  isConnecting = true;

  socket = io(API, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
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
