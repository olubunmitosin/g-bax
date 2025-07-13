'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG, COLORS } from '@/utils/constants';
import { CameraControls } from '@/utils/cameraControls';
import { SpaceGenerator } from '@/utils/spaceGeneration';
import { SpaceObjectManager } from '@/utils/spaceObjectManager';
import { GameSystemsManager } from '@/systems/gameSystemsManager';
import MiningInterface from '@/components/ui/MiningInterface';
import InventoryInterface from '@/components/ui/InventoryInterface';
import NotificationSystem, { useNotifications } from '@/components/ui/NotificationSystem';
import LoyaltyDashboard from '@/components/ui/LoyaltyDashboard';
import GuildBrowser from '@/components/ui/GuildBrowser';
import { SaveStatus } from '@/components/ui/SaveStatus';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useVerxioIntegration } from '@/hooks/useVerxioIntegration';
import type { SpaceObject } from '@/types/game';

interface VanillaSceneProps {
  className?: string;
}

export default function VanillaScene({ className = "" }: VanillaSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<CameraControls | null>(null);
  const objectManagerRef = useRef<SpaceObjectManager | null>(null);
  const gameSystemsRef = useRef<GameSystemsManager | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const clockRef = useRef<THREE.Clock>(new THREE.Clock());

  // UI state
  const [hoveredObject, setHoveredObject] = useState<SpaceObject | null>(null);
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(null);
  const [sectorInfo, setSectorInfo] = useState<{ name: string; objectCount: number } | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showGuilds, setShowGuilds] = useState(false);

  // Game store and player sync
  const { inventory, addResource, removeResource, updatePlayerExperience } = useGameStore();
  const { player, isWalletConnected } = usePlayerSync();

  // Verxio loyalty system
  const {
    awardPointsForActivity,
    getCurrentMultiplier,
    getGuildBenefits,
    playerLoyalty,
    playerGuild
  } = useVerxioIntegration();

  // Notification system
  const { notifications, removeNotification, showSuccess, showInfo, showWarning, showError } = useNotifications();

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      SCENE_CONFIG.CAMERA.FOV,
      width / height,
      SCENE_CONFIG.CAMERA.NEAR,
      SCENE_CONFIG.CAMERA.FAR
    );
    camera.position.set(...SCENE_CONFIG.CAMERA.POSITION);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mount.appendChild(renderer.domElement);

    // Initialize camera controls
    const controls = new CameraControls(camera, mount, {
      enableOrbit: true,
      enableWASD: true,
      enableZoom: true,
      minDistance: SCENE_CONFIG.CONTROLS.MIN_DISTANCE,
      maxDistance: SCENE_CONFIG.CONTROLS.MAX_DISTANCE,
      moveSpeed: 8,
      rotateSpeed: 1.2,
      zoomSpeed: 1.1,
      dampingFactor: 0.08,
    });
    controlsRef.current = controls;

    // Initialize space object manager
    const objectManager = new SpaceObjectManager(scene, camera, mount);
    objectManagerRef.current = objectManager;

    // Initialize game systems with callbacks
    const gameSystems = new GameSystemsManager({}, {
      onResourceAdded: (resource) => {
        addResource(resource);
      },
      onExperienceGained: (experience) => {
        updatePlayerExperience(experience);
      },
      onMiningComplete: async (result) => {
        if (result.success) {
          // Calculate base loyalty points for mining
          const basePoints = result.resources.length * 10 + result.experience;

          // Award loyalty points for mining
          const loyaltyPoints = await awardPointsForActivity('mining_complete', basePoints);

          const multiplier = getCurrentMultiplier();
          const finalExperience = Math.floor(result.experience * multiplier);

          // Create a summary of extracted resources
          const resourceSummary = result.resources.reduce((acc, resource) => {
            const key = resource.type;
            if (!acc[key]) {
              acc[key] = { type: resource.type, totalQuantity: 0, count: 0 };
            }
            acc[key].totalQuantity += resource.quantity;
            acc[key].count += 1;
            return acc;
          }, {} as Record<string, { type: string; totalQuantity: number; count: number }>);

          const resourceText = Object.values(resourceSummary)
            .map(summary => `${summary.totalQuantity} ${summary.type}`)
            .join(', ');

          showSuccess(
            'Mining Complete!',
            `Extracted ${resourceText}, gained ${finalExperience} XP${loyaltyPoints && loyaltyPoints > 0 ? `, and earned ${loyaltyPoints} loyalty points` : ''}!`
          );
        }
      },
      onCraftingComplete: async (result) => {
        if (result.success) {
          // Calculate base loyalty points for crafting based on item rarity
          const rarityMultiplier = {
            common: 20,
            rare: 50,
            epic: 100,
            legendary: 200
          }[result.item.rarity] || 20;
          const basePoints = rarityMultiplier + result.experience;

          // Award loyalty points for crafting
          const loyaltyPoints = await awardPointsForActivity('crafting_complete', basePoints);

          const multiplier = getCurrentMultiplier();
          const finalExperience = Math.floor(result.experience * multiplier);

          showSuccess(
            'Crafting Complete!',
            `Created ${result.item.name}, gained ${finalExperience} XP${loyaltyPoints && loyaltyPoints > 0 ? `, and earned ${loyaltyPoints} loyalty points` : ''}!`
          );
        }
      },
    });
    gameSystemsRef.current = gameSystems;
    gameSystems.initialize();

    // Set up object interaction callbacks
    objectManager.setOnObjectHover(setHoveredObject);
    objectManager.setOnObjectSelect(setSelectedObject);

    // Create starfield
    const createStarfield = () => {
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: true
      });

      const starsVertices = [];
      for (let i = 0; i < SCENE_CONFIG.STARS.COUNT; i++) {
        const x = (Math.random() - 0.5) * SCENE_CONFIG.STARS.RADIUS;
        const y = (Math.random() - 0.5) * SCENE_CONFIG.STARS.RADIUS;
        const z = (Math.random() - 0.5) * SCENE_CONFIG.STARS.RADIUS;
        starsVertices.push(x, y, z);
      }

      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      scene.add(stars);
      return stars;
    };

    // Generate procedural space sector
    const generateSpaceSector = () => {
      const sector = SpaceGenerator.generateSector({
        size: 40,
        asteroidCount: 15,
        resourceNodeCount: 8,
        stationCount: 2,
        density: 0.3,
        seed: 12345, // Fixed seed for consistent generation
      });

      // Add all objects to the scene
      sector.objects.forEach(spaceObject => {
        objectManager.addSpaceObject(spaceObject);
      });

      // Generate additional asteroid fields
      const asteroidField1 = SpaceGenerator.generateAsteroidField(
        new THREE.Vector3(15, 5, -10),
        8,
        20,
        54321
      );

      const asteroidField2 = SpaceGenerator.generateAsteroidField(
        new THREE.Vector3(-12, -8, 15),
        6,
        15,
        98765
      );

      [...asteroidField1, ...asteroidField2].forEach(asteroid => {
        objectManager.addSpaceObject(asteroid);
      });

      // Collect all space objects and update game systems
      const allSpaceObjects = [...sector.objects, ...asteroidField1, ...asteroidField2];
      if (gameSystemsRef.current) {
        gameSystemsRef.current.updateSpaceObjects(allSpaceObjects);
      }

      // Update sector info for UI
      setSectorInfo({
        name: sector.name,
        objectCount: sector.objects.length + asteroidField1.length + asteroidField2.length,
      });

      return sector;
    };

    // Lighting setup
    const setupLighting = () => {
      // Ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
      scene.add(ambientLight);

      // Main directional light (sun)
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 10);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 50;
      scene.add(directionalLight);

      // Accent point light
      const pointLight = new THREE.PointLight(COLORS.PRIMARY, 0.5, 20);
      pointLight.position.set(-10, -10, -10);
      scene.add(pointLight);
    };

    // Create scene elements
    const stars = createStarfield();
    const sector = generateSpaceSector();
    setupLighting();

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = clockRef.current.getDelta();

      // Update camera controls
      if (controls) {
        controls.update(deltaTime);
      }

      // Animate space objects
      if (objectManager) {
        objectManager.animateObjects(deltaTime);
      }

      // Rotate starfield slowly
      stars.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mount || !camera || !renderer) return;

      const newWidth = mount.clientWidth;
      const newHeight = mount.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      // Dispose camera controls
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }

      // Dispose object manager
      if (objectManagerRef.current) {
        objectManagerRef.current.dispose();
      }

      // Dispose game systems
      if (gameSystemsRef.current) {
        gameSystemsRef.current.dispose();
      }

      window.removeEventListener('resize', handleResize);

      if (mount && renderer) {
        mount.removeChild(renderer.domElement);
      }

      // Dispose of Three.js resources
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });

      renderer?.dispose();
    };
  }, []);

  // Mining functions
  const handleStartMining = (objectId: string) => {
    if (!player) {
      return;
    }

    if (!gameSystemsRef.current) {
      return;
    }

    if (!selectedObject) {
      return;
    }

    const success = gameSystemsRef.current.startMining(player.id, selectedObject);

    if (success) {
      // Force a re-render to update the UI
      setSelectedObject({ ...selectedObject });
    }
  };

  const handleCancelMining = (operationId: string) => {
    if (!gameSystemsRef.current) return;

    gameSystemsRef.current.cancelMining(operationId);
  };

  // Get active mining operations
  const activeMiningOperations = player && gameSystemsRef.current
    ? gameSystemsRef.current.getPlayerMiningOperations(player.id)
    : [];

  // Inventory action handlers
  const handleUseItem = (itemId: string, quantity: number) => {
    // Find the item in inventory
    const item = inventory.find(r => r.id === itemId);
    if (!item) {
      return;
    }

    // Different actions based on item type
    switch (item.type) {
      case 'energy':
        // Energy items could restore player energy or provide temporary boosts
        removeResource(itemId, quantity);
        showSuccess('Energy Restored!', `Used ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to restore energy and boost mining efficiency.`);
        break;

      case 'crystal':
        // Crystals could provide experience or unlock abilities
        removeResource(itemId, quantity);
        showSuccess('Experience Boost!', `Used ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to gain experience and unlock new abilities.`);
        break;

      case 'metal':
        // Metals might be used for repairs or upgrades
        removeResource(itemId, quantity);
        showSuccess('Equipment Enhanced!', `Used ${quantity} ${item.name}${quantity > 1 ? 's' : ''} to improve mining tools and efficiency.`);
        break;

      default:
        showWarning('Cannot Use Item', `${item.name} cannot be used directly. Try using it in crafting recipes.`);
        break;
    }
  };

  const handleDropItem = (itemId: string, quantity: number) => {
    // Find the item in inventory
    const item = inventory.find(r => r.id === itemId);
    if (!item) {
      return;
    }

    if (quantity > item.quantity) {
      showError('Cannot Drop Items', 'You cannot drop more items than you have in your inventory.');
      return;
    }

    // Remove items from inventory
    removeResource(itemId, quantity);
    showInfo('Items Dropped', `Dropped ${quantity}x ${item.name} from your inventory.`);

    // In a full implementation, dropped items could:
    // - Appear in the 3D world as pickable objects
    // - Be added to a "dropped items" system
    // - Provide resources to other players in multiplayer
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <div ref={mountRef} className="w-full h-full" />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 text-white max-w-xs">
        <h1 className="text-2xl font-bold mb-2">G-Bax Space Explorer</h1>

        {/* Player Status */}
        {player && (
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-green-300">Player Status</h3>
            <div className="space-y-1 text-xs text-white/70">
              <div><span className="text-white">Level:</span> {player.level}</div>
              <div><span className="text-white">Credits:</span> {player.credits.toLocaleString()}</div>
              {playerLoyalty && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-white">Loyalty:</span>
                    <span className="text-purple-300">{playerLoyalty.currentTier.icon} {playerLoyalty.currentTier.name}</span>
                  </div>
                  <div><span className="text-white">Points:</span> {playerLoyalty.points.toLocaleString()} (x{getCurrentMultiplier().toFixed(1)})</div>
                  {playerGuild && (
                    <div><span className="text-white">Guild:</span> <span className="text-blue-300">{playerGuild.name}</span></div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Sector Information */}
        {sectorInfo && (
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-purple-300">Current Sector</h3>
            <div className="space-y-1 text-xs text-white/70">
              <div><span className="text-white">Name:</span> {sectorInfo.name}</div>
              <div><span className="text-white">Objects:</span> {sectorInfo.objectCount}</div>
            </div>
          </div>
        )}

        {/* Controls Instructions */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-2 text-blue-300">Controls</h3>
          <div className="space-y-1 text-xs text-white/70">
            <div><span className="text-white">Mouse:</span> Drag to orbit • Click objects</div>
            <div><span className="text-white">WASD:</span> Move around space</div>
            <div><span className="text-white">Q/E:</span> Move up/down</div>
            <div><span className="text-white">Scroll:</span> Zoom in/out</div>
          </div>
        </div>

        {/* Object Information */}
        {(hoveredObject || selectedObject) && (
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-yellow-300">
              {selectedObject ? 'Selected' : 'Hovered'} Object
            </h3>
            <div className="space-y-1 text-xs text-white/70">
              {(() => {
                const obj = selectedObject || hoveredObject;
                if (!obj) return null;
                return (
                  <>
                    <div><span className="text-white">Type:</span> {obj.type.replace('_', ' ')}</div>
                    <div><span className="text-white">Health:</span> {obj.health}/{obj.maxHealth}</div>
                    {obj.resources && obj.resources.length > 0 && (
                      <div><span className="text-white">Resources:</span> {obj.resources.length}</div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Objects Legend */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <h3 className="text-sm font-semibold mb-2 text-green-300">Object Types</h3>
          <div className="space-y-1 text-xs text-white/70">
            <div>🪨 Asteroids (Brown) - Basic resources</div>
            <div>💎 Resource Nodes (Colored) - Rich deposits</div>
            <div>🏭 Stations (Cyan) - Trading posts</div>
            <div>⭐ Asteroid Fields - Dense clusters</div>
          </div>
        </div>

        {/* Save Status Badge */}
        <div className="mt-2">
          <SaveStatus />
        </div>
      </div>

      {/* Mining Interface */}
      <div className="absolute top-4 right-4 z-10">
        <MiningInterface
          selectedObject={selectedObject}
          onStartMining={handleStartMining}
          onCancelMining={handleCancelMining}
          activeMiningOperations={activeMiningOperations}
        />
      </div>

      {/* UI Controls */}
      <div className="absolute bottom-12 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => setShowInventory(!showInventory)}
          className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 text-white hover:bg-black/50 transition-colors"
        >
          {showInventory ? 'Hide' : 'Show'} Inventory
        </button>
        <button
          onClick={() => setShowLoyalty(!showLoyalty)}
          className="bg-purple-600/30 backdrop-blur-sm border border-purple-400/20 rounded-lg px-4 py-2 text-white hover:bg-purple-600/50 transition-colors"
        >
          {showLoyalty ? 'Hide' : 'Show'} Loyalty
        </button>
        <button
          onClick={() => setShowGuilds(!showGuilds)}
          className="bg-blue-600/30 backdrop-blur-sm border border-blue-400/20 rounded-lg px-4 py-2 text-white hover:bg-blue-600/50 transition-colors"
        >
          {showGuilds ? 'Hide' : 'Show'} Guilds
        </button>
      </div>

      {/* Inventory Interface */}
      {showInventory && (
        <div className="absolute bottom-20 right-4 z-10">
          <InventoryInterface
            inventory={inventory}
            onUseItem={handleUseItem}
            onDropItem={handleDropItem}
            onClose={() => setShowInventory(false)}
          />
        </div>
      )}

      {/* Loyalty Dashboard */}
      {showLoyalty && (
        <div className="absolute bottom-20 right-[420px] z-10">
          <LoyaltyDashboard onClose={() => setShowLoyalty(false)} />
        </div>
      )}

      {/* Guild Browser */}
      {showGuilds && (
        <div className="absolute bottom-20 right-[740px] z-10">
          <GuildBrowser onClose={() => setShowGuilds(false)} />
        </div>
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  );
}
