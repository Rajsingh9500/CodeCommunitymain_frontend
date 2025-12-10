"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState, createContext, useRef } from "react";
import { Menu, X } from "lucide-react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

export const AdminSocketContext = createContext<Socket | null>(null);

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const validated = useRef(false);

  /* ---------------------------------------------------------
     AUTH CHECK (COOKIE-BASED)
  --------------------------------------------------------- */
  useEffect(() => {
    if (validated.current) return;
    validated.current = true;

    const validate = async () => {
      try {
        // Hit auth/me using cookies
        const res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.user) {
          toast.error("Please login first");
          return router.replace("/login");
        }

        // Only admin + superadmin can access
        if (!["admin", "superadmin"].includes(data.user.role)) {
          toast.error("Access denied");
          return router.replace("/dashboard");
        }

        // SOCKET (COOKIE AUTH)
        if (!socketRef.current) {
          socketRef.current = io(API_URL, {
            withCredentials: true,
            transports: ["websocket"],
            path: "/socket.io/",
            autoConnect: true,
          });

          socketRef.current.on("connect", () => {
            console.log("Admin socket connected:", socketRef.current?.id);
          });

          socketRef.current.on("connect_error", (err) => {
            console.warn("Socket error:", err.message);
          });
        }
      } catch (err) {
        return router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, [router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );

  /* ---------------------------------------------------------
     SIDEBAR NAV ITEMS
  --------------------------------------------------------- */
  const navItems = [
    { name: "Users", path: "/admin/users", icon: "👤" },
    { name: "Projects", path: "/admin/projects", icon: "📂" },
    { name: "Notifications", path: "/admin/notifications", icon: "🔔" },
    { name: "Analytics", path: "/admin/analytics", icon: "📊" },
  ];

  return (
    <AdminSocketContext.Provider value={socketRef.current}>
      <div className="flex bg-gray-900 text-white min-h-screen pt-[65px]">

        {/* SIDEBAR */}
        <aside
          className={`
            fixed lg:static left-0 top-[60px]
            w-64 h-[calc(100vh-80px)]
            bg-gray-800 shadow-xl z-40
            transform transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-64 lg:translate-x-0"}
          `}
        >
          <div className="p-5 flex flex-col h-full justify-between overflow-y-auto">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-emerald-400">⚡ Admin</h2>

                <Link
                  href="/admin"
                  className="inline-block text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 
                          rounded-md text-gray-200 transition"
                >
                  ← Admin Home
                </Link>
              </div>

              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                      pathname === item.path
                        ? "bg-emerald-500 text-black font-semibold"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    {item.icon} {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="text-xs text-gray-400">Admin Panel • v1.0</div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="flex-1 px-6 py-6 overflow-y-auto relative">

          {/* MOBILE BUTTON */}
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden fixed top-[70px] right-4 bg-gray-800 hover:bg-gray-700 
                       text-white px-4 py-2 rounded-lg shadow-md border border-gray-700 z-50
                       flex items-center gap-2"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-sm">Sidebar</span>
          </button>

          {children}
        </main>
      </div>
    </AdminSocketContext.Provider>
  );
}
