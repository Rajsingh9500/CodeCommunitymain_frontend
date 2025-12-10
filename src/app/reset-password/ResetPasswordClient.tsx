"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState(email || "");
  const [resendLoading, setResendLoading] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  // -----------------------------------------
  // RESET PASSWORD SUBMIT
  // -----------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!token || !email) {
      setError("Invalid or missing reset link. Please request a new one.");
      setShowResend(true);
      return;
    }

    setLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/auth/reset-password`, {
        token,
        email,
        password,
      });

      if (resp.data?.success) {
        setMessage("Password reset successful. Redirecting to login...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        setError(resp.data?.message || "Failed to reset password.");
        setShowResend(true);
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || "Something went wrong. Token may be invalid or expired.");
      setShowResend(true);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------
  // RESEND RESET LINK
  // -----------------------------------------
  const handleResend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setMessage(null);
    setError(null);

    if (!resendEmail.trim()) {
      setError("Please enter your email.");
      return;
    }

    setResendLoading(true);
    try {
      const resp = await axios.post(`${API_BASE}/api/auth/forgot-password`, {
        email: resendEmail.trim(),
      });

      if (resp.data?.success) {
        setMessage("Reset link sent. Check your email!");
        setShowResend(false);
      } else {
        setError(resp.data?.message || "Failed to resend reset link.");
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || "Failed to send reset link.");
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (email) setResendEmail(email);
  }, [email]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 pt-20">
      <div className="bg-gray-900/80 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-700 text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-center">Reset Password</h2>

        {message && <div className="mb-4 text-green-400">{message}</div>}
        {error && <div className="mb-4 text-red-400">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NEW PASSWORD */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-300">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {/* RESEND RESET LINK SECTION */}
        <div className="mt-6 border-t border-gray-700 pt-4">
          {!showResend ? (
            <div className="text-center">
              <p className="text-sm text-gray-300">
                Token expired or not received?
                <button
                  onClick={() => setShowResend(true)}
                  className="text-blue-400 underline ml-1"
                >
                  Resend reset link
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleResend} className="space-y-3">
              <label className="block text-sm text-gray-300">Enter your email</label>
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required
                className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend Link"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowResend(false);
                    setError(null);
                    setMessage(null);
                  }}
                  className="px-3 py-2 rounded-lg bg-gray-700 text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
