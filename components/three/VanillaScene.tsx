"use client";

import type { SpaceObject } from "@/types/game";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import { SCENE_CONFIG, COLORS } from "@/utils/constants";
import { CameraControls } from "@/utils/cameraControls";
import { SpaceGenerator } from "@/utils/spaceGeneration";
import { SpaceObjectManager } from "@/utils/spaceObjectManager";
import { GameSystemsManager } from "@/systems/gameSystemsManager";
import MiningInterface from "@/components/ui/MiningInterface";
import CraftingInterface from "@/components/ui/CraftingInterface";
import InventoryInterface from "@/components/ui/InventoryInterface";
import NotificationSystem, {
  useNotifications,
} from "@/components/ui/NotificationSystem";
import LoyaltyDashboard from "@/components/ui/LoyaltyDashboard";
import GuildBrowser from "@/components/ui/GuildBrowser";
import { SaveStatus } from "@/components/ui/SaveStatus";
import ActiveEffectsPanel from "@/components/ui/ActiveEffectsPanel";

import MissionProgressIndicator from "@/components/ui/MissionProgressIndicator";
import MissionCompletionModal from "@/components/ui/MissionCompletionModal";
import TraitAssignmentPanel from "@/components/ui/TraitAssignmentPanel";
import TraitEvolutionPanel from "@/components/ui/TraitEvolutionPanel";
import TraitBonusesPanel from "@/components/ui/TraitBonusesPanel";

import { useGameStore } from "@/stores/gameStore";
import { useHoneycombStore } from "@/stores/honeycombStore";
import { usePlayerSync } from "@/hooks/usePlayerSync";
import { useVerxioIntegration } from "@/hooks/useVerxioIntegration";
import { useItemEffectsStore } from "@/stores/itemEffectsStore";
import { useHoneycombIntegration } from "@/hooks/useHoneycombIntegration";
import { useMissionProgressTracker } from "@/hooks/useMissionProgressTracker";
import { useTraitBonuses } from "@/hooks/useTraitBonuses";
import { useAchievementTracker } from "@/hooks/useAchievementTracker";
import { useResourceOwnership } from "@/hooks/useResourceOwnership";
import { useGuildProgression } from "@/hooks/useGuildProgression";

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
  const [selectedObject, setSelectedObject] = useState<SpaceObject | null>(
    null,
  );
  const [sectorInfo, setSectorInfo] = useState<{
    name: string;
    objectCount: number;
  } | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [showGuilds, setShowGuilds] = useState(false);

  // Game store and player sync
  const {
    inventory,
    activeMission,
    addResource,
    removeResource,
    updatePlayerExperience,
  } = useGameStore();
  const { player } = usePlayerSync();

  // Honeycomb system states
  const {
    isCharacterSystemInitialized,
    isAchievementSystemInitialized,
    isResourceSystemInitialized,
    isGuildSystemInitialized,
    isConnected: honeycombConnected,
  } = useHoneycombStore();

  // Verxio loyalty system
  const {
    awardPointsForActivity,
    getCurrentMultiplier,
    playerLoyalty,
    playerGuild,
    isConnected: verxioConnected,
  } = useVerxioIntegration();

  // Mission progress tracking
  const {
    trackMiningActivity,
    trackCraftingActivity,
    trackExplorationActivity,
    completionModal,
    closeCompletionModal,
  } = useMissionProgressTracker();

  // Trait-based bonuses
  const {
    applyMiningBonus,
    applyCraftingBonus,
    applyExplorationBonus,
    applyExperienceBonus,
    getBonusSummary,
    hasTraits,
  } = useTraitBonuses();

  // Achievement tracking
  const { trackActivity } = useAchievementTracker();

  // Resource ownership
  const { awardMiningRewards, awardCraftingResult } = useResourceOwnership();

  // Guild progression
  const { recordContribution, getGuildBonus } = useGuildProgression();

  // Item effects system
  const { getActiveMultipliers } = useItemEffectsStore();

  // Honeycomb integration for missions
  const { updateMissionProgress } = useHoneycombIntegration();

  // Mission progress notification throttling
  const lastMissionNotificationTime = useRef<number>(0);
  const missionNotificationCooldown = 3000; // 3 seconds between mission progress notifications

  // Helper function to track mission progress based on activity
  const trackMissionProgress = async (
    activityType: string,
    amount: number = 1,
  ) => {
    if (!activeMission || !player) return;

    // Special handling for specific mission requirements
    let shouldTrackProgress = false;

    if (
      activeMission.id === "mining_002" &&
      activityType === "mining_crystal"
    ) {
      // Mission 2 specifically requires crystal mining
      shouldTrackProgress = true;
    } else if (
      activeMission.id === "exploration_001" &&
      activityType === "object_discovery"
    ) {
      // Sector Scout mission specifically requires object discoveries
      shouldTrackProgress = true;
    } else if (
      activeMission.id === "exploration_002" &&
      activityType === "location_discovery"
    ) {
      // Deep Space Cartographer mission specifically requires location discoveries
      shouldTrackProgress = true;
    } else if (
      activeMission.type.toLowerCase() === activityType.toLowerCase()
    ) {
      // General type matching for other missions
      shouldTrackProgress = true;
    }

    if (shouldTrackProgress) {
      try {
        const newProgress = Math.min(
          activeMission.progress + amount,
          activeMission.maxProgress,
        );

        await updateMissionProgress(activeMission.id, newProgress);

        // Check if mission is completed
        if (newProgress >= activeMission.maxProgress) {
          showSuccess(
            "Mission Complete!",
            `Completed "${activeMission.title}" and earned ${activeMission.rewards.experience} XP and ${activeMission.rewards.credits} credits!`,
          );
        } else {
          // Only show mission progress notification if enough time has passed
          const currentTime = Date.now();
          const timeSinceLastNotification =
            currentTime - lastMissionNotificationTime.current;

          if (timeSinceLastNotification >= missionNotificationCooldown) {
            showInfo(
              "Mission Progress",
              `${activeMission.title}: ${newProgress}/${activeMission.maxProgress}`,
            );
            lastMissionNotificationTime.current = currentTime;
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Handle error silently in production
      }
    }
  };

  // Notification system
  const {
    notifications,
    removeNotification,
    showSuccess,
    showInfo,
    showWarning,
    showError,
  } = useNotifications();

  useEffect(() => {
    if (!mountRef.current) return;

    // Initialize 3D scene immediately - don't wait for Verxio connection
    // Verxio features will be enabled when connection is established
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
      SCENE_CONFIG.CAMERA.FAR,
    );

    camera.position.set(...SCENE_CONFIG.CAMERA.POSITION);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
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
    const gameSystems = new GameSystemsManager(
      {},
      {
        onResourceAdded: (resource) => {
          addResource(resource);
        },
        onExperienceGained: (experience) => {
          // Apply loyalty tier multiplier and item effect multipliers to experience
          const loyaltyMultiplier = getCurrentMultiplier();
          const itemMultipliers = getActiveMultipliers();
          const totalMultiplier =
            loyaltyMultiplier * itemMultipliers.experienceBoost;
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
          // Track mission progress based on an activity type
          trackMissionProgress(missionType, progress);
        },
        onMiningComplete: async (result) => {
          if (result.success) {
            // Apply trait bonuses to mining results
            const enhancedResources = result.resources.map(resource => ({
              ...resource,
              quantity: applyMiningBonus(resource.quantity),
            }));

            // Apply trait bonuses to experience
            const enhancedExperience = applyExperienceBonus(result.experience);

            // Update the result with enhanced values
            const enhancedResult = {
              ...result,
              resources: enhancedResources,
              experience: enhancedExperience,
            };

            // Track mission progress for mining activities
            const totalQuantity = enhancedResources.reduce((sum, resource) => sum + resource.quantity, 0);
            await trackMiningActivity("mining", totalQuantity);

            // Track achievement progress for mining
            await trackActivity("mining", 1);

            // Award mining rewards as on-chain resources
            try {
              await awardMiningRewards(enhancedResources.map(resource => ({
                type: resource.type,
                quantity: resource.quantity,
                rarity: resource.rarity || "common",
              })));
              console.log("Mining rewards awarded as on-chain resources");
            } catch (error) {
              console.warn("Failed to award on-chain mining rewards:", error);
            }

            // Record guild contribution for mining
            try {
              await recordContribution("mining", totalQuantity);
            } catch (error) {
              console.warn("Failed to record guild mining contribution:", error);
            }

            // Calculate base loyalty points for mining (with bonuses)
            const basePoints = enhancedResources.length * 10 + enhancedExperience;

            // Award loyalty points for mining
            const loyaltyPoints = await awardPointsForActivity(
              "mining_complete",
              basePoints,
            );

            // Calculate final experience for display (multiplier is applied in onExperienceGained)
            const multiplier = getCurrentMultiplier();
            const finalExperience = Math.floor(result.experience * multiplier);

            // Create a summary of extracted resources
            const resourceSummary = result.resources.reduce(
              (acc, resource) => {
                const key = resource.type;

                if (!acc[key]) {
                  acc[key] = {
                    type: resource.type,
                    totalQuantity: 0,
                    count: 0,
                  };
                }
                acc[key].totalQuantity += resource.quantity;
                acc[key].count += 1;

                return acc;
              },
              {} as Record<
                string,
                { type: string; totalQuantity: number; count: number }
              >,
            );

            const resourceText = Object.values(resourceSummary)
              .map((summary) => {
                const typedSummary = summary as {
                  totalQuantity: number;
                  type: string;
                };

                return `${typedSummary.totalQuantity} ${typedSummary.type}`;
              })
              .join(", ");

            showSuccess(
              "Mining Complete!",
              `Extracted ${resourceText}, gained ${finalExperience} XP${loyaltyPoints && loyaltyPoints > 0 ? `, and earned ${loyaltyPoints} loyalty points` : ""}!`,
            );
          }
        },
        onCraftingComplete: async (result) => {
          if (result.success) {
            // Apply trait bonuses to experience
            const enhancedExperience = applyExperienceBonus(result.experience);

            // Update the result with enhanced values
            const enhancedResult = {
              ...result,
              experience: enhancedExperience,
            };

            // Track mission progress for crafting activities
            await trackCraftingActivity(result.item.type, 1);

            // Track achievement progress for crafting
            await trackActivity("crafting", 1);

            // Award crafting result as on-chain resource
            try {
              await awardCraftingResult({
                type: result.item.type,
                rarity: result.item.rarity,
              });
              console.log("Crafting result awarded as on-chain resource");
            } catch (error) {
              console.warn("Failed to award on-chain crafting result:", error);
            }

            // Record guild contribution for crafting
            try {
              await recordContribution("crafting", 1);
            } catch (error) {
              console.warn("Failed to record guild crafting contribution:", error);
            }

            // Calculate base loyalty points for crafting based on item rarity (with bonuses)
            const rarityMultipliers: Record<string, number> = {
              common: 20,
              rare: 50,
              epic: 100,
              legendary: 200,
            };
            const rarityMultiplier =
              rarityMultipliers[result.item.rarity] || 20;
            const basePoints = rarityMultiplier + enhancedExperience;

            // Award loyalty points for crafting
            const loyaltyPoints = await awardPointsForActivity(
              "crafting_complete",
              basePoints,
            );

            // Calculate final experience for display (multiplier is applied in onExperienceGained)
            const multiplier = getCurrentMultiplier();
            const finalExperience = Math.floor(result.experience * multiplier);

            showSuccess(
              "Crafting Complete!",
              `Created ${result.item.name}, gained ${finalExperience} XP${loyaltyPoints && loyaltyPoints > 0 ? `, and earned ${loyaltyPoints} loyalty points` : ""}!`,
            );
          }
        },
      },
    );

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
        sizeAttenuation: true,
      });

      const starsVertices = [];

      for (let i = 0; i < SCENE_CONFIG.STARS.COUNT; i++) {
        const x = (Math.random() - 0.5) * SCENE_CONFIG.STARS.RADIUS;
        const y = (Math.random() - 0.5) * SCENE_CONFIG.STARS.RADIUS;
        const z = (Math.random() - 0.5) * SCENE_CONFIG.STARS.RADIUS;

        starsVertices.push(x, y, z);
      }

      starsGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starsVertices, 3),
      );
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
      sector.objects.forEach((spaceObject) => {
        objectManager.addSpaceObject(spaceObject);
      });

      // Generate additional asteroid fields
      const asteroidField1 = SpaceGenerator.generateAsteroidField(
        new THREE.Vector3(15, 5, -10),
        8,
        20,
        54321,
      );

      const asteroidField2 = SpaceGenerator.generateAsteroidField(
        new THREE.Vector3(-12, -8, 15),
        6,
        15,
        98765,
      );

      [...asteroidField1, ...asteroidField2].forEach((asteroid) => {
        objectManager.addSpaceObject(asteroid);
      });

      // Collect all space objects and update game systems
      const allSpaceObjects = [
        ...sector.objects,
        ...asteroidField1,
        ...asteroidField2,
      ];

      if (gameSystemsRef.current) {
        gameSystemsRef.current.updateSpaceObjects(allSpaceObjects);
      }

      // Update sector info for UI
      setSectorInfo({
        name: sector.name,
        objectCount:
          sector.objects.length + asteroidField1.length + asteroidField2.length,
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
        const explorationResults = gameSystems.updatePlayerPosition(
          player.id,
          currentPosition,
        );

        // The callback automatically handles exploration results
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

    window.addEventListener("resize", handleResize);

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

      window.removeEventListener("resize", handleResize);

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
  }, []); // Remove verxioConnected dependency - 3D scene should load immediately

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

    const success = gameSystemsRef.current.startMining(
      player.id,
      selectedObject,
    );

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

    const canCraft = gameSystemsRef.current.crafting.canCraftRecipe(
      recipe,
      inventory,
    );

    if (!canCraft.canCraft) {
      showError(
        "Insufficient Resources",
        "You don't have enough resources to craft this item.",
      );

      return;
    }

    // Remove required resources from inventory
    recipe.requiredResources.forEach((req) => {
      removeResource(req.resourceType, req.quantity);
    });

    // Start crafting
    const success = gameSystemsRef.current.startCrafting(
      player.id,
      recipeId,
      inventory,
    );

    if (success) {
      showInfo(
        "Crafting Started",
        `Started crafting ${recipe.name}. This will take ${Math.ceil(recipe.craftingTime / 1000)} seconds.`,
      );
    } else {
      showError("Crafting Failed", "Unable to start crafting operation.");
      // Restore resources if crafting failed
      recipe.requiredResources.forEach((req) => {
        addResource({
          id: `${req.resourceType}_${Date.now()}`,
          name:
            req.resourceType.charAt(0).toUpperCase() +
            req.resourceType.slice(1),
          type: req.resourceType as "crystal" | "metal" | "energy",
          quantity: req.quantity,
          rarity: "common",
        });
      });
    }
  };

  const handleCancelCrafting = (operationId: string) => {
    if (!gameSystemsRef.current) return;

    gameSystemsRef.current.cancelCrafting(operationId);
    showInfo("Crafting Cancelled", "Crafting operation has been cancelled.");
  };

  // Get active mining operations
  const activeMiningOperations =
    player && gameSystemsRef.current
      ? gameSystemsRef.current.getPlayerMiningOperations(player.id)
      : [];

  // Get active crafting operations
  const activeCraftingOperations =
    player && gameSystemsRef.current
      ? gameSystemsRef.current.getPlayerCraftingOperations(player.id)
      : [];

  // Get available crafting recipes
  const availableRecipes =
    player && gameSystemsRef.current
      ? gameSystemsRef.current.getAvailableRecipes(player.level || 1)
      : [];

  // Inventory action handlers
  const handleUseItem = (itemId: string, quantity: number) => {
    // Find the item in inventory
    const item = inventory.find((r) => r.id === itemId);

    if (!item) {
      return;
    }

    // Check if we have enough quantity
    if (item.quantity < quantity) {
      showWarning(
        "Insufficient Quantity",
        `Cannot use ${quantity} ${item.name}(s) - only have ${item.quantity}`,
      );

      return;
    }

    // Remove the specified quantity of the item
    removeResource(itemId, quantity);

    // Use new tiered benefit system
    const baseDuration = 300000; // 5 minutes base duration
    const totalDuration = baseDuration * quantity;

    switch (item.type) {
      case "energy":
        // Energy items provide mining efficiency boost using tiered system
        useItemEffectsStore
          .getState()
          .useItems(
            "mining_efficiency",
            quantity,
            totalDuration,
            `${item.name} Mining Boost`,
          );

        showSuccess(
          "Mining Efficiency Boosted!",
          `Used ${quantity} ${item.name}(s) - Check Active Effects panel for your current tier bonus!`,
        );
        break;

      case "crystal":
        // Crystals provide experience boost using tiered system
        const rarityMultiplier =
          {
            common: 1.0,
            rare: 1.5,
            epic: 2.0,
            legendary: 3.0,
          }[item.rarity] || 1.0;

        const experienceGained = quantity * 50 * rarityMultiplier; // 50-150 XP per crystal based on rarity
        const expDuration = 600000 * quantity; // 10 minutes per crystal

        updatePlayerExperience(Math.floor(experienceGained));
        useItemEffectsStore
          .getState()
          .useItems(
            "experience_boost",
            quantity,
            expDuration,
            `${item.name} Experience Boost`,
          );

        showSuccess(
          "Experience Boosted!",
          `Used ${quantity} ${item.name}(s) - Gained ${Math.floor(experienceGained)} XP and tiered experience boost!`,
        );
        break;

      case "metal":
        // Metals provide crafting speed and resource yield boost using tiered system
        const metalDuration = 450000 * quantity; // 7.5 minutes per metal

        useItemEffectsStore
          .getState()
          .useItems(
            "crafting_speed",
            quantity,
            metalDuration,
            `${item.name} Crafting Boost`,
          );
        useItemEffectsStore
          .getState()
          .useItems(
            "resource_yield",
            quantity,
            metalDuration,
            `${item.name} Resource Yield`,
          );

        showSuccess(
          "Equipment Enhanced!",
          `Used ${quantity} ${item.name}(s) - Check Active Effects panel for your current tier bonuses!`,
        );
        break;

      default:
        // Generic items provide small temporary boosts using tiered system
        const genericDuration = 180000 * quantity; // 3 minutes per item

        useItemEffectsStore
          .getState()
          .useItems(
            "mining_efficiency",
            quantity,
            genericDuration,
            `${item.name} Boost`,
          );

        showInfo(
          "Item Used",
          `Used ${quantity} ${item.name}(s) - Check Active Effects panel for your current tier bonus!`,
        );
        break;
    }
  };

  const handleDropItem = (itemId: string, quantity: number) => {
    // Find the item in inventory
    const item = inventory.find((r) => r.id === itemId);

    if (!item) {
      return;
    }

    if (quantity > item.quantity) {
      showError(
        "Cannot Drop Items",
        "You cannot drop more items than you have in your inventory.",
      );

      return;
    }

    // Remove items from inventory
    removeResource(itemId, quantity);
    showInfo(
      "Items Dropped",
      `Dropped ${quantity}x ${item.name} from your inventory.`,
    );

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
            <h3 className="text-sm font-semibold mb-2 text-green-300">
              Player Status
            </h3>
            <div className="space-y-1 text-xs text-white/70">
              <div>
                <span className="text-white">Level:</span> {player.level}
              </div>
              <div>
                <span className="text-white">Credits:</span>{" "}
                {player.credits.toLocaleString()}
              </div>
              {playerLoyalty && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-white">Loyalty:</span>
                    <span className="text-purple-300">
                      {playerLoyalty.currentTier.icon}{" "}
                      {playerLoyalty.currentTier.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-white">Points:</span>{" "}
                    {playerLoyalty.points.toLocaleString()} (x
                    {getCurrentMultiplier().toFixed(1)})
                  </div>
                  {playerGuild && (
                    <div>
                      <span className="text-white">Guild:</span>{" "}
                      <span className="text-blue-300">{playerGuild.name}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Sector Information */}
        {sectorInfo && (
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-purple-300">
              Current Sector
            </h3>
            <div className="space-y-1 text-xs text-white/70">
              <div>
                <span className="text-white">Name:</span> {sectorInfo.name}
              </div>
              <div>
                <span className="text-white">Objects:</span>{" "}
                {sectorInfo.objectCount}
              </div>
            </div>
          </div>
        )}

        {/* Controls Instructions */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
          <h3 className="text-sm font-semibold mb-2 text-blue-300">Controls</h3>
          <div className="space-y-1 text-xs text-white/70">
            <div>
              <span className="text-white">Mouse:</span> Drag to orbit • Click
              objects
            </div>
            <div>
              <span className="text-white">WASD:</span> Move around space
            </div>
            <div>
              <span className="text-white">Q/E:</span> Move up/down
            </div>
            <div>
              <span className="text-white">Scroll:</span> Zoom in/out
            </div>
          </div>
        </div>

        {/* Object Information */}
        {(hoveredObject || selectedObject) && (
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 mb-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-2 text-yellow-300">
              {selectedObject ? "Selected" : "Hovered"} Object
            </h3>
            <div className="space-y-1 text-xs text-white/70">
              {(() => {
                const obj = selectedObject || hoveredObject;

                if (!obj) return null;

                return (
                  <>
                    <div>
                      <span className="text-white">Type:</span>{" "}
                      {obj.type.replace("_", " ")}
                    </div>
                    <div>
                      <span className="text-white">Health:</span> {obj.health}/
                      {obj.maxHealth}
                    </div>
                    {obj.resources && obj.resources.length > 0 && (
                      <div>
                        <span className="text-white">Resources:</span>{" "}
                        {obj.resources.length}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Objects Legend */}
        <div className="bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <h3 className="text-sm font-semibold mb-2 text-green-300">
            Object Types
          </h3>
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

        {/* Mission Progress Indicator */}
        <div className="mt-2">
          <MissionProgressIndicator />
        </div>

        {/* Only show panels when wallet is connected and systems are ready */}
        {player && honeycombConnected && (
          <>
            {/* Trait Assignment Panel - only when character system is ready */}
            {isCharacterSystemInitialized && (
              <div className="mt-2">
                <TraitAssignmentPanel />
              </div>
            )}

            {/* Trait Evolution Panel - only when character system is ready */}
            {isCharacterSystemInitialized && (
              <div className="mt-2">
                <TraitEvolutionPanel />
              </div>
            )}

            {/* Trait Bonuses Panel - only when character system is ready */}
            {isCharacterSystemInitialized && (
              <div className="mt-2">
                <TraitBonusesPanel />
              </div>
            )}

          </>
        )}

        {/* Active Effects Panel */}
        <div className="mt-2">
          <ActiveEffectsPanel />
        </div>
      </div>

      {/* Mining Interface */}
      <div className="absolute top-4 right-4 z-10">
        <MiningInterface
          activeMiningOperations={activeMiningOperations}
          selectedObject={selectedObject}
          onCancelMining={handleCancelMining}
          onStartMining={handleStartMining}
        />
      </div>

      {/* Enhanced UI Controls */}
      <div className="absolute bottom-12 right-4 z-10 flex flex-col gap-3">
        {/* Inventory Button */}
        <button
          className={`group relative bg-gradient-to-r ${
            showInventory
              ? "from-gray-700/90 to-gray-600/90 border-gray-400/40"
              : "from-gray-800/70 to-gray-700/70 border-gray-500/30"
          } backdrop-blur-md border rounded-xl px-5 py-3 text-white hover:from-gray-600/90 hover:to-gray-500/90 hover:border-gray-400/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[140px]`}
          onClick={() => setShowInventory(!showInventory)}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🎒</span>
            <span className="font-medium">
              {showInventory ? "Hide" : "Show"} Inventory
            </span>
          </div>
          <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Crafting Button */}
        <button
          className={`group relative bg-gradient-to-r ${
            showCrafting
              ? "from-orange-700/90 to-orange-600/90 border-orange-400/40"
              : "from-orange-800/70 to-orange-700/70 border-orange-500/30"
          } backdrop-blur-md border rounded-xl px-5 py-3 text-white hover:from-orange-600/90 hover:to-orange-500/90 hover:border-orange-400/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[140px]`}
          onClick={() => setShowCrafting(!showCrafting)}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">⚒️</span>
            <span className="font-medium">
              {showCrafting ? "Hide" : "Show"} Crafting
            </span>
          </div>
          <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Loyalty Button */}
        <button
          className={`group relative bg-gradient-to-r ${
            showLoyalty
              ? "from-purple-700/90 to-purple-600/90 border-purple-400/40"
              : "from-purple-800/70 to-purple-700/70 border-purple-500/30"
          } backdrop-blur-md border rounded-xl px-5 py-3 text-white hover:from-purple-600/90 hover:to-purple-500/90 hover:border-purple-400/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[140px]`}
          onClick={() => setShowLoyalty(!showLoyalty)}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="font-medium">
              {showLoyalty ? "Hide" : "Show"} Loyalty
            </span>
          </div>
          <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Guilds Button */}
        <button
          className={`group relative bg-gradient-to-r ${
            showGuilds
              ? "from-blue-700/90 to-blue-600/90 border-blue-400/40"
              : "from-blue-800/70 to-blue-700/70 border-blue-500/30"
          } backdrop-blur-md border rounded-xl px-5 py-3 text-white hover:from-blue-600/90 hover:to-blue-500/90 hover:border-blue-400/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 min-w-[140px]`}
          onClick={() => setShowGuilds(!showGuilds)}
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">🏛️</span>
            <span className="font-medium">
              {showGuilds ? "Hide" : "Show"} Guilds
            </span>
          </div>
          <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {/* Enhanced Modal Interfaces */}

      {/* Inventory Interface */}
      {showInventory && (
        <div className="absolute bottom-24 right-4 z-20 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
            <InventoryInterface
              inventory={inventory}
              onClose={() => setShowInventory(false)}
              onDropItem={handleDropItem}
              onUseItem={handleUseItem}
            />
          </div>
        </div>
      )}

      {/* Crafting Interface */}
      {showCrafting && (
        <div className="absolute bottom-24 right-[180px] z-20 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-1 border border-orange-400/20">
            <CraftingInterface
              activeCraftingOperations={activeCraftingOperations}
              availableRecipes={availableRecipes}
              inventory={inventory}
              onCancelCrafting={handleCancelCrafting}
              onClose={() => setShowCrafting(false)}
              onStartCrafting={handleStartCrafting}
            />
          </div>
        </div>
      )}

      {/* Loyalty Dashboard */}
      {showLoyalty && (
        <div className="absolute bottom-24 right-[360px] z-20 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-1 border border-purple-400/20">
            <LoyaltyDashboard onClose={() => setShowLoyalty(false)} />
          </div>
        </div>
      )}

      {/* Guild Browser */}
      {showGuilds && (
        <div className="absolute bottom-24 right-[540px] z-20 animate-in slide-in-from-right-4 duration-300">
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-1 border border-blue-400/20">
            <GuildBrowser onClose={() => setShowGuilds(false)} />
          </div>
        </div>
      )}

      {/* Mission Completion Modal */}
      <MissionCompletionModal
        isOpen={completionModal.isOpen}
        onClose={closeCompletionModal}
        mission={completionModal.mission}
        rewardSummary={completionModal.rewardSummary}
      />

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  );
}
