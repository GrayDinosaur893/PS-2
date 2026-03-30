import React, { useState } from 'react';
import { CloudArrowUpIcon } from '@heroicons/react/24/outline';

const UploadBox = ({ onFileUpload, previewImage, onRemoveImage, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (isLoading) return;
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileUpload({
          file,
          preview: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      {!previewImage && (
        <>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-300 glass-panel ${
              isDragging
                ? 'border-blue-400 bg-blue-900/20 shadow-[0_0_15px_rgba(96,165,250,0.5)]'
                : isLoading
                ? 'border-slate-700 bg-black/40 opacity-60 cursor-not-allowed'
                : 'border-blue-500/30 hover:border-blue-400/80 hover:bg-slate-800/60 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]'
            }`}
             onDragOver={handleDragOver}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
          >
             <CloudArrowUpIcon className={`mx-auto h-16 w-16 mb-2 ${isLoading ? 'text-slate-600' : 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]'}`} />
             <div className="mt-4">
               <p className="text-xl font-clash tracking-widest text-slate-200 drop-shadow-md uppercase">
                 {isLoading ? 'UPLOADING BLUEPRINT...' : 'DROP ARENA BLUEPRINT HERE'}
               </p>
               {!isLoading && (
                 <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                   or click to upload from device
                 </p>
               )}
             </div>
             <input
               type="file"
               accept="image/*"
               onChange={handleFileInput}
               disabled={isLoading}
               className={`absolute inset-0 w-full h-full opacity-0 ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
             />
          </div>

          {!isLoading && (
             <div className="flex justify-center">
               <label className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                 <CloudArrowUpIcon className="mr-2 h-4 w-4" />
                 Select Floor Plan
                 <input
                   type="file"
                   accept="image/*"
                   onChange={handleFileInput}
                   className="hidden"
                 />
               </label>
             </div>
          )}
        </>
      )}

      {previewImage && (
        <div className="mt-6">
          <h3 className="text-xl text-blue-300 font-clash tracking-wider drop-shadow-md mb-2">ARENA PREVIEW</h3>
          <div className="relative glass-panel rounded-lg overflow-hidden border border-blue-500/20 shadow-[0_0_15px_rgba(0,0,0,0.8)] inline-block w-full">
            <img
              src={previewImage.preview}
              alt={previewImage.name}
              className={`w-full h-auto max-h-[600px] object-contain ${isLoading ? 'opacity-40 grayscale' : ''}`}
            />
            {previewImage.debugLines && previewImage.dimensions && !isLoading && (
              <svg 
                viewBox={`0 0 ${previewImage.dimensions.width} ${previewImage.dimensions.height}`}
                className="absolute top-0 left-0 w-full h-full pointer-events-none drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                preserveAspectRatio="xMidYMid meet"
              >
                {previewImage.debugLines.map((line, i) => (
                  <line 
                    key={i} 
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} 
                    stroke="#ef4444" strokeWidth="4" 
                    strokeLinecap="round"
                  />
                ))}
                {previewImage.debugLines.map((line, i) => (
                  <circle key={`p1-${i}`} cx={line.x1} cy={line.y1} r="5" fill="#38bdf8" />
                ))}
                {previewImage.debugLines.map((line, i) => (
                  <circle key={`p2-${i}`} cx={line.x2} cy={line.y2} r="5" fill="#38bdf8" />
                ))}
              </svg>
            )}
            {!isLoading && (
              <button
                onClick={onRemoveImage}
                className="absolute top-3 right-3 bg-red-600/80 backdrop-blur-md text-white border border-red-400 p-2 rounded-lg transition-all duration-300 hover:scale-110 hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.6)] focus:outline-none z-10"
              >
                <span className="font-clash text-sm tracking-wider pr-1">CLEAR</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadBox;