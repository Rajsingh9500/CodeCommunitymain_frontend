"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useChatGlobal } from "@/app/providers/ChatProvider";
import ChatInboxPage from "../page";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  const partnerId = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string);

  const { socket, socketReady, currentUser, ready } = useChatGlobal();

  const [partner, setPartner] = useState<UserMini | null>(null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const partnerRef = useRef<string | null>(partnerId);

  /* ---------------------------
     Ask notification permission once
  --------------------------- */
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  /* ---------------------------
     Date label helper
  --------------------------- */
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString())
      return "Yesterday";

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  /* ---------------------------
     Defensive normalization
  --------------------------- */
  const asString = (v: any) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (v._id) return String(v._id);
    if (v.id) return String(v.id);
    if (v.user && (v.user._id || v.user.id))
      return String(v.user._id ?? v.user.id);
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
    const createdAt =
      raw?.createdAt && !isNaN(Date.parse(raw.createdAt))
        ? new Date(raw.createdAt).toISOString()
        : new Date().toISOString();

    return {
      _id: raw?._id?.toString() ?? raw?.tempId ?? `tmp-${Date.now()}`,
      sender: {
        _id: asString(raw?.sender ?? raw?.from),
        name: asName(raw?.sender ?? raw?.from),
      },
      receiver: {
        _id: asString(raw?.receiver ?? raw?.to),
        name: asName(raw?.receiver ?? raw?.to),
      },
      message: raw?.message ?? raw?.text ?? "",
      createdAt,
      tempId: raw?.tempId ?? null,
    };
  };

  /* ---------------------------
     Upsert message
  --------------------------- */
  const upsertMessage = (raw: any) => {
    const incoming = normalizeMessage(raw);

    setMessages((prev) => {
      const list = [...prev];

      if (incoming.tempId) {
        const i = list.findIndex(
          (m) => m._id === incoming.tempId || m.tempId === incoming.tempId
        );
        if (i !== -1) {
          list[i] = { ...incoming, tempId: null };
          return list;
        }
      }

      if (list.some((m) => m._id === incoming._id)) return prev;

      return [...list, incoming].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
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

    const onOnline = (id: string) =>
      setOnline((p) => [...new Set([...p, id])]);
    const onOffline = (id: string) =>
      setOnline((p) => p.filter((x) => x !== id));

    socket.on("userOnline", onOnline);
    socket.on("userOffline", onOffline);
socket.on("onlineUsers", (list: unknown) => {
  if (Array.isArray(list)) {
    setOnline(list.map(String));
  } else {
    setOnline([]);
  }
});

    socket.emit("getOnlineUsers");

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

    (async () => {
      setLoading(true);
      try {
        const users = await fetch(`${API_URL}/api/chat/users`, {
          credentials: "include",
        }).then((r) => r.json());

        setPartner(
          users.find((u: UserMini) => String(u._id) === String(partnerId)) ??
            null
        );

        const raw = await fetch(
          `${API_URL}/api/chat/messages/${partnerId}`,
          { credentials: "include" }
        ).then((r) => r.json());

        setMessages(raw.map(normalizeMessage));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, partnerId]);

  /* ---------------------------
     Mark messages as read
  --------------------------- */
  useEffect(() => {
    if (!partnerId) return;

    fetch(`${API_URL}/api/chat/mark-read/${partnerId}`, {
      method: "PUT",
      credentials: "include",
    });
  }, [partnerId]);

  /* ---------------------------
     Receive socket messages
  --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (raw: any) => {
      const msg = normalizeMessage(raw);
      if (
        msg.sender._id !== partnerRef.current &&
        msg.receiver._id !== partnerRef.current
      )
        return;

      upsertMessage(raw);
    };

    socket.on("receiveMessage", onReceive);
    return () => socket.off("receiveMessage", onReceive);
  }, [socket]);

  /* ---------------------------
     Notification popup
  --------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onNotify = (data: any) => {
      if (String(data.from) === String(partnerRef.current)) return;
      if (Notification.permission === "granted") {
        new Notification(data.fromName || "New message", {
          body: data.message,
        });
      }
    };

    socket.on("newMessageNotification", onNotify);
    return () => socket.off("newMessageNotification", onNotify);
  }, [socket]);

  /* ---------------------------
     Send message
  --------------------------- */
  const handleSend = () => {
    if (!input.trim() || !socket || !socketReady || !currentUser) return;

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
        sender: { _id: String(currentUser._id), name: currentUser.name },
        receiver: { _id: String(partnerId), name: partner?.name },
        message: input,
        createdAt: new Date().toISOString(),
      },
    ]);

    setInput("");
  };

  /* ---------------------------
     Auto scroll
  --------------------------- */
  useEffect(() => {
    const box = messagesRef.current;
    if (!box) return;

    const nearBottom =
      box.scrollHeight - box.scrollTop - box.clientHeight < 120;

    if (nearBottom) {
      box.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const isPartnerOnline = online.some(
    (id) => String(id) === String(partnerId)
  );

  if (!partnerId)
    return (
      <div className="h-screen flex items-center justify-center text-red-400">
        Invalid chat link
      </div>
    );

  return (
    <div className="h-screen bg-black text-white flex">
      {/* SIDEBAR (DESKTOP) */}
      <div className="hidden md:flex w-[380px] border-r border-gray-800">
        <ChatInboxPage />
      </div>

      {/* CHAT WINDOW */}
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
              const isMe =
                String(m.sender._id) ===
                String(currentUser?._id ?? currentUser?.id);

              const showDate =
                i === 0 ||
                new Date(messages[i - 1].createdAt).toDateString() !==
                  new Date(m.createdAt).toDateString();

              return (
                <div key={m._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="px-3 py-1 text-xs rounded bg-gray-800">
                        {formatDateLabel(m.createdAt)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
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

        <div className="p-4 border-t border-gray-800 bg-gray-900 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 px-4 py-2 rounded-full bg-gray-800 outline-none"
            placeholder={
              socketReady ? "Write a message…" : "Connecting…"
            }
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
