import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text } from '@react-three/drei';

const Wall = ({ start, end, data, onSelect }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Default values just in case
  const p1 = start || [0, 0];
  const p2 = end || [0, 0];
  
  const x1 = p1[0];
  const y1 = p1[1];
  const x2 = p2[0];
  const y2 = p2[1];
  
  // 1. Calculate length (distance)
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) || 1; // fallback to 1 to avoid 0 width
  
  // 2. Calculate angle
  const angle = Math.atan2(dy, dx);
  
  // 3. Calculate midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  
  // 4. Map 2D (x, y) to 3D (x, z), keeping y as height
  const x = midX;
  const z = midY; 
  const y = 1.5; // Half of height 3
  
  // 5. Fixed Dimensions
  const height = 3; 
  const thickness = 0.2; 
  
  const color = hovered ? "#3b82f6" : ((data && data.color) ? data.color : "#94a3b8");

  return (
    <mesh
      ref={meshRef}
      position={[x, y, z]}
      rotation={[0, -angle, 0]}
      castShadow
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        if (onSelect && data) onSelect(data);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
      }}
    >
      <boxGeometry args={[length, height, thickness]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

const Scene = ({ walls = [], onSelectWall }) => {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg">
      <Canvas
        shadows
        camera={{ position: [10, 15, 10], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />
        
        {/* Floor Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#f1f5f9" />
        </mesh>
        
        {walls && walls.length > 0 ? (
          walls.map((wall, index) => (
            <Wall 
              key={wall.id || index} 
              start={wall.start}
              end={wall.end}
              data={wall} 
              onSelect={onSelectWall} 
            />
          ))
        ) : (
          <group>
            {/* Fallback default cube */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#cbd5e1" wireframe />
            </mesh>
            <Text position={[0, 1.5, 0]} fontSize={0.3} color="#64748b">
              No Data Available
            </Text>
          </group>
        )}

        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={20}
        />
        <Environment preset="studio" />
      </Canvas>
    </div>
  );
};

export default Scene;