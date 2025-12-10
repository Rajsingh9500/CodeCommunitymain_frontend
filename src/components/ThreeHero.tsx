"use client";

import { Canvas } from "@react-three/fiber";
import ThreeScene from "./ThreeScene";

export default function ThreeHero() {
  return (
    <Canvas
      className="absolute inset-0 z-0"
      camera={{ position: [0, 0, 2.5], fov: 60 }}
    >
      <ThreeScene />
    </Canvas>
  );
}
