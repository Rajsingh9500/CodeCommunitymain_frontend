"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function PublicUserProfile() {
  const params = useParams();
  const router = useRouter();
  const userId = params?.id;

  const [user, setUser] = useState<any>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  /* ------------------------------
       LOAD PROFILE
  ------------------------------ */
  const loadProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/profile/${userId}`, {
        credentials: "include",
      });
      const data = await res.json();

      if (data.success) setUser(data.user);
    } catch (err) {
      console.error("Profile load error:", err);
    }
  };

  /* ------------------------------
       CHECK CONNECTION
  ------------------------------ */
  const checkConnected = async () => {
    try {
      const res = await fetch(`${API_URL}/api/connections/check/${userId}`, {
        credentials: "include",
      });
      const data = await res.json();
      setConnected(data?.connected || false);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      await Promise.all([loadProfile(), checkConnected()]);
      setLoading(false);
    })();
  }, [userId]);

  /* ------------------------------
       CONNECT BUTTON
  ------------------------------ */
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch(`${API_URL}/api/connections/add/${userId}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Connection request sent!");
        setConnected(true);
      } else {
        toast.error(data.message || "Failed to connect");
      }
    } catch {
      toast.error("Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  /* ------------------------------
       LOADING / NO USER
  ------------------------------ */
  if (loading)
    return (
      <div className="h-screen flex justify-center items-center text-gray-300 text-lg">
        Loading profile…
      </div>
    );

  if (!user)
    return (
      <div className="h-screen flex justify-center items-center text-red-400 text-lg">
        User not found
      </div>
    );

  /* ------------------------------
       UI DESIGN (CENTER MODAL UI)
  ------------------------------ */
  return (
    <div className="min-h-screen mt-10 bg-black flex items-center justify-center px-4 py-8">

      {/* MODAL CONTAINER */}
      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-500 rounded-3xl w-full max-w-2xl p-10 shadow-[0_0_35px_rgba(0,255,200,0.12)] relative">

        {/* 🔙 Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-5 left-5 px-4 py-2 rounded-lg bg-gray-800/70 border border-gray-600 hover:bg-gray-700 text-gray-300 text-sm transition"
        >
          ← Back
        </button>

        {/* Profile Pic / Avatar */}
        <div className="relative mx-auto w-32 h-32 rounded-full p-[3px] bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-xl">
          <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-white text-5xl font-extrabold">
            {user.name?.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Name */}
        <h1 className="text-4xl font-bold text-center mt-6">{user.name}</h1>

        {/* Email */}
        <p className="text-center text-gray-400 text-sm mt-1">{user.email}</p>

        {/* Role Badge */}
        <div className="flex justify-center mt-3">
          <span className="px-5 py-1 rounded-full bg-gray-800 text-emerald-300 border border-gray-700 text-sm tracking-wide">
            {user.role.toUpperCase()}
          </span>
        </div>

        {/* Developer Info */}
        {user.role === "developer" && (
          <div className="mt-10 space-y-6">
            <ProfileField label="Developer Type" value={user.developerType} />

            <ProfileField
              label="Technologies"
              value={(user.technologies || []).join(", ")}
            />

            <div className="grid grid-cols-2 gap-6">
              <ProfileField label="Experience" value={`${user.experience} yrs`} />
              <ProfileField label="Charges" value={`₹${user.charges}`} />
            </div>

            {/* Full Developer Button */}
            <button
              onClick={() => router.push(`/developers/${user._id}`)}
              className="w-full py-3 rounded-xl bg-gray-800 text-cyan-300 border border-gray-700 hover:bg-gray-700 transition-all mt-2"
            >
              View Developer Full Profile →
            </button>
          </div>
        )}

        {/* CONNECT & CHAT BUTTONS */}
        <div className="mt-10 flex flex-col gap-4 items-center">
          {!connected ? (
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400
                         text-black font-bold text-lg hover:opacity-90 transition-all"
            >
              {connecting ? "Connecting…" : "Connect"}
            </button>
          ) : (
            <>
              <button
                className="w-full py-3 rounded-xl bg-gray-800 text-gray-300 border border-gray-700"
                disabled
              >
                Connected ✓
              </button>

              {/* CHAT BUTTON */}
              <button
                onClick={() => router.push(`/chat/${user._id}`)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-lg hover:bg-emerald-400 transition-all"
              >
                💬 Chat Now
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* SMALL FIELD COMPONENT */
function ProfileField({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-lg font-semibold text-gray-200">{value || "Not provided"}</p>
    </div>
  );
}
