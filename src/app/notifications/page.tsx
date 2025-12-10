"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Trash2 } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

type Notif = {
  _id: string;
  message: string;
  userEmail?: string;
  link?: string | null;
  read?: boolean;
  createdAt?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const mountedRef = useRef(true);
  const router = useRouter();

  const fetchPage = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const token = Cookies.get("token");
        if (!token) return;
        const res = await fetch(`${API_URL}/api/notifications?page=${p}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (!data) throw new Error("Invalid response");
        // Expecting { notifications, page, totalPages }
        setNotifications(data.notifications || []);
        setPage(data.page || p);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error("fetch notifications error", err);
        toast.error("Could not load notifications");
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchPage(1);

    // socket reuse:
    const token = Cookies.get("token");
    if (token) {
      const existing = (window as any).__cc_socket as Socket | undefined;
      let s: Socket;
      if (existing && existing.connected) {
        s = existing;
      } else {
        s = io(API_URL, { withCredentials: true, transports: ["websocket", "polling"], autoConnect: false });
        s.auth = { token };
        s.connect();
        (window as any).__cc_socket = s;
      }
      setSocket(s);

      const onNew = (n: Notif) => {
        // show on top
        setNotifications((prev) => [n, ...prev]);
      };
      const onDeleted = ({ id }: { id: string }) => {
        setNotifications((prev) => prev.filter((x) => x._id !== id));
      };
      const onRead = (n: Notif) => {
        setNotifications((prev) => prev.map((x) => (x._id === n._id ? n : x)));
      };

      s.on("notification:new", onNew);
      s.on("notification:deleted", onDeleted);
      s.on("notification:read", onRead);
      s.on("admin:notification", onNew);

      return () => {
        mountedRef.current = false;
        s.off("notification:new", onNew);
        s.off("notification:deleted", onDeleted);
        s.off("notification:read", onRead);
      };
    }

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const token = Cookies.get("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setNotifications((prev) => prev.map((n) => (n._id === id ? data.notification : n)));
    } catch (err) {
      console.error("mark read", err);
      toast.error("Could not mark read");
    }
  };

  const deleteNotif = async (id: string) => {
    try {
      const token = Cookies.get("token");
      if (!token) return;
      const res = await fetch(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error("delete notif", err);
      toast.error("Could not delete");
    }
  };

  const handleClick = async (n: Notif) => {
    // deep link if present
    if (n.link) {
      router.push(n.link);
      // optimistic mark
      setNotifications((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      await markAsRead(n._id);
      return;
    }
    // else toggle read
    if (!n.read) await markAsRead(n._id);
  };

  const goPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    fetchPage(p);
  };

  return (
    <div className="p-6 pt-24 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>

        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchPage(1)} className="px-3 py-1 bg-gray-800 rounded text-sm">
              Refresh
            </button>
            <button onClick={() => goPage(page - 1)} disabled={page <= 1} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">
              Prev
            </button>
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages} className="px-3 py-1 bg-gray-800 rounded text-sm disabled:opacity-50">
              Next
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {loading && <div className="text-sm text-gray-400">Loading...</div>}
          {!loading && notifications.length === 0 && <div className="text-sm text-gray-400">No notifications</div>}

          {notifications.map((n) => (
            <div key={n._id} className={`p-4 rounded border ${n.read ? "bg-gray-800/30" : "bg-gray-900"} flex justify-between items-start`}>
              <div className="flex-1 pr-4 cursor-pointer" onClick={() => handleClick(n)}>
                <div className="text-sm text-gray-100">{n.message}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt || Date.now()).toLocaleString()}</div>
                {n.link && <div className="text-xs text-cyan-400 mt-1">Go to: {n.link}</div>}
              </div>

              <div className="flex flex-col items-end gap-2">
                {!n.read ? (
                  <button title="Mark read" onClick={() => markAsRead(n._id)} className="p-1 rounded bg-emerald-500 text-black">
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button title="Delete" onClick={() => deleteNotif(n._id)} className="p-1 rounded bg-red-600 text-white">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* simple numeric paginator */}
        <div className="mt-6 flex justify-center gap-2 items-center">
          <button onClick={() => goPage(1)} disabled={page === 1} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">First</button>
          <button onClick={() => goPage(page - 1)} disabled={page === 1} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">Prev</button>
          <div className="px-3 py-1 text-sm text-gray-300">{page}</div>
          <button onClick={() => goPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">Next</button>
          <button onClick={() => goPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50">Last</button>
        </div>
      </div>
    </div>
  );
}
