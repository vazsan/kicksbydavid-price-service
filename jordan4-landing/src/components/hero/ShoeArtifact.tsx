"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Sparkles } from "@react-three/drei";
import * as THREE from "three";

/**
 * An abstract sculptural reading of the AJ4 silhouette — sole, upper,
 * eyestay wings and a heel air-pod — built from primitives rather than a
 * literal product scan, so it reads as a gallery artifact rather than a
 * catalog render.
 */
export function ShoeArtifact({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Mesh>(null);
  const wingR = useRef<THREE.Mesh>(null);
  const t = useRef(0);

  useFrame((_, delta) => {
    t.current += delta;
    if (!group.current) return;

    const progress = scrollRef.current;
    // rest at a 3/4 "product shot" angle, then idle turntable + scroll-driven turn
    group.current.rotation.y = 0.62 + t.current * 0.05 + progress * Math.PI * 0.9;
    group.current.position.y = Math.sin(t.current * 0.8) * 0.06 - progress * 0.6;
    group.current.rotation.x = -0.08 + progress * 0.12;
    group.current.position.z = progress * -1.2;

    if (wingL.current && wingR.current) {
      const flare = 0.03 + Math.sin(t.current * 0.6) * 0.01;
      wingL.current.rotation.z = 0.3 + flare;
      wingR.current.rotation.z = -0.3 - flare;
    }
  });

  return (
    <group ref={group} position={[0, 0.1, 0]}>
      {/* sole */}
      <RoundedBox args={[2.6, 0.34, 1.05]} radius={0.16} smoothness={6} position={[0, -0.55, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#efe9dd" roughness={0.55} clearcoat={0.3} />
      </RoundedBox>

      {/* midsole trim line */}
      <RoundedBox args={[2.62, 0.1, 1.07]} radius={0.05} smoothness={4} position={[0, -0.36, 0]}>
        <meshPhysicalMaterial color="#c8102e" roughness={0.4} clearcoat={0.6} />
      </RoundedBox>

      {/* visible heel air unit */}
      <mesh position={[-0.85, -0.5, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.5, 8, 16]} />
        <meshPhysicalMaterial
          color="#dfe6ea"
          transmission={0.85}
          thickness={0.4}
          roughness={0.05}
          ior={1.3}
          clearcoat={1}
        />
      </mesh>

      {/* upper body */}
      <RoundedBox args={[2.05, 0.68, 0.92]} radius={0.28} smoothness={6} position={[0.05, -0.05, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#141414" roughness={0.75} clearcoat={0.15} />
      </RoundedBox>

      {/* toe box */}
      <RoundedBox args={[0.85, 0.5, 0.8]} radius={0.24} smoothness={6} position={[1.05, -0.15, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#1c1c1c" roughness={0.6} clearcoat={0.2} />
      </RoundedBox>

      {/* mesh vamp panel */}
      <RoundedBox args={[0.7, 0.42, 0.86]} radius={0.12} smoothness={4} position={[-0.35, 0.16, 0]} castShadow>
        <meshPhysicalMaterial color="#8b8680" roughness={0.9} />
      </RoundedBox>

      {/* eyestay wings */}
      <mesh ref={wingL} position={[-0.1, 0.28, 0.47]} rotation={[0, 0.15, 0.3]} castShadow>
        <boxGeometry args={[0.46, 0.24, 0.04]} />
        <meshPhysicalMaterial color="#f4efe6" roughness={0.4} clearcoat={0.5} />
      </mesh>
      <mesh ref={wingR} position={[-0.1, 0.28, -0.47]} rotation={[0, -0.15, -0.3]} castShadow>
        <boxGeometry args={[0.46, 0.24, 0.04]} />
        <meshPhysicalMaterial color="#f4efe6" roughness={0.4} clearcoat={0.5} />
      </mesh>

      {/* collar */}
      <RoundedBox args={[0.55, 0.34, 0.78]} radius={0.16} smoothness={6} position={[-0.85, 0.28, 0]} castShadow>
        <meshPhysicalMaterial color="#0f0f0f" roughness={0.8} />
      </RoundedBox>

      {/* jumpman accent tag */}
      <mesh position={[0.05, 0.02, 0.47]} rotation={[0, 0, 0]}>
        <circleGeometry args={[0.09, 32]} />
        <meshBasicMaterial color="#c8102e" />
      </mesh>

      <Sparkles count={40} scale={[3.2, 1.6, 1.6]} size={2} speed={0.25} color="#b08d57" opacity={0.5} />
    </group>
  );
}
