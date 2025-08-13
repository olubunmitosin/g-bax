'use client';

import React from 'react';

// Temporary placeholder scene while we fix Three.js integration
function PlaceholderScene() {
  return (
    <div className="relative w-full h-full bg-gradient-to-br from-purple-900/30 via-blue-900/20 to-black overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Welcome content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome to G-Bax
        </h1>
        <p className="text-lg text-gray-300 mb-8 max-w-md">
          3D Blockchain Space Exploration Game
        </p>
        <div className="grid grid-cols-3 gap-8 text-center">
          <div className="p-4 bg-purple-500/20 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-2"></div>
            <h3 className="text-white font-semibold">Explore</h3>
            <p className="text-gray-400 text-sm">Discover space sectors</p>
          </div>
          <div className="p-4 bg-blue-500/20 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2"></div>
            <h3 className="text-white font-semibold">Mine</h3>
            <p className="text-gray-400 text-sm">Extract cosmic resources</p>
          </div>
          <div className="p-4 bg-green-500/20 rounded-lg backdrop-blur-sm">
            <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-2"></div>
            <h3 className="text-white font-semibold">Forge</h3>
            <p className="text-gray-400 text-sm">Craft powerful items</p>
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          3D Scene will be integrated with Honeycomb Protocol
        </div>
      </div>
    </div>
  );
}

interface SceneProps {
  className?: string;
}

export default function Scene({ className = "" }: SceneProps) {
  return (
    <div className={`w-full h-full ${className}`}>
      <PlaceholderScene />
    </div>
  );
}
