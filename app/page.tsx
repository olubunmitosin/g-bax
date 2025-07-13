import SceneWrapper from "@/components/three/SceneWrapper";

export default function Home() {
  return (
    <div className="w-full h-full">
      {/* Main 3D Scene - Full Available Space */}
      <SceneWrapper className="w-full h-full" />
    </div>
  );
}
