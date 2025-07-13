// Game constants
export const GAME_CONFIG = {
  // Player settings
  INITIAL_CREDITS: 1000,
  INITIAL_LEVEL: 1,
  INITIAL_EXPERIENCE: 0,
  
  // Experience and leveling
  EXPERIENCE_PER_LEVEL: 1000,
  MAX_LEVEL: 100,
  
  // Mining settings
  MINING_DURATION: 5000, // 5 seconds in milliseconds
  MINING_ENERGY_COST: 10,
  
  // Crafting settings
  CRAFTING_DURATION: 3000, // 3 seconds in milliseconds
  
  // Mission settings
  MAX_ACTIVE_MISSIONS: 3,
  MISSION_COOLDOWN: 60000, // 1 minute in milliseconds
} as const;

// Resource types and rarities
export const RESOURCE_TYPES = {
  CRYSTAL: 'crystal',
  METAL: 'metal',
  ENERGY: 'energy',
} as const;

export const RESOURCE_RARITIES = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;

// Mission types
export const MISSION_TYPES = {
  MINING: 'mining',
  CRAFTING: 'crafting',
  EXPLORATION: 'exploration',
} as const;

// Scene types
export const SCENES = {
  MENU: 'menu',
  SPACE: 'space',
  CRAFTING: 'crafting',
  MISSIONS: 'missions',
} as const;

// Solana network configuration
export const SOLANA_CONFIG = {
  NETWORK: 'devnet',
  COMMITMENT: 'confirmed',
} as const;

// 3D Scene configuration
export const SCENE_CONFIG = {
  CAMERA: {
    POSITION: [0, 0, 8] as [number, number, number],
    FOV: 60,
    NEAR: 0.1,
    FAR: 1000,
  },
  CONTROLS: {
    MIN_DISTANCE: 3,
    MAX_DISTANCE: 20,
    ENABLE_PAN: true,
    ENABLE_ZOOM: true,
    ENABLE_ROTATE: true,
  },
  STARS: {
    RADIUS: 300,
    DEPTH: 60,
    COUNT: 1000,
    FACTOR: 7,
    SPEED: 1,
  },
} as const;

// Color palette for the game
export const COLORS = {
  PRIMARY: '#4f46e5',
  SECONDARY: '#06b6d4',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  
  // Resource colors
  CRYSTAL: '#8b5cf6',
  METAL: '#6b7280',
  ENERGY: '#fbbf24',
  
  // Rarity colors
  COMMON: '#9ca3af',
  RARE: '#3b82f6',
  EPIC: '#8b5cf6',
  LEGENDARY: '#f59e0b',
} as const;
