"use client";

import { useEffect, useState, useContext } from "react";
import { AdminSocketContext } from "../layout";
import toast from "react-hot-toast";

interface ProjectType {
  _id: string;
  title: string;
  client: { name: string; email: string } | null;
  developer?: { name: string; email: string } | null;
  status: string;
  deadline?: string | null;
  requirements?: string[] | string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* ---------------------------------------------------
   COOKIE-BASED secure fetch
--------------------------------------------------- */
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const res = await fetch(url, {
    ...options,
    credentials: "include",       // 🔥 COOKIE AUTH
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(txt || res.statusText);
  }

  return res.json();
};

export default function AdminProjectsPage() {
  const socket = useContext(AdminSocketContext);

  const [projects, setProjects] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  /* ---------------------------------------------------
     Load all projects (Admin only)
--------------------------------------------------- */
  const loadProjects = async () => {
    try {
      setLoading(true);

      const data = await fetchWithAuth(
        `${API_URL}/api/admin/projects?page=${page}&limit=20&search=${encodeURIComponent(
          search
        )}`
      );

      setProjects(data.projects || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [page, search]);

  /* ---------------------------------------------------
     Socket Listeners (real-time sync)
--------------------------------------------------- */
  useEffect(() => {
    if (!socket) return;

    const handleNew = (proj: ProjectType) => {
      setProjects((prev) => [proj, ...prev]);
      setTotal((t) => t + 1);
      toast.success(`New project: ${proj.title}`);
    };

    const handleUpdate = (proj: ProjectType) => {
      setProjects((prev) => prev.map((p) => (p._id === proj._id ? proj : p)));
    };

    const handleDelete = (id: string) => {
      setProjects((prev) => prev.filter((p) => p._id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Project deleted");
    };

    socket.on("project:new", handleNew);
    socket.on("project:update", handleUpdate);
    socket.on("project:deleted", handleDelete);

    return () => {
      socket.off("project:new", handleNew);
      socket.off("project:update", handleUpdate);
      socket.off("project:deleted", handleDelete);
    };
  }, [socket]);

  const totalPages = Math.ceil(total / 20);

  /* ---------------------------------------------------
     Delete Project
--------------------------------------------------- */
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project permanently?")) return;

    try {
      const res = await fetchWithAuth(`${API_URL}/api/admin/projects/${id}`, {
        method: "DELETE",
      });

      toast.success("Project deleted");

      setProjects((prev) => prev.filter((p) => p._id !== id));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* ---------------------------------------------------
     UI Rendering
--------------------------------------------------- */
  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-emerald-400">
        📂 Manage All Projects
      </h1>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by title, client, developer..."
        className="w-full md:w-1/3 p-2 mb-4 rounded bg-gray-800 border border-gray-700"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="bg-gray-900 rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-800 text-emerald-400">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Client</th>
              <th className="p-3">Developer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Deadline</th>
              <th className="p-3">Requirements</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p._id} className="border-b border-gray-800">
                  <td className="p-3 font-semibold">{p.title}</td>

                  <td className="p-3">
                    {p.client?.name || "—"}
                    <div className="text-xs text-gray-500">{p.client?.email}</div>
                  </td>

                  <td className="p-3">
                    {p.developer?.name || "Unassigned"}
                    {p.developer?.email && (
                      <div className="text-xs text-gray-500">
                        {p.developer.email}
                      </div>
                    )}
                  </td>

                  <td className="p-3 capitalize">{p.status}</td>

                  <td className="p-3">
                    {p.deadline
                      ? new Date(p.deadline).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-3">
                    {Array.isArray(p.requirements)
                      ? p.requirements.join(", ")
                      : p.requirements || "—"}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50"
          >
            ⬅ Prev
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-gray-800 rounded disabled:opacity-50"
          >
            Next ➡
          </button>
        </div>
      )}
    </div>
  );
}
