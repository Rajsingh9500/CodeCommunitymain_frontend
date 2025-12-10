"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Laptop, Clock, IndianRupee, Star, PlusCircle } from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

interface DeveloperType {
  _id: string;
  name: string;
  email: string;
  role: "developer" | "client" | "admin";
  technologies?: string[];
  experience?: number;
  charges?: number;
  avgRating?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function DevelopersPage() {
  const [developers, setDevelopers] = useState<DeveloperType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevId, setSelectedDevId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Requirement form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [charges, setCharges] = useState("");
  const [deadline, setDeadline] = useState("");

  const [user, setUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const fetchUserAndDevelopers = async () => {
      try {
        const token = Cookies.get("token") || "";

        if (token) {
          const userRes = await fetch(`${API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          const userData = await userRes.json();
          if (userData.user) setUser(userData.user);
        }

        const devRes = await fetch(`${API_URL}/api/developers`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });

        const devData = await devRes.json();
        if (devData.success && Array.isArray(devData.developers)) {
          setDevelopers(devData.developers);
        } else setDevelopers([]);
      } catch {
        setDevelopers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndDevelopers();
  }, []);

  const handlePostRequirement = async () => {
    const token = Cookies.get("token") || "";
    if (!title || !description || !charges || !deadline || !selectedDevId) {
      toast.error("Please fill all fields!");
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/requirements`,
        {
          title,
          description,
          charges: Number(charges),
          deadline,
          developerId: selectedDevId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success("Requirement posted!");
        setTitle("");
        setDescription("");
        setCharges("");
        setDeadline("");
        setSelectedDevId(null);
        setShowForm(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to post requirement");
    }
  };

  if (loading) return <div className="text-white p-6">Loading developers...</div>;

  return (
    <div className="bg-gray-950 text-white min-h-screen mt-20 p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-emerald-400">
          Developers
        </h1>
      </div>

      {developers.length === 0 ? (
        <p className="text-center text-gray-400">No developers found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {developers.map((dev) => (
            <div
              key={dev._id}
              className="
                backdrop-blur-xl bg-gray-900/60 border border-gray-480
                rounded-2xl p-6 shadow-xl hover:shadow-emerald-500/30
                hover:border-emerald-500 transition-all duration-300
              "
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="
                    w-24 h-24 rounded-full bg-gradient-to-br
                    from-emerald-500 to-cyan-500 flex items-center justify-center
                    text-3xl font-bold shadow-lg
                  "
                >
                  {dev.name.charAt(0)}
                </div>

                <h2 className="text-xl font-semibold mt-4 text-white">
                  {dev.name}
                </h2>
                <p className="text-gray-400 text-sm">{dev.email}</p>
              </div>

              {/* Info */}
              <div className="mt-6 space-y-4 text-sm flex flex-col items-center  ">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300">
                    {dev.technologies?.length
                      ? dev.technologies.join(", ")
                      : "No technologies added"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300">
                    {dev.experience || 0} yrs experience
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  <span className="text-gray-300">₹{dev.charges || 0}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (dev.avgRating || 0)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-600"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-gray-400 text-xs">
                    {dev.avgRating?.toFixed(1) || "0.0"}
                  </span>
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href={`/developers/${dev._id}`}
                  className="
                    px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400
                    text-black font-semibold shadow-md transition
                  "
                >
                  View Profile
                </Link>

                {user?.role === "client" && (
                  <button
                    onClick={() => {
                      setSelectedDevId(dev._id);
                      setShowForm(true);
                    }}
                    className="
                      px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400
                      text-black font-semibold shadow-md transition
                    "
                  >
                    Post Requirement
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Requirement Modal */}
      {showForm && user?.role === "client" && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900/90 border border-gray-700 p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-emerald-400">
              Post Requirement
            </h2>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Requirement Title"
              className="w-full p-3 mb-3 border border-gray-700 rounded-lg bg-gray-800 text-white"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Requirement Description"
              className="w-full p-3 mb-3 border border-gray-700 rounded-lg bg-gray-800 text-white"
            />

            <input
              type="number"
              value={charges}
              onChange={(e) => setCharges(e.target.value)}
              placeholder="Charges (₹)"
              className="w-full p-3 mb-3 border border-gray-700 rounded-lg bg-gray-800 text-white"
            />

            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-3 mb-3 border border-gray-700 rounded-lg bg-gray-800 text-white"
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedDevId(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handlePostRequirement}
                className="
                  px-4 py-2 bg-emerald-500 hover:bg-emerald-400
                  text-black font-semibold rounded-lg
                "
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
