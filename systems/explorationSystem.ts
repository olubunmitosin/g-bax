import type { SpaceObject } from '@/types/game';
import * as THREE from 'three';

export interface ExplorationResult {
  success: boolean;
  discoveredObject?: SpaceObject;
  newLocation?: THREE.Vector3;
  experience: number;
  message: string;
}

export interface ExplorationProgress {
  id: string;
  playerId: string;
  discoveredObjects: Set<string>;
  visitedLocations: THREE.Vector3[];
  totalDistance: number;
  startTime: number;
}

export class ExplorationSystem {
  private explorationProgress: Map<string, ExplorationProgress> = new Map();
  private explorationCallbacks: Map<string, (result: ExplorationResult) => void> = new Map();
  private spaceObjects: SpaceObject[] = [];
  private lastPlayerPosition: THREE.Vector3 = new THREE.Vector3();
  private discoveryRadius: number = 5.0; // Distance to discover objects
  private locationRadius: number = 15.0; // Distance to count as new location (increased)
  // Notification system removed per user preference

  // Initialize exploration for a player
  initializeExploration(playerId: string): ExplorationProgress {
    const progress: ExplorationProgress = {
      id: `exploration_${Date.now()}_${Math.random()}`,
      playerId,
      discoveredObjects: new Set(),
      visitedLocations: [],
      totalDistance: 0,
      startTime: Date.now(),
    };

    this.explorationProgress.set(playerId, progress);
    return progress;
  }

  // Update space objects for discovery
  updateSpaceObjects(objects: SpaceObject[]): void {
    this.spaceObjects = objects;
  }

  // Update player position and check for discoveries
  updatePlayerPosition(playerId: string, newPosition: THREE.Vector3): ExplorationResult[] {
    const results: ExplorationResult[] = [];
    let progress = this.explorationProgress.get(playerId);

    if (!progress) {
      progress = this.initializeExploration(playerId);
    }

    // Calculate distance traveled
    const distance = this.lastPlayerPosition.distanceTo(newPosition);
    progress.totalDistance += distance;
    this.lastPlayerPosition.copy(newPosition);

    // Check for discoveries (notifications disabled)
    const discoveryResult = this.checkObjectDiscovery(playerId, newPosition);
    if (discoveryResult) {
      results.push(discoveryResult);
    } else {
      // Only check for location discovery if no object was discovered
      const locationResult = this.checkLocationDiscovery(playerId, newPosition);
      if (locationResult) {
        results.push(locationResult);
      }
    }

    return results;
  }

  // Check if player discovered any new objects
  private checkObjectDiscovery(playerId: string, playerPosition: THREE.Vector3): ExplorationResult | null {
    const progress = this.explorationProgress.get(playerId);
    if (!progress) return null;

    for (const spaceObject of this.spaceObjects) {
      // Skip if already discovered
      if (progress.discoveredObjects.has(spaceObject.id)) continue;

      // Check if player is close enough to discover
      const objectPosition = new THREE.Vector3(
        spaceObject.position.x,
        spaceObject.position.y,
        spaceObject.position.z
      );
      const distance = playerPosition.distanceTo(objectPosition);

      if (distance <= this.discoveryRadius) {
        // Mark as discovered
        progress.discoveredObjects.add(spaceObject.id);

        // Calculate experience reward based on object type
        const experience = this.calculateDiscoveryExperience(spaceObject);

        return {
          success: true,
          discoveredObject: spaceObject,
          experience,
          message: '', // Exploration notifications disabled
        };
      }
    }

    return null;
  }

  // Check if player discovered a new location
  private checkLocationDiscovery(playerId: string, playerPosition: THREE.Vector3): ExplorationResult | null {
    const progress = this.explorationProgress.get(playerId);
    if (!progress) return null;

    // Check if this location is significantly different from previous ones
    const isNewLocation = progress.visitedLocations.every(location =>
      location.distanceTo(playerPosition) > this.locationRadius
    );

    if (isNewLocation) {
      // Add new location
      progress.visitedLocations.push(playerPosition.clone());

      // Calculate experience reward
      const experience = 15; // Base experience for location discovery

      return {
        success: true,
        newLocation: playerPosition.clone(),
        experience,
        message: '', // Exploration notifications disabled
      };
    }

    return null;
  }

  // Calculate experience reward for discovering an object
  private calculateDiscoveryExperience(spaceObject: SpaceObject): number {
    const baseExperience = 20;

    // Bonus based on object type
    const typeBonus = {
      'asteroid': 10,
      'station': 50,
      'resource_node': 25,
      'debris': 5,
      'anomaly': 100,
    }[spaceObject.type] || 10;

    return baseExperience + typeBonus;
  }

  // Get exploration statistics for a player
  getExplorationStats(playerId: string): {
    discoveredObjects: number;
    visitedLocations: number;
    totalDistance: number;
    explorationTime: number;
  } | null {
    const progress = this.explorationProgress.get(playerId);
    if (!progress) return null;

    return {
      discoveredObjects: progress.discoveredObjects.size,
      visitedLocations: progress.visitedLocations.length,
      totalDistance: progress.totalDistance,
      explorationTime: Date.now() - progress.startTime,
    };
  }

  // Check if player can explore (always true for exploration)
  canExplore(playerId: string): { canExplore: boolean; reason?: string } {
    return { canExplore: true };
  }

  // Set up callback for exploration events
  onExplorationEvent(eventId: string, callback: (result: ExplorationResult) => void): void {
    this.explorationCallbacks.set(eventId, callback);
  }

  // Remove exploration callback
  removeExplorationCallback(eventId: string): void {
    this.explorationCallbacks.delete(eventId);
  }

  // Trigger exploration callbacks
  private triggerCallbacks(result: ExplorationResult): void {
    this.explorationCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Exploration callback error:', error);
      }
    });
  }

  // Get discovered objects for a player
  getDiscoveredObjects(playerId: string): string[] {
    const progress = this.explorationProgress.get(playerId);
    return progress ? Array.from(progress.discoveredObjects) : [];
  }

  // Get visited locations for a player
  getVisitedLocations(playerId: string): THREE.Vector3[] {
    const progress = this.explorationProgress.get(playerId);
    return progress ? [...progress.visitedLocations] : [];
  }

  // Clear exploration progress (for cleanup)
  clearExplorationProgress(playerId?: string): void {
    if (playerId) {
      this.explorationProgress.delete(playerId);
    } else {
      this.explorationProgress.clear();
    }
    this.explorationCallbacks.clear();
  }

  // Force discovery of an object (for testing or special events)
  forceDiscoverObject(playerId: string, objectId: string): ExplorationResult | null {
    const progress = this.explorationProgress.get(playerId);
    if (!progress) return null;

    const spaceObject = this.spaceObjects.find(obj => obj.id === objectId);
    if (!spaceObject || progress.discoveredObjects.has(objectId)) return null;

    progress.discoveredObjects.add(objectId);
    const experience = this.calculateDiscoveryExperience(spaceObject);

    return {
      success: true,
      discoveredObject: spaceObject,
      experience,
      message: '', // Exploration notifications disabled
    };
  }
}
