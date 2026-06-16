import { useGLTF } from '@react-three/drei';

export default function RealisticCarModel() {
  // We'll return a basic placeholder for now until a GLTF model is provided
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.8, 4.5]} />
        <meshStandardMaterial color="#ff0044" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.1, -0.2]} castShadow>
        <boxGeometry args={[1.4, 0.6, 2.2]} />
        <meshStandardMaterial color="#111" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}
