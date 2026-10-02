import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer, Float } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const IVORY = "#ece4d6";
const INK = "#1a1412";
const BLUSH = "#c8352d";

function Tube({
  points,
  radius,
  color,
}: {
  points: [number, number, number][];
  radius: number;
  color: string;
}) {
  const geo = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        48,
        radius,
        10,
        false,
      ),
    [points, radius],
  );
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
    </mesh>
  );
}

const mirror = (pts: [number, number, number][]) =>
  pts.map(([x, y, z]) => [-x, y, z] as [number, number, number]);
const brow: [number, number, number][] = [
  [0.18, 0.62, 0.98],
  [0.45, 0.86, 0.94],
  [0.78, 0.84, 0.8],
  [1.02, 0.6, 0.6],
];
const stache: [number, number, number][] = [
  [0.04, -0.42, 1.08],
  [0.32, -0.5, 1.02],
  [0.62, -0.4, 0.9],
  [0.82, -0.12, 0.74],
  [0.74, 0.08, 0.72],
  [0.6, 0.02, 0.78],
];
const smile: [number, number, number][] = [
  [-0.38, -0.82, 0.96],
  [0, -0.95, 1.0],
  [0.38, -0.82, 0.96],
];

function Mask({ open, onInspect }: { open: boolean; onInspect: () => void }) {
  const group = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useFrame(({ pointer }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const g = group.current;
    if (!g) return;
    spin.current = THREE.MathUtils.damp(spin.current, open ? Math.PI * 2 : 0, 2.2, dt);
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, pointer.x * 0.45 - 0.25, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -pointer.y * 0.25, 3, dt);
    g.rotation.z = spin.current * 0.0;
    g.children[0]!.rotation.y = spin.current;
  });
  return (
    <group ref={group} onClick={onInspect}>
      <group>
        {/* face shell */}
        <mesh scale={[1.25, 1.62, 0.95]}>
          <sphereGeometry args={[1, 64, 64, 0, Math.PI * 2, 0, Math.PI]} />
          <meshStandardMaterial color={IVORY} roughness={0.38} side={THREE.DoubleSide} />
        </mesh>
        {/* eye holes */}
        {[-0.46, 0.46].map((x) => (
          <mesh
            key={x}
            position={[x, 0.32, 0.86]}
            scale={[0.26, 0.15, 0.1]}
            rotation-z={x > 0 ? -0.12 : 0.12}
          >
            <sphereGeometry args={[1, 32, 16]} />
            <meshStandardMaterial color={INK} roughness={0.9} />
          </mesh>
        ))}
        <Tube points={brow} radius={0.045} color={INK} />
        <Tube points={mirror(brow)} radius={0.045} color={INK} />
        {/* nose */}
        <mesh position={[0, -0.05, 1.02]} rotation-x={-0.25} scale={[0.17, 0.42, 0.2]}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={IVORY} roughness={0.38} />
        </mesh>
        {/* cheeks */}
        {[-0.68, 0.68].map((x) => (
          <mesh key={x} position={[x, -0.25, 0.73]} scale={[0.22, 0.16, 0.08]}>
            <sphereGeometry args={[1, 24, 16]} />
            <meshStandardMaterial color={BLUSH} roughness={0.6} transparent opacity={0.75} />
          </mesh>
        ))}
        <Tube points={stache} radius={0.05} color={INK} />
        <Tube points={mirror(stache)} radius={0.05} color={INK} />
        <Tube points={smile} radius={0.025} color={INK} />
        {/* chin dimple */}
        <mesh position={[0, -1.22, 0.62]} scale={[0.08, 0.03, 0.03]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={INK} />
        </mesh>
      </group>
    </group>
  );
}

export function VaultScene({ open, onInspect }: { open: boolean; onInspect: () => void }) {
  return (
    <div className="vault-canvas" aria-label="Interactive three-dimensional heist mask">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 6.2], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[-4, 3, 5]} color="#f1dcc0" intensity={45} distance={15} />
        <pointLight position={[4, -1, 2]} color="#e12620" intensity={35} distance={12} />
        <Environment>
          <Lightformer intensity={2} position={[0, 5, 2]} scale={[10, 2, 1]} />
          <Lightformer intensity={1.2} color="#e77d65" position={[5, 1, 2]} scale={[3, 8, 1]} />
        </Environment>
        <Float speed={1.4} rotationIntensity={0.15} floatIntensity={0.6}>
          <Mask open={open} onInspect={onInspect} />
        </Float>
      </Canvas>
    </div>
  );
}
