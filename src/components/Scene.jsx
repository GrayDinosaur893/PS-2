import React, { useRef, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Center } from '@react-three/drei';

// Abstract conversion for Pixel Layout -> Realistic Space Mapping (1 pixel = 4 centimeters)
const SCALE = 0.04;

const Wall = ({ start, end, data, onSelect, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const [x1, y1] = start;
  const [x2, y2] = end;
  
  // 1. Calculate physical length scaling down the image bounding size
  const dx = (x2 - x1) * SCALE;
  const dy = (y2 - y1) * SCALE;
  const length = Math.sqrt(dx * dx + dy * dy) || 0.1; 
  
  // 2. Strict atan2 logic mapping angles accurately
  const angle = Math.atan2(dy, dx);
  
  // 3. Apply the ratio offset scaling for position geometry
  const midX = (x1 + x2) / 2 * SCALE;
  const midZ = (y1 + y2) / 2 * SCALE;
  
  // 4. PRESERVE standard measurements. Do not scale predefined constants.
  const height = data?.height || 3.0; 
  const yPosition = height / 2; 
  const thickness = data?.thickness || 0.3; 

  // Mapping Backend 'type' natively to Colors
  let baseColor = "#94a3b8";
  if (data?.type === "load-bearing") baseColor = "#ef4444"; // Red
  else if (data?.type === "partition") baseColor = "#3b82f6"; // Blue
  else if (data?.type === "structural" || data?.type === "structural-spine") baseColor = "#a855f7"; // Purple

  const color = isSelected ? "#fde047" : hovered ? "#fbbf24" : baseColor;

  return (
    <mesh
      ref={meshRef}
      position={[midX, yPosition, midZ]}
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

const Opening = ({ start, end, data, onSelect, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const [x1, y1] = start;
  const [x2, y2] = end;
  
  const dx = (x2 - x1) * SCALE;
  const dy = (y2 - y1) * SCALE;
  const length = Math.sqrt(dx * dx + dy * dy) || 0.1; 
  
  const angle = Math.atan2(dy, dx);
  
  const midX = (x1 + x2) / 2 * SCALE;
  const midZ = (y1 + y2) / 2 * SCALE;
  
  const thickness = 0.4; // Slightly thicker than walls to overhang beautifully
  const isWindow = data?.type === "Window";
  
  // Doors hit floor (height 2m). Windows hit y=1 (height 1.2m).
  const height = isWindow ? 1.2 : 2.0; 
  const yPosition = isWindow ? 1.0 + (height/2) : height / 2; 
  
  const baseColor = isWindow ? "#38bdf8" : "#451a03"; 
  const color = isSelected ? "#fde047" : hovered ? "#fbbf24" : baseColor;

  return (
    <mesh
      ref={meshRef}
      position={[midX, yPosition, midZ]}
      rotation={[0, -angle, 0]}
      castShadow={!isWindow}
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
      <meshStandardMaterial 
        color={color} 
        transparent={isWindow} 
        opacity={isWindow ? 0.3 : 1.0} 
        roughness={isWindow ? 0.1 : 0.8}
        metalness={isWindow ? 0.8 : 0.1}
      />
    </mesh>
  );
};

const RoomLabel = ({ data }) => {
  if (!data?.center) return null;
  const [x, z] = data.center;
  return (
    <group position={[x * SCALE, 0.1, z * SCALE]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
         <circleGeometry args={[0.5, 32]} />
         <meshStandardMaterial color="#3b82f6" transparent opacity={0.3} />
      </mesh>
      <Text position={[0, 0.5, 0]} fontSize={0.8} color="#1e3a8a" anchorX="center" anchorY="middle">
        {data.name || "Room"}
      </Text>
    </group>
  );
};

const Scene = ({ walls = [], rooms = [], openings = [], onSelectWall, selectedWall }) => {
  // Discover exact architectural Center to prevent Drei fractional warping
  const bounds = useMemo(() => {
    if (!walls?.length) return { cx: 0, cz: 0 };
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    walls.forEach(w => {
      minX = Math.min(minX, w.start[0] * SCALE, w.end[0] * SCALE);
      maxX = Math.max(maxX, w.start[0] * SCALE, w.end[0] * SCALE);
      minZ = Math.min(minZ, w.start[1] * SCALE, w.end[1] * SCALE);
      maxZ = Math.max(maxZ, w.start[1] * SCALE, w.end[1] * SCALE);
    });
    return { cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 };
  }, [walls]);

  return (
    <div className="w-full h-full bg-transparent rounded-lg">
       <Canvas
        shadows
        camera={{ position: [20, 20, 20], fov: 50 }}
        style={{ width: '100%', height: '100%' }}
        onPointerMissed={() => onSelectWall && onSelectWall(null)}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
        
        {/* Helper Grids mapping 3D environment securely */}
        <gridHelper args={[100, 100, '#38bdf8', '#1e293b']} material-opacity={0.15} transparent />
        <axesHelper args={[5]} />

        {/* Floor Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#020617" transparent opacity={0.4} />
        </mesh>
        
        {/* Native absolute cartesian group mapping centered explicitly */}
        {walls && walls.length > 0 ? (
          <group position={[-bounds.cx, 0, -bounds.cz]}>
            {walls.map((wall, index) => (
                <Wall 
                  key={wall.id || `w_${index}`} 
                  start={wall.start}
                  end={wall.end}
                  data={wall} 
                  onSelect={onSelectWall}
                  isSelected={selectedWall?.id === wall.id}
                />
            ))}
            {openings && openings.length > 0 && openings.map((op, index) => (
                <Opening 
                  key={op.id || `op_${index}`} 
                  start={op.start}
                  end={op.end}
                  data={op} 
                  onSelect={onSelectWall} 
                  isSelected={selectedWall?.id === op.id}
                />
            ))}
            {rooms && rooms.length > 0 && rooms.map((room, index) => (
                <RoomLabel key={`room_${index}`} data={room} />
            ))}
          </group>
        ) : (
          <Center>
            <group>
              <mesh position={[0, 1, 0]}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="#cbd5e1" wireframe />
              </mesh>
              <Text position={[0, 2.5, 0]} fontSize={0.4} color="#64748b">
                Awaiting Backend
              </Text>
            </group>
          </Center>
        )}

        <OrbitControls 
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={2}
          maxDistance={80}
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
}

export default Scene;