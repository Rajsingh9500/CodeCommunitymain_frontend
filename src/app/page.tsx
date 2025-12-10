"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";

export default function IntroPage() {
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const token = Cookies.get("token");
    const introNeeded = localStorage.getItem("introNeeded");

    if (token) {
      router.push("/home");
      return;
    }

    // User logged out → intro only once
    if (introNeeded === "true") {
      setShowIntro(true);
      localStorage.removeItem("introNeeded");
    } else {
      setShowIntro(true);
    }

    const fadeTimer = setTimeout(() => setFadeOut(true), 4500);
    const loginTimer = setTimeout(() => router.push("/login"), 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(loginTimer);
    };
  }, [router]);

  if (!showIntro) return null;

  return (
    <div
      className={`
        relative
        flex flex-col items-center justify-center 
        h-screen bg-black text-white 
        transition-opacity duration-700
        ${fadeOut ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Background glow (behind everything) */}
      <div className="absolute z-0 w-[500px] h-[500px] bg-emerald-400/20 blur-[120px] rounded-full top-10 left-1/4 animate-pulse"></div>
      <div className="absolute z-0 w-[400px] h-[400px] bg-cyan-400/20 blur-[120px] rounded-full bottom-10 right-1/4 animate-pulse"></div>

      {/* MAIN CONTENT — z-10 keeps it ABOVE blur */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo */}
        <Image
          src="/logos/CodeCommunity.png"
          alt="CodeCommunity"
          width={240}
          height={80}
        />

        <h1 className="mt-8 text-4xl font-bold">Welcome to CodeCommunity</h1>
        <p className="mt-2 text-gray-300">Connecting Developers & Clients</p>

        {/* Loader — ★ NOW VISIBLE ★ */}
        <div className="mt-10 animate-spin border-t-4 border-emerald-400 rounded-full w-12 h-12"></div>
      </div>
    </div>
  );
}
