"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";

import {
  Menu,
  X,
  User,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Bell,
  Trash2,
  Check,
} from "lucide-react";

import { getSocket } from "@/lib/socket";
import { useAuth } from "@/app/providers/AuthProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Notif = {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, loading } = useAuth();

  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const [userMenu, setUserMenu] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement | null>(null);
  const userRef = useRef<HTMLDivElement | null>(null);

  /* --------------------------------------------------------
     Load Notifications
  -------------------------------------------------------- */
  const loadNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.notifications) {
        setNotifs(data.notifications);
        setUnread(data.notifications.filter((n: any) => !n.read).length);
      }
    } catch {}
  }, [user]);

  /* --------------------------------------------------------
     Socket Notifications
  -------------------------------------------------------- */
  const handleIncomingNotif = useCallback((n: Notif) => {
    setNotifs((prev) => [n, ...prev]);
    setUnread((u) => u + 1);
    toast("New Notification 🔔");
  }, []);

  useEffect(() => {
    if (!user) return;

    const s = getSocket();
    if (!s) return;

    void loadNotifs();

    const listener = (notif: Notif) => handleIncomingNotif(notif);

    s.on("notification:new", listener);

    return () => {
      try {
        s.off("notification:new", listener);
      } catch {}
    };
  }, [user, loadNotifs, handleIncomingNotif]);

  /* --------------------------------------------------------
     Mark One Read
  -------------------------------------------------------- */
  const markAsRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));

    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
  };

  /* --------------------------------------------------------
     Mark All Read
  -------------------------------------------------------- */
  const markAllAsRead = async () => {
    if (notifs.length === 0) return;

    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);

    await fetch(`${API_URL}/api/notifications/read-all`, {
      method: "PATCH",
      credentials: "include",
    });
  };

  /* --------------------------------------------------------
     Delete One
  -------------------------------------------------------- */
  const deleteNotif = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n._id !== id));

    await fetch(`${API_URL}/api/notifications/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
  };

  /* --------------------------------------------------------
     Outside Click Close
  -------------------------------------------------------- */
  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;

      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(t)) setUserMenu(false);
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  /* --------------------------------------------------------
     Close Menus on Page Change
  -------------------------------------------------------- */
  useEffect(() => {
    setMobileOpen(false);
    setNotifOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const isReady = !loading && user;

  return (
    <header className="fixed top-0 left-0 w-full px-4 py-3 bg-black/80 border-b border-gray-800 backdrop-blur-xl z-[100]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">

        {/* LOGO */}
        <Link href={isReady ? "/home" : "/"}>
          <Image
            src="/logos/CodeCommunity.png"
            alt="logo"
            width={140}
            height={50}
            priority
            className="opacity-90 hover:opacity-100 transition"
          />
        </Link>

        {/* DESKTOP NAVIGATION */}
        {isReady && (
          <nav className="hidden lg:flex items-center gap-6 font-medium">
            {[
              { label: "Home", href: "/home" },
              { label: "Developers", href: "/developers" },
              { label: "Users", href: "/users" },
              { label: "Chat", href: "/chat" },
              { label: "About", href: "/about" },
              { label: "Contact", href: "/contact" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-gray-300 hover:text-white transition 
                  after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-emerald-400
                  after:w-0 hover:after:w-full after:transition-all
                  ${pathname === item.href ? "after:w-full text-white" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* RIGHT SIDE BUTTONS */}
        <div className="flex items-center gap-4">

          {/* 🔔 NOTIFICATION BELL */}
          {isReady && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((p) => !p)}
                className="p-2 rounded hover:bg-gray-800/60 transition relative"
              >
                <Bell className="w-6 h-6 text-gray-300" />

                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white 
                                   text-xs rounded-full flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </button>

              {/* DROPDOWN */}
              {notifOpen && (
                <>
                  {/* DESKTOP DROPDOWN */}
                  <div 
                    className="
                      hidden md:block
                      absolute top-10 right-0
                      w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-[200]
                    "
                  >
                    <div className="flex justify-between text-sm text-gray-300 p-3 border-b border-gray-700">
                      <span>Notifications</span>

                      <div className="flex items-center gap-3">
                        {unread > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-emerald-400 text-xs hover:underline"
                          >
                            Mark all read
                          </button>
                        )}

                        <Link href="/notifications" className="text-cyan-400 text-xs">
                          View All
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="text-gray-400 text-sm p-3">No notifications</p>
                      ) : (
                        notifs.map((n) => (
                          <div 
                            key={n._id}
                            className={`p-3 border-b border-gray-800 last:border-none flex justify-between ${
                              n.read ? "bg-gray-800/40" : "bg-gray-800"
                            }`}
                          >
                            <div className="pr-2">
                              <p className="text-white text-sm">{n.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>

                            {!n.read ? (
                              <Check
                                className="text-emerald-400 cursor-pointer"
                                onClick={() => markAsRead(n._id)}
                              />
                            ) : (
                              <Trash2
                                className="text-red-400 cursor-pointer"
                                onClick={() => deleteNotif(n._id)}
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* MOBILE DROPDOWN */}
                  <div 
                    className="
                      md:hidden
                      fixed top-20 left-1/2 -translate-x-1/2
                      w-[90%] bg-gray-900 border border-gray-700 rounded-xl shadow-xl z-[999]
                    "
                  >
                    <div className="flex justify-between text-sm text-gray-300 p-3 border-b border-gray-700">
                      <span>Notifications</span>

                      <div className="flex items-center gap-3">
                        {unread > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-emerald-400 text-xs hover:underline"
                          >
                            Mark all read
                          </button>
                        )}

                        <Link href="/notifications" className="text-cyan-400 text-xs">
                          View All
                        </Link>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <p className="text-gray-400 text-sm p-4 text-center">No notifications</p>
                      ) : (
                        notifs.map((n) => (
                          <div 
                            key={n._id}
                            className={`p-4 border-b border-gray-800 last:border-none flex justify-between ${
                              n.read ? "bg-gray-800/40" : "bg-gray-800"
                            }`}
                          >
                            <div className="pr-2">
                              <p className="text-white text-sm">{n.message}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(n.createdAt).toLocaleString()}
                              </p>
                            </div>

                            {!n.read ? (
                              <Check
                                className="text-emerald-400 cursor-pointer"
                                onClick={() => markAsRead(n._id)}
                              />
                            ) : (
                              <Trash2
                                className="text-red-400 cursor-pointer"
                                onClick={() => deleteNotif(n._id)}
                              />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* USER MENU */}
          {isReady ? (
            <div className="relative hidden lg:block" ref={userRef}>
              <button
                onClick={() => setUserMenu((p) => !p)}
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-emerald-400 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black font-bold">
                  {user.name[0].toUpperCase()}
                </div>
                <span className="text-white">{user.name}</span>
                <ChevronDown className="text-gray-400" />
              </button>

              {userMenu && (
                <div className="absolute top-12 right-0 w-56 bg-gray-900 border border-gray-700 p-2 rounded-xl shadow-xl z-[200]">
                  <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded">
                    <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                    Dashboard
                  </Link>

                  <Link href="/profile" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded">
                    <User className="w-4 h-4 text-cyan-400" />
                    Profile
                  </Link>

                  <button
                    onClick={async () => {
                      await fetch(`${API_URL}/api/auth/logout`, {
                        method: "POST",
                        credentials: "include",
                      });
                      setUser(null);
                      router.replace("/login");
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-10 h-8 bg-gray-700 animate-pulse rounded-xl" />
          )}

          {/* MOBILE MENU BUTTON */}
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded hover:bg-gray-800/60">
            <Menu className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* MOBILE SIDEBAR */}
     {/* MOBILE SIDEBAR */}
{mobileOpen && (
  <>
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[140]"
      onClick={() => setMobileOpen(false)}
    />

    <aside className="fixed top-0 left-0 w-[78%] max-w-xs h-full bg-[#0d0d0e] border-r border-gray-800 p-6 z-[150] shadow-xl">
      <div className="flex justify-between items-center mb-8">
        <Image src="/logos/CodeCommunity.png" width={130} height={40} alt="logo" />
        <button onClick={() => setMobileOpen(false)}>
          <X className="text-gray-400 hover:text-white w-7 h-7 transition" />
        </button>
      </div>

      {/* USER INFO (always show if user exists, no loading restriction) */}
      {user ? (
        <>
          <div className="flex items-center gap-4 bg-gray-900/60 border border-gray-700 p-4 rounded-2xl mb-8 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 
                            flex items-center justify-center text-black font-bold text-lg">
              {user.name[0].toUpperCase()}
            </div>

            <div>
              <p className="text-white font-semibold text-base">{user.name}</p>
              <p className="text-gray-400 text-sm capitalize">{user.role}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="text-gray-400 text-center py-4">Not logged in</div>
      )}

      {/* NAVIGATION (always visible) */}
      <nav className="flex bg-gray-900 p-3 border border-gray-600 rounded-2xl flex-col gap-2 text-gray-300">
        {[
          { path: "/home", label: "Home" },
          { path: "/developers", label: "Developers" },
          { path: "/users", label: "Users" },
          { path: "/chat", label: "Chat" },
          { path: "/about", label: "About" },
          { path: "/contact", label: "Contact" },
          { path: "/profile", label: "Profile" },
          { path: "/dashboard", label: "Dashboard" },
        ].map((item) => (
          <Link
            key={item.path}
            href={item.path}
            onClick={() => setMobileOpen(false)}
            className="px-4 py-3 rounded-xl border border-gray-800 hover:border-emerald-500 text-sm font-medium transition flex items-center justify-between"
          >
            <span>{item.label}</span>
            <ChevronDown className="w-4 h-4 opacity-40 rotate-[-90deg]" />
          </Link>
        ))}

        {/* LOGOUT BUTTON — NOW VISIBLE */}
        {user && (
          <button
            onClick={async () => {
              setMobileOpen(false);
              await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
              });
              setUser(null);
              router.replace("/login");
            }}
            className="px-4 py-3 rounded-xl border border-red-500 text-red-500 hover:bg-red-900/20 mt-3 text-sm font-semibold flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        )}
      </nav>
    </aside>
  </>
)}

    </header>
  );
}
