"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

export default function DeveloperFeed() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const token = Cookies.get("token") || "";
  const socketRef = useRef<any>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  useEffect(() => {
    // fetch existing
    axios
      .get(`${API_URL}/api/requirements`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setRequirements(res.data))
      .catch((err) => console.error(err));

    // init socket
    socketRef.current = io(API_URL, { auth: { token } });

    socketRef.current.on("requirementPosted", (req: any) => {
      setRequirements((prev) => [req, ...prev]);
      toast.success("New requirement posted");
    });

    socketRef.current.on("requirementUpdated", (updated: any) => {
      setRequirements((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      toast.success("Requirement updated");
    });

    return () => socketRef.current.disconnect();
  }, [token]);

  const handleAction = async (id: string, action: "accept" | "reject") => {
    try {
      const res = await axios.put(`${API_URL}/api/requirements/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // server emits requirementUpdated; we can also emit locally
      socketRef.current.emit("updateRequirement", res.data);
      toast.success(`Requirement ${action}ed`);
    } catch (err) {
      console.error(err);
      toast.error("Action failed");
    }
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white mt-20">
      <h1 className="text-2xl font-bold mb-4">Requirements Feed</h1>
      <div className="space-y-4">
        {requirements.map((r) => (
          <div key={r._id} className="bg-gray-800 p-4 rounded">
            <h2 className="font-semibold">{r.title}</h2>
            <p className="text-sm text-gray-300">{r.description}</p>
            <p className="text-xs text-gray-400 mt-2">Client: {r.client?.name || "Unknown"}</p>
            <p className="text-xs text-gray-400">Status: {r.status}</p>

            {r.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <button onClick={() => handleAction(r._id, "accept")} className="px-3 py-1 bg-green-600 rounded">Accept</button>
                <button onClick={() => handleAction(r._id, "reject")} className="px-3 py-1 bg-red-600 rounded">Reject</button>
              </div>
            )}
            {r.status === "accepted" && r.developer && (
              <div className="mt-2 text-sm text-green-300">Accepted by {r.developer?.name}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
