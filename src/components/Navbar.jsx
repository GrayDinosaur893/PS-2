import React from 'react';
import { Bars3Icon, ViewfinderCircleIcon } from '@heroicons/react/24/outline';

const Navbar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'upload', name: 'Upload', icon: '📁' },
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'walls', name: 'Walls', icon: '🧱' },
    { id: 'materials', name: 'Materials', icon: '🎨' },
    { id: '3d', name: '3D Model', icon: '🧊' },
  ];

  return (
    <nav className="relative z-50 mb-2 mt-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <div className="glass-panel flex justify-between h-16 items-center px-6">
        <div className="flex items-center space-x-2">
          <ViewfinderCircleIcon className="h-8 w-8 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
          <h1 className="text-2xl text-slate-100 font-clash tracking-wider drop-shadow-md pb-1">STRUCTURAL ARENA</h1>
        </div>
        
        <div className="hidden lg:ml-6 lg:flex lg:space-x-2 bg-black/20 p-1.5 rounded-xl border border-white/5 shadow-inner">
          {tabs.map((tab) => {
             const isActive = activeTab === tab.id;
             return (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id)}
                 className={`relative inline-flex items-center px-4 py-1.5 text-sm rounded-lg transition-all duration-300 font-bold uppercase tracking-wider ${
                   isActive
                     ? 'bg-blue-500/20 text-blue-300 shadow-[0_0_15px_rgba(56,189,248,0.5)] border border-blue-400/50 scale-105'
                     : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent hover-scale'
                 }`}
               >
                 <span className={`mr-2 ${isActive ? 'drop-shadow-md' : 'opacity-70'}`}>{tab.icon}</span>
                 {tab.name}
                 {isActive && (
                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(56,189,248,0.9)] animate-pulse"></span>
                 )}
               </button>
             );
          })}
        </div>
        
        <div className="lg:hidden flex items-center">
          <button
            type="button"
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover-scale"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon className="block h-6 w-6 drop-shadow-md" aria-hidden="true" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;