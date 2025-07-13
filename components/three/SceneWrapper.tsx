'use client';

import dynamic from "next/dynamic";

// Dynamically import the 3D Scene to avoid SSR issues
const VanillaScene = dynamic(() => import("@/components/three/VanillaScene"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg">
      <div className="text-white animate-pulse">Loading 3D Scene...</div>
    </div>
  ),
});

interface SceneWrapperProps {
  className?: string;
}

export default function SceneWrapper({ className = "" }: SceneWrapperProps) {
  return <VanillaScene className={className} />;
}
