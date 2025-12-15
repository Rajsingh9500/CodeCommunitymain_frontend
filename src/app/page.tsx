"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoaderScene from "@/components/LoaderScene";

export default function Page() {
  const router = useRouter();

  const [showIntro, setShowIntro] = useState(false);
  const [typedLogo, setTypedLogo] = useState("");
  const handledRef = useRef(false);

  const LOGO_TEXT = "CODECOMMUNITY";
  const TAGLINE = "Connecting Developers & Clients";

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const introSeen = sessionStorage.getItem("introSeen");

    // If intro already shown in this session → skip
    if (introSeen) {
      router.replace("/login");
      return;
    }

    // First visit in this browser session
    setShowIntro(true);
    sessionStorage.setItem("introSeen", "true");

    // ⌨️ Logo typing animation
    let i = 0;
    const typing = setInterval(() => {
      setTypedLogo(LOGO_TEXT.slice(0, i + 1));
      i++;
      if (i === LOGO_TEXT.length) clearInterval(typing);
    }, 90);

    // Redirect after animation
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2600);

    return () => {
      clearInterval(typing);
      clearTimeout(timer);
    };
  }, [router]);

  if (!showIntro) return null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* THREE.JS LOADER BACKGROUND */}
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <LoaderScene />
      </Canvas>

      {/* CENTER CONTENT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-6">
        {/* TYPING LOGO */}
        <h1
          className="
            text-white font-semibold uppercase
            tracking-[0.35em]
            text-[1.6rem] sm:text-[2.2rem] md:text-[2.8rem]
          "
        >
          {typedLogo}
          <span className="ml-1 inline-block w-[2px] h-[1em] bg-cyan-400 animate-pulse align-middle" />
        </h1>

        {/* TAGLINE */}
        <p className="mt-5 text-gray-400 text-sm sm:text-base tracking-widest">
          {TAGLINE}
        </p>
      </div>
    </div>
  );
}
