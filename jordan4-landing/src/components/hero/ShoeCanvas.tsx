"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Float, MeshReflectorMaterial, PerspectiveCamera } from "@react-three/drei";
import { ShoeArtifact } from "./ShoeArtifact";

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.92, 0]} receiveShadow>
      <planeGeometry args={[16, 16]} />
      <MeshReflectorMaterial
        blur={[300, 80]}
        resolution={512}
        mixBlur={1}
        mixStrength={35}
        roughness={1}
        depthScale={1}
        minDepthThreshold={0.85}
        color="#0a0908"
        metalness={0.3}
        mirror={0}
      />
    </mesh>
  );
}

function Rig({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.4, 5.2]} fov={32} />
      {/* key spotlight — the "gallery" light */}
      <spotLight
        position={[3, 4, 2]}
        angle={0.35}
        penumbra={0.6}
        intensity={45}
        color="#f4efe6"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* jordan-red rim light for edge separation */}
      <spotLight position={[-4, 1.5, -3]} angle={0.5} penumbra={0.8} intensity={30} color="#c8102e" />
      {/* soft gold fill from below-front, like museum case lighting */}
      <pointLight position={[0, -0.4, 3]} intensity={4} color="#b08d57" />
      <ambientLight intensity={0.12} />
      <fog attach="fog" args={["#0a0908", 4, 11]} />

      <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.4}>
        <ShoeArtifact scrollRef={scrollRef} />
      </Float>

      <ContactShadows position={[0, -0.9, 0]} opacity={0.65} scale={8} blur={2.4} far={2} color="#000000" />
      <Floor />
    </>
  );
}

export function ShoeCanvas() {
  const scrollRef = useRef(0);

  useEffect(() => {
    const el = document.getElementById("hero-stage");
    function onScroll() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
      scrollRef.current = progress;
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
      <Suspense fallback={null}>
        <Rig scrollRef={scrollRef} />
      </Suspense>
    </Canvas>
  );
}
