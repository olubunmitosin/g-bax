import { MiningSystem, type MiningResult } from './miningSystem';
import { CraftingSystem, type CraftingResult } from './craftingSystem';
import type { SpaceObject, Resource } from '@/types/game';
import { useGameStore } from '@/stores/gameStore';

export interface GameSystemsConfig {
  enableMining: boolean;
  enableCrafting: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
}

export interface GameSystemsCallbacks {
  onResourceAdded?: (resource: Resource) => void;
  onExperienceGained?: (experience: number) => void;
  onMiningComplete?: (result: MiningResult) => void;
  onCraftingComplete?: (result: CraftingResult) => void;
  onMissionProgress?: (missionType: string, progress: number) => void;
}

export class GameSystemsManager {
  private miningSystem: MiningSystem;
  private craftingSystem: CraftingSystem;
  private config: GameSystemsConfig;
  private callbacks: GameSystemsCallbacks;
  private updateInterval: number | null = null;
  private autoSaveInterval: number | null = null;

  constructor(config: Partial<GameSystemsConfig> = {}, callbacks: GameSystemsCallbacks = {}) {
    this.config = {
      enableMining: true,
      enableCrafting: true,
      enableAutoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      ...config,
    };

    this.callbacks = callbacks;
    this.miningSystem = new MiningSystem();
    this.craftingSystem = new CraftingSystem();
  }

  // Initialize the game systems
  initialize(): void {
    // Start update loop
    this.startUpdateLoop();

    // Start auto-save if enabled
    if (this.config.enableAutoSave) {
      this.startAutoSave();
    }
  }

  // Start the main update loop
  private startUpdateLoop(): void {
    const update = () => {
      const deltaTime = 16; // Assuming 60 FPS
      this.update(deltaTime);
      this.updateInterval = requestAnimationFrame(update);
    };
    update();
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
          this.callbacks.onMissionProgress('mining', 1);
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

  // Update space objects for mining system
  updateSpaceObjects(objects: SpaceObject[]): void {
    this.miningSystem.updateSpaceObjects(objects);
  }

  // Mining operations
  startMining(playerId: string, targetObject: SpaceObject): boolean {
    if (!this.config.enableMining) return false;

    const canMine = this.miningSystem.canStartMining(playerId, targetObject);
    if (!canMine.canMine) {
      return false;
    }

    // Calculate efficiency based on player traits
    const gameStore = useGameStore.getState();
    const efficiency = this.miningSystem.calculateMiningEfficiency([], []); // Would use actual player data

    const operation = this.miningSystem.startMining(playerId, targetObject, efficiency);

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

    // Calculate efficiency based on player traits
    const efficiency = this.craftingSystem.calculateCraftingEfficiency([], []); // Would use actual player data

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
