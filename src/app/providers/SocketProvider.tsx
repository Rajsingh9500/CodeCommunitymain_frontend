"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
      console.log("🔵 Connecting socket from SocketProvider...");
      socket.connect();
    }
  }, []);

  return <>{children}</>;
}
