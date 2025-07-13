// Re-export types from stores for easier importing
export type {
  Player,
  Resource,
  Mission,
  GameState,
} from '@/stores/gameStore';

export type {
  WalletState,
} from '@/stores/walletStore';

// Additional game types
export interface SpaceObject {
  id: string;
  type: 'asteroid' | 'station' | 'resource_node' | 'enemy';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  health?: number;
  maxHealth?: number;
  resources?: Resource[];
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  requiredResources: {
    resourceType: string;
    quantity: number;
  }[];
  output: Resource;
  craftingTime: number; // in milliseconds
  requiredLevel: number;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  type: 'miners' | 'forgers' | 'explorers';
  level: number;
  experience: number;
  benefits: {
    xpMultiplier: number;
    resourceBonus: number;
    specialAbilities: string[];
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'mining' | 'crafting' | 'exploration' | 'social' | 'progression';
  requirements: {
    type: string;
    target: number;
    current: number;
  }[];
  rewards: {
    experience: number;
    credits: number;
    resources?: Resource[];
    title?: string;
  };
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// UI and interaction types
export interface GameUIState {
  showInventory: boolean;
  showMissions: boolean;
  showCrafting: boolean;
  showSettings: boolean;
  selectedObject: SpaceObject | null;
  hoveredObject: SpaceObject | null;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Honeycomb Protocol types (will be expanded when we integrate)
export interface HoneycombMission {
  id: string;
  title: string;
  description: string;
  requirements: any[];
  rewards: any[];
  status: 'available' | 'active' | 'completed';
  onChainData?: any;
}

export interface HoneycombTrait {
  id: string;
  name: string;
  description: string;
  category: string;
  level: number;
  effects: {
    [key: string]: number;
  };
  onChainData?: any;
}

// Verxio types (will be expanded when we integrate)
export interface VerxioLoyaltyTier {
  id: string;
  name: string;
  requiredPoints: number;
  benefits: {
    xpMultiplier: number;
    discounts: number;
    exclusiveContent: string[];
  };
}

export interface VerxioProfile {
  id: string;
  points: number;
  tier: VerxioLoyaltyTier;
  streakDays: number;
  totalSpent: number;
  joinedAt: Date;
}
