import React, { useMemo } from 'react';
import { CubeIcon, PaintBrushIcon, DocumentTextIcon, ChartBarIcon, TagIcon } from '@heroicons/react/24/outline';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, CartesianGrid, ZAxis } from 'recharts';

export const evaluateMaterial = (cost, durability) => {
  if (cost <= 0) return { k: 0, score: 0, rating: "Poor" };
  const k = durability / cost;
  const penalty = k < 1 ? (1 - k) : (k - 1) * 0.5; 
  const score = Math.max(0, Math.round(100 - (penalty * 100)));

  let rating = "Poor";
  if (k >= 0.95 && k <= 1.05) rating = "Optimal";
  else if ((k >= 0.8 && k < 0.95) || (k > 1.05 && k <= 1.2)) rating = "Good";
  return { k: Number(k.toFixed(3)), score, rating };
};

export const MaterialBar = ({ name, cost, durability, k, score, rating }) => {
  const getZoneColor = (kValue) => {
    if (kValue < 0.8) return 'bg-red-500'; 
    if (kValue >= 0.95 && kValue <= 1.05) return 'bg-green-500'; 
    return 'bg-yellow-400'; 
  };

  const currentK = k !== undefined ? k : (durability && cost ? durability/cost : 0);
  const currentScore = score !== undefined ? score : 0;
  const currentRating = rating !== undefined ? rating : "Poor";
  const barPosition = Math.min(Math.max((currentK / 2) * 100, 5), 95); 

  return (
    <div className="w-full relative p-4 glass-panel hover-scale transition-all duration-300 mb-2 border-l-4 border-l-blue-400/50">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-md font-clash tracking-wider text-slate-100 drop-shadow-sm">{name}</h3>
          {(cost && durability) && <p className="text-xs text-slate-400 mt-1">Cost: <span className="text-blue-400 font-mono">${cost}</span> | Durability: <span className="text-green-400 font-mono">{durability}</span></p>}
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-black rounded text-white shadow-lg ${getZoneColor(currentK)}`}>
            {currentRating}
          </span>
          <p className="text-sm font-black text-slate-300 mt-1">{currentScore}<span className="text-[10px] text-slate-500 font-normal">/100</span></p>
        </div>
      </div>

      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <span>Inefficient</span>
          <span className="text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">k=1.0</span>
          <span>Over-engineered</span>
        </div>
        <div className="overflow-hidden h-2.5 mb-1 text-xs flex rounded-full bg-slate-700/50 relative shadow-inner">
          <div className="absolute left-0 w-1/3 h-full bg-red-500/80" />
          <div className="absolute left-1/3 w-1/3 h-full bg-green-400/80" />
          <div className="absolute right-0 w-1/3 h-full bg-yellow-400/80" />
          <div 
            className={`absolute h-4 w-4 -mt-0.5 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-500 ${getZoneColor(currentK)}`}
            style={{ left: `calc(${barPosition}% - 8px)` }}
          />
        </div>
      </div>
    </div>
  );
};

// ==========================================
// MODULAR VIEW: MATERIALS
// ==========================================
const MaterialsView = ({ materials }) => {
  if (!materials || materials.length === 0) {
    return (
      <div className="glass-panel p-6 text-center border border-white/5">
        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">No material data available.</p>
      </div>
    );
  }

  // Extract all recommended materials from the backend output
  const allRecommended = [];
  materials.forEach(matObj => {
     if (matObj && matObj.best_option) {
         if (!allRecommended.find(x => x.name === matObj.best_option.name)) {
             allRecommended.push(matObj.best_option);
         }
     }
  });

  const sortedMaterials = [...allRecommended].sort((a,b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="glass-panel p-6 flex flex-col max-h-[700px]">
      <div className="flex items-center mb-4 shrink-0 border-b border-slate-700 pb-3">
        <PaintBrushIcon className="h-6 w-6 text-blue-400 mr-3 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        <h3 className="text-xl font-clash text-blue-300 drop-shadow-md tracking-wider">MATERIAL EFFICIENCY</h3>
      </div>
      <div className="overflow-y-auto space-y-4 pr-2 pb-4 flex-grow">
        {sortedMaterials.map((item, index) => (
          <div key={index} className="relative">
             {index === 0 && <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full z-10 shadow-sm font-bold tracking-wide">TOP PICK</span>}
             <MaterialBar 
                name={item.name} 
                k={item.k} 
                score={item.score} 
                rating={item.rating} 
             />
          </div>
        ))}
      </div>
    </div>
  );
};


// ==========================================
// MODULAR VIEW: WALLS (DETAILS)
// ==========================================
const WallsView = ({ walls, selectedWall }) => {
  if (!walls || walls.length === 0) {
    return (
      <div className="glass-panel p-6 text-center border border-white/5">
        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">No walls available yet.</p>
      </div>
    );
  }

  if (!selectedWall) {
    return (
      <div className="glass-panel p-6 text-center border border-white/5">
         <p className="text-slate-300 font-medium">Select a wall in the 3D viewer to see its structural details.</p>
         <p className="text-blue-400/80 text-xs mt-2 font-mono">({walls.length} architecture elements available)</p>
      </div>
    );
  }

  const data = selectedWall;
  const opt = data.best_option || {};

  return (
    <div className="glass-panel glass-glow-gold hover-scale p-6 transition-all duration-300">
      <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-3">
        <div className="flex items-center">
          <CubeIcon className="h-6 w-6 text-yellow-400 mr-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
          <h3 className="text-xl font-clash tracking-wider text-yellow-100 drop-shadow-md">SELECTION PROFILE</h3>
        </div>
        <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-md shadow-inner">{data.id}</span>
      </div>
      
      <div className="space-y-4">
         <div className="grid grid-cols-2 gap-4 text-sm bg-slate-900/50 border border-slate-700/50 p-4 rounded-xl shadow-inner shadow-black/50">
           <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-widest">Type</span>
              <p className="font-bold text-slate-200 mt-1">{data.type || 'Not computed'}</p>
           </div>
           <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-widest">Length</span>
              <p className="font-bold text-slate-200 mt-1">{data.length ? `${data.length.toFixed(2)} units` : 'Not computed'}</p>
           </div>
           <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-widest">Thickness</span>
              <p className="font-bold text-slate-200 mt-1">{data.thickness || 'Not computed'}</p>
           </div>
           <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-widest">Material</span>
              <p className="font-black text-blue-400 drop-shadow-sm mt-1 uppercase tracking-tight">{opt.name || 'Not computed'}</p>
           </div>
         </div>

         <div className="flex items-center justify-between border-b border-slate-700 pb-2">
             <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide font-bold">Durability Ratio (k)</span>
                <p className="font-clash text-2xl text-indigo-300 drop-shadow-sm mt-1">{opt.k !== undefined ? opt.k : 'N/A'}</p>
             </div>
             {opt.rating && (
                 <div className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded shadow-md text-white 
                    ${opt.rating === 'Optimal' ? 'bg-green-500' : opt.rating === 'Good' ? 'bg-yellow-500' : 'bg-red-500'}`}>
                    {opt.rating}
                 </div>
             )}
         </div>

         <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 shadow-inner">
           <span className="flex items-center text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">
             <DocumentTextIcon className="w-4 h-4 mr-1" />
             AI Engine Optimization
           </span>
           <p className="text-sm text-slate-300 italic leading-relaxed">
             {opt.reason || 'Not computed.'}
           </p>
         </div>
      </div>
    </div>
  );
};

// ==========================================
// MODULAR VIEW: OVERVIEW DASHBOARD
// ==========================================
const OverviewView = ({ walls, openings, materials }) => {
  if (!walls || walls.length === 0) {
    return (
      <div className="glass-panel p-6 text-center border border-white/5">
        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">No overview available yet.</p>
      </div>
    );
  }

  const { overviewStats } = useMemo(() => {
    let totalLength = 0;
    let loadBearing = 0;
    let partition = 0;
    let structural = 0;
    let kWeightedSum = 0;
    let weightSum = 0;
    let bestEl = null; let weakEl = null; let bestDiff = Infinity;
    let materialCounts = {};
    
    const totalElements = walls.length + (openings?.length || 0);

    const processElement = (el, weight) => {
      totalLength += el.length || 0;
      const option = el.best_option || {};
      const k = option.k;
      const material = option.name || "Unknown";
      materialCounts[material] = (materialCounts[material] || 0) + 1;

      if (k !== undefined && k > 0) {
         kWeightedSum += (k * weight);
         weightSum += weight;
         const diff = Math.abs(1.0 - k);
         if (diff < bestDiff) { bestDiff = diff; bestEl = el; }
         if (!weakEl || k < weakEl.best_option.k) { weakEl = el; }
      }
    };

    walls.forEach(w => {
       if (w.type === "load-bearing") loadBearing++;
       else if (w.type === "partition") partition++;
       else if (w.type?.includes("structural")) structural++;
       processElement(w, 1.0); 
    });
    
    if (openings) {
      openings.forEach(o => processElement(o, o.type === "Door" ? 0.6 : 0.5));
    }
    
    const avgK = weightSum > 0 ? (kWeightedSum / weightSum) : 0;
    let bestMaterialUsage = { name: "None", percent: 0 };
    if (totalElements > 0) {
       let maxCount = 0;
       for (const [mat, count] of Object.entries(materialCounts)) {
          if (count > maxCount) {
             maxCount = count;
             bestMaterialUsage = { name: mat, percent: Math.round((count/totalElements)*100) };
          }
       }
    }

    return { 
      overviewStats: {
        totalElements, totalWalls: walls.length,
        totalDoors: (openings || []).filter(o => o.type === "Door").length,
        totalWindows: (openings || []).filter(o => o.type === "Window").length,
        loadBearing, partition, structural,
        totalLength: totalLength.toFixed(1),
        avgK: avgK.toFixed(3),
        bestMaterialUsage, bestEl, weakEl
      }
    };
  }, [walls, openings]);

  // Compute Recharts Data Arrays safely mapping backend payload!
  const { barData, scatterData } = useMemo(() => {
    if (!materials || materials.length === 0) return { barData: [], scatterData: [] };
    
    const uniqueMats = [];
    materials.forEach(matObj => {
       if (matObj && matObj.best_option) {
          if (!uniqueMats.find(x => x.name === matObj.best_option.name)) {
              uniqueMats.push(matObj.best_option);
          }
       }
    });

    const scatterFormat = [];
    const barFormat = [];

    uniqueMats.forEach(opt => {
       barFormat.push({ name: opt.name, k: opt.k, rating: opt.rating });
       if (opt.cost !== undefined && opt.durability !== undefined) {
         scatterFormat.push({
            name: opt.name,
            cost: opt.cost,
            durability: opt.durability,
            k: opt.k,
            rating: opt.rating
         });
       }
    });

    return { barData: barFormat, scatterData: scatterFormat };
  }, [materials]);

  // UI mapping logic: Chart Tooltip Renderers
  const CustomScatterTooltip = ({ active, payload }) => {
     if (active && payload && payload.length) {
         const data = payload[0].payload;
         return (
             <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg text-white">
                 <p className="text-xs font-bold text-gray-200 mb-1">{data.name}</p>
                 <p className="text-xs text-gray-400">Cost: <span className="text-blue-400">${data.cost}</span></p>
                 <p className="text-xs text-gray-400">Durability: <span className="text-green-400">{data.durability}</span></p>
                 <div className="mt-2 border-t border-gray-700 pt-2 flex justify-between items-center text-xs">
                     <span className="text-gray-400">Ratio (k): </span>
                     <span className="font-bold text-yellow-400">{data.k}</span>
                 </div>
                 <div className={`mt-1 text-center font-bold text-[10px] uppercase rounded py-1
                      ${data.rating === 'Optimal' ? 'bg-green-600' : data.rating === 'Good' ? 'bg-yellow-600' : 'bg-red-600'}`}>
                      {data.rating}
                 </div>
             </div>
         );
     }
     return null;
  };

// ==========================================
// RENDER OVERVIEW CHARTS INTERFACE
// ==========================================
  return (
    <div className="glass-panel p-6 flex-grow flex flex-col max-h-[1400px] overflow-y-auto">
      <div className="flex items-center mb-6 border-b border-slate-700 pb-3 shrink-0">
        <ChartBarIcon className="h-6 w-6 text-blue-400 mr-3 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
        <h3 className="text-xl font-clash text-blue-300 tracking-wider drop-shadow-md">OPTIMIZATION DASHBOARD</h3>
      </div>
      
      {/* Structural Math Visualization Base */}
      <div className="bg-gray-900 rounded-lg p-5 mb-6 border border-gray-800 shadow-inner shrink-0">
         <h4 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-1 text-gray-500" /> Optimization Function Definition
         </h4>
         <div className="grid grid-cols-2 gap-4">
             <div>
                <div className="text-green-400 font-mono text-lg lg:text-xl font-bold bg-black/40 p-2 rounded block mb-1">
                   f(x) = k * g(x)
                </div>
                <div className="text-blue-400 font-mono text-xs lg:text-sm font-bold bg-black/40 p-2 rounded block mt-2">
                   k = durability / cost
                </div>
             </div>
             <div className="text-xs text-gray-300 space-y-2 bg-black/40 p-3 rounded flex flex-col justify-center">
                <div className="flex justify-between border-b border-gray-700 pb-1">
                   <span className="font-mono text-green-400">k ≈ 1</span>
                   <span className="text-gray-400">Optimal Balance</span>
                </div>
                <div className="flex justify-between border-b border-gray-700 pb-1">
                   <span className="font-mono text-red-400">k &lt; 1</span>
                   <span className="text-gray-400">Inefficient Load</span>
                </div>
                <div className="flex justify-between">
                   <span className="font-mono text-yellow-400">k &gt; 1</span>
                   <span className="text-gray-400">Over-Engineered</span>
                </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 shrink-0">
         <div className="p-4 bg-slate-900/60 rounded-xl border border-white/5 shadow-inner flex items-center justify-between">
            <div>
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Structural Network Avg</span>
               <p className="text-3xl font-clash tracking-widest text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">{overviewStats.avgK}</p>
            </div>
            <div className="text-right">
               <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1">Total Bounds</span>
               <p className="text-xl font-bold text-slate-300">{overviewStats.totalLength} <span className="text-sm font-normal text-slate-600">units</span></p>
            </div>
         </div>
         <div className="space-y-2 flex flex-col justify-center">
            <div className="bg-slate-900/40 p-2 rounded-lg border border-green-500/20 border-l-4 border-l-green-400 shadow-sm relative overflow-hidden group">
               <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
               <div className="flex justify-between relative z-10">
                  <span className="text-[10px] text-green-400 uppercase font-black tracking-widest truncate">Most Efficient</span>
                  <span className="font-mono text-[10px] text-green-300 ml-2 drop-shadow-sm">k={overviewStats.bestEl?.best_option?.k}</span>
               </div>
               <p className="text-xs font-bold text-slate-200 mt-0.5 truncate relative z-10">{overviewStats.bestEl?.best_option?.name || "N/A"}</p>
            </div>
            <div className="bg-slate-900/40 p-2 rounded-lg border border-red-500/20 border-l-4 border-l-red-500 shadow-sm relative overflow-hidden group">
               <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
               <div className="flex justify-between relative z-10">
                  <span className="text-[10px] text-red-400 uppercase font-black tracking-widest truncate">Weakest Link</span>
                  <span className="font-mono text-[10px] text-red-300 ml-2 drop-shadow-sm">k={overviewStats.weakEl?.best_option?.k}</span>
               </div>
               <p className="text-xs font-bold text-slate-200 mt-0.5 truncate relative z-10">{overviewStats.weakEl?.best_option?.name || "N/A"}</p>
            </div>
         </div>
      </div>

      {/* Visual Data Mining / Graphs */}
      {barData.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 shadow-inner">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">Material Comparison Matrix (k)</h4>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                   <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#cbd5e1' }} interval={0} angle={-15} textAnchor="end" stroke="#475569" />
                   <YAxis tick={{ fontSize: 10, fill: '#cbd5e1' }} domain={[0, 'auto']} stroke="#475569" />
                   <RechartsTooltip 
                      cursor={{fill: '#f3f4f6'}}
                      contentStyle={{borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px'}}
                   />
                   <ReferenceLine y={1.0} stroke="#4ade80" strokeWidth={2} strokeDasharray="3 3" />
                   <ReferenceLine y={1.05} stroke="#4ade80" strokeOpacity={0.2} strokeWidth={20} />
                   <ReferenceLine y={0.95} stroke="#4ade80" strokeOpacity={0.2} strokeWidth={20} />
                   <Bar dataKey="k" maxBarSize={40}>
                     {barData.map((entry, index) => {
                        let fill = "#fde047"; // neon yellow (over-engineered)
                        if (entry.k < 0.95) fill = "#f87171"; // neon red
                        else if (entry.k >= 0.95 && entry.k <= 1.05) fill = "#4ade80"; // neon green
                        return <Cell key={`cell-${index}`} fill={fill} />;
                     })}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             <p className="text-center text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Optimal Threshold: [0.95 - 1.05]</p>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 shadow-inner">
             <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 text-center">Cost vs Durability Spread</h4>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: -10 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis type="number" dataKey="cost" name="Cost" unit="$" tick={{ fontSize: 10, fill: '#cbd5e1' }} stroke="#475569" />
                   <YAxis type="number" dataKey="durability" name="Durability" tick={{ fontSize: 10, fill: '#cbd5e1' }} stroke="#475569" />
                   <ZAxis range={[60, 60]} /> 
                   <RechartsTooltip content={<CustomScatterTooltip />} />
                   <Scatter data={scatterData} fill="#38bdf8" shape="circle" />
                 </ScatterChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      ) : (
         <div className="mt-8 text-center text-sm font-medium text-gray-400">
           Charts will map when metrics natively calculate via Pipeline.
         </div>
      )}
    </div>
  );
};

// ==========================================
// MAIN SIDEBAR ORCHESTRATOR
// ==========================================
const Sidebar = ({ activeTab, walls = [], openings = [], materials = [], selectedWall, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="glass-panel border-blue-500/20 p-12 text-center flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-transparent border-t-blue-400 border-l-blue-400 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)] mb-4"></div>
          <p className="font-clash text-blue-300 tracking-wider text-lg drop-shadow-md">PROCESSING ARENA...</p>
        </div>
      </div>
    );
  }

  // Active Tab Routing precisely bypassing default fallback traps!
  return (
    <div className="space-y-6 h-full flex flex-col pt-1">
      {activeTab === 'materials' && <MaterialsView materials={materials} />}
      {activeTab === 'walls' && <WallsView walls={walls} selectedWall={selectedWall} />}
      {activeTab === 'overview' && <OverviewView walls={walls} openings={openings} materials={materials} />}
      {activeTab === 'upload' && (
        <div className="glass-panel border-white/5 p-6 text-center py-12 flex flex-col justify-center items-center h-full">
            <h3 className="text-xl font-clash text-slate-300 tracking-wider">AWAITING ARCHITECTURE</h3>
            <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-widest">Please upload a blueprint to begin.</p>
        </div>
      )}
    </div>
  );
};

export default Sidebar;