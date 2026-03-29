import React from 'react';
import { CubeIcon, PaintBrushIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ activeTab, walls = [], materials = [], explanations = [], selectedWall, isLoading }) => {
  // Fallback map for a wall if no selection or data incomplete
  const wallData = selectedWall || {};

  // Normalize materials in case they are strings vs objects
  const materialList = materials.length > 0 ? materials : [];

  // Join explanations if multiple, or provide generic text
  const overviewText = explanations.length > 0 
    ? explanations.join(' ')
    : "No analysis data available yet. Please upload a floor plan to begin.";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Processing floor plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeTab === 'walls' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <CubeIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Wall Details</h3>
          </div>
          
          {selectedWall ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <p className="font-medium">{wallData.type || 'Standard Wall'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Thickness:</span>
                  <p className="font-medium">{wallData.thickness || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Material:</span>
                  <p className="font-medium">{wallData.material || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Length:</span>
                  <p className="font-medium">{wallData.length ? `${wallData.length.toFixed(2)} units` : 'N/A'}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center">
                <span className="text-gray-500 mr-2">Explanation:</span>
                <span className="text-sm text-gray-800">
                  {wallData.explanation || 'No specific explanation provided for this wall.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500 text-sm">Select a wall in the 3D viewer to see details.</p>
              {walls.length > 0 && <p className="text-blue-500 text-xs mt-2">({walls.length} walls available)</p>}
            </div>
          )}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <PaintBrushIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Material Recommendations</h3>
          </div>
          
          {materialList.length > 0 ? (
            <div className="space-y-4">
              {materialList.map((item, index) => {
                // Handle case where material is just a string or an object
                const name = typeof item === 'string' ? item : (item.name || `Material ${index + 1}`);
                const type = typeof item === 'object' ? item.type : 'General';
                const rating = typeof item === 'object' ? item.rating : '-';
                const price = typeof item === 'object' ? item.price : '-';

                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">{name}</h4>
                        {type && <p className="text-sm text-gray-600 mt-1">{type}</p>}
                      </div>
                      <div className="text-right">
                        {price !== '-' && <div className="text-sm font-medium text-gray-900">{price}</div>}
                        {rating !== '-' && <div className="text-xs text-yellow-600">★ {rating}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500 text-sm">No materials identified from this floor plan.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Analysis Summary</h3>
          </div>
          <div className="text-sm text-gray-700 leading-relaxed font-serif">
            {overviewText}
          </div>
          {explanations.length > 0 && (
            <div className="mt-4 flex justify-between items-center text-xs text-gray-500 border-t pt-4">
              <span>Analysis completed successfully</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 font-medium">
                ✓ Verified
              </span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4 animate-bounce">
              <CubeIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Your Floor Plan</h3>
            <p className="text-sm text-gray-600">
              Select or drag your floor plan image to begin AI analysis.
            </p>
          </div>
        </div>
      )}

      {activeTab === '3d' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <CubeIcon className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">3D Model Preview</h3>
            <p className="text-sm text-gray-600">
              {walls.length > 0
                ? "Interact with the 3D model on the left to see accurate spatial layout."
                : "Interactive 3D model will appear here after analysis."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;