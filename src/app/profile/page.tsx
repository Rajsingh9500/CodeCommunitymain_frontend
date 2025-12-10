"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { Loader2, Edit, Trash2, LogOut, Save } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface UserType {
  id?: string;
  name: string;
  email: string;
  role: "developer" | "client" | "admin" | "superadmin";
  technologies?: string[];
  experience?: number;
  charges?: number;
  photo?: string;
  developerType?: string;
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<UserType | null>(null);
  const [editForm, setEditForm] = useState<UserType | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* --------------------------------------------------------
     Fetch user using cookie authentication
  -------------------------------------------------------- */
  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        credentials: "include",
      });

      const data = await res.json();

      if (data?.user) {
        setUser(data.user);
        setEditForm(data.user);
      } else {
        toast.error("Authentication expired. Please log in again.");
        router.push("/login");
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  /* --------------------------------------------------------
     Image Preview
  -------------------------------------------------------- */
  useEffect(() => {
    if (!photoFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photoFile]);

  /* --------------------------------------------------------
     Save Updated Profile (COOKIE BASED)
  -------------------------------------------------------- */
  const saveProfile = async () => {
    if (!editForm) return;

    setSaving(true);
    try {
      const formData = new FormData();

      Object.entries(editForm).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (Array.isArray(v)) formData.append(k, JSON.stringify(v));
          else formData.append(k, String(v));
        }
      });

      if (photoFile) {
        formData.append("photo", photoFile);
      }

      const res = await fetch(`${API_URL}/api/auth/update-profile`, {
        method: "PUT",
        credentials: "include", // Cookie auth
        body: formData,
      });

      const data = await res.json();

      if (data?.success) {
        setUser(data.user);
        setEditForm(data.user);
        toast.success("Profile updated successfully!");
      } else {
        toast.error(data?.message || "Update failed");
      }
    } catch (err) {
      console.error("Save profile error:", err);
      toast.error("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------------------------------
     DELETE PROFILE
  -------------------------------------------------------- */
  const deleteProfile = async () => {
    if (!confirm("⚠️ Are you sure? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/delete-profile`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (data.success) {
        Cookies.remove("token");
        Cookies.remove("user");
        toast.success("Account deleted successfully");
        router.push("/register");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete account");
    }
  };

  /* --------------------------------------------------------
     LOGOUT
  -------------------------------------------------------- */
  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    Cookies.remove("token");
    Cookies.remove("user");

    router.push("/login");
  };

  /* --------------------------------------------------------
     Loading UI
  -------------------------------------------------------- */
  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-950 text-white">
        <Loader2 className="animate-spin w-8 h-8 text-emerald-400" />
        <p className="ml-3">Loading your profile...</p>
      </div>
    );

  if (!user) return <div className="p-6 text-white">Please login</div>;

  const resolveImageSrc = (src?: string) => {
    if (!src) return `${API_URL}/uploads/user.png`;
    if (src.startsWith("http")) return src;
    return `${API_URL}${src}`;
  };

  /* --------------------------------------------------------
     PAGE UI
  -------------------------------------------------------- */
  return (
    <>
      <Header />
      <main className="mt-24 min-h-[80vh] flex items-start justify-center px-4 pb-20">
        <div className="max-w-5xl w-full">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-gray-700 rounded-3xl shadow-xl p-8 sm:p-10">

            {/* Profile Header */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full p-[3px] bg-gradient-to-r from-emerald-400 to-cyan-400">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gray-800">
                    {preview ? (
                      <img src={preview} className="w-full h-full object-cover" />
                    ) : user.photo ? (
                      <img src={resolveImageSrc(user.photo)} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl text-white">
                        {user.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <label className="absolute bottom-2 right-2 bg-emerald-400 p-2 rounded-full cursor-pointer">
                  <input type="file" className="hidden" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
                  <Edit className="text-black w-4 h-4" />
                </label>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold text-white">{user.name}</h1>
                <p className="text-gray-400">{user.email}</p>
                <p className="mt-2 inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-400/10 text-emerald-300 border border-emerald-400/30">
                  {user.role.toUpperCase()}
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInput label="Full Name" value={editForm?.name || ""} onChange={(v) => setEditForm((p) => p ? { ...p, name: v } : p)} />
              <ProfileInput label="Email" disabled value={editForm?.email || ""} />

              {user.role === "developer" && (
                <>
                  <ProfileInput label="Developer Type" value={editForm?.developerType || ""} onChange={(v) => setEditForm((p) => p ? { ...p, developerType: v } : p)} />
                  <ProfileInput label="Technologies" value={(editForm?.technologies || []).join(", ")} onChange={(v) => setEditForm((p) => p ? { ...p, technologies: v.split(",") } : p)} />
                  <ProfileInput label="Experience (Years)" value={editForm?.experience || ""} type="number" onChange={(v) => setEditForm((p) => p ? { ...p, experience: Number(v) } : p)} />
                  <ProfileInput label="Charges (₹)" value={editForm?.charges || ""} type="number" onChange={(v) => setEditForm((p) => p ? { ...p, charges: Number(v) } : p)} />
                </>
              )}

              <ProfileInput label="New Password" type="password" placeholder="Leave blank to keep current" onChange={(v) => setEditForm((p) => p ? { ...p, password: v } : p)} />
            </div>

            {/* Buttons */}
            <div className="mt-8 flex flex-wrap gap-4 justify-end">
              <button onClick={saveProfile} disabled={saving} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-400 to-cyan-400 text-black font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </button>

              <button onClick={() => router.push("/dashboard")} className="px-5 py-2 rounded-lg border border-gray-700 text-white">
                Back to Dashboard
              </button>

              <button onClick={logout} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-800 text-gray-300">
                <LogOut className="w-4 h-4" /> Logout
              </button>

              <button onClick={deleteProfile} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-600 text-white">
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

/* --------------------------------------------------------
   Reusable Input Component
-------------------------------------------------------- */
function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  placeholder = "",
}: {
  label: string;
  value?: string | number;
  onChange?: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value ?? ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        className={`w-full p-3 rounded-lg bg-gray-900 border border-gray-700 text-white`}
      />
    </div>
  );
}
