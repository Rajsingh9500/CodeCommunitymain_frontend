"use client";

import { useEffect } from "react";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/app/providers/AuthProvider";

export default function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;     // Wait until /me finishes
    if (!user) return;       // Only connect when logged in

    // Pass token to the socket
    const socket = getSocket(user.socketToken);

    if (!socket.connected) {
      console.log("🔵 Connecting socket...");
      socket.connect();
    }

    return () => {
      if (socket.connected) {
        console.log("🔌 Socket disconnected");
        socket.disconnect();
      }
    };
  }, [user, loading]);

  return <>{children}</>;
}
