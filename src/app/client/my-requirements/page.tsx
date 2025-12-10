"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

export default function MyRequirements() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    charges: "",
    deadline: "",
  });

  const token = Cookies.get("token") || "";
  const socketRef = useRef<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const rawUser = JSON.parse(Cookies.get("user") || "{}");
    const myId = rawUser._id || rawUser.id;

    axios
      .get(`${API_URL}/api/requirements`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setRequirements(
          res.data.filter(
            (r: any) => String(r.client?._id || r.client) === String(myId)
          )
        );
      })
      .catch(console.error);

    socketRef.current = io(API_URL, { auth: { token } });

    socketRef.current.on("requirementUpdated", (updated: any) => {
      if (String(updated.client?._id || updated.client) === String(myId)) {
        setRequirements((prev) =>
          prev.map((r) => (r._id === updated._id ? updated : r))
        );
        toast.success("Your requirement was updated");
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [token, API_URL]);

  // ✅ Delete logic
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this requirement?")) return;

    try {
      await axios.delete(`${API_URL}/api/requirements/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequirements((prev) => prev.filter((r) => r._id !== id));
      toast.success("Requirement deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete requirement");
    }
  };

  // ✅ Start editing
  const startEdit = (r: any) => {
    setEditingId(r._id);
    setEditData({
      title: r.title,
      description: r.description,
      charges: r.charges,
      deadline: r.deadline ? r.deadline.split("T")[0] : "",
    });
  };

  // ✅ Save edit
  const handleEditSave = async (id: string) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/requirements/${id}`,
        editData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRequirements((prev) =>
        prev.map((r) => (r._id === id ? res.data : r))
      );
      setEditingId(null);
      toast.success("Requirement updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update requirement");
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white mt-20">
      <h1 className="text-2xl font-bold mb-4">My Requirements</h1>
      <div className="space-y-4">
        {requirements.length === 0 ? (
          <p className="text-gray-400">No requirements posted yet.</p>
        ) : (
          requirements.map((r) => (
            <div key={r._id} className="bg-gray-800 p-4 rounded">
              {editingId === r._id ? (
                <>
                  {/* Editable form */}
                  <input
                    className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                    value={editData.title}
                    onChange={(e) =>
                      setEditData({ ...editData, title: e.target.value })
                    }
                  />
                  <textarea
                    className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                    value={editData.charges}
                    onChange={(e) =>
                      setEditData({ ...editData, charges: e.target.value })
                    }
                  />
                  <input
                    type="date"
                    className="w-full p-2 mb-2 rounded bg-gray-700 text-white"
                    value={editData.deadline}
                    onChange={(e) =>
                      setEditData({ ...editData, deadline: e.target.value })
                    }
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(r._id)}
                      className="px-3 py-1 bg-green-600 rounded text-white text-sm hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-gray-600 rounded text-white text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Display mode */}
                  <h2 className="font-semibold">{r.title}</h2>
                  <p className="text-sm text-gray-300">{r.description}</p>
                  <p className="mt-2 text-sm text-yellow-300">
                    Charges: ₹{r.charges}
                  </p>
                  <p className="text-sm text-blue-300">
                    Deadline:{" "}
                    {r.deadline
                      ? new Date(r.deadline).toLocaleDateString()
                      : "Not set"}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">Status: {r.status}</p>
                  {r.status === "accepted" && (
                    <p className="text-sm text-green-300">
                      Accepted by {r.developer?.name}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => startEdit(r)}
                      className="px-3 py-1 bg-blue-600 rounded text-white text-sm hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(r._id)}
                      className="px-3 py-1 bg-red-600 rounded text-white text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
