"use client";

import { useRef, useMemo } from "react";
import { Points, PointMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export default function ThreeScene() {
  const ref = useRef<any>(null);

  // Create 3000 random particles in 3D space
  const particles = useMemo(() => {
    const count = 3000;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 6;
    }

    return positions;
  }, []);

  // Rotate particle cloud
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#00ffaa"
        size={0.015}
        sizeAttenuation
        depthWrite={false}
      />
    </Points>
  );
}
