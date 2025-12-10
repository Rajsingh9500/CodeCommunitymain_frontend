"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

export default function ClientPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [charges, setCharges] = useState("");
  const [deadline, setDeadline] = useState("");

  const token = Cookies.get("token") || "";
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  const [socket, setSocket] = useState<any>(null);

  // ✅ Create socket only once
  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL, { auth: { token } });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, API_URL]);

  // ✅ Handle Post
  const handlePost = async () => {
    if (!title || !description || !charges || !deadline) {
      toast.error("Please fill all fields!");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/api/requirements`,
        { title, description, charges, deadline },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Requirement posted successfully!");
      setTitle("");
      setDescription("");
      setCharges("");
      setDeadline("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to post requirement");
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Post Requirement</h1>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-full p-2 mb-3 border rounded bg-gray-900 text-white"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full p-2 mb-3 border rounded bg-gray-900 text-white"
      />

      {/* Charges */}
      <input
        type="number"
        value={charges}
        onChange={(e) => setCharges(e.target.value)}
        placeholder="Charges (in ₹)"
        className="w-full p-2 mb-3 border rounded bg-gray-900 text-white"
      />

      {/* Deadline */}
      <input
        type="date"
        value={deadline}
        onChange={(e) => setDeadline(e.target.value)}
        className="w-full p-2 mb-3 border rounded bg-gray-900 text-white"
      />

      <button
        onClick={handlePost}
        className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
      >
        Post
      </button>
    </div>
  );
}
