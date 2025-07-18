import { MiningSystem, type MiningResult } from './miningSystem';
import { CraftingSystem, type CraftingResult } from './craftingSystem';
import { ExplorationSystem, type ExplorationResult } from './explorationSystem';
import type { SpaceObject, Resource } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';
import { useItemEffectsStore } from '@/stores/itemEffectsStore';
import * as THREE from 'three';

export interface GameSystemsConfig {
  enableMining: boolean;
  enableCrafting: boolean;
  enableExploration: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
}

export interface GameSystemsCallbacks {
  onResourceAdded?: (resource: Resource) => void;
  onExperienceGained?: (experience: number) => void;
  onMiningComplete?: (result: MiningResult) => void;
  onCraftingComplete?: (result: CraftingResult) => void;
  onExplorationComplete?: (result: ExplorationResult) => void;
  onMissionProgress?: (missionType: string, progress: number) => void;
  onGetLoyaltyMultiplier?: () => number;
}

export class GameSystemsManager {
  private miningSystem: MiningSystem;
  private craftingSystem: CraftingSystem;
  private explorationSystem: ExplorationSystem;
  private config: GameSystemsConfig;
  private callbacks: GameSystemsCallbacks;
  private updateInterval: number | null = null;
  private autoSaveInterval: number | null = null;

  constructor(config: Partial<GameSystemsConfig> = {}, callbacks: GameSystemsCallbacks = {}) {
    this.config = {
      enableMining: true,
      enableCrafting: true,
      enableExploration: true,
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      ...config,
    };

    this.callbacks = callbacks;
    this.miningSystem = new MiningSystem();
    this.craftingSystem = new CraftingSystem();
    this.explorationSystem = new ExplorationSystem();
  }

  // Initialize the game systems
  initialize(): void {
    // Don't start internal update loop - let the main scene handle updates
    // this.startUpdateLoop();

    // Start auto-save if enabled
    if (this.config.enableAutoSave) {
      this.startAutoSave();
    }
  }

  // Start the main update loop (deprecated - use updateSystems instead)
  private startUpdateLoop(): void {
    const update = () => {
      const deltaTime = 16; // Assuming 60 FPS
      this.update(deltaTime);
      this.updateInterval = requestAnimationFrame(update);
    };
    update();
  }

  // Public method to update all systems - called from main animation loop
  updateSystems(deltaTime: number): void {
    this.update(deltaTime);
  }

  // Main update function
  private update(deltaTime: number): void {
    if (this.config.enableMining) {
      const miningResults = this.miningSystem.updateMining(deltaTime);
      this.handleMiningResults(miningResults);
    }

    if (this.config.enableCrafting) {
      const craftingResults = this.craftingSystem.updateCrafting(deltaTime);
      this.handleCraftingResults(craftingResults);
    }
  }

  // Handle mining results
  private handleMiningResults(results: MiningResult[]): void {
    results.forEach(result => {
      if (result.success) {
        // Add resources to player inventory via callback
        result.resources.forEach(resource => {
          if (this.callbacks.onResourceAdded) {
            this.callbacks.onResourceAdded(resource);
          }
        });

        // Update player experience via callback
        if (result.experience > 0 && this.callbacks.onExperienceGained) {
          this.callbacks.onExperienceGained(result.experience);
        }

        // Notify mining completion
        if (this.callbacks.onMiningComplete) {
          this.callbacks.onMiningComplete(result);
        }

        // Track mission progress for mining
        if (this.callbacks.onMissionProgress) {
          // Track general mining progress
          this.callbacks.onMissionProgress('mining', 1);

          // Track specific resource type mining for targeted missions
          const resourceTypes = result.resources.map(r => r.type);
          const uniqueResourceTypes = Array.from(new Set(resourceTypes));

          uniqueResourceTypes.forEach(resourceType => {
            if (this.callbacks.onMissionProgress) {
              this.callbacks.onMissionProgress(`mining_${resourceType}`, 1);
            }
          });
        }

      }
    });
  }

  // Handle crafting results
  private handleCraftingResults(results: CraftingResult[]): void {
    results.forEach(result => {
      if (result.success) {
        // Add crafted item to inventory via callback
        if (this.callbacks.onResourceAdded) {
          this.callbacks.onResourceAdded(result.item);
        }

        // Add bonus items if any
        if (result.bonusItems) {
          result.bonusItems.forEach(item => {
            if (this.callbacks.onResourceAdded) {
              this.callbacks.onResourceAdded(item);
            }
          });
        }

        // Update player experience via callback
        if (result.experience > 0 && this.callbacks.onExperienceGained) {
          this.callbacks.onExperienceGained(result.experience);
        }

        // Notify crafting completion
        if (this.callbacks.onCraftingComplete) {
          this.callbacks.onCraftingComplete(result);
        }

        // Track mission progress for crafting
        if (this.callbacks.onMissionProgress) {
          this.callbacks.onMissionProgress('crafting', 1);
        }

      }
    });
  }

  // Update space objects for mining and exploration systems
  updateSpaceObjects(objects: SpaceObject[]): void {
    this.miningSystem.updateSpaceObjects(objects);
    if (this.config.enableExploration) {
      this.explorationSystem.updateSpaceObjects(objects);
    }
  }

  // Mining operations
  startMining(playerId: string, targetObject: SpaceObject): boolean {
    if (!this.config.enableMining) return false;

    const canMine = this.miningSystem.canStartMining(playerId, targetObject);
    if (!canMine.canMine) {
      return false;
    }

    // Calculate efficiency based on player traits, loyalty tier, and item effects
    const gameStore = useGameStore.getState();
    const itemEffectsStore = useItemEffectsStore.getState();

    // Get base efficiency from traits and equipment
    let efficiency = this.miningSystem.calculateMiningEfficiency([], []); // Would use actual player data

    // Apply item effect bonuses (additive to prevent exponential growth)
    const itemMultipliers = itemEffectsStore.getActiveMultipliers();
    efficiency += (itemMultipliers.miningEfficiency - 1.0); // Convert to additive
    efficiency += (itemMultipliers.resourceYield - 1.0); // Convert to additive

    // Get loyalty multiplier for bonuses
    let loyaltyMultiplier = 1.0;
    if (this.callbacks.onGetLoyaltyMultiplier) {
      loyaltyMultiplier = this.callbacks.onGetLoyaltyMultiplier();
      // Apply loyalty bonus additively and cap at 2.0x total efficiency
      efficiency += (loyaltyMultiplier - 1.0);
    }

    // Cap final efficiency at 3.0x (200% bonus maximum)
    efficiency = Math.min(efficiency, 3.0);

    const operation = this.miningSystem.startMining(playerId, targetObject, efficiency, loyaltyMultiplier);

    if (operation) {
      // Set up completion callback
      this.miningSystem.onMiningComplete(operation.id, (result) => {
      });
      return true;
    }

    return false;
  }

  cancelMining(operationId: string): boolean {
    return this.miningSystem.cancelMining(operationId);
  }

  getPlayerMiningOperations(playerId: string) {
    return this.miningSystem.getPlayerMiningOperations(playerId);
  }

  getMiningProgress(operationId: string) {
    return this.miningSystem.getMiningProgress(operationId);
  }

  // Crafting operations
  startCrafting(playerId: string, recipeId: string, playerResources: Resource[]): boolean {
    if (!this.config.enableCrafting) return false;

    const recipe = this.craftingSystem.getRecipe(recipeId);
    if (!recipe) {
      return false;
    }

    const canCraft = this.craftingSystem.canCraftRecipe(recipe, playerResources);
    if (!canCraft.canCraft) {
      return false;
    }

    // Calculate efficiency based on player traits, loyalty tier, and item effects
    const itemEffectsStore = useItemEffectsStore.getState();
    let efficiency = this.craftingSystem.calculateCraftingEfficiency([], []); // Would use actual player data

    // Apply item effect bonuses (additive to prevent exponential growth)
    const itemMultipliers = itemEffectsStore.getActiveMultipliers();
    efficiency += (itemMultipliers.craftingSpeed - 1.0); // Convert to additive

    // Apply loyalty tier crafting bonuses
    if (this.callbacks.onGetLoyaltyMultiplier) {
      const loyaltyMultiplier = this.callbacks.onGetLoyaltyMultiplier();
      // Apply loyalty bonus additively
      efficiency += (loyaltyMultiplier - 1.0);
    }

    // Cap final efficiency at 3.0x (200% bonus maximum)
    efficiency = Math.min(efficiency, 3.0);

    const operation = this.craftingSystem.startCrafting(playerId, recipeId, playerResources, efficiency);

    if (operation) {
      // Note: Resource removal should be handled by the calling code
      // since we can't access the game store directly from here

      // Set up completion callback
      this.craftingSystem.onCraftingComplete(operation.id, (result) => {
      });
      return true;
    }

    return false;
  }

  cancelCrafting(operationId: string): boolean {
    return this.craftingSystem.cancelCrafting(operationId);
  }

  getPlayerCraftingOperations(playerId: string) {
    return this.craftingSystem.getPlayerCraftingOperations(playerId);
  }

  getCraftingProgress(operationId: string) {
    return this.craftingSystem.getCraftingProgress(operationId);
  }

  // Exploration operations
  updatePlayerPosition(playerId: string, position: THREE.Vector3): ExplorationResult[] {
    if (!this.config.enableExploration) return [];

    const results = this.explorationSystem.updatePlayerPosition(playerId, position);

    // Process exploration results
    results.forEach(result => {
      if (result.success) {
        // Add experience
        if (this.callbacks.onExperienceGained) {
          this.callbacks.onExperienceGained(result.experience);
        }

        // Track mission progress based on discovery type
        if (this.callbacks.onMissionProgress) {
          if (result.discoveredObject) {
            // Track object discoveries for "Sector Scout" type missions
            this.callbacks.onMissionProgress('exploration', 1);
            this.callbacks.onMissionProgress('object_discovery', 1);
          } else if (result.newLocation) {
            // Track location discoveries for "Deep Space Cartographer" type missions
            this.callbacks.onMissionProgress('location_discovery', 1);
          }
        }

        // Trigger exploration callback
        if (this.callbacks.onExplorationComplete) {
          this.callbacks.onExplorationComplete(result);
        }
      }
    });

    return results;
  }

  initializeExploration(playerId: string) {
    if (!this.config.enableExploration) return null;
    return this.explorationSystem.initializeExploration(playerId);
  }

  getExplorationStats(playerId: string) {
    return this.explorationSystem.getExplorationStats(playerId);
  }

  getDiscoveredObjects(playerId: string): string[] {
    return this.explorationSystem.getDiscoveredObjects(playerId);
  }

  getVisitedLocations(playerId: string): THREE.Vector3[] {
    return this.explorationSystem.getVisitedLocations(playerId);
  }

  getAvailableRecipes(playerLevel: number) {
    return this.craftingSystem.getAvailableRecipes(playerLevel);
  }

  // Auto-save functionality
  private startAutoSave(): void {
    this.autoSaveInterval = window.setInterval(() => {
      this.saveGameState();
    }, this.config.autoSaveInterval);
  }

  private saveGameState(): void {
    // This would save game state to local storage or server
    // For now, just save system-specific data
    const systemState = {
      miningStats: this.miningSystem.getMiningStats(),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('g-bax-systems-state', JSON.stringify(systemState));
    } catch (error) {
    }
  }

  // Load game state
  loadGameState(): boolean {
    try {
      const savedState = localStorage.getItem('g-bax-systems-state');
      if (!savedState) return false;

      const systemState = JSON.parse(savedState);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get system statistics
  getSystemStats() {
    return {
      mining: this.miningSystem.getMiningStats(),
      crafting: {
        activeOperations: this.craftingSystem.getPlayerCraftingOperations('').length,
        availableRecipes: this.craftingSystem.getAvailableRecipes(1).length,
      },
    };
  }

  // Cleanup
  dispose(): void {
    if (this.updateInterval) {
      cancelAnimationFrame(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }

    this.miningSystem.clearAllOperations();
    this.craftingSystem.clearAllOperations();
  }

  // Getters for systems
  get mining(): MiningSystem {
    return this.miningSystem;
  }

  get crafting(): CraftingSystem {
    return this.craftingSystem;
  }
}
