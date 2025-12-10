"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, User, Mail, Lock } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [passwordError, setPasswordError] = useState("");

  // 🔐 PASSWORD VALIDATION FUNCTION
  const validatePassword = (password: string) => {
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must include a number.";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(password))
      return "Password must include a special character.";
    return "";
  };

  // Input Handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "password") {
      setPasswordError(validatePassword(value));
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Password validation check
    const validationError = validatePassword(formData.password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "❌ Something went wrong");
        return;
      }

      alert("✅ Registration successful! Please login.");
      router.push("/login");
    } catch (err) {
      alert("❌ Backend not reachable, ensure it's running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-14 bg-black flex items-center justify-center px-4 relative overflow-hidden">

      {/* Glowing BG */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[-200px] left-[-100px] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[150px]"></div>

      {/* CARD */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md p-8 sm:p-10 bg-gray-900/70 backdrop-blur-xl rounded-2xl border border-gray-500 
                   shadow-[0_0_35px_rgba(0,255,200,0.15)] text-white"
      >
        <h2 className="text-4xl font-extrabold text-center mb-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          Create an Account
        </h2>

        <p className="text-center text-gray-400 mb-8">
          Join <span className="text-emerald-400 font-semibold">CodeCommunity</span> 🚀
        </p>

        {/* FULL NAME */}
        <FormField
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          icon={<User size={20} />}
          placeholder="John Doe"
        />

        {/* EMAIL */}
        <FormField
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={20} />}
          placeholder="you@example.com"
        />

        {/* ROLE */}
        <RoleSelect value={formData.role} onChange={handleChange} />

        {/* PASSWORD */}
        <PasswordField
          label="Password"
          name="password"
          value={formData.password}
          show={showPassword}
          setShow={setShowPassword}
          onChange={handleChange}
        />

        {/* PASSWORD HINT */}
        {passwordError && (
          <p className="text-red-400 text-sm mb-3 -mt-2">{passwordError}</p>
        )}

        {/* CONFIRM PASSWORD */}
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={formData.confirmPassword}
          show={showConfirm}
          setShow={setShowConfirm}
          onChange={handleChange}
        />

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 
                     text-black rounded-lg font-bold shadow-lg hover:opacity-90 transition disabled:opacity-50 
                     flex items-center justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin mr-2" size={18} /> Registering...
            </>
          ) : (
            "Register"
          )}
        </button>

        {/* SWITCH TO LOGIN */}
        <p className="text-center text-gray-400 mt-6 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

function FormField({ label, name, value, onChange, icon, type = "text", placeholder }: any) {
  return (
    <div className="mb-3">
      <label className="text-sm text-gray-300 mb-2 block">{label}</label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          className="w-full p-3 pl-12 rounded-lg bg-black/40 border border-gray-700 text-gray-200 
                     focus:ring-2 focus:ring-emerald-500 outline-none transition"
          required
        />
      </div>
    </div>
  );
}

function RoleSelect({ value, onChange }: any) {
  return (
    <div className="mb-3">
      <label className="text-sm text-gray-300 mb-2 block">Select Role</label>
      <select
        name="role"
        value={value}
        onChange={onChange}
        required
        className="w-full p-3 rounded-lg bg-black/40 border border-gray-700 text-gray-300 focus:ring-2 focus:ring-cyan-500 transition"
      >
        <option value="">Choose Role</option>
        <option value="developer">Developer</option>
        <option value="client">Client</option>
      </select>
    </div>
  );
}

function PasswordField({ label, name, value, show, setShow, onChange }: any) {
  return (
    <div className="mb-3">
      <label className="text-sm text-gray-300 mb-2 block">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          placeholder={label}
          onChange={onChange}
          className="w-full p-3 pl-12 pr-12 rounded-lg bg-black/40 border border-gray-700 text-gray-200 
                     focus:ring-2 focus:ring-blue-500 outline-none transition"
          required
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
        >
          {show ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>
    </div>
  );
}
