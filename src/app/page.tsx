'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import * as THREE from 'three';

export default function IntroPage() {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [typedText, setTypedText] = useState('');

  const taglineText = 'Connecting Developers & Clients.';

  /* ================= FLOW ================= */
  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      router.replace('/home');
      return;
    }

    setVisible(true);

    let index = 0;
    const typing = setInterval(() => {
      setTypedText(taglineText.slice(0, index));
      index++;
      if (index > taglineText.length) clearInterval(typing);
    }, 55);

    const fadeTimer = setTimeout(() => setFadeOut(true), 2400);
    const redirectTimer = setTimeout(() => router.replace('/login'), 2700);

    return () => {
      clearInterval(typing);
      clearTimeout(fadeTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  /* ================= THREE BACKGROUND ================= */
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    const count = 120;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x38bdf8, // BRAND CYAN
      size: 0.07,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += 0.003;
        if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = -4;
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  if (!visible) return null;

  /* ================= UI ================= */
  return (
    <div
      className={`fixed inset-0 bg-black transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Soft glow (matches site) */}
      <div
        className="absolute w-[60vw] max-w-[500px] h-[60vw] max-h-[500px] 
                      bg-cyan-500/20 blur-[160px] rounded-full 
                      top-[12%] left-[20%]"
      />

      <div
        className="absolute w-[50vw] max-w-[420px] h-[50vw] max-h-[420px] 
                      bg-emerald-500/20 blur-[160px] rounded-full 
                      bottom-[10%] right-[18%]"
      />

      {/* THREE BACKGROUND */}
      <div ref={mountRef} className="absolute inset-0 z-0" />

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        <h1 className="text-6xl sm:text-5xl font-semibold text-white">
          CodeCommunity
        </h1>

        <p className="mt-4 text-gray-300 text-lg sm:text-xl h-7">
          {typedText}
          <span className="border-r-2 border-cyan-400 ml-1 animate-blink" />
        </p>
      </div>
    </div>
  );
}
