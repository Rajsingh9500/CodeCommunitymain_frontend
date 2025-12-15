"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LoaderScene from "@/components/LoaderScene";

export default function Page() {
  const router = useRouter();

  const [showIntro, setShowIntro] = useState(false);
  const handledRef = useRef(false); // prevents double-run in dev

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const introSeen = sessionStorage.getItem("introSeen");

    // If intro already shown in THIS SESSION → skip
    if (introSeen) {
      router.replace("/login");
      return;
    }

    // First visit in this browser session
    setShowIntro(true);
    sessionStorage.setItem("introSeen", "true");

    const timer = setTimeout(() => {
      router.replace("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  if (!showIntro) return null;

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* THREE LOADER */}
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <LoaderScene />
      </Canvas>

      {/* CENTER TEXT */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
  <h1
    className="
      text-white font-semibold uppercase tracking-[0.35em]
      text-[1.6rem] sm:text-[2.2rem] md:text-[2.8rem]
    "
  >
    CODECOMMUNITY
  </h1>

  <p className="mt-5 text-gray-400 text-sm sm:text-base tracking-widest">
    Connecting Developers & Clients
  </p>
</div>

    </div>
  );
}
