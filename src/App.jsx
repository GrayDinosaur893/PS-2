import React, { useState } from 'react';
import Navbar from './components/Navbar';
import UploadBox from './components/UploadBox';
import Scene from './components/Scene';
import Sidebar from './components/Sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Layout Data State from API
  const [walls, setWalls] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [openings, setOpenings] = useState([]);
  const [dimensions, setDimensions] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedWall, setSelectedWall] = useState(null);

  const handleFileUpload = async (imageData) => {
    setUploadedImage(imageData);
    setActiveTab('3d'); 
    setIsLoading(true);
    setError(null);

    try {
      if (!imageData.file) {
        throw new Error("No valid file provided for processing.");
      }

      // 1. Pack image into FormData
      const formData = new FormData();
      formData.append("file", imageData.file);

      // 2. Fetch Structured JSON from full Python OpenCV pipeline
      const response = await fetch("http://127.0.0.1:8000/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      
      console.log("API DATA:", data);
      console.log("Walls:", data.walls);
      console.log("Materials:", data.materials);
      
      if (data.error) {
         throw new Error(data.error);
      }

      // 3. Native Data Fetching (Do NOT calculate React side geometry anymore)
      setWalls(data.walls || []);
      setRooms(data.rooms || []);
      setOpenings(data.openings || []);
      setDimensions(data.dimensions || null);
      setMaterials(data.materials || []);
      
      setUploadedImage(prev => ({ ...prev, dimensions: data.dimensions }));

      if (data.walls && data.walls.length > 0) {
        setSelectedWall(data.walls[0]);
      } else {
        setSelectedWall(null);
      }
    } catch (err) {
      console.error("Backend fetch error:", err);
      setError("Failed to parse floor plan via API: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setWalls([]);
    setRooms([]);
    setOpenings([]);
    setMaterials([]);
    setDimensions(null);
    setSelectedWall(null);
    setError(null);
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="container mx-auto px-4 py-6 flex-grow flex flex-col">
        {/* Top: Upload Section */}
        <div className="mb-6">
          <UploadBox
            onFileUpload={handleFileUpload}
            previewImage={uploadedImage}
            onRemoveImage={handleRemoveImage}
            isLoading={isLoading}
          />
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <p className="font-bold">Error Connecting to Backend</p>
              <p>{error}</p>
              <p className="text-sm mt-1">Make sure 'uvicorn api:app --reload' is actively running on port 8000.</p>
            </div>
          )}
        </div>

        {/* Bottom Split (Left: 3D Canvas, Right: Sidebar Details) */}
        {(uploadedImage || walls.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
            {/* Left Section (70%): 3D Model Canvas */}
            <div className="lg:col-span-2">
              <div className="glass-panel p-6 h-full min-h-[500px] flex flex-col hover-scale relative z-10 transition-all duration-300 hover:glass-glow">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl text-blue-400 font-clash tracking-wider drop-shadow-md">ARENA 3D MAP</h2>
                  <span className="bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold px-3 py-1 rounded-sm shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                    {walls.length} BOUNDS
                  </span>
                </div>
                <div className="w-full flex-grow relative rounded-lg border border-white/5 overflow-hidden shadow-inner bg-black/20">
                  {isLoading && (
                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-md flex items-center justify-center border border-blue-500/20 rounded-lg">
                      <div className="text-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-r-2 border-transparent border-t-blue-400 border-l-blue-400 mx-auto mb-4 drop-shadow-[0_0_12px_rgba(56,189,248,0.8)]"></div>
                         <p className="text-xl font-clash text-blue-300 tracking-wider">GENERATING ARENA...</p>
                      </div>
                    </div>
                  )}
                  <Scene 
                    walls={walls} 
                    rooms={rooms} 
                    openings={openings} 
                    onSelectWall={setSelectedWall} 
                    selectedWall={selectedWall}
                  />
                </div>
              </div>
            </div>

            {/* Right Section (30%): Details Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar 
                activeTab={activeTab === '3d' ? 'walls' : activeTab}
                walls={walls}
                openings={openings}
                materials={materials}
                selectedWall={selectedWall}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;