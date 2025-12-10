"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function EditRequirementPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [charges, setCharges] = useState("");
  const [deadline, setDeadline] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const getToken = () => Cookies.get("token") || localStorage.getItem("token") || "";

  // ✅ Fetch requirement details safely
  useEffect(() => {
    const fetchRequirement = async () => {
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/api/requirements/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const text = await res.text(); // safe read
        let data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          console.error("❌ Invalid JSON response from server");
          data = null;
        }

        if (!res.ok || !data || !data.requirement) {
          toast.error("Requirement not found");
          router.push("/dashboard");
          return;
        }

        // 🧩 Prevent editing if requirement accepted
        if (data.requirement.status === "accepted") {
          toast.error("Accepted requirements cannot be edited");
          router.push("/dashboard");
          return;
        }

        setTitle(data.requirement.title);
        setDescription(data.requirement.description);
        setCharges(data.requirement.charges);
        setDeadline(data.requirement.deadline?.split("T")[0] || "");
        setStatus(data.requirement.status || "pending");
      } catch (err) {
        console.error("❌ Fetch error:", err);
        toast.error("Error loading requirement");
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchRequirement();
  }, [id]);

  // ✅ Handle update safely
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !charges || !deadline) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/requirements/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description, charges, deadline }),
      });

      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        console.error("❌ Failed to parse update response");
        data = null;
      }

      if (!res.ok || !data?.success) {
        toast.error(data?.message || "Failed to update requirement");
        return;
      }

      toast.success("Requirement updated successfully");
      router.push("/dashboard");
    } catch (err) {
      console.error("❌ Update error:", err);
      toast.error("Error updating requirement");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-200">
        Loading requirement...
      </div>
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Edit Requirement</h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Charges (₹)
            </label>
            <input
              type="number"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
              required
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <p className="text-sm text-gray-500 mt-2">
              Current Status:{" "}
              <span
                className={`font-medium ${
                  status === "accepted"
                    ? "text-green-600"
                    : status === "rejected"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-2 rounded mt-3"
          >
            Update Requirement
          </button>

          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full mt-2 py-2 border rounded border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
