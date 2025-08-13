import type { Resource } from "@/stores/gameStore";

import { GAME_CONFIG, RESOURCE_RARITIES, COLORS } from "./constants";

/**
 * Calculate the experience required for a given level
 */
export function getExperienceForLevel(level: number): number {
  return level * GAME_CONFIG.EXPERIENCE_PER_LEVEL;
}

/**
 * Calculate the current level based on experience
 */
export function getLevelFromExperience(experience: number): number {
  return Math.floor(experience / GAME_CONFIG.EXPERIENCE_PER_LEVEL) + 1;
}

/**
 * Calculate experience progress to next level
 */
export function getExperienceProgress(experience: number): {
  currentLevel: number;
  experienceInLevel: number;
  experienceToNextLevel: number;
  progressPercentage: number;
} {
  const currentLevel = getLevelFromExperience(experience);
  const experienceForCurrentLevel = getExperienceForLevel(currentLevel - 1);
  const experienceForNextLevel = getExperienceForLevel(currentLevel);
  const experienceInLevel = experience - experienceForCurrentLevel;
  const experienceToNextLevel = experienceForNextLevel - experience;
  const progressPercentage =
    (experienceInLevel / GAME_CONFIG.EXPERIENCE_PER_LEVEL) * 100;

  return {
    currentLevel,
    experienceInLevel,
    experienceToNextLevel,
    progressPercentage,
  };
}

/**
 * Generate a random resource based on rarity weights
 */
export function generateRandomResource(): Resource {
  const rarityWeights = {
    [RESOURCE_RARITIES.COMMON]: 60,
    [RESOURCE_RARITIES.RARE]: 25,
    [RESOURCE_RARITIES.EPIC]: 12,
    [RESOURCE_RARITIES.LEGENDARY]: 3,
  };

  const totalWeight = Object.values(rarityWeights).reduce(
    (sum, weight) => sum + weight,
    0,
  );
  const random = Math.random() * totalWeight;

  let currentWeight = 0;
  let selectedRarity: Resource["rarity"] = RESOURCE_RARITIES.COMMON;

  for (const [rarityKey, weight] of Object.entries(rarityWeights)) {
    currentWeight += weight;
    if (random <= currentWeight) {
      selectedRarity = rarityKey as Resource["rarity"];
      break;
    }
  }

  const resourceTypes = ["crystal", "metal", "energy"] as const;
  const randomType =
    resourceTypes[Math.floor(Math.random() * resourceTypes.length)];

  const baseQuantity = {
    [RESOURCE_RARITIES.COMMON]: Math.floor(Math.random() * 10) + 1,
    [RESOURCE_RARITIES.RARE]: Math.floor(Math.random() * 5) + 1,
    [RESOURCE_RARITIES.EPIC]: Math.floor(Math.random() * 3) + 1,
    [RESOURCE_RARITIES.LEGENDARY]: 1,
  };

  return {
    id: `${randomType}_${selectedRarity}_${Date.now()}_${Math.random()}`,
    name: `${selectedRarity.charAt(0).toUpperCase() + selectedRarity.slice(1)} ${randomType.charAt(0).toUpperCase() + randomType.slice(1)}`,
    type: randomType,
    quantity: baseQuantity[selectedRarity],
    rarity: selectedRarity,
  };
}

/**
 * Get color for resource rarity
 */
export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case RESOURCE_RARITIES.COMMON:
      return COLORS.COMMON;
    case RESOURCE_RARITIES.RARE:
      return COLORS.RARE;
    case RESOURCE_RARITIES.EPIC:
      return COLORS.EPIC;
    case RESOURCE_RARITIES.LEGENDARY:
      return COLORS.LEGENDARY;
    default:
      return COLORS.COMMON;
  }
}

/**
 * Get color for resource type
 */
export function getResourceTypeColor(type: string): string {
  switch (type) {
    case "crystal":
      return COLORS.CRYSTAL;
    case "metal":
      return COLORS.METAL;
    case "energy":
      return COLORS.ENERGY;
    default:
      return COLORS.PRIMARY;
  }
}

/**
 * Format large numbers with suffixes (K, M, B)
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }

  return num.toString();
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(
  address: string,
  length: number = 4,
): string {
  if (address.length <= length * 2) return address;

  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Calculate distance between two 3D points
 */
export function calculateDistance(
  point1: [number, number, number],
  point2: [number, number, number],
): number {
  const [x1, y1, z1] = point1;
  const [x2, y2, z2] = point2;

  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2);
}

/**
 * Generate random position within a sphere
 */
export function generateRandomPosition(
  radius: number = 10,
): [number, number, number] {
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = Math.random() * radius;

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return [x, y, z];
}
