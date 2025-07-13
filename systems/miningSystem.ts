import { GAME_CONFIG, RESOURCE_TYPES } from '@/utils/constants';
import { generateRandomResource } from '@/utils/gameHelpers';
import type { SpaceObject, Resource } from '@/types/game';

export interface MiningOperation {
  id: string;
  targetObjectId: string;
  playerId: string;
  startTime: number;
  duration: number;
  progress: number;
  isCompleted: boolean;
  resources: Resource[];
  efficiency: number;
}

export interface MiningResult {
  success: boolean;
  resources: Resource[];
  experience: number;
  damage: number;
  message: string;
}

export class MiningSystem {
  private activeMiningOperations: Map<string, MiningOperation> = new Map();
  private miningCallbacks: Map<string, (result: MiningResult) => void> = new Map();
  private spaceObjects: SpaceObject[] = []; // Store reference to space objects

  // Start mining operation on a space object
  startMining(
    playerId: string,
    targetObject: SpaceObject,
    efficiency: number = 1.0
  ): MiningOperation | null {
    // Check if object can be mined
    if (!this.canMineObject(targetObject)) {
      return null;
    }

    // Check if already mining this object
    const existingOperation = Array.from(this.activeMiningOperations.values())
      .find(op => op.targetObjectId === targetObject.id && op.playerId === playerId);

    if (existingOperation) {
      return existingOperation;
    }

    // Calculate mining duration based on object type and efficiency
    const baseDuration = this.getBaseMiningDuration(targetObject);
    const adjustedDuration = baseDuration / efficiency;

    const operation: MiningOperation = {
      id: `mining_${Date.now()}_${Math.random()}`,
      targetObjectId: targetObject.id,
      playerId,
      startTime: Date.now(),
      duration: adjustedDuration,
      progress: 0,
      isCompleted: false,
      resources: [],
      efficiency,
    };

    this.activeMiningOperations.set(operation.id, operation);
    return operation;
  }

  // Update mining progress
  updateMining(deltaTime: number): MiningResult[] {
    const results: MiningResult[] = [];
    const completedOperations: string[] = [];

    this.activeMiningOperations.forEach((operation, operationId) => {
      if (operation.isCompleted) return;

      // Update progress
      const elapsed = Date.now() - operation.startTime;
      operation.progress = Math.min(elapsed / operation.duration, 1.0);

      // Check if mining is complete
      if (operation.progress >= 1.0) {
        operation.isCompleted = true;
        const result = this.completeMining(operation);
        results.push(result);
        completedOperations.push(operationId);

        // Call callback if registered
        const callback = this.miningCallbacks.get(operationId);
        if (callback) {
          callback(result);
          this.miningCallbacks.delete(operationId);
        }
      }
    });

    // Clean up completed operations
    completedOperations.forEach(id => {
      this.activeMiningOperations.delete(id);
    });

    return results;
  }

  // Complete mining operation and generate resources
  private completeMining(operation: MiningOperation): MiningResult {
    // Find the target object to get its specific resources
    const targetObject = this.findObjectById(operation.targetObjectId);

    const resources: Resource[] = [];

    if (targetObject && targetObject.resources && targetObject.resources.length > 0) {
      // Use the object's specific resources
      const baseResourceCount = this.getBaseResourceCount(operation.targetObjectId);
      const adjustedResourceCount = Math.floor(baseResourceCount * operation.efficiency);

      for (let i = 0; i < adjustedResourceCount; i++) {
        // Pick a random resource from the object's available resources
        const sourceResource = targetObject.resources[Math.floor(Math.random() * targetObject.resources.length)];

        // Create a new resource instance based on the source
        const resource: Resource = {
          id: `${sourceResource.type}_${sourceResource.rarity}_${Date.now()}_${Math.random()}`,
          name: sourceResource.name,
          type: sourceResource.type,
          quantity: Math.floor(Math.random() * 5) + 1, // 1-5 quantity per mining
          rarity: sourceResource.rarity,
        };
        resources.push(resource);
      }
    } else {
      // Fallback to random generation if object has no specific resources
      const baseResourceCount = this.getBaseResourceCount(operation.targetObjectId);
      const adjustedResourceCount = Math.floor(baseResourceCount * operation.efficiency);

      for (let i = 0; i < adjustedResourceCount; i++) {
        const resource = generateRandomResource();
        resources.push(resource);
      }
    }

    // Calculate experience reward
    const baseExperience = 25;
    const experience = Math.floor(baseExperience * operation.efficiency);

    // Calculate damage to object (for future health system)
    const damage = 10;

    operation.resources = resources;

    return {
      success: true,
      resources,
      experience,
      damage,
      message: `Mining completed! Extracted ${resources.length} resources.`,
    };
  }

  // Cancel mining operation
  cancelMining(operationId: string): boolean {
    const operation = this.activeMiningOperations.get(operationId);
    if (!operation || operation.isCompleted) {
      return false;
    }

    this.activeMiningOperations.delete(operationId);
    this.miningCallbacks.delete(operationId);
    return true;
  }

  // Get mining operation by ID
  getMiningOperation(operationId: string): MiningOperation | null {
    return this.activeMiningOperations.get(operationId) || null;
  }

  // Get all active mining operations for a player
  getPlayerMiningOperations(playerId: string): MiningOperation[] {
    return Array.from(this.activeMiningOperations.values())
      .filter(op => op.playerId === playerId);
  }

  // Register callback for mining completion
  onMiningComplete(operationId: string, callback: (result: MiningResult) => void): void {
    this.miningCallbacks.set(operationId, callback);
  }

  // Check if an object can be mined
  private canMineObject(object: SpaceObject): boolean {
    return object.type === 'asteroid' || object.type === 'resource_node';
  }

  // Get base mining duration for object type
  private getBaseMiningDuration(object: SpaceObject): number {
    switch (object.type) {
      case 'asteroid':
        return GAME_CONFIG.MINING_DURATION * 0.8; // Asteroids are easier to mine
      case 'resource_node':
        return GAME_CONFIG.MINING_DURATION * 1.5; // Resource nodes take longer but yield more
      default:
        return GAME_CONFIG.MINING_DURATION;
    }
  }

  // Get base resource count for object
  private getBaseResourceCount(objectId: string): number {
    // This would typically be based on object properties
    // For now, using random values based on object type
    return Math.floor(Math.random() * 3) + 1; // 1-3 resources
  }

  // Get mining efficiency based on player traits and equipment
  calculateMiningEfficiency(playerTraits: any[], equipment: any[]): number {
    let efficiency = 1.0;

    // Apply trait bonuses
    playerTraits.forEach(trait => {
      if (trait.effects?.miningSpeed) {
        efficiency *= trait.effects.miningSpeed;
      }
      if (trait.effects?.resourceYield) {
        efficiency *= trait.effects.resourceYield;
      }
    });

    // Apply equipment bonuses
    equipment.forEach(item => {
      if (item.effects?.miningBonus) {
        efficiency *= item.effects.miningBonus;
      }
    });

    return efficiency;
  }

  // Get mining progress for UI display
  getMiningProgress(operationId: string): { progress: number; timeRemaining: number } | null {
    const operation = this.activeMiningOperations.get(operationId);
    if (!operation) return null;

    const elapsed = Date.now() - operation.startTime;
    const progress = Math.min(elapsed / operation.duration, 1.0);
    const timeRemaining = Math.max(operation.duration - elapsed, 0);

    return { progress, timeRemaining };
  }

  // Check if player can start mining (cooldown, energy, etc.)
  canStartMining(playerId: string, targetObject: SpaceObject): { canMine: boolean; reason?: string } {
    // Check if object can be mined
    if (!this.canMineObject(targetObject)) {
      return { canMine: false, reason: 'This object cannot be mined' };
    }

    // Check if object has health remaining
    if (targetObject.health !== undefined && targetObject.health <= 0) {
      return { canMine: false, reason: 'This object is depleted' };
    }

    // Check if already mining this object
    const existingOperation = Array.from(this.activeMiningOperations.values())
      .find(op => op.targetObjectId === targetObject.id && op.playerId === playerId);

    if (existingOperation && !existingOperation.isCompleted) {
      return { canMine: false, reason: 'Already mining this object' };
    }

    // Check maximum concurrent mining operations
    const playerOperations = this.getPlayerMiningOperations(playerId);
    const maxConcurrentOperations = 3; // Could be based on player level/traits

    if (playerOperations.length >= maxConcurrentOperations) {
      return { canMine: false, reason: 'Maximum mining operations reached' };
    }

    return { canMine: true };
  }

  // Get estimated mining yield for an object
  getEstimatedYield(targetObject: SpaceObject, efficiency: number = 1.0): {
    resourceCount: number;
    duration: number;
    experience: number;
  } {
    const baseResourceCount = this.getBaseResourceCount(targetObject.id);
    const baseDuration = this.getBaseMiningDuration(targetObject);
    const baseExperience = 25;

    return {
      resourceCount: Math.floor(baseResourceCount * efficiency),
      duration: baseDuration / efficiency,
      experience: Math.floor(baseExperience * efficiency),
    };
  }

  // Clear all mining operations (for cleanup)
  clearAllOperations(): void {
    this.activeMiningOperations.clear();
    this.miningCallbacks.clear();
  }

  // Get mining statistics
  getMiningStats(): {
    activeOperations: number;
    totalOperationsToday: number;
    averageEfficiency: number;
  } {
    const activeOperations = this.activeMiningOperations.size;

    // These would typically be stored in a database or persistent storage
    const totalOperationsToday = 0;
    const averageEfficiency = 1.0;

    return {
      activeOperations,
      totalOperationsToday,
      averageEfficiency,
    };
  }

  // Update space objects reference for resource lookup
  updateSpaceObjects(objects: SpaceObject[]): void {
    this.spaceObjects = objects;
  }

  // Find object by ID for resource lookup
  private findObjectById(objectId: string): SpaceObject | undefined {
    return this.spaceObjects.find(obj => obj.id === objectId);
  }
}
