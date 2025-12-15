"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useChatGlobal } from "@/app/providers/ChatProvider";
import ChatInboxPage from "../page";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ---------------- TYPES ---------------- */
type UserMini = { _id: string; name?: string };
type MessageType = {
  _id: string;
  tempId?: string | null;
  sender: { _id: string; name?: string };
  receiver: { _id: string; name?: string };
  message: string;
  createdAt: string;
};

export default function ChatConversationPage() {
  const router = useRouter();
  const params = useParams();
  const partnerId = String(
    Array.isArray(params?.id) ? params.id[0] : params?.id
  );

  const { socket, socketReady, currentUser, ready } = useChatGlobal();

  const [partner, setPartner] = useState<UserMini | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const partnerRef = useRef(partnerId);

  const myId = String(currentUser?._id ?? currentUser?.id ?? "");

  /* ---------------- ASK NOTIFICATION PERMISSION ONCE ---------------- */
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  /* ---------------- DATE LABEL ---------------- */
  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";

    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /* ---------------- NORMALIZE MESSAGE ---------------- */
  const normalize = (raw: any): MessageType => ({
    _id: String(raw._id ?? raw.tempId),
    tempId: raw.tempId ?? null,
    sender: {
      _id: String(raw.sender?._id ?? raw.sender),
      name: raw.sender?.name,
    },
    receiver: {
      _id: String(raw.receiver?._id ?? raw.receiver),
      name: raw.receiver?.name,
    },
    message: raw.message,
    createdAt: new Date(raw.createdAt).toISOString(),
  });

  /* ---------------- LOAD PARTNER + HISTORY ---------------- */
  useEffect(() => {
    if (!ready || !partnerId) return;

    (async () => {
      setLoading(true);

      const users = await fetch(`${API_URL}/api/chat/users`, {
        credentials: "include",
      }).then((r) => r.json());

      setPartner(users.find((u: UserMini) => String(u._id) === partnerId));

      const msgs = await fetch(
        `${API_URL}/api/chat/messages/${partnerId}`,
        { credentials: "include" }
      ).then((r) => r.json());

      setMessages(msgs.map(normalize));
      setLoading(false);
    })();
  }, [ready, partnerId]);

  /* ---------------- MARK MESSAGES AS READ ---------------- */
  useEffect(() => {
    if (!partnerId) return;

    fetch(`${API_URL}/api/chat/mark-read/${partnerId}`, {
      method: "PUT",
      credentials: "include",
    });
  }, [partnerId]);

  /* ---------------- ONLINE / OFFLINE ---------------- */
  useEffect(() => {
    if (!socket) return;

    const handleOnline = (id: string) =>
      setOnline((p) => [...new Set([...p, String(id)])]);

    const handleOffline = (id: string) =>
      setOnline((p) => p.filter((x) => x !== String(id)));

    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    socket.on("onlineUsers", (list: any) =>
      Array.isArray(list) ? setOnline(list.map(String)) : setOnline([])
    );

    socket.emit("getOnlineUsers");

    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
      socket.off("onlineUsers");
    };
  }, [socket]);

  /* ---------------- RECEIVE MESSAGE ---------------- */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (raw: any) => {
      const msg = normalize(raw);

      if (
        msg.sender._id !== partnerRef.current &&
        msg.receiver._id !== partnerRef.current
      )
        return;

      setMessages((prev) => {
        // Replace optimistic message
        if (msg.tempId) {
          const i = prev.findIndex((m) => m._id === msg.tempId);
          if (i !== -1) {
            const copy = [...prev];
            copy[i] = { ...msg, tempId: null };
            return copy;
          }
        }

        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on("receiveMessage", onReceive);
    return () => socket.off("receiveMessage", onReceive);
  }, [socket]);

  /* ---------------- SEND MESSAGE (FIXED) ---------------- */
  const handleSend = () => {
    if (!input.trim() || !socket || !socketReady) return;

    const tempId = `tmp-${Date.now()}`;

    socket.emit("sendMessage", {
      to: partnerId,
      message: input,
      tempId,
    });

    setMessages((p) => [
      ...p,
      {
        _id: tempId,
        tempId,
        sender: { _id: myId, name: currentUser?.name },
        receiver: { _id: partnerId, name: partner?.name },
        message: input,
        createdAt: new Date().toISOString(),
      },
    ]);

    setInput("");
  };

  /* ---------------- SMART AUTO SCROLL ---------------- */
  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;

    const nearBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 120;

    if (nearBottom) {
      box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const isPartnerOnline = online.includes(partnerId);

  if (!partnerId)
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        Invalid chat link
      </div>
    );

  /* ---------------- UI ---------------- */
  return (
    <div className="h-screen bg-black text-white flex">
      {/* SIDEBAR */}
      <div className="hidden md:flex w-[380px] border-r border-gray-800">
        <ChatInboxPage />
      </div>

      {/* CHAT */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center gap-3 p-4 border-b border-gray-800 bg-gray-900">
          <button
            className="md:hidden p-2"
            onClick={() => router.push("/chat")}
          >
            <ArrowLeft />
          </button>

          <div className="w-10 h-10 rounded-full bg-emerald-400 text-black flex items-center justify-center font-bold">
            {partner?.name?.[0]?.toUpperCase() ?? "U"}
          </div>

          <div>
            <div className="font-semibold">{partner?.name}</div>
            <div className="text-xs text-gray-400">
              {isPartnerOnline ? "Online" : "Offline"}
            </div>
          </div>
        </header>

        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto p-4 bg-gray-950"
        >
          {loading ? (
            <p className="text-center text-gray-400">Loading…</p>
          ) : (
            messages.map((m, i) => {
              const isMe = m.sender._id === myId;

              const showDate =
                i === 0 ||
                new Date(messages[i - 1].createdAt).toDateString() !==
                  new Date(m.createdAt).toDateString();

              return (
                <div key={m._id} className="mb-4">
                  {showDate && (
                    <div className="flex justify-center mb-3">
                      <span className="px-3 py-1 text-xs rounded bg-gray-800">
                        {formatDateLabel(m.createdAt)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`px-4 py-2 rounded-2xl max-w-[75%] ${
                        isMe
                          ? "bg-emerald-500 text-black"
                          : "bg-gray-800 text-white"
                      }`}
                    >
                      <div className="text-sm">{m.message}</div>
                      <div className="text-[10px] text-right mt-1 opacity-70">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* INPUT */}
        <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-2 rounded-full bg-gray-800 outline-none"
            placeholder={socketReady ? "Write a message…" : "Connecting…"}
            disabled={!socketReady}
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
