"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Home, Users, MessageCircle } from "lucide-react";
import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function MobileFooter() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();

  // ❗ Hide on admin pages
  if (pathname.startsWith("/admin")) return null;

  useEffect(() => {
    let mounted = true;

    const fetchUnread = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/notifications?limit=1&page=1`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (typeof data.totalUnread === "number") {
          setUnread(data.totalUnread);
        } else if (Array.isArray(data.notifications)) {
          setUnread(data.notifications.filter((n: any) => !n.read).length);
        }
      } catch {}
    };

    fetchUnread();

    // socket reuse
    const token = Cookies.get("token");
    if (!token) return;
    const existing = (window as any).__cc_socket as Socket | undefined;

    let s: Socket;
    if (existing && existing.connected) {
      s = existing;
    } else {
      s = io(API_URL, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        autoConnect: false,
      });
      s.auth = { token };
      s.connect();
      (window as any).__cc_socket = s;
    }

    s.on("notification:new", (n: any) => {
      if (!n.read) setUnread((u) => u + 1);
    });

    s.on("notification:read", () => {
      setUnread((u) => Math.max(0, u - 1));
    });

    return () => {
      mounted = false;
      try {
        s.off("notification:new");
        s.off("notification:read");
      } catch {}
    };
  }, []);

  return (
    <nav className="lg:hidden fixed left-0 right-0 bottom-4 flex justify-center pointer-events-none z-[60]">
      <div className="
        pointer-events-auto 
        w-[88%] max-w-md mx-auto
        bg-black/70 backdrop-blur-xl
        border border-white/10
        shadow-[0_4px_20px_rgba(0,0,0,0.5)]
        rounded-2xl px-4 py-3
        flex items-center justify-between
      ">
        
        {/* HOME */}
        <Link href="/home" className="flex flex-col items-center text-gray-300 hover:text-emerald-400 transition">
          <Home className="w-6 h-6" />
        </Link>

        {/* DEVELOPERS */}
        <Link href="/developers" className="flex flex-col items-center text-gray-300 hover:text-emerald-400 transition">
          <Users className="w-6 h-6" />
        </Link>

        {/* NOTIFICATIONS */}
        <Link href="/notifications" className="relative flex flex-col items-center text-gray-300 hover:text-emerald-400 transition">
          <Bell className="w-6 h-6" />

          {unread > 0 && (
            <span className="
              absolute -top-1 -right-2
              bg-red-500 text-white
              text-[10px] font-semibold
              px-1.5 py-[2px]
              rounded-full shadow-lg
              animate-pulse
            ">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        {/* CHAT */}
        <Link href="/chat" className="flex flex-col items-center text-gray-300 hover:text-emerald-400 transition">
          <MessageCircle className="w-6 h-6" />
        </Link>

      </div>
    </nav>
  );
}
