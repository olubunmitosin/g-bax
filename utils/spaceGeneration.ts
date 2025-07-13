import * as THREE from 'three';
import { COLORS, RESOURCE_TYPES, RESOURCE_RARITIES } from './constants';
import { generateRandomResource } from './gameHelpers';
import type { SpaceObject } from '@/types/game';

export interface SpaceSectorConfig {
  size: number;
  asteroidCount: number;
  resourceNodeCount: number;
  stationCount: number;
  density: number;
  seed?: number;
}

export interface GeneratedSector {
  id: string;
  name: string;
  objects: SpaceObject[];
  bounds: THREE.Box3;
  center: THREE.Vector3;
}

// Seeded random number generator for consistent generation
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  choice<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

export class SpaceGenerator {
  private static sectorNames = [
    'Alpha Centauri', 'Beta Orionis', 'Gamma Draconis', 'Delta Vega',
    'Epsilon Eridani', 'Zeta Reticuli', 'Eta Carinae', 'Theta Serpentis',
    'Iota Pegasi', 'Kappa Cygni', 'Lambda Scorpii', 'Mu Andromedae',
    'Nu Phoenicis', 'Xi Hydrae', 'Omicron Ceti', 'Pi Mensae',
    'Rho Cassiopeiae', 'Sigma Sagittarii', 'Tau Ceti', 'Upsilon Boötis'
  ];

  static generateSector(config: SpaceSectorConfig): GeneratedSector {
    const seed = config.seed || Math.floor(Math.random() * 1000000);
    const rng = new SeededRandom(seed);
    
    const sectorId = `sector_${seed}`;
    const sectorName = rng.choice(this.sectorNames) + ` Sector ${seed.toString().slice(-3)}`;
    
    const objects: SpaceObject[] = [];
    const center = new THREE.Vector3(0, 0, 0);
    const bounds = new THREE.Box3(
      new THREE.Vector3(-config.size / 2, -config.size / 2, -config.size / 2),
      new THREE.Vector3(config.size / 2, config.size / 2, config.size / 2)
    );

    // Generate asteroids
    for (let i = 0; i < config.asteroidCount; i++) {
      const asteroid = this.generateAsteroid(rng, config.size, i);
      objects.push(asteroid);
    }

    // Generate resource nodes
    for (let i = 0; i < config.resourceNodeCount; i++) {
      const resourceNode = this.generateResourceNode(rng, config.size, i);
      objects.push(resourceNode);
    }

    // Generate stations
    for (let i = 0; i < config.stationCount; i++) {
      const station = this.generateStation(rng, config.size, i);
      objects.push(station);
    }

    return {
      id: sectorId,
      name: sectorName,
      objects,
      bounds,
      center,
    };
  }

  private static generateAsteroid(rng: SeededRandom, sectorSize: number, index: number): SpaceObject {
    const position: [number, number, number] = [
      rng.range(-sectorSize / 2, sectorSize / 2),
      rng.range(-sectorSize / 2, sectorSize / 2),
      rng.range(-sectorSize / 2, sectorSize / 2),
    ];

    const scale = rng.range(0.3, 1.2);
    const rotation: [number, number, number] = [
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
    ];

    // Some asteroids might contain resources
    const hasResources = rng.next() < 0.3; // 30% chance
    const resources = hasResources ? [generateRandomResource()] : [];

    return {
      id: `asteroid_${index}`,
      type: 'asteroid',
      position,
      rotation,
      scale: [scale, scale, scale],
      health: Math.floor(scale * 100),
      maxHealth: Math.floor(scale * 100),
      resources,
    };
  }

  private static generateResourceNode(rng: SeededRandom, sectorSize: number, index: number): SpaceObject {
    const position: [number, number, number] = [
      rng.range(-sectorSize / 2, sectorSize / 2),
      rng.range(-sectorSize / 2, sectorSize / 2),
      rng.range(-sectorSize / 2, sectorSize / 2),
    ];

    const resourceType = rng.choice(['crystal', 'metal', 'energy']);
    const rarity = this.getWeightedRarity(rng);
    
    // Resource nodes are larger and more valuable
    const scale = rng.range(0.8, 1.5);
    const rotation: [number, number, number] = [
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
    ];

    // Generate multiple resources based on rarity
    const resourceCount = rarity === 'legendary' ? 5 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1;
    const resources = Array.from({ length: resourceCount }, () => ({
      id: `${resourceType}_${rarity}_${Date.now()}_${Math.random()}`,
      name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`,
      type: resourceType as 'crystal' | 'metal' | 'energy',
      quantity: rng.range(10, 50),
      rarity: rarity as 'common' | 'rare' | 'epic' | 'legendary',
    }));

    return {
      id: `resource_node_${index}`,
      type: 'resource_node',
      position,
      rotation,
      scale: [scale, scale, scale],
      health: Math.floor(scale * 200),
      maxHealth: Math.floor(scale * 200),
      resources,
    };
  }

  private static generateStation(rng: SeededRandom, sectorSize: number, index: number): SpaceObject {
    const position: [number, number, number] = [
      rng.range(-sectorSize / 3, sectorSize / 3), // Stations closer to center
      rng.range(-sectorSize / 3, sectorSize / 3),
      rng.range(-sectorSize / 3, sectorSize / 3),
    ];

    const scale = rng.range(2, 4); // Stations are larger
    const rotation: [number, number, number] = [
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
      rng.range(0, Math.PI * 2),
    ];

    return {
      id: `station_${index}`,
      type: 'station',
      position,
      rotation,
      scale: [scale, scale, scale],
      health: Math.floor(scale * 500),
      maxHealth: Math.floor(scale * 500),
      resources: [], // Stations don't contain mineable resources
    };
  }

  private static getWeightedRarity(rng: SeededRandom): string {
    const rand = rng.next();
    if (rand < 0.6) return 'common';
    if (rand < 0.85) return 'rare';
    if (rand < 0.97) return 'epic';
    return 'legendary';
  }

  static generateAsteroidField(
    center: THREE.Vector3,
    radius: number,
    count: number,
    seed?: number
  ): SpaceObject[] {
    const rng = new SeededRandom(seed || Math.floor(Math.random() * 1000000));
    const asteroids: SpaceObject[] = [];

    for (let i = 0; i < count; i++) {
      // Generate position within sphere
      const theta = rng.range(0, Math.PI * 2);
      const phi = Math.acos(2 * rng.next() - 1);
      const r = rng.range(0.3, 1) * radius;

      const x = center.x + r * Math.sin(phi) * Math.cos(theta);
      const y = center.y + r * Math.sin(phi) * Math.sin(theta);
      const z = center.z + r * Math.cos(phi);

      const scale = rng.range(0.2, 0.8);
      const rotation: [number, number, number] = [
        rng.range(0, Math.PI * 2),
        rng.range(0, Math.PI * 2),
        rng.range(0, Math.PI * 2),
      ];

      asteroids.push({
        id: `field_asteroid_${i}`,
        type: 'asteroid',
        position: [x, y, z],
        rotation,
        scale: [scale, scale, scale],
        health: Math.floor(scale * 50),
        maxHealth: Math.floor(scale * 50),
        resources: rng.next() < 0.2 ? [generateRandomResource()] : [],
      });
    }

    return asteroids;
  }

  static getObjectColor(object: SpaceObject): string {
    switch (object.type) {
      case 'asteroid':
        return '#8B7355'; // Brown-gray
      case 'resource_node':
        if (object.resources && object.resources.length > 0) {
          const resource = object.resources[0];
          switch (resource.type) {
            case 'crystal':
              return COLORS.CRYSTAL;
            case 'metal':
              return COLORS.METAL;
            case 'energy':
              return COLORS.ENERGY;
          }
        }
        return COLORS.PRIMARY;
      case 'station':
        return COLORS.SECONDARY;
      default:
        return COLORS.PRIMARY;
    }
  }

  static getObjectGeometry(object: SpaceObject): THREE.BufferGeometry {
    switch (object.type) {
      case 'asteroid':
        // Irregular asteroid shape
        const asteroidGeometry = new THREE.DodecahedronGeometry(1, 0);
        // Add some randomness to vertices for irregular shape
        const positions = asteroidGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          const noise = 0.1 + Math.random() * 0.2;
          positions[i] *= noise;
          positions[i + 1] *= noise;
          positions[i + 2] *= noise;
        }
        asteroidGeometry.attributes.position.needsUpdate = true;
        asteroidGeometry.computeVertexNormals();
        return asteroidGeometry;

      case 'resource_node':
        return new THREE.OctahedronGeometry(1, 1);

      case 'station':
        return new THREE.CylinderGeometry(0.5, 1, 2, 8);

      default:
        return new THREE.SphereGeometry(1, 16, 16);
    }
  }
}
