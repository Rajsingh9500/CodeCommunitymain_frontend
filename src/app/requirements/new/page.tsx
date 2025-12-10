"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function NewRequirementPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [charges, setCharges] = useState("");
  const [deadline, setDeadline] = useState("");

  const getToken = () => Cookies.get("token") || localStorage.getItem("token") || "";

  const submitRequirement = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !charges || !deadline) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/requirements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          description,
          charges: Number(charges),
          deadline,
        }),
        credentials: "include",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Requirement added successfully");
        router.push("/dashboard");
      } else {
        toast.error(data.message || "Failed to add requirement");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-10">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Add New Requirement</h2>

        <form onSubmit={submitRequirement} className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Title
            </label>
            <input
              type="text"
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Charges (₹)
            </label>
            <input
              type="number"
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Deadline
            </label>
            <input
              type="date"
              className="w-full p-2 rounded border dark:bg-gray-700 dark:border-gray-600"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-medium py-2 rounded"
          >
            Add Requirement
          </button>
        </form>

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 w-full py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
