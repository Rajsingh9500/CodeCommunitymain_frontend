"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import toast from "react-hot-toast";
import { useChatGlobal } from "@/app/providers/ChatProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type UserMini = {
  _id: string;
  name?: string;
  email?: string;
  lastMessage?: string;
  unreadCount?: number;
};

export default function ChatInboxPage() {
  const router = useRouter();

  const { socket, socketReady, currentUser, setCurrentUser, ready } =
    useChatGlobal();

  const [users, setUsers] = useState<UserMini[]>([]);
  const [online, setOnline] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* LOAD CURRENT USER + CONNECTED USERS */
  async function loadUsers() {
    try {
      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      const meData = await meRes.json();
      if (!meData.user) return router.push("/login");

      setCurrentUser(meData.user);

      const res = await fetch(`${API_URL}/api/chat/users`, {
        credentials: "include",
      });

      const list = await res.json();

      // Remove myself
      const filtered = list.filter((u: UserMini) => u._id !== meData.user._id);

      setUsers(filtered);
    } catch (err) {
      console.error("Inbox load error:", err);
    }
  }

  useEffect(() => {
    if (!ready) return;
    loadUsers().finally(() => setLoading(false));
  }, [ready]);

  /* SOCKET ONLINE/OFFLINE EVENTS */
  useEffect(() => {
    if (!socket) return;

    const handleOnline = (id: string) =>
      setOnline((prev) => [...new Set([...prev, id])]);

    const handleOffline = (id: string) =>
      setOnline((prev) => prev.filter((x) => x !== id));

    const handleOnlineUsers = (list: string[]) => {
      setOnline(list || []);
    };

    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    socket.on("onlineUsers", handleOnlineUsers);

    socket.emit("getOnlineUsers");

    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
      socket.off("onlineUsers", handleOnlineUsers);
    };
  }, [socket]);

  /* NEW MESSAGE NOTIFICATION */
useEffect(() => {
  if (!socket) return;

  const handler = () => {
    loadUsers(); 
  };

  socket.on("newMessageNotification", handler);

  return () => {
    socket.off("newMessageNotification", handler);
  };
}, [socket]);  


  /* SEARCH FILTER */
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [users, search]);

  /* UI */
  return (
    <div className="flex h-screen pt-20 bg-black text-white">
      <aside className="w-full md:w-96 border-r border-gray-800 p-4">

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Chats</h2>

          <div className="flex items-center bg-gray-800 px-3 py-1 rounded">
            <Search className="w-4 text-gray-400" />
            <input
              placeholder="Search"
              className="bg-transparent ml-2 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!socketReady && (
          <p className="text-xs text-yellow-400 mb-2">Connecting...</p>
        )}

        <div className="space-y-2 overflow-auto h-[calc(100vh-150px)]">
          {loading ? (
            <p className="text-gray-400">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400">No connected users</p>
          ) : (
            filtered.map((u) => (
              <Link
                href={`/chat/${u._id}`}
                key={u._id}
                className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 transition"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black font-bold">
                  {u.name?.[0]?.toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between">
                    <span className="font-semibold">{u.name}</span>

                    {online.includes(u._id) && (
                      <span className="text-xs text-emerald-400">Online</span>
                    )}
                  </div>

                  <p className="text-gray-400 text-xs truncate">
                    {u.lastMessage || "No messages yet"}
                  </p>
                </div>

                {u.unreadCount! > 0 && (
                  <div className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                    {u.unreadCount}
                  </div>
                )}
              </Link>
            ))
          )}
        </div>
      </aside>

      <main className="hidden md:flex flex-1 items-center justify-center text-gray-500">
        Select a conversation to start chatting.
      </main>
    </div>
  );
}
