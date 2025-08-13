import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};
export interface HoneycombConfig {
  rpcUrl: string;
  environment: "devnet" | "mainnet-beta" | "honeynet";
  projectAddress?: string;
  edgeApiUrl?: string;
}

export interface PlayerProfile {
  id: string;
  name: string;
  experience: number;
  level: number;
  credits: number;
  address?: string;
  userId?: number;
  bio?: string;
  pfp?: string;
  platformData?: {
    custom?: {
      miningOperations?: number;
      itemsCrafted?: number;
      sectorsExplored?: number;
      combatWins?: number;
      leadershipActions?: number;
    };
  };
}

export interface MissionProgress {
  missionId: string;
  playerId: string;
  progress: number;
  completed: boolean;
  rewards: any[];
  startedAt: Date;
  completedAt?: Date;
}

export interface PlayerTrait {
  traitId: string;
  playerId: string;
  level: number;
  experience: number;
  effects: Record<string, number>;
  acquiredAt: Date;
}

export interface TransactionResponse {
  transaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
}

// Honeycomb Mission System Types
export interface HoneycombMissionPool {
  address: string;
  name: string;
  project: string;
  characterModel: string;
  authority: string;
}

export interface HoneycombMissionReward {
  kind: "Xp" | "Resource";
  min: string;
  max: string;
  resource?: string; // Only for Resource rewards
}

export interface HoneycombMissionData {
  name: string;
  project: string;
  missionPool: string;
  authority: string;
  payer: string;
  minXp: string;
  cost: {
    address: string;
    amount: string;
  };
  duration: string; // in seconds
  rewards: HoneycombMissionReward[];
}

export interface HoneycombMissionInstance {
  address: string;
  name: string;
  missionPool: string;
  duration: number;
  minXp: number;
  cost: {
    resource: string;
    amount: number;
  };
  rewards: HoneycombMissionReward[];
  isActive: boolean;
}

// Honeycomb Character System Types
export interface HoneycombCharacterTrait {
  label: string;
  name: string;
  uri: string;
  description?: string;
  rarity?: "common" | "rare" | "epic" | "legendary";
  benefits?: {
    miningBonus?: number;
    craftingBonus?: number;
    explorationBonus?: number;
    combatBonus?: number;
    leadershipBonus?: number;
  };
}

export interface HoneycombCharacter {
  address: string;
  owner: string;
  traits: string[][]; // Array of [category, name] pairs
  level: number;
  experience: number;
  createdAt: Date;
  lastUpdated: Date;
}

export interface HoneycombAssemblerConfig {
  address: string;
  project: string;
  authority: string;
  ticker: string;
  order: string[];
  treeAddress: string;
}

export interface HoneycombCharacterModel {
  address: string;
  project: string;
  authority: string;
  assemblerConfig: string;
  collectionName: string;
  name: string;
  symbol: string;
  description: string;
}

// Honeycomb Achievement System Types
export interface HoneycombAchievement {
  id: string;
  name: string;
  description: string;
  category: "mining" | "crafting" | "exploration" | "progression" | "missions" | "special";
  requirements: {
    miningCount?: number;
    craftingCount?: number;
    explorationCount?: number;
    level?: number;
    missionsCompleted?: number;
    traitCategories?: number;
    blockchainXP?: number;
  };
  rewards: {
    experience: number;
    credits: number;
    resources?: any[];
  };
  rarity: "common" | "rare" | "epic" | "legendary";
  icon?: string;
  unlockedAt?: Date;
}

export interface PlayerAchievementProgress {
  achievementId: string;
  playerId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  onChain: boolean;
}

export interface AchievementSystemStatus {
  isInitialized: boolean;
  resourceAddress: string | null;
  achievementsCount: number;
  playerAchievementsCount: number;
}

// On-Chain Resource Ownership Types
export interface GameResource {
  id: string;
  name: string;
  symbol: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  decimals: number;
  maxSupply: number;
  category: "mining" | "crafted" | "energy" | "special";
  address: string;
  createdAt: Date;
  icon?: string;
}

export interface PlayerResourceHolding {
  resourceId: string;
  amount: number;
  lastUpdated: Date;
  onChain: boolean;
}

export interface ResourceTransfer {
  id: string;
  fromPlayer: string;
  toPlayer: string;
  resourceId: string;
  amount: number;
  timestamp: Date;
  transactionHash: string;
  status: "pending" | "completed" | "failed";
}

export interface ResourceSystemStatus {
  isInitialized: boolean;
  resourceCount: number;
  totalPlayers: number;
  totalHoldings: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  inputs: Array<{
    resourceId: string;
    amount: number;
  }>;
  outputs: Array<{
    resourceId: string;
    amount: number;
    probability: number;
  }>;
  craftingTime: number;
  requiredLevel: number;
  category: string;
}

// Guild Progression on Blockchain Types
export interface Guild {
  id: string;
  name: string;
  description: string;
  category: "mining" | "crafting" | "exploration" | "combat" | "leadership";
  requirements: {
    level?: number;
    miningOperations?: number;
    itemsCrafted?: number;
    sectorsExplored?: number;
    combatWins?: number;
    leadershipActions?: number;
    achievements?: number;
  };
  benefits: {
    miningBonus?: number;
    craftingBonus?: number;
    explorationBonus?: number;
    combatBonus?: number;
    leadershipBonus?: number;
    experienceBonus?: number;
    allActivitiesBonus?: number;
    resourceBonus?: number;
    qualityBonus?: number;
    discoveryBonus?: number;
    defenseBonus?: number;
  };
  level: number;
  experience: number;
  memberCount: number;
  maxMembers: number;
  totalContributions: number;
  leader: string | null;
  lastActivity: Date;
  icon: string;
}

export interface GuildMember {
  wallet: string;
  rank: "member" | "officer" | "leader";
  contributions: number;
  joinedAt: Date;
  lastActivity: Date;
}

export interface PlayerGuildInfo {
  guild: Guild;
  membership: GuildMember;
}

export interface GuildContribution {
  type: "mining" | "crafting" | "exploration" | "mission" | "leadership";
  amount: number;
  points: number;
  timestamp: Date;
  playerWallet: string;
}

export interface GuildSystemStatus {
  isInitialized: boolean;
  resourceAddress: string | null;
  guildsCount: number;
  totalMembers: number;
}

