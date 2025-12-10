"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success || !data.user) {
        toast.error(data?.message || "Invalid Email or Password");
        setLoading(false);
        return;
      }

      toast.success("Login successful!");

      // ✅ INSTANT UPDATE AuthProvider (fixes double-login issue)
      setUser(data.user);

      // Small delay to allow cookies to write
      await new Promise((r) => setTimeout(r, 200));

      router.replace("/home");

    } catch (err) {
      toast.error("Server error, try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4">

      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-emerald-400/20 rounded-full blur-[120px]" />
      <div className="absolute -bottom-40 left-0 w-[600px] h-[600px] bg-cyan-400/20 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-md bg-gray-900/60 border border-gray-500/90 backdrop-blur-2xl 
                      rounded-2xl shadow-[0_0_40px_rgba(0,255,200,0.08)] p-10 animate-fadeIn">

        <h2 className="text-4xl font-extrabold text-center mb-10 
                       bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 
                       bg-clip-text text-transparent drop-shadow-lg">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="text-sm text-gray-300 mb-1">Email</div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              required
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 pl-12 pr-4 rounded-lg bg-black/40 border border-gray-700 text-gray-300 
                         focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
            />
          </div>

          <div className="text-sm text-gray-300 mb-1">Password</div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />

            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 pl-12 pr-12 rounded-lg bg-black/40 border border-gray-700 text-gray-300 
                         focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 outline-none transition"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="flex justify-between text-sm mt-1">
            <Link href="/forgot-password" className="text-gray-300 hover:text-emerald-400 transition">
              Forgot Password?
            </Link>

            <Link href="/register" className="text-gray-300 hover:text-cyan-400 transition">
              Create Account
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-600 
                       text-black font-bold shadow-lg hover:opacity-90 transition disabled:opacity-60 
                       flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin mr-2" />
                Logging in…
              </>
            ) : (
              "Log In"
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
