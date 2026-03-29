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
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : isLoading
            ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${isLoading ? 'text-gray-300' : 'text-gray-400'}`} />
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-600">
            {isLoading ? 'Processing...' : 'Drag and drop your floor plan image here'}
          </p>
          {!isLoading && (
            <p className="text-xs text-gray-500 mt-1">
              or click to select a file
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

      {!isLoading && !previewImage && (
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

      {previewImage && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
          <div className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden inline-block w-full">
            <img
              src={previewImage.preview}
              alt={previewImage.name}
              className={`w-full h-auto max-h-[600px] object-contain ${isLoading ? 'opacity-50' : ''}`}
            />
            {previewImage.debugLines && previewImage.dimensions && !isLoading && (
              <svg 
                viewBox={`0 0 ${previewImage.dimensions.width} ${previewImage.dimensions.height}`}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
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
                  <circle key={`p1-${i}`} cx={line.x1} cy={line.y1} r="5" fill="#3b82f6" />
                ))}
                {previewImage.debugLines.map((line, i) => (
                  <circle key={`p2-${i}`} cx={line.x2} cy={line.y2} r="5" fill="#3b82f6" />
                ))}
              </svg>
            )}
            {!isLoading && (
              <button
                onClick={onRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadBox;