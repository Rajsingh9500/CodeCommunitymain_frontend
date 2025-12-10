"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from "next/image";

export default function IntroPage() {
  const router = useRouter();
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(false);
  const [typedText, setTypedText] = useState("");

  const fullText = "Connecting Developers & Clients.";

  useEffect(() => {
    const token = Cookies.get("token");

    if (token) {
      router.replace("/home");
      return;
    }

    setVisible(true);

    // ░░ Typing Animation ░░
    let index = 0;
    const typeInterval = setInterval(() => {
      setTypedText(fullText.slice(0, index));
      index++;

      if (index > fullText.length) {
        clearInterval(typeInterval);
      }
    }, 60); // typing speed

    // ░░ Fade + Redirect after 2s ░░
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const redirectTimer = setTimeout(() => router.replace("/login"), 2200);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 flex flex-col items-center justify-center 
        bg-black text-white transition-opacity duration-500 overflow-hidden
        ${fadeOut ? "opacity-0" : "opacity-100"}
      `}
    >
      {/* Glowing Background */}
      <div className="absolute w-[60vw] max-w-[500px] h-[60vw] max-h-[500px] 
                      bg-emerald-400/20 blur-[160px] rounded-full 
                      top-[12%] left-[22%] animate-pulse" />

      <div className="absolute w-[55vw] max-w-[420px] h-[55vw] max-h-[420px] 
                      bg-cyan-400/20 blur-[160px] rounded-full 
                      bottom-[12%] right-[18%] animate-pulse" />

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex flex-col items-center text-center animate-fadeInSlow px-6">

        {/* Logo */}
        <Image
          src="/logos/CodeCommunity.png"
          alt="CodeCommunity"
          width={260}
          height={90}
          priority
          className="w-[65%] max-w-[260px] mx-auto"
        />

        {/* Typing Tagline */}
        <p className="mt-4 text-gray-300 text-lg sm:text-xl h-7 sm:h-8">
          {typedText}
          <span className="border-r-2 border-emerald-400 animate-blink ml-1" />
        </p>

        {/* Loader */}
        <div className="mt-10 w-10 h-10 sm:w-12 sm:h-12 border-4 
                        border-emerald-400 border-t-transparent 
                        rounded-full animate-spin" />
      </div>

    </div>
  );
}
