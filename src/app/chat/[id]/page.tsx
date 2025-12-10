"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useChatGlobal } from "@/app/providers/ChatProvider";
import ChatInboxPage from "../page"; // parent /chat/page

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type UserMini = { _id: string; name?: string; email?: string };
type MessageType = {
  _id: string;
  sender: { _id: string; name?: string };
  receiver: { _id: string; name?: string };
  message: string;
  createdAt: string;
  tempId?: string | null;
};

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { socket, socketReady, currentUser, ready } = useChatGlobal();

  const [partner, setPartner] = useState<UserMini | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const partnerRef = useRef<string | null>(partnerId);

  /* ---------------------------
     Defensive normalization
     Accept many shapes from server
  --------------------------- */
  const asString = (v: any) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (v._id) return String(v._id);
    if (v.id) return String(v.id);
    // some servers nest user: { _id: ... }
    if (v.user && (v.user._id || v.user.id)) return String(v.user._id ?? v.user.id);
    return "";
  };

  const asName = (v: any) => {
    if (!v) return "";
    if (typeof v === "string") return "";
    if (v.name) return String(v.name);
    if (v.username) return String(v.username);
    if (v.user && v.user.name) return String(v.user.name);
    return "";
  };

  const normalizeMessage = (raw: any): MessageType => {
    if (!raw) {
      console.warn("normalizeMessage: got falsy raw", raw);
      return {
        _id: `tmp-${Date.now()}`,
        sender: { _id: "", name: "" },
        receiver: { _id: "", name: "" },
        message: "",
        createdAt: new Date().toISOString(),
        tempId: null,
      };
    }

    // createdAt normalization
    let createdAtIso: string;
    if (raw.createdAt && !isNaN(Date.parse(String(raw.createdAt)))) {
      createdAtIso = new Date(String(raw.createdAt)).toISOString();
    } else if (raw.createdAt instanceof Date) {
      createdAtIso = raw.createdAt.toISOString();
    } else {
      // fallback: if server provides ts or missing, use now
      createdAtIso = new Date().toISOString();
    }

    // normalize sender/receiver shapes defensively
    const senderId = asString(raw.sender ?? raw.from ?? raw.senderId ?? raw.fromId);
    const senderName = asName(raw.sender ?? raw.from);

    const receiverId = asString(raw.receiver ?? raw.to ?? raw.receiverId ?? raw.toId);
    const receiverName = asName(raw.receiver ?? raw.to);

    const id = raw._id?.toString() ?? raw.id?.toString() ?? raw.tempId ?? `tmp-${Date.now()}`;

    // final message text
    const messageText = raw.message ?? raw.text ?? raw.body ?? "";

    return {
      _id: id,
      sender: { _id: senderId, name: senderName },
      receiver: { _id: receiverId, name: receiverName },
      message: messageText,
      createdAt: createdAtIso,
      tempId: raw.tempId ?? null,
    };
  };

  /* ---------------------------
     Upsert: replace temp bubbles reliably,
     dedupe by _id, keep chronological order
  --------------------------- */
  const upsertMessage = (incomingRaw: any) => {
    const incoming = normalizeMessage(incomingRaw);

    setMessages((prev) => {
      // shallow copy
      const list = [...prev];

      // 1) If server returns a message with tempId -> replace the optimistic bubble
      if (incoming.tempId) {
        // find by tempId (optimistic id stored in _id previously)
        const byTempIndex = list.findIndex((m) => m._id === incoming.tempId || m.tempId === incoming.tempId);
        if (byTempIndex !== -1) {
          // ensure we preserve server's createdAt and server _id
          list[byTempIndex] = {
            ...incoming,
            _id: incoming._id ?? incoming.tempId,
            tempId: null,
          };
          // no major resort (keeps user scroll stable), but ensure ordering if timestamps differ
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          return list;
        }
      }

      // 2) If message already exists by server _id, ignore
      if (incoming._id && list.some((m) => m._id === incoming._id)) {
        return prev;
      }

      // 3) Otherwise push and sort
      list.push(incoming);
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return list;
    });
  };

  /* ---------------------------
     partnerRef sync
  --------------------------- */
  useEffect(() => {
    partnerRef.current = partnerId;
  }, [partnerId]);

  /* ---------------------------
     Online socket events
  --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onOnline = (id: string) => setOnline((prev) => [...new Set([...prev, id])]);
    const onOffline = (id: string) => setOnline((prev) => prev.filter((x) => x !== id));

    socket.on("userOnline", onOnline);
    socket.on("userOffline", onOffline);
    socket.emit("getOnlineUsers");
    socket.on("onlineUsers", (list: string[]) => setOnline(list ?? []));

    return () => {
      socket.off("userOnline", onOnline);
      socket.off("userOffline", onOffline);
      socket.off("onlineUsers");
    };
  }, [socket]);

  /* ---------------------------
     Load partner + history
  --------------------------- */
  useEffect(() => {
    if (!ready || !partnerId) return;

    const load = async () => {
      setLoading(true);
      try {
        const usersRes = await fetch(`${API_URL}/api/chat/users`, { credentials: "include" });
        const users = await usersRes.json();
        setPartner(users.find((u: UserMini) => String(u._id) === String(partnerId)) ?? null);

        const msgRes = await fetch(`${API_URL}/api/chat/messages/${partnerId}`, { credentials: "include" });
        const raw = await msgRes.json();

        const normalized = (Array.isArray(raw) ? raw : []).map((m: any) => normalizeMessage(m));
        normalized.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setMessages(normalized);
      } catch (err) {
        console.error("History load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [ready, partnerId]);

  /* ---------------------------
     Single receive handler
     (logs unexpected shapes so you can fix server side)
  --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (raw: any) => {
      try {
        // debug: log raw payload if missing sender/receiver
        if (!raw) {
          console.warn("receiveMessage: empty payload", raw);
          return;
        }
        // quick check for expected fields
        if (!raw.sender && !raw.from && !raw.senderId) {
          console.warn("receiveMessage: payload missing sender. raw:", raw);
        }
        if (!raw.receiver && !raw.to && !raw.receiverId) {
          // some server messages may include only 'to' or 'receiverId'
          console.warn("receiveMessage: payload missing receiver. raw:", raw);
        }

        const msg = normalizeMessage(raw);
        const pid = partnerRef.current;
        if (!pid) return;

        // if neither sender nor receiver matches current partner, ignore
        if (msg.sender._id !== pid && msg.receiver._id !== pid) return;

        upsertMessage(raw);
      } catch (e) {
        console.error("receiveMessage handler error", e);
      }
    };

    socket.on("receiveMessage", onReceive);

    return () => {
      socket.off("receiveMessage", onReceive);
    };
  }, [socket]);

  /* ---------------------------
     Send message (optimistic)
  --------------------------- */
  const handleSend = () => {
    if (!input.trim()) return;
    if (!socket || !socketReady || !currentUser) return;

    const text = input.trim();
    const tempId = `tmp-${Date.now()}`;

    // emit to server. server should echo the saved message and include tempId in response
    socket.emit("sendMessage", { to: partnerId, message: text, tempId });

    // Build optimistic message with same normalized structure
    const optimistic: MessageType = {
      _id: tempId,
      tempId,
      sender: { _id: String(currentUser._id ?? currentUser.id ?? ""), name: currentUser.name ?? "" },
      receiver: { _id: String(partnerId ?? ""), name: partner?.name ?? "" },
      message: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => {
      const list = [...prev, optimistic];
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      return list;
    });

    setInput("");
  };

  /* ---------------------------
     Auto-scroll when messages update
  --------------------------- */
  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;
    const t = setTimeout(() => {
      box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    }, 40);
    return () => clearTimeout(t);
  }, [messages]);

  const isPartnerOnline = online.includes(partnerId);

  if (!partnerId)
    return <div className="h-screen flex items-center justify-center text-red-400">Invalid chat link</div>;

return (
  <div className="h-screen  bg-black text-white flex">

    {/* SIDEBAR — only on DESKTOP (WhatsApp-style) */}
    <div className="hidden md:flex w-[380px] border-r border-gray-800 bg-gray-900">
      <ChatInboxPage />
    </div>

    {/* CHAT WINDOW */}
    <div className="flex-1  pt-15 flex flex-col bg-black">

      {/* HEADER */}
      <header className="flex items-center gap-3 p-4 border-b border-gray-800 bg-gray-900">
        {/* Back button only on mobile */}
        <button
          className="md:hidden p-2 rounded hover:bg-gray-800"
          onClick={() => router.push("/chat")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black font-bold">
          {partner?.name?.[0]?.toUpperCase() ?? "U"}
        </div>

        <div>
          <div className="font-semibold">{partner?.name ?? "User"}</div>
          <div className="text-xs text-gray-400">{isPartnerOnline ? "Online" : "Offline"}</div>
        </div>
      </header>

      {/* MESSAGES */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
        {loading ? (
          <div className="text-center text-gray-400">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">Start the conversation</div>
        ) : (
          messages.map((m) => {
            const isMe = String(m.sender._id) === String(currentUser?._id ?? currentUser?.id);
            return (
              <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                    isMe
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
                      : "bg-gray-800 text-gray-200"
                  }`}
                >
                  <div className="text-sm">{m.message}</div>
                  <div className="text-[10px] text-gray-300 mt-1 text-right">
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* INPUT */}
      <div className="p-4 border-t border-gray-800 bg-gray-900 flex items-center gap-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={socketReady ? "Write a message…" : "Connecting…"}
          disabled={!socketReady}
          className="flex-1 px-4 py-2 rounded-full bg-gray-800 border border-gray-700 outline-none"
        />
        <button
          onClick={handleSend}
          disabled={!socketReady}
          className="px-4 py-2 rounded-full bg-emerald-500 text-black font-semibold"
        >
          Send
        </button>
      </div>
    </div>
  </div>
);

}
