"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

interface Notif {
  _id: string;
  user: string;
  userEmail?: string;
  message: string;
  link?: string | null;
  type?: string;
  read?: boolean;
  createdAt: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [filtered, setFiltered] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [filter, setFilter] = useState<string>("all");

  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const listenerRef = useRef<((data: any) => void) | null>(null);

  /* ---------------- FETCH WITH COOKIE AUTH ---------------- */
  const fetchWithAuth = async (url: string, options: any = {}) => {
    const res = await fetch(url, {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed");
    return json;
  };

  /* ---------------- VERIFY ADMIN ---------------- */
  const verifyAdmin = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API_URL}/api/auth/me`);
      return data?.user?.role === "admin" || data?.user?.role === "superadmin";
    } catch {
      return false;
    }
  }, []);

  /* ---------------- LOAD NOTIFICATIONS ---------------- */
  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await fetchWithAuth(
        `${API_URL}/api/notifications/all?page=${p}&limit=20`
      );

      setNotifications(data.notifications);
      setPage(p);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ---------------- FILTER HANDLER ---------------- */
  const applyFilter = (type: string, list: Notif[]) => {
    if (type === "all") return list;
    return list.filter((n) => n.type === type);
  };

  useEffect(() => {
    setFiltered(applyFilter(filter, notifications));
  }, [filter, notifications]);

  /* ---------------- INITIAL LOAD + SOCKET ---------------- */
 useEffect(() => {
  let cleanup: (() => void) | null = null;

  const init = async () => {
    const ok = await verifyAdmin();
    if (!ok) {
      router.replace("/login");
      return;
    }

    await fetchPage(1);

    // Create global socket singleton
    if (!(window as any).__admin_socket) {
      (window as any).__admin_socket = io(API_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
    }

    socketRef.current = (window as any).__admin_socket;
    const s = socketRef.current;
    if (!s) return;

    // Strict TS-safe handler
    const onAdminNotif = (data: any) => {
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      }
    };

    // Save handler safely
    listenerRef.current = onAdminNotif;

    // Attach listener
    s.on("admin:notification:new", onAdminNotif);

    // Cleanup function
    cleanup = () => {
      const fn = listenerRef.current;
      if (fn) s.off("admin:notification:new", fn);
    };
  };

  init();

  // Strongly typed cleanup
  return () => {
    if (cleanup) cleanup();
  };
}, [verifyAdmin, fetchPage, router]);


  /* ---------------- DELETE SINGLE ---------------- */
  const deleteNotif = async (id: string) => {
    try {
      await fetchWithAuth(`${API_URL}/api/notifications/${id}`, {
        method: "DELETE",
      });
      setNotifications((prev) => prev.filter((x) => x._id !== id));
    } catch {
      toast.error("Failed to delete");
    }
  };

  /* ---------------- DELETE ALL ---------------- */
  const deleteAll = async () => {
    if (!confirm("⚠️ Delete ALL notifications?")) return;

    try {
      const deletePromises = notifications.map((n) =>
        fetchWithAuth(`${API_URL}/api/notifications/${n._id}`, {
          method: "DELETE",
        })
      );

      await Promise.all(deletePromises);

      setNotifications([]);
      toast.success("All notifications deleted");
    } catch {
      toast.error("Failed to delete all");
    }
  };

  return (
    <div className="p-8 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Admin Notifications
        </h1>

        <button
          onClick={deleteAll}
          className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700"
        >
          Delete All
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4 mb-6">
        {["all", "system", "chat", "alert", "hire"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-lg border ${
              filter === t
                ? "bg-emerald-500 text-black border-emerald-500"
                : "border-gray-600 bg-gray-900"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-500">No notifications found.</p>
      ) : (
        filtered.map((n) => (
          <div
            key={n._id}
            className="p-3 bg-gray-900 border border-gray-700 rounded-xl mb-4 shadow-md"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-semibold text-emerald-300">
                  [{n.type || "system"}]
                </p>
                <p className="text-sm">{n.message}</p>

                {n.userEmail && (
                  <p className="text-sm text-gray-400">
                    From: <span className="text-white">{n.userEmail}</span>
                  </p>
                )}

                <p className="text-sm text-gray-500 mt-1">
                  User ID: <span className="text-emerald-400">{n.user}</span>
                </p>

                <p className="text-xs text-gray-500 mt-2">
                  {new Date(n.createdAt).toLocaleString()}
                </p>

                
              </div>

              <button
                onClick={() => deleteNotif(n._id)}
                className=" p-3 bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => fetchPage(page - 1)}
            className="px-4 py-2 bg-gray-800 rounded disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-lg">{page} / {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => fetchPage(page + 1)}
            className="px-4 py-2 bg-gray-800 rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
