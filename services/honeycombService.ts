/* eslint-disable @typescript-eslint/no-unused-vars */
// Conditional imports to avoid Node.js modules in browser
let EdgeClient: any = null;
let HiveControl: any = null;

// Only import Honeycomb packages on the server side or when needed
if (typeof window === "undefined") {
  try {
    EdgeClient = require("@honeycomb-protocol/edge-client").EdgeClient;
    HiveControl = require("@honeycomb-protocol/hive-control").HiveControl;
  } catch (error) {}
}

import type { HoneycombMission } from "@/types/game";

import { Connection, PublicKey, Keypair } from "@solana/web3.js";

export interface HoneycombConfig {
  rpcUrl: string;
  environment: "devnet" | "mainnet-beta";
  projectAddress?: string;
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

export class HoneycombService {
  private edgeClient: any;
  private hiveControl: any;
  private connection: Connection;
  private config: HoneycombConfig;

  constructor(config: HoneycombConfig) {
    this.config = config;
    this.connection = new Connection(config.rpcUrl, "confirmed");

    // Initialize Honeycomb clients only if available
    if (EdgeClient && HiveControl) {
      this.edgeClient = new EdgeClient({
        connection: this.connection,
        environment: config.environment,
      });

      this.hiveControl = new HiveControl({
        connection: this.connection,
        environment: config.environment,
      });
    } else {
      this.edgeClient = null;
      this.hiveControl = null;
    }
  }

  // Mission Management
  async createMission(
    authority: Keypair,
    missionData: {
      name: string;
      description: string;
      requirements: any[];
      rewards: any[];
      duration?: number;
    },
  ): Promise<string> {
    try {
      if (!this.hiveControl) {
        throw new Error("Honeycomb not available");
      }

      // Create mission using Honeycomb Protocol
      const mission = await this.hiveControl.createMission({
        authority,
        name: missionData.name,
        description: missionData.description,
        requirements: missionData.requirements,
        rewards: missionData.rewards,
        duration: missionData.duration,
      });

      return mission.address.toString();
    } catch (error) {
      throw new Error("Failed to create mission");
    }
  }

  async startMission(
    player: PublicKey,
    missionId: string,
    playerKeypair?: Keypair,
  ): Promise<MissionProgress> {
    try {
      if (!this.hiveControl) {
        // Mock implementation when Honeycomb is not available
        return {
          missionId,
          playerId: player.toString(),
          progress: 0,
          completed: false,
          rewards: [],
          startedAt: new Date(),
        };
      }

      // Start mission participation
      const participation = await this.hiveControl.participateInMission({
        player,
        missionAddress: new PublicKey(missionId),
        playerKeypair,
      });

      return {
        missionId,
        playerId: player.toString(),
        progress: 0,
        completed: false,
        rewards: [],
        startedAt: new Date(),
      };
    } catch (error) {
      throw new Error("Failed to start mission");
    }
  }

  async updateMissionProgress(
    player: PublicKey,
    missionId: string,
    progress: number,
    playerKeypair?: Keypair,
  ): Promise<MissionProgress> {
    try {
      if (!this.hiveControl) {
        // Mock implementation when Honeycomb is not available
        return {
          missionId,
          playerId: player.toString(),
          progress,
          completed: progress >= 100,
          rewards: [],
          startedAt: new Date(),
        };
      }

      // Update mission progress on-chain
      await this.hiveControl.updateMissionProgress({
        player,
        missionAddress: new PublicKey(missionId),
        progress,
        playerKeypair,
      });

      // Check if mission is completed
      const isCompleted = progress >= 100;

      return {
        missionId,
        playerId: player.toString(),
        progress,
        completed: isCompleted,
        rewards: isCompleted ? await this.getMissionRewards(missionId) : [],
        startedAt: new Date(), // This would come from on-chain data
        completedAt: isCompleted ? new Date() : undefined,
      };
    } catch (error) {
      throw new Error("Failed to update mission progress");
    }
  }

  async getMissionRewards(missionId: string): Promise<any[]> {
    try {
      if (!this.edgeClient) {
        return [];
      }

      // Fetch mission rewards from on-chain data
      const mission = await this.edgeClient.getMission(
        new PublicKey(missionId),
      );

      return mission?.rewards || [];
    } catch (error) {
      return [];
    }
  }

  // Trait Management
  async assignTrait(
    player: PublicKey,
    traitData: {
      name: string;
      category: string;
      effects: Record<string, number>;
      level?: number;
    },
    authority?: Keypair,
  ): Promise<PlayerTrait> {
    try {
      // Assign trait using Honeycomb Protocol
      const trait = await this.hiveControl.assignTrait({
        player,
        traitName: traitData.name,
        traitCategory: traitData.category,
        effects: traitData.effects,
        level: traitData.level || 1,
        authority,
      });

      return {
        traitId: trait.address.toString(),
        playerId: player.toString(),
        level: traitData.level || 1,
        experience: 0,
        effects: traitData.effects,
        acquiredAt: new Date(),
      };
    } catch (error) {
      throw new Error("Failed to assign trait");
    }
  }

  async upgradeTrait(
    player: PublicKey,
    traitId: string,
    newLevel: number,
    playerKeypair?: Keypair,
  ): Promise<PlayerTrait> {
    try {
      // Upgrade trait level
      await this.hiveControl.upgradeTrait({
        player,
        traitAddress: new PublicKey(traitId),
        newLevel,
        playerKeypair,
      });

      // Fetch updated trait data
      const trait = await this.getPlayerTrait(player, traitId);

      return trait;
    } catch (error) {
      throw new Error("Failed to upgrade trait");
    }
  }

  async getPlayerTrait(
    player: PublicKey,
    traitId: string,
  ): Promise<PlayerTrait> {
    try {
      // Fetch trait data from on-chain
      const trait = await this.edgeClient.getTrait(new PublicKey(traitId));

      return {
        traitId,
        playerId: player.toString(),
        level: trait?.level || 1,
        experience: trait?.experience || 0,
        effects: trait?.effects || {},
        acquiredAt: new Date(trait?.createdAt || Date.now()),
      };
    } catch (error) {
      throw new Error("Failed to fetch player trait");
    }
  }

  async getPlayerTraits(player: PublicKey): Promise<PlayerTrait[]> {
    try {
      if (!this.edgeClient) {
        // Return empty array when Honeycomb is not available
        return [];
      }

      // Fetch all traits for a player
      const traits = await this.edgeClient.getPlayerTraits(player);

      return traits.map(
        (trait: {
          address: { toString: () => any };
          level: any;
          experience: any;
          effects: any;
          createdAt: string | number | Date;
        }) => ({
          traitId: trait.address.toString(),
          playerId: player.toString(),
          level: trait.level,
          experience: trait.experience,
          effects: trait.effects,
          acquiredAt: new Date(trait.createdAt),
        }),
      );
    } catch (error) {
      return [];
    }
  }

  // Player Profile Management
  async createPlayerProfile(
    player: PublicKey,
    profileData: {
      name: string;
      avatar?: string;
      metadata?: Record<string, any>;
    },
    playerKeypair?: Keypair,
  ): Promise<any> {
    try {
      // Create player profile on Honeycomb
      const profile = await this.hiveControl.createProfile({
        player,
        name: profileData.name,
        avatar: profileData.avatar,
        metadata: profileData.metadata,
        playerKeypair,
      });

      return profile;
    } catch (error) {
      throw new Error("Failed to create player profile");
    }
  }

  async getPlayerProfile(player: PublicKey): Promise<any> {
    try {
      if (!this.edgeClient) {
        // Use localStorage as blockchain simulation when Honeycomb is not available
        const blockchainKey = `honeycomb-profile-${player.toString()}`;
        const saved = localStorage.getItem(blockchainKey);

        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (error) {
            // Continue to create new profile
          }
        }

        // Return null to indicate no existing profile (not a default one)
        return null;
      }

      // Fetch player profile from Honeycomb
      const profile = await this.edgeClient.getProfile(player);

      return profile;
    } catch (error) {
      return null;
    }
  }

  async updatePlayerExperience(
    player: PublicKey,
    experience: number,
    playerKeypair?: Keypair,
  ): Promise<void> {
    try {
      if (!this.hiveControl) {
        // Use localStorage as blockchain simulation when Honeycomb is not available
        const blockchainKey = `honeycomb-profile-${player.toString()}`;
        const existing = localStorage.getItem(blockchainKey);
        let profile = {
          id: player.toString(),
          name: `Explorer ${player.toString().slice(0, 8)}`,
          experience: 0,
          credits: 1000,
          level: 1,
        };

        if (existing) {
          try {
            profile = JSON.parse(existing);
          } catch (error) {
            // Use default profile
          }
        }

        // Update experience and level
        profile.experience = experience;
        profile.level = Math.floor(experience / 1000) + 1; // Simple level calculation

        // Save to localStorage (simulating blockchain)
        localStorage.setItem(blockchainKey, JSON.stringify(profile));

        return;
      }

      // Update player experience on-chain
      await this.hiveControl.updateExperience({
        player,
        experience,
        playerKeypair,
      });
    } catch (error) {
      throw new Error("Failed to update player experience");
    }
  }

  // Utility Methods
  async getAvailableMissions(): Promise<HoneycombMission[]> {
    try {
      if (!this.edgeClient) {
        // Return empty array when Honeycomb is not available
        return [];
      }

      // Fetch all available missions
      const missions = await this.edgeClient.getMissions();

      return missions.map(
        (mission: {
          address: { toString: () => any };
          name: any;
          description: any;
          requirements: any;
          rewards: any;
        }) => ({
          id: mission.address.toString(),
          title: mission.name,
          description: mission.description,
          requirements: mission.requirements,
          rewards: mission.rewards,
          status: "available",
          onChainData: mission,
        }),
      );
    } catch (error) {
      return [];
    }
  }

  async getPlayerMissions(player: PublicKey): Promise<MissionProgress[]> {
    try {
      if (!this.edgeClient) {
        // Return an empty array when Honeycomb is not available
        return [];
      }

      // Fetch player's mission participation's
      const participations = await this.edgeClient.getPlayerMissions(player);

      return participations.map(
        (participation: {
          missionAddress: { toString: () => any };
          progress: any;
          completed: any;
          rewards: any;
          startedAt: string | number | Date;
          completedAt: string | number | Date;
        }) => ({
          missionId: participation.missionAddress.toString(),
          playerId: player.toString(),
          progress: participation.progress,
          completed: participation.completed,
          rewards: participation.rewards,
          startedAt: new Date(participation.startedAt),
          completedAt: participation.completedAt
            ? new Date(participation.completedAt)
            : undefined,
        }),
      );
    } catch (error) {
      return [];
    }
  }

  // Connection and health checks
  async isConnected(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();

      return slot > 0;
    } catch (error) {
      return false;
    }
  }

  async getNetworkInfo(): Promise<{ cluster: string; slot: number }> {
    try {
      const slot = await this.connection.getSlot();

      return {
        cluster: this.config.environment,
        slot,
      };
    } catch (error) {
      return {
        cluster: this.config.environment,
        slot: 0,
      };
    }
  }
}
