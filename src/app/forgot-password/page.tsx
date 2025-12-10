"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resendMode, setResendMode] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      if (res.data.success) {
        setMessage("✅ Reset link sent! Please check your inbox.");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(res.data.message || "❌ Failed to send reset link.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "❌ Server error. Try again later.");
      setResendMode(true); // allow resend option if it fails
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email before resending.");
      return;
    }

    setResendLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      if (res.data.success) {
        setMessage("✅ Reset link resent! Please check your inbox.");
        setResendMode(false);
      } else {
        setError(res.data.message || "❌ Failed to resend reset link.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "❌ Failed to resend reset link.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black px-4 pt-20">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900/80 p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-700 text-white"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>

        {/* Success/Error */}
        {message && <p className="mb-4 text-green-400 text-center">{message}</p>}
        {error && <p className="mb-4 text-red-400 text-center">{error}</p>}

        {/* Email */}
        <input
          type="email"
          placeholder="Enter your registered email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-3 mb-4 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {/* Resend Section */}
        {resendMode && (
          <div className="mt-6 border-t border-gray-700 pt-4">
            <p className="text-sm text-gray-400 mb-3 text-center">
              Didn’t get the email? You can resend the reset link.
            </p>
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-semibold disabled:opacity-50"
            >
              {resendLoading ? "Resending..." : "Resend Reset Link"}
            </button>
          </div>
        )}

        {/* Back to Login */}
        <p className="text-center text-gray-400 mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
