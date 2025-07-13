import { GAME_CONFIG, RESOURCE_TYPES, RESOURCE_RARITIES } from '@/utils/constants';
import type { Resource, CraftingRecipe } from '@/types/game';

export interface CraftingOperation {
  id: string;
  recipeId: string;
  playerId: string;
  startTime: number;
  duration: number;
  progress: number;
  isCompleted: boolean;
  requiredResources: Resource[];
  outputItem: Resource;
  efficiency: number;
}

export interface CraftingResult {
  success: boolean;
  item: Resource;
  experience: number;
  message: string;
  bonusItems?: Resource[];
}

export class CraftingSystem {
  private activeCraftingOperations: Map<string, CraftingOperation> = new Map();
  private craftingCallbacks: Map<string, (result: CraftingResult) => void> = new Map();
  private recipes: Map<string, CraftingRecipe> = new Map();

  constructor() {
    this.initializeRecipes();
  }

  // Initialize predefined crafting recipes
  private initializeRecipes(): void {
    const recipes: CraftingRecipe[] = [
      // Basic Tools
      {
        id: 'basic_mining_tool',
        name: 'Basic Mining Tool',
        description: 'A simple tool that increases mining efficiency',
        requiredResources: [
          { resourceType: 'metal', quantity: 3 },
          { resourceType: 'crystal', quantity: 1 },
        ],
        output: {
          id: 'basic_mining_tool_001',
          name: 'Basic Mining Tool',
          type: 'metal',
          quantity: 1,
          rarity: 'common',
        },
        craftingTime: 3000,
        requiredLevel: 1,
      },

      // Advanced Tools
      {
        id: 'advanced_scanner',
        name: 'Advanced Scanner',
        description: 'Detects rare resources more effectively',
        requiredResources: [
          { resourceType: 'crystal', quantity: 5 },
          { resourceType: 'energy', quantity: 3 },
          { resourceType: 'metal', quantity: 2 },
        ],
        output: {
          id: 'advanced_scanner_001',
          name: 'Advanced Scanner',
          type: 'crystal',
          quantity: 1,
          rarity: 'rare',
        },
        craftingTime: 8000,
        requiredLevel: 3,
      },

      // Energy Cells
      {
        id: 'energy_cell',
        name: 'Energy Cell',
        description: 'Stores energy for extended operations',
        requiredResources: [
          { resourceType: 'energy', quantity: 10 },
          { resourceType: 'crystal', quantity: 2 },
        ],
        output: {
          id: 'energy_cell_001',
          name: 'Energy Cell',
          type: 'energy',
          quantity: 1,
          rarity: 'common',
        },
        craftingTime: 5000,
        requiredLevel: 2,
      },

      // Rare Alloys
      {
        id: 'quantum_alloy',
        name: 'Quantum Alloy',
        description: 'An extremely durable and lightweight material',
        requiredResources: [
          { resourceType: 'metal', quantity: 15 },
          { resourceType: 'crystal', quantity: 8 },
          { resourceType: 'energy', quantity: 5 },
        ],
        output: {
          id: 'quantum_alloy_001',
          name: 'Quantum Alloy',
          type: 'metal',
          quantity: 1,
          rarity: 'epic',
        },
        craftingTime: 15000,
        requiredLevel: 5,
      },

      // Legendary Equipment
      {
        id: 'stellar_forge',
        name: 'Stellar Forge',
        description: 'A legendary crafting station that enhances all operations',
        requiredResources: [
          { resourceType: 'metal', quantity: 50 },
          { resourceType: 'crystal', quantity: 30 },
          { resourceType: 'energy', quantity: 20 },
        ],
        output: {
          id: 'stellar_forge_001',
          name: 'Stellar Forge',
          type: 'crystal',
          quantity: 1,
          rarity: 'legendary',
        },
        craftingTime: 30000,
        requiredLevel: 8,
      },
    ];

    recipes.forEach(recipe => {
      this.recipes.set(recipe.id, recipe);
    });
  }

  // Start crafting operation
  startCrafting(
    playerId: string,
    recipeId: string,
    playerResources: Resource[],
    efficiency: number = 1.0
  ): CraftingOperation | null {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return null;

    // Check if player has required resources
    const canCraft = this.canCraftRecipe(recipe, playerResources);
    if (!canCraft.canCraft) return null;

    // Calculate crafting duration based on efficiency
    const adjustedDuration = recipe.craftingTime / efficiency;

    const operation: CraftingOperation = {
      id: `crafting_${Date.now()}_${Math.random()}`,
      recipeId,
      playerId,
      startTime: Date.now(),
      duration: adjustedDuration,
      progress: 0,
      isCompleted: false,
      requiredResources: this.getRequiredResourcesFromInventory(recipe, playerResources),
      outputItem: { ...recipe.output },
      efficiency,
    };

    this.activeCraftingOperations.set(operation.id, operation);
    return operation;
  }

  // Update crafting progress
  updateCrafting(deltaTime: number): CraftingResult[] {
    const results: CraftingResult[] = [];
    const completedOperations: string[] = [];

    this.activeCraftingOperations.forEach((operation, operationId) => {
      if (operation.isCompleted) return;

      // Update progress
      const elapsed = Date.now() - operation.startTime;
      operation.progress = Math.min(elapsed / operation.duration, 1.0);

      // Check if crafting is complete
      if (operation.progress >= 1.0) {
        operation.isCompleted = true;
        const result = this.completeCrafting(operation);
        results.push(result);
        completedOperations.push(operationId);

        // Call callback if registered
        const callback = this.craftingCallbacks.get(operationId);
        if (callback) {
          callback(result);
          this.craftingCallbacks.delete(operationId);
        }
      }
    });

    // Clean up completed operations
    completedOperations.forEach(id => {
      this.activeCraftingOperations.delete(id);
    });

    return results;
  }

  // Complete crafting operation
  private completeCrafting(operation: CraftingOperation): CraftingResult {
    const recipe = this.recipes.get(operation.recipeId);
    if (!recipe) {
      return {
        success: false,
        item: operation.outputItem,
        experience: 0,
        message: 'Recipe not found',
      };
    }

    // Calculate experience reward
    const baseExperience = this.getRecipeExperience(recipe);
    const experience = Math.floor(baseExperience * operation.efficiency);

    // Check for bonus items based on efficiency and luck
    const bonusItems = this.calculateBonusItems(recipe, operation.efficiency);

    return {
      success: true,
      item: operation.outputItem,
      experience,
      message: `Crafting completed! Created ${operation.outputItem.name}.`,
      bonusItems,
    };
  }

  // Calculate bonus items from high efficiency crafting
  private calculateBonusItems(recipe: CraftingRecipe, efficiency: number): Resource[] {
    const bonusItems: Resource[] = [];
    
    // Higher efficiency has chance for bonus materials
    if (efficiency > 1.5 && Math.random() < 0.3) {
      // Return some materials used in crafting
      const bonusResource = recipe.requiredResources[0];
      bonusItems.push({
        id: `bonus_${Date.now()}`,
        name: `Recycled ${bonusResource.resourceType}`,
        type: bonusResource.resourceType as 'crystal' | 'metal' | 'energy',
        quantity: Math.floor(bonusResource.quantity * 0.2),
        rarity: 'common',
      });
    }

    return bonusItems;
  }

  // Check if player can craft a recipe
  canCraftRecipe(recipe: CraftingRecipe, playerResources: Resource[]): {
    canCraft: boolean;
    missingResources?: { resourceType: string; needed: number; have: number }[];
  } {
    const missingResources: { resourceType: string; needed: number; have: number }[] = [];

    for (const requirement of recipe.requiredResources) {
      const playerAmount = this.getResourceAmount(playerResources, requirement.resourceType);
      
      if (playerAmount < requirement.quantity) {
        missingResources.push({
          resourceType: requirement.resourceType,
          needed: requirement.quantity,
          have: playerAmount,
        });
      }
    }

    return {
      canCraft: missingResources.length === 0,
      missingResources: missingResources.length > 0 ? missingResources : undefined,
    };
  }

  // Get amount of specific resource type in inventory
  private getResourceAmount(resources: Resource[], resourceType: string): number {
    return resources
      .filter(resource => resource.type === resourceType)
      .reduce((total, resource) => total + resource.quantity, 0);
  }

  // Get required resources from player inventory
  private getRequiredResourcesFromInventory(recipe: CraftingRecipe, playerResources: Resource[]): Resource[] {
    const requiredResources: Resource[] = [];

    for (const requirement of recipe.requiredResources) {
      let remainingNeeded = requirement.quantity;
      
      for (const resource of playerResources) {
        if (resource.type === requirement.resourceType && remainingNeeded > 0) {
          const takeAmount = Math.min(resource.quantity, remainingNeeded);
          requiredResources.push({
            ...resource,
            quantity: takeAmount,
          });
          remainingNeeded -= takeAmount;
        }
      }
    }

    return requiredResources;
  }

  // Get experience reward for recipe
  private getRecipeExperience(recipe: CraftingRecipe): number {
    const rarityMultiplier = {
      common: 50,
      rare: 100,
      epic: 200,
      legendary: 400,
    };

    return rarityMultiplier[recipe.output.rarity] || 50;
  }

  // Get all available recipes
  getAvailableRecipes(playerLevel: number): CraftingRecipe[] {
    return Array.from(this.recipes.values())
      .filter(recipe => recipe.requiredLevel <= playerLevel);
  }

  // Get recipe by ID
  getRecipe(recipeId: string): CraftingRecipe | null {
    return this.recipes.get(recipeId) || null;
  }

  // Get active crafting operations for player
  getPlayerCraftingOperations(playerId: string): CraftingOperation[] {
    return Array.from(this.activeCraftingOperations.values())
      .filter(op => op.playerId === playerId);
  }

  // Cancel crafting operation
  cancelCrafting(operationId: string): boolean {
    const operation = this.activeCraftingOperations.get(operationId);
    if (!operation || operation.isCompleted) {
      return false;
    }

    this.activeCraftingOperations.delete(operationId);
    this.craftingCallbacks.delete(operationId);
    return true;
  }

  // Register callback for crafting completion
  onCraftingComplete(operationId: string, callback: (result: CraftingResult) => void): void {
    this.craftingCallbacks.set(operationId, callback);
  }

  // Calculate crafting efficiency based on traits and equipment
  calculateCraftingEfficiency(playerTraits: any[], equipment: any[]): number {
    let efficiency = 1.0;

    // Apply trait bonuses
    playerTraits.forEach(trait => {
      if (trait.effects?.craftingSpeed) {
        efficiency *= trait.effects.craftingSpeed;
      }
      if (trait.effects?.materialEfficiency) {
        efficiency *= trait.effects.materialEfficiency;
      }
    });

    // Apply equipment bonuses
    equipment.forEach(item => {
      if (item.effects?.craftingBonus) {
        efficiency *= item.effects.craftingBonus;
      }
    });

    return efficiency;
  }

  // Get crafting progress for UI
  getCraftingProgress(operationId: string): { progress: number; timeRemaining: number } | null {
    const operation = this.activeCraftingOperations.get(operationId);
    if (!operation) return null;

    const elapsed = Date.now() - operation.startTime;
    const progress = Math.min(elapsed / operation.duration, 1.0);
    const timeRemaining = Math.max(operation.duration - elapsed, 0);

    return { progress, timeRemaining };
  }

  // Clear all operations
  clearAllOperations(): void {
    this.activeCraftingOperations.clear();
    this.craftingCallbacks.clear();
  }
}
