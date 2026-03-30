export const MATERIAL_DB = [
  // Load bearing
  { name: "Red Brick", cost: 120, durability: 125, category: "load-bearing" },
  { name: "Fly Ash Brick", cost: 90, durability: 95, category: "load-bearing" },
  { name: "Precast Concrete", cost: 250, durability: 260, category: "load-bearing" },
  // Partition
  { name: "AAC Blocks", cost: 130, durability: 130, category: "partition" },
  { name: "Hollow Concrete Block", cost: 110, durability: 105, category: "partition" },
  { name: "Basic Drywall", cost: 50, durability: 40, category: "partition" },
  // Structural Spine
  { name: "RCC Frame", cost: 400, durability: 450, category: "structural-spine" },
  { name: "Reinforced Precast", cost: 300, durability: 320, category: "structural-spine" },
  // Spans > 5m
  { name: "Steel Frame I-Beam", cost: 600, durability: 650, category: "long-span" },
];

const evaluateMaterial = (material) => {
  const k = material.durability / material.cost;
  const penalty = k < 1 ? (1 - k) : (k - 1) * 0.5; 
  const score = Math.max(0, Math.round(100 - (penalty * 100)));

  let rating = "Poor";
  if (k >= 0.95 && k <= 1.05) rating = "Optimal";
  else if ((k >= 0.8 && k < 0.95) || (k > 1.05 && k <= 1.2)) rating = "Good";

  return { ...material, k: Number(k.toFixed(3)), score, rating };
};

const getOptimalMaterials = (category, lengthSpan) => {
  const targetCategory = lengthSpan > 5 ? "long-span" : category;
  
  let options = MATERIAL_DB.filter(m => m.category === targetCategory);
  if (options.length === 0) options = MATERIAL_DB.filter(m => m.category === category);

  return options
    .map(evaluateMaterial)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

export const analyzeLayout = (walls) => {
  if (!walls || walls.length === 0) return [];

  // 1. Map bounding box limits to isolate Load-Bearing shells
  let allX = [];
  let allY = [];
  walls.forEach(w => {
    allX.push(w.start[0], w.end[0]);
    allY.push(w.start[1], w.end[1]);
  });
  
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY);
  const maxY = Math.max(...allY);
  
  const width = Math.abs(maxX - minX);
  const height = Math.abs(maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const BORDER_TOLERANCE = Math.max(width, height) * 0.05; // 5% border threshold

  return walls.map((wall, index) => {
    const x1 = wall.start[0];
    const y1 = wall.start[1];
    const x2 = wall.end[0];
    const y2 = wall.end[1];

    // Compute Physical Characteristics
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    
    // Check connections (node matching)
    let connections = 0;
    const tol = BORDER_TOLERANCE / 2;
    const match = (p1, p2) => Math.hypot(p1[0] - p2[0], p1[1] - p2[1]) < tol;
    
    walls.forEach((w, wIdx) => {
      if (wIdx === index) return;
      if (match(w.start, wall.start) || match(w.start, wall.end) || match(w.end, wall.start) || match(w.end, wall.end)) {
        connections++;
      }
    });

    // Determine Classification
    const isLeftBorder = Math.abs(x1 - minX) < BORDER_TOLERANCE && Math.abs(x2 - minX) < BORDER_TOLERANCE;
    const isRightBorder = Math.abs(x1 - maxX) < BORDER_TOLERANCE && Math.abs(x2 - maxX) < BORDER_TOLERANCE;
    const isTopBorder = Math.abs(y1 - minY) < BORDER_TOLERANCE && Math.abs(y2 - minY) < BORDER_TOLERANCE;
    const isBottomBorder = Math.abs(y1 - maxY) < BORDER_TOLERANCE && Math.abs(y2 - maxY) < BORDER_TOLERANCE;
    
    let type = "Partition";
    let color = "#3b82f6"; // Blue
    let categoryKey = "partition";
    let explanationTemplate = "";

    const isOuter = isLeftBorder || isRightBorder || isTopBorder || isBottomBorder;
    const isCentral = Math.hypot(midX - centerX, midY - centerY) < (Math.max(width, height) * 0.25);

    if (isOuter || length > 8) {
      type = "Load-Bearing";
      color = "#ef4444"; // Red
      categoryKey = "load-bearing";
      explanationTemplate = `This wall forms an outer structural shell or spans a massive length (${length.toFixed(1)} units). It is strictly Load-Bearing. We highly prioritize standard hardened brick geometries with structural density here.`;
    } else if (isCentral && connections >= 2 && length > 3) {
      type = "Structural Spine";
      color = "#a855f7"; // Purple
      categoryKey = "structural-spine";
      explanationTemplate = `Located centrally with ${connections} junction connections locking the structure together. This is a critical structural spine, requiring hardened heavy-duty frames rather than lightweight partitions.`;
    } else {
      type = "Partition";
      color = "#3b82f6"; // Blue
      categoryKey = "partition";
      explanationTemplate = `This internal segment spans ${length.toFixed(1)} units with minimal foundational connections. It serves merely as a spatial partition, opening up massive cost-savings via AAC layout blocks or drywall.`;
    }

    // Embed Materials Output
    const recommended_materials = getOptimalMaterials(categoryKey, length);
    
    // Create the full human explanation backing up the specific #1 choice
    const topMaterial = recommended_materials[0];
    const explanation = `${explanationTemplate} ${topMaterial.name} proves optimal with an efficiency vector of k=${topMaterial.k}.`;

    return {
      ...wall,
      id: wall.id || `wall_${index}`,
      type,
      color,
      length,
      connections,
      recommended_materials,
      explanation
    };
  });
};
