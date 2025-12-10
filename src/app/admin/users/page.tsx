"use client";

import { useEffect, useState, useContext } from "react";
import { AdminSocketContext } from "../layout";
import toast from "react-hot-toast";

interface UserType {
  _id: string;
  name: string;
  email: string;
  role: "developer" | "client" | "admin" | "superadmin";
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ---------------------------------------------------
   COOKIE-BASED secure fetch
--------------------------------------------------- */
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    credentials: "include",        // 🔥 SEND COOKIE
    cache: "no-store",             // 🔥 FORCE FRESH RESPONSE
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(t || "Request failed");
  }

  return res.json();
};

export default function AdminUsersPage() {
  const socket = useContext(AdminSocketContext);

  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  /* ---------------------------------------------------
     LOAD USERS (cookie protected)
  --------------------------------------------------- */
  const loadUsers = async () => {
    try {
      setLoading(true);

      const data = await fetchWithAuth(
        `${API_URL}/api/admin/users?page=${page}&limit=20&search=${encodeURIComponent(
          search
        )}`
      );

      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page, search]);

  /* ---------------------------------------------------
     SOCKET LISTENERS (real-time updates)
  --------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const onUpdate = (u: UserType) =>
      setUsers((prev) => prev.map((x) => (x._id === u._id ? u : x)));

    const onDelete = (id: string) =>
      setUsers((prev) => prev.filter((x) => x._id !== id));

    socket.on("user:updated", onUpdate);
    socket.on("user:deleted", onDelete);

    return () => {
      socket.off("user:updated", onUpdate);
      socket.off("user:deleted", onDelete);
    };
  }, [socket]);

  const totalPages = Math.ceil(total / 20);

  /* ---------------------------------------------------
     DELETE USER
  --------------------------------------------------- */
  const handleDelete = async (user: UserType) => {
    if (!confirm(`Delete ${user.email}?`)) return;

    try {
      const data = await fetchWithAuth(
        `${API_URL}/api/admin/users/${user._id}`,
        { method: "DELETE" }
      );

      toast.success("User deleted");
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch {
      toast.error("Error deleting user");
    }
  };

  /* ---------------------------------------------------
     UPDATE ROLE
  --------------------------------------------------- */
  const handleRoleChange = async (user: UserType, newRole: string) => {
    try {
      const data = await fetchWithAuth(
        `${API_URL}/api/admin/users/update-role`,
        {
          method: "PUT",
          body: JSON.stringify({ id: user._id, role: newRole }),
        }
      );

      toast.success("Role updated");

      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, role: newRole as any } : u
        )
      );
    } catch {
      toast.error("Error updating role");
    }
  };

  /* ---------------------------------------------------
     UI
  --------------------------------------------------- */
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-emerald-400 mb-6">
        👤 Manage Users
      </h1>

      {/* SEARCH */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="w-full md:w-1/3 p-3 rounded bg-gray-800 border border-gray-700"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* USERS TABLE */}
      <div className="bg-gray-900 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-emerald-400">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="border-b border-gray-800">
                  <td className="p-3">{u.name}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3 capitalize">{u.role}</td>

                  <td className="p-3 flex gap-3">
                    {u.role !== "superadmin" && (
                      <>
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => handleRoleChange(u, "admin")}
                            className="bg-emerald-500 text-black px-3 py-1 rounded"
                          >
                            Make Admin
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(u, "developer")}
                            className="bg-yellow-400 text-black px-3 py-1 rounded"
                          >
                            Revoke Admin
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(u)}
                          className="bg-red-500 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 bg-gray-700 rounded"
          >
            Prev
          </button>

          <span className="text-gray-300">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 bg-gray-700 rounded"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
