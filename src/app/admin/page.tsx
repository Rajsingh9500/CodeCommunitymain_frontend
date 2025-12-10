"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* Cookie-based fetch */
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(await res.text().catch(() => "Error"));
  return res.json();
};

interface StatsType {
  totalUsers: number;
  totalDevelopers: number;
  totalClients: number;
  totalAdmins: number;
  recentUsers: number;
}

export default function AdminHomePage() {
  const router = useRouter();

  const [role, setRole] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);

  /* -----------------------------------------------------
    1) VERIFY USER USING COOKIE TOKEN
  ----------------------------------------------------- */
  const verifyUser = useCallback(async () => {
    try {
      const data = await fetchWithAuth(`${API_URL}/api/auth/me`);

      if (!data?.user) return router.replace("/login");

      const r = data.user.role;
      setRole(r);

      if (!["admin", "superadmin"].includes(r)) {
        toast.error("Admins Only");
        return router.replace("/dashboard");
      }
    } catch (err) {
      router.replace("/login");
    }
  }, [router]);

  /* -----------------------------------------------------
    2) FETCH STATS FROM BACKEND (/api/stats)
  ----------------------------------------------------- */
  const fetchStats = useCallback(async () => {
  try {
    const data = await fetchWithAuth(`${API_URL}/api/stats`);

    if (data?.success) {
      setStats(data.stats);
    }
  } catch (err) {
    console.error("Stats fetch failed:", err);
  } finally {
    setLoading(false);
  }
}, []);


  /* -----------------------------------------------------
    3) RUN AUTH ON LOAD
  ----------------------------------------------------- */
  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  /* Load stats AFTER role is known */
  useEffect(() => {
    if (role === "admin" || role === "superadmin") fetchStats();
  }, [role, fetchStats]);

  /* -----------------------------------------------------
    4) SOCKET → AUTO REFRESH STATS
  ----------------------------------------------------- */
  useEffect(() => {
    if (!["admin", "superadmin"].includes(role || "")) return;

    let s: Socket;

    if ((window as any).__ADMIN_SOCKET) {
      s = (window as any).__ADMIN_SOCKET;
    } else {
      s = io(API_URL, {
        transports: ["websocket"],
        withCredentials: true,
      });
      (window as any).__ADMIN_SOCKET = s;
    }

    socketRef.current = s;

    const refresh = () => fetchStats();

    s.on("user:updated", refresh);
    s.on("user:deleted", refresh);
    s.on("project:deleted", refresh);
    s.on("admin:project:new", refresh);

    return () => {
      s.off("user:updated", refresh);
      s.off("user:deleted", refresh);
      s.off("project:deleted", refresh);
      s.off("admin:project:new", refresh);
    };
  }, [role, fetchStats]);

  /* -----------------------------------------------------
    5) LOADING UI
  ----------------------------------------------------- */
  if (loading || !stats)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading admin panel…
      </div>
    );

  /* -----------------------------------------------------
    6) PAGE UI
  ----------------------------------------------------- */
  return (
    <div className="p-4">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-400">⚙ Admin Control Panel</h1>
        <p className="text-gray-400 text-sm mt-2">Manage analytics & platform operations.</p>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        <StatCard title="Total Users" value={stats.totalUsers} bg="bg-emerald-600" />
        <StatCard title="Developers" value={stats.totalDevelopers} bg="bg-blue-500" />
        <StatCard title="Clients" value={stats.totalClients} bg="bg-yellow-400 text-black" />
        <StatCard title="Admins" value={stats.totalAdmins} bg="bg-purple-600" />
        <StatCard title="New Users (30d)" value={stats.recentUsers} bg="bg-gray-700" />
      </div>

      {/* ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard title="Manage Users" desc="View, update, delete users" icon="👤" onClick={() => router.push("/admin/users")} />
        <ActionCard title="Manage Projects" desc="Full control of projects" icon="📂" onClick={() => router.push("/admin/projects")} />
        <ActionCard title="Notifications" desc="Manage alerts" icon="🔔" onClick={() => router.push("/admin/notifications")} />
      </div>

      {/* SHOW ANALYTICS BUTTON */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={() => router.push("/admin/analytics")}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded-xl"
        >
          📊 View Full Analytics
        </button>
      </div>

    </div>
  );
}

/* -------------------- COMPONENTS -------------------- */

function StatCard({ title, value, bg }: any) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center text-white shadow-lg`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ActionCard({ title, desc, icon, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-gray-800 hover:bg-emerald-600 hover:text-black rounded-xl p-6 shadow-lg transition-all"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-300 text-sm">{desc}</p>
    </div>
  );
}
