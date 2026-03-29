import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadBox from './components/UploadBox';
import Scene from './components/Scene';
import Sidebar from './components/Sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cvLoaded, setCvLoaded] = useState(false);

  // API/Processing State
  const [walls, setWalls] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [explanations, setExplanations] = useState([]);
  const [selectedWall, setSelectedWall] = useState(null);

  useEffect(() => {
    if (window.cv && window.cv.Mat) {
      setCvLoaded(true);
      return;
    }

    if (document.getElementById('opencv-script')) return;

    const script = document.createElement("script");
    script.id = 'opencv-script';
    script.src = "https://docs.opencv.org/4.x/opencv.js";
    script.async = true;
    script.onload = () => {
      const checkCvInterval = setInterval(() => {
        if (window.cv && window.cv.Mat) {
          clearInterval(checkCvInterval);
          setCvLoaded(true);
        }
      }, 100);
    };
    script.onerror = () => {
      setError("Failed to load OpenCV.js. Please check your internet connection.");
    };
    document.body.appendChild(script);
  }, []);

  const processImage = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      if (!window.cv || !window.cv.Mat) {
        reject(new Error("OpenCV is not fully loaded."));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const cv = window.cv;
          let src = cv.imread(img);
          let gray = new cv.Mat();
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
          
          let blurred = new cv.Mat();
          cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
          
          // 1. Binary Threshold (Assume walls are darker than bg initially, THRESH_BINARY_INV flips)
          let binary = new cv.Mat();
          cv.threshold(blurred, binary, 150, 255, cv.THRESH_BINARY_INV | cv.THRESH_OTSU);
          
          // 2. Morphological Cleanup (Aggressive 5x5 to fuse thick structural noise)
          let cleaned = new cv.Mat();
          let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
          cv.morphologyEx(binary, cleaned, cv.MORPH_CLOSE, kernel);
          cv.dilate(cleaned, cleaned, kernel); 

          // 3. Morphological Skeletonization (Thinning)
          let skel = new cv.Mat.zeros(cleaned.rows, cleaned.cols, cv.CV_8UC1);
          let temp = new cv.Mat();
          let eroded = new cv.Mat();
          let done;
          let iterations = 0;
          do {
            cv.erode(cleaned, eroded, kernel);
            cv.dilate(eroded, temp, kernel);
            cv.subtract(cleaned, temp, temp);
            cv.bitwise_or(skel, temp, skel);
            eroded.copyTo(cleaned);
            
            done = (cv.countNonZero(cleaned) === 0);
            iterations++;
            if (iterations > 100) break;
          } while (!done);
          
          let pixels = [];
          let skelData = skel.data;
          let cols = skel.cols;
          for (let i = 0; i < skelData.length; i++) {
              if (skelData[i] > 0) {
                  pixels.push({x: i % cols, y: Math.floor(i / cols)});
              }
          }
          
          src.delete(); gray.delete(); blurred.delete(); binary.delete();
          cleaned.delete(); kernel.delete(); skel.delete(); temp.delete(); eroded.delete();

          if (pixels.length === 0) {
              resolve({ extractedWalls: [], debugLines: [], dimensions: {width: img.width, height: img.height} });
              return;
          }

          // Dynamic Scaling Parameters based on resolution
          let maxImgDim = Math.max(img.width, img.height);
          let clusterThreshold = Math.max(30, Math.floor(maxImgDim * 0.025)); // Huge magnetic grid to suck in parallel wobbles
          let connectionGap = Math.max(40, Math.floor(maxImgDim * 0.035));    // Bridge larger broken gaps
          let minLineLength = Math.max(45, Math.floor(maxImgDim * 0.04));     // Completely drop structural noise

          // 5. Global Magnetic Axes Snap
          let allX = pixels.map(p => p.x);
          let allY = pixels.map(p => p.y);
          
          const clusterValues = (values, threshold) => {
              let unique = Array.from(new Set(values)).sort((a,b)=>a-b);
              if (unique.length === 0) return [];
              
              let clusters = [];
              let currentCluster = [unique[0]];
              
              for (let i = 1; i < unique.length; i++) {
                  if (unique[i] - currentCluster[currentCluster.length - 1] < threshold) {
                      currentCluster.push(unique[i]);
                  } else {
                      clusters.push(currentCluster);
                      currentCluster = [unique[i]];
                  }
              }
              clusters.push(currentCluster);
              return clusters.map(c => Math.round(c.reduce((a,b)=>a+b,0)/c.length));
          };
          
          let gridX = clusterValues(allX, clusterThreshold);
          let gridY = clusterValues(allY, clusterThreshold);

          const snapToCluster = (val, clusters, threshold) => {
              let minD = Infinity; let closest = val;
              for (let c of clusters) {
                  let d = Math.abs(c - val);
                  if (d < minD) { minD = d; closest = c; }
              }
              return minD <= threshold ? closest : val;
          };

          for (let p of pixels) {
              p.x = snapToCluster(p.x, gridX, clusterThreshold);
              p.y = snapToCluster(p.y, gridY, clusterThreshold);
          }

          // 6. Assemble Extruded Contiguous Segments
          let hLines = [];
          let groupedY = {};
          pixels.forEach(p => {
              if (!groupedY[p.y]) groupedY[p.y] = [];
              groupedY[p.y].push(p.x);
          });
          
          // Rebuild H walls
          for (let y in groupedY) {
              let xVals = Array.from(new Set(groupedY[y])).sort((a,b)=>a-b);
              if (xVals.length < 2) continue;
              
              let currentStart = xVals[0];
              let currentEnd = xVals[0];
              for (let i = 1; i < xVals.length; i++) {
                  if (xVals[i] - currentEnd <= connectionGap) {
                      currentEnd = xVals[i]; 
                  } else {
                      if (currentEnd - currentStart >= minLineLength) {
                          hLines.push({x1: currentStart, y1: Number(y), x2: currentEnd, y2: Number(y)});
                      }
                      currentStart = xVals[i];
                      currentEnd = xVals[i];
                  }
              }
              if (currentEnd - currentStart >= minLineLength) {
                  hLines.push({x1: currentStart, y1: Number(y), x2: currentEnd, y2: Number(y)});
              }
          }
          
          let vLines = [];
          let groupedX = {};
          pixels.forEach(p => {
              if (!groupedX[p.x]) groupedX[p.x] = [];
              groupedX[p.x].push(p.y);
          });
          
          // Rebuild V walls
          for (let x in groupedX) {
              let yVals = Array.from(new Set(groupedX[x])).sort((a,b)=>a-b);
              if (yVals.length < 2) continue;
              
              let currentStart = yVals[0];
              let currentEnd = yVals[0];
              for (let i = 1; i < yVals.length; i++) {
                  if (yVals[i] - currentEnd <= connectionGap) {
                      currentEnd = yVals[i];
                  } else {
                      if (currentEnd - currentStart >= minLineLength) {
                          vLines.push({x1: Number(x), y1: currentStart, x2: Number(x), y2: currentEnd});
                      }
                      currentStart = yVals[i];
                      currentEnd = yVals[i];
                  }
              }
              if (currentEnd - currentStart >= minLineLength) {
                  vLines.push({x1: Number(x), y1: currentStart, x2: Number(x), y2: currentEnd});
              }
          }
          
          // 7. Ensure Outer Boundary connection Extensions
          for (let h of hLines) {
              for (let v of vLines) {
                  if (v.y1 - 25 <= h.y1 && v.y2 + 25 >= h.y1) {
                      if (v.x1 < h.x1 && Math.abs(h.x1 - v.x1) < 40) h.x1 = v.x1;
                      if (v.x1 > h.x2 && Math.abs(v.x1 - h.x2) < 40) h.x2 = v.x1;
                  }
              }
          }
          for (let v of vLines) {
              for (let h of hLines) {
                  if (h.x1 - 25 <= v.x1 && h.x2 + 25 >= v.x1) {
                      if (h.y1 < v.y1 && Math.abs(v.y1 - h.y1) < 40) v.y1 = h.y1;
                      if (h.y1 > v.y2 && Math.abs(v.y1 - h.y2) < 40) v.y2 = h.y1;
                  }
              }
          }

          let finalLines = [...hLines, ...vLines];

          // 8. Scale Normalization Engine
          const extractedWalls = [];
          const dimensions = { width: img.width, height: img.height };
          
          if (finalLines.length > 0) {
            let minBoundsX = Infinity, maxBoundsX = -Infinity;
            let minBoundsY = Infinity, maxBoundsY = -Infinity;
            
            for (let l of finalLines) {
                minBoundsX = Math.min(minBoundsX, l.x1, l.x2);
                maxBoundsX = Math.max(maxBoundsX, l.x1, l.x2);
                minBoundsY = Math.min(minBoundsY, l.y1, l.y2);
                maxBoundsY = Math.max(maxBoundsY, l.y1, l.y2);
            }
            
            let centroidX = (minBoundsX + maxBoundsX) / 2;
            let centroidY = (minBoundsY + maxBoundsY) / 2;
            let maxDim = Math.max(maxBoundsX - minBoundsX, maxBoundsY - minBoundsY, 100);
            let scale = maxDim / 20.0;

            let idCounter = 0;
            finalLines.forEach((line) => {
              if (Math.abs(line.x1 - line.x2) < 0.1 && Math.abs(line.y1 - line.y2) < 0.1) return;
              
              let nx1 = (line.x1 - centroidX) / scale;
              let ny1 = (line.y1 - centroidY) / scale;
              let nx2 = (line.x2 - centroidX) / scale;
              let ny2 = (line.y2 - centroidY) / scale;
              
              extractedWalls.push({
                id: `wall_${idCounter++}`,
                start: [nx1, ny1],
                end: [nx2, ny2],
                type: "Extruded Structural Skeleton",
                material: "Concrete",
                explanation: `Exact Morphological Centerline. Clean bounding block.`
              });
            });
          }
          
          resolve({ extractedWalls, debugLines: finalLines, dimensions });
        } catch (e) {
          console.error(e);
          reject(new Error("Error executing OpenCV Skeletonization routine."));
        }
      };
      
      img.onerror = () => reject(new Error("Failed to load image for processing."));
      img.src = imageDataUrl;
    });
  };

  const handleFileUpload = async (imageData) => {
    setUploadedImage(imageData);
    setActiveTab('3d'); 
    setIsLoading(true);
    setError(null);

    try {
      if (!cvLoaded) {
        throw new Error("OpenCV is still loading. Please wait a moment and try again.");
      }

      const { extractedWalls: newWalls, debugLines, dimensions } = await processImage(imageData.preview);

      setUploadedImage(prev => ({
        ...prev,
        debugLines,
        dimensions
      }));

      setWalls(newWalls);
      setMaterials([{ name: "Standard Drywall", type: "Interior", rating: "4.8/5", price: "$25/sq.m" }]);
      setExplanations([
        newWalls.length > 0
          ? `Successfully generated structured, grid-aligned 3D model with ${newWalls.length} clean walls.`
          : "No structural lines were detected in this image."
      ]);
      
      if (newWalls.length > 0) {
        setSelectedWall(newWalls[0]);
      } else {
        setSelectedWall(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setWalls([]);
    setMaterials([]);
    setExplanations([]);
    setSelectedWall(null);
    setError(null);
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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
              <p className="font-bold">Error Processing Image</p>
              <p>{error}</p>
            </div>
          )}
          {!cvLoaded && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-md text-sm border border-blue-200">
              <span className="flex items-center">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></span>
                Downloading and initializing computer vision engine (OpenCV.js)...
              </span>
            </div>
          )}
        </div>

        {/* Bottom Split (Left: 3D Canvas, Right: Sidebar Details) */}
        {(uploadedImage || walls.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow">
            {/* Left Section (70%): 3D Model Canvas */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">3D Interactive Map</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-sm">
                    {walls.length} Walls Detected
                  </span>
                </div>
                <div className="w-full flex-grow relative bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-xl font-bold text-blue-700">Extracting Geometry with OpenCV...</p>
                      </div>
                    </div>
                  )}
                  <Scene walls={walls} onSelectWall={setSelectedWall} />
                </div>
              </div>
            </div>

            {/* Right Section (30%): Details Sidebar */}
            <div className="lg:col-span-1">
              <Sidebar 
                activeTab={activeTab === 'upload' ? 'walls' : activeTab}
                walls={walls}
                materials={materials}
                explanations={explanations}
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