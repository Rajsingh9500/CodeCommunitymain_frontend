"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type UserType = {
  _id: string;
  name: string;
  email: string;
  role: string;
  photo?: string;
};

export default function AllUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [connected, setConnected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /* ----------------------------------
      LOAD ALL USERS
  ---------------------------------- */
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/public/all`, {
        credentials: "include",
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Users load error:", err);
    }
  };

  /* ----------------------------------
      LOAD MY CONNECTIONS
  ---------------------------------- */
  const loadConnections = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connections/list`, {
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        setConnected(data.connections.map((u: any) => u._id));
      }
    } catch (err) {
      console.error("Connections load error:", err);
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadUsers(), loadConnections()]);
      setLoading(false);
    })();
  }, []);

  /* ----------------------------------
      CONNECT USER
  ---------------------------------- */
  const handleConnect = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/api/connections/add/${id}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Connected!");
        setConnected((prev) => [...prev, id]);
      } else {
        toast.error(data.message || "Failed to connect");
      }
    } catch {
      toast.error("Connection failed");
    }
  };

  /* ----------------------------------
      UI
  ---------------------------------- */
  return (
    <div className="min-h-screen bg-black text-white pt-24 px-6">

      {/* 🔙 BACK BUTTON */}
      <button
        onClick={() => router.back()}
        className=" px-4 py-2 rounded-lg bg-gray-900/60 backdrop-blur-xl 
                   border border-gray-700 hover:bg-gray-800 text-gray-300 text-sm 
                   shadow-md hover:shadow-emerald-500/20 transition-all"
      >
        ← Back
      </button>

      {/* PAGE TITLE */}
      <h1 className="text-3xl font-extrabold mb-10 text-center bg-gradient-to-r from-emerald-400 to-cyan-400 text-transparent bg-clip-text">
        Discover Developers & Clients
      </h1>

      {loading ? (
        <div className="text-gray-400 text-center">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-gray-400 text-center">No users available</div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {users.map((u) => {
            const isConnected = connected.includes(u._id);

            return (
              <div
                key={u._id}
                className="bg-gray-900/50 border border-gray-400 rounded-2xl p-6 flex flex-col 
                        items-center shadow-xl hover:shadow-emerald-500/30 transition-transform hover:scale-105"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 
                             flex items-center justify-center text-black text-xl font-extrabold mb-4">
                  {u.name.charAt(0).toUpperCase()}
                </div>

                <div className="text-lg font-bold">{u.name}</div>
                <div className="text-xs text-gray-400">{u.role.toUpperCase()}</div>
                <div className="mt-1 text-xs text-gray-500 truncate">{u.email}</div>

                <div className="flex justify-between w-full mt-5">
                  <Link
                    href={`/profile/${u._id}`}
                    className="text-cyan-400 text-sm hover:underline"
                  >
                    View Profile
                  </Link>

                  {isConnected ? (
                    <span className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded">
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConnect(u._id)}
                      className="px-3 py-1 text-xs bg-emerald-500 text-black rounded hover:bg-emerald-400"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
