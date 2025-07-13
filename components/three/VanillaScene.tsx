'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { SCENE_CONFIG, COLORS } from '@/utils/constants';
import { CameraControls } from '@/utils/cameraControls';
import { SpaceGenerator } from '@/utils/spaceGeneration';
import { SpaceObjectManager } from '@/utils/spaceObjectManager';
import { GameSystemsManager } from '@/systems/gameSystemsManager';
import MiningInterface from '@/components/ui/MiningInterface';
import CraftingInterface from '@/components/ui/CraftingInterface';
import InventoryInterface from '@/components/ui/InventoryInterface';
import NotificationSystem, { useNotifications } from '@/components/ui/NotificationSystem';
import LoyaltyDashboard from '@/components/ui/LoyaltyDashboard';
import GuildBrowser from '@/components/ui/GuildBrowser';
import { SaveStatus } from '@/components/ui/SaveStatus';
import ActiveEffectsPanel from '@/components/ui/ActiveEffectsPanel';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useVerxioIntegration } from '@/hooks/useVerxioIntegration';
import { useItemEffectsStore } from '@/stores/itemEffectsStore';
import { useHoneycombIntegration } from '@/hooks/useHoneycombIntegration';
import type { SpaceObject } from '@/types/game';
import type { MiningOperation } from '@/systems/miningSystem';
import type { CraftingOperation } from '@/systems/craftingSystem';

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
  const [showCrafting, setShowCrafting] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showGuilds, setShowGuilds] = useState(false);

  // Game store and player sync
  const { inventory, activeMission, addResource, removeResource, updatePlayerExperience } = useGameStore();
  const { player, isWalletConnected } = usePlayerSync();

  // Verxio loyalty system
  const {
    awardPointsForActivity,
    getCurrentMultiplier,
    getGuildBenefits,
    playerLoyalty,
    playerGuild
  } = useVerxioIntegration();

  // Item effects system
  const { getActiveMultipliers, addEffect } = useItemEffectsStore();

  // Honeycomb integration for missions
  const { updateMissionProgress } = useHoneycombIntegration();

  // Mission progress notification throttling
  const lastMissionNotificationTime = useRef<number>(0);
  const missionNotificationCooldown = 3000; // 3 seconds between mission progress notifications

  // Helper function to track mission progress based on activity
  const trackMissionProgress = async (activityType: string, amount: number = 1) => {
    if (!activeMission || !player) return;

    // Special handling for specific mission requirements
    let shouldTrackProgress = false;

    if (activeMission.id === 'mining_002' && activityType === 'mining_crystal') {
      // Mission 2 specifically requires crystal mining
      shouldTrackProgress = true;
    } else if (activeMission.id === 'exploration_001' && activityType === 'object_discovery') {
      // Sector Scout mission specifically requires object discoveries
      shouldTrackProgress = true;
    } else if (activeMission.id === 'exploration_002' && activityType === 'location_discovery') {
      // Deep Space Cartographer mission specifically requires location discoveries
      shouldTrackProgress = true;
    } else if (activeMission.type.toLowerCase() === activityType.toLowerCase()) {
      // General type matching for other missions
      shouldTrackProgress = true;
    }

    if (shouldTrackProgress) {
      try {
        const newProgress = Math.min(activeMission.progress + amount, activeMission.maxProgress);
        await updateMissionProgress(activeMission.id, newProgress);

        // Check if mission is completed
        if (newProgress >= activeMission.maxProgress) {
          showSuccess(
            'Mission Complete!',
            `Completed "${activeMission.title}" and earned ${activeMission.rewards.experience} XP and ${activeMission.rewards.credits} credits!`
          );
        } else {
          // Only show mission progress notification if enough time has passed
          const currentTime = Date.now();
          const timeSinceLastNotification = currentTime - lastMissionNotificationTime.current;

          if (timeSinceLastNotification >= missionNotificationCooldown) {
            showInfo(
              'Mission Progress',
              `${activeMission.title}: ${newProgress}/${activeMission.maxProgress}`
            );
            lastMissionNotificationTime.current = currentTime;
          }
        }
      } catch (error) {
        // Handle error silently in production
      }
    }
  };

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
        // Apply loyalty tier multiplier and item effect multipliers to experience
        const loyaltyMultiplier = getCurrentMultiplier();
        const itemMultipliers = getActiveMultipliers();
        const totalMultiplier = loyaltyMultiplier * itemMultipliers.experienceBoost;
        const finalExperience = Math.floor(experience * totalMultiplier);

        updatePlayerExperience(finalExperience);
      },
      onGetLoyaltyMultiplier: () => {
        return getCurrentMultiplier();
      },
      onExplorationComplete: (result) => {
        // Exploration notifications removed per user preference
        // Still track discoveries for mission progress and experience
      },
      onMissionProgress: (missionType: string, progress: number) => {
        // Track mission progress based on activity type
        trackMissionProgress(missionType, progress);
      },
      onMiningComplete: async (result) => {
        if (result.success) {
          // Calculate base loyalty points for mining
          const basePoints = result.resources.length * 10 + result.experience;

          // Award loyalty points for mining
          const loyaltyPoints = await awardPointsForActivity('mining_complete', basePoints);

          // Calculate final experience for display (multiplier is applied in onExperienceGained)
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

          // Calculate final experience for display (multiplier is applied in onExperienceGained)
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

    // Initialize exploration for the player
    if (player) {
      gameSystems.initializeExploration(player.id);
    }

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
      const deltaTimeMs = deltaTime * 1000; // Convert to milliseconds for game systems

      // Update camera controls
      if (controls) {
        controls.update(deltaTime);
      }

      // Update game systems (mining, crafting, etc.)
      if (gameSystems) {
        gameSystems.updateSystems(deltaTimeMs);
      }

      // Track player position for exploration
      if (player && gameSystems && camera) {
        const currentPosition = camera.position.clone();
        const explorationResults = gameSystems.updatePlayerPosition(player.id, currentPosition);

        // Exploration results are automatically handled by the callback
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

  // Crafting functions
  const handleStartCrafting = (recipeId: string) => {
    if (!player || !gameSystemsRef.current) {
      return;
    }

    // Check if player has required resources
    const recipe = gameSystemsRef.current.crafting.getRecipe(recipeId);
    if (!recipe) return;

    const canCraft = gameSystemsRef.current.crafting.canCraftRecipe(recipe, inventory);
    if (!canCraft.canCraft) {
      showError('Insufficient Resources', 'You don\'t have enough resources to craft this item.');
      return;
    }

    // Remove required resources from inventory
    recipe.requiredResources.forEach(req => {
      removeResource(req.resourceType, req.quantity);
    });

    // Start crafting
    const success = gameSystemsRef.current.startCrafting(player.id, recipeId, inventory);

    if (success) {
      showInfo('Crafting Started', `Started crafting ${recipe.name}. This will take ${Math.ceil(recipe.craftingTime / 1000)} seconds.`);
    } else {
      showError('Crafting Failed', 'Unable to start crafting operation.');
      // Restore resources if crafting failed
      recipe.requiredResources.forEach(req => {
        addResource({
          id: `${req.resourceType}_${Date.now()}`,
          name: req.resourceType.charAt(0).toUpperCase() + req.resourceType.slice(1),
          type: req.resourceType as 'crystal' | 'metal' | 'energy',
          quantity: req.quantity,
          rarity: 'common',
        });
      });
    }
  };

  const handleCancelCrafting = (operationId: string) => {
    if (!gameSystemsRef.current) return;

    gameSystemsRef.current.cancelCrafting(operationId);
    showInfo('Crafting Cancelled', 'Crafting operation has been cancelled.');
  };

  // Get active mining operations
  const activeMiningOperations = player && gameSystemsRef.current
    ? gameSystemsRef.current.getPlayerMiningOperations(player.id)
    : [];

  // Get active crafting operations
  const activeCraftingOperations = player && gameSystemsRef.current
    ? gameSystemsRef.current.getPlayerCraftingOperations(player.id)
    : [];

  // Get available crafting recipes
  const availableRecipes = player && gameSystemsRef.current
    ? gameSystemsRef.current.getAvailableRecipes(player.level || 1)
    : [];

  // Inventory action handlers
  const handleUseItem = (itemId: string, quantity: number) => {
    // Find the item in inventory
    const item = inventory.find(r => r.id === itemId);
    if (!item) {
      return;
    }

    // Check if we have enough quantity
    if (item.quantity < quantity) {
      showWarning(
        'Insufficient Quantity',
        `Cannot use ${quantity} ${item.name}(s) - only have ${item.quantity}`
      );
      return;
    }

    // Remove the specified quantity of the item
    removeResource(itemId, quantity);

    // Apply actual effects based on item type and rarity
    const rarityMultiplier = {
      common: 1.0,
      rare: 1.5,
      epic: 2.0,
      legendary: 3.0,
    }[item.rarity] || 1.0;

    switch (item.type) {
      case 'energy':
        // Energy items provide mining efficiency boost
        const miningBoost = 1.2 + (rarityMultiplier - 1.0) * 0.3; // 1.2x to 1.8x based on rarity
        const miningDuration = 300000 * quantity; // 5 minutes per item

        addEffect({
          name: `${item.name} Mining Boost`,
          type: 'mining_efficiency',
          multiplier: miningBoost,
          duration: miningDuration,
          description: `Mining efficiency increased by ${Math.round((miningBoost - 1) * 100)}% for ${miningDuration / 60000} minutes`,
        });

        showSuccess(
          'Mining Efficiency Boosted!',
          `Used ${quantity} ${item.name}(s) - Mining efficiency increased by ${Math.round((miningBoost - 1) * 100)}% for ${miningDuration / 60000} minutes!`
        );
        break;

      case 'crystal':
        // Crystals provide experience boost and immediate XP
        const experienceGained = quantity * 50 * rarityMultiplier; // 50-150 XP per crystal based on rarity
        const expBoost = 1.15 + (rarityMultiplier - 1.0) * 0.15; // 1.15x to 1.6x based on rarity
        const expDuration = 600000 * quantity; // 10 minutes per crystal

        updatePlayerExperience(Math.floor(experienceGained));

        addEffect({
          name: `${item.name} Experience Boost`,
          type: 'experience_boost',
          multiplier: expBoost,
          duration: expDuration,
          description: `Experience gain increased by ${Math.round((expBoost - 1) * 100)}% for ${expDuration / 60000} minutes`,
        });

        showSuccess(
          'Experience Boosted!',
          `Used ${quantity} ${item.name}(s) - Gained ${Math.floor(experienceGained)} XP and experience boost of ${Math.round((expBoost - 1) * 100)}% for ${expDuration / 60000} minutes!`
        );
        break;

      case 'metal':
        // Metals provide crafting speed and resource yield boost
        const craftingBoost = 1.25 + (rarityMultiplier - 1.0) * 0.25; // 1.25x to 2.0x based on rarity
        const resourceBoost = 1.1 + (rarityMultiplier - 1.0) * 0.2; // 1.1x to 1.7x based on rarity
        const metalDuration = 450000 * quantity; // 7.5 minutes per metal

        addEffect({
          name: `${item.name} Crafting Boost`,
          type: 'crafting_speed',
          multiplier: craftingBoost,
          duration: metalDuration,
          description: `Crafting speed increased by ${Math.round((craftingBoost - 1) * 100)}% for ${metalDuration / 60000} minutes`,
        });

        addEffect({
          name: `${item.name} Resource Yield`,
          type: 'resource_yield',
          multiplier: resourceBoost,
          duration: metalDuration,
          description: `Resource yield increased by ${Math.round((resourceBoost - 1) * 100)}% for ${metalDuration / 60000} minutes`,
        });

        showSuccess(
          'Equipment Enhanced!',
          `Used ${quantity} ${item.name}(s) - Crafting speed increased by ${Math.round((craftingBoost - 1) * 100)}% and resource yield by ${Math.round((resourceBoost - 1) * 100)}% for ${metalDuration / 60000} minutes!`
        );
        break;

      default:
        // Generic items provide small temporary boosts
        const genericBoost = 1.05 + (rarityMultiplier - 1.0) * 0.05;
        const genericDuration = 180000 * quantity; // 3 minutes per item

        addEffect({
          name: `${item.name} Boost`,
          type: 'mining_efficiency',
          multiplier: genericBoost,
          duration: genericDuration,
          description: `Minor efficiency boost for ${genericDuration / 60000} minutes`,
        });

        showInfo(
          'Item Used',
          `Used ${quantity} ${item.name}(s) - Minor efficiency boost for ${genericDuration / 60000} minutes!`
        );
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

        {/* Active Effects Panel */}
        <div className="mt-2">
          <ActiveEffectsPanel />
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
          onClick={() => setShowCrafting(!showCrafting)}
          className="bg-orange-600/30 backdrop-blur-sm border border-orange-400/20 rounded-lg px-4 py-2 text-white hover:bg-orange-600/50 transition-colors"
        >
          {showCrafting ? 'Hide' : 'Show'} Crafting
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

      {/* Crafting Interface */}
      {showCrafting && (
        <div className="absolute bottom-20 right-[520px] z-10">
          <CraftingInterface
            availableRecipes={availableRecipes}
            inventory={inventory}
            activeCraftingOperations={activeCraftingOperations}
            onStartCrafting={handleStartCrafting}
            onCancelCrafting={handleCancelCrafting}
            onClose={() => setShowCrafting(false)}
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
