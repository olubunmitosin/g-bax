import createEdgeClient from "@honeycomb-protocol/edge-client";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { sendTransactionForTests as sendTransactionT } from "@honeycomb-protocol/edge-client/client/helpers.js";
import {WalletContextState} from "@solana/wallet-adapter-react/src/useWallet";
import {sendClientTransactions} from "@honeycomb-protocol/edge-client/client/walletHelpers";

export interface HoneycombConfig {
  rpcUrl: string;
  environment: "devnet" | "mainnet-beta" | "honeynet";
  projectAddress?: string;
  edgeApiUrl?: string;
}

export interface HoneycombError {
  code: string;
  message: string;
  details?: any;
}

export interface TransactionResult {
  success: boolean;
  signature: string | null;
  error: string | null;
}

export interface MissionProgress {
  missionId: string;
  playerId: string;
  progress: number;
  completed: boolean;
  rewards: any[];
  startedAt: Date;
  completedAt?: Date;
  characterAddresses?: string[];
  transactionSignature?: string;
  lastUpdated?: Date;
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
  private readonly edgeClient: any;
  private connection: Connection;
  private config: HoneycombConfig;
  private xpSyncQueue: Map<string, { pendingXP: number; lastUpdate: number }> =
    new Map();
  private profileCache: Map<string, { profile: any; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(config: HoneycombConfig) {

    this.config = config;
    this.connection = new Connection(config.rpcUrl, "confirmed");

    const API_URL =
      process.env.NEXT_PUBLIC_HONEYCOMB_EDGE_API_URL ||
      "https://edge.test.honeycombprotocol.com/";
    // Create edge client with the configured API URL
    const apiUrl = config.edgeApiUrl || API_URL;

    this.edgeClient = createEdgeClient(apiUrl, true);
  }

  /**
   * Checks if Honeycomb Protocol is properly initialized and available
   * @returns boolean - True if a Honeycomb-edge client is available
   */
  public isHoneycombAvailable(): boolean {
    return !!this.edgeClient;
  }

  /**
   * Gets player traits from local storage
   * @param player - Player's public key
   * @returns PlayerTrait[] - Array of local traits
   */
  private getLocalPlayerTraits(player: PublicKey): PlayerTrait[] {
    try {
      const playerKey = player.toString();
      const traits: PlayerTrait[] = [];

      // Scan localStorage for trait entries
      const keys = Object.keys(localStorage);
      const traitKeys = keys.filter((key) =>
        key.startsWith(`character-trait-${playerKey}-`),
      );

      for (const key of traitKeys) {
        try {
          const traitData = JSON.parse(localStorage.getItem(key) || "{}");

          if (traitData.traitId) {
            traits.push({
              ...traitData,
              acquiredAt: new Date(traitData.acquiredAt),
            });
          }
        } catch (parseError) {
          console.warn(`Failed to parse trait data for key ${key}`);
        }
      }

      return traits;
    } catch (error) {
      console.error("❌ Failed to get local player traits:", error);

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
      // Fallback: Create profile locally
      const localProfile = {
        id: player.toString(),
        address: player.toString(),
        name: profileData.name,
        avatar: profileData.avatar,
        bio:
          profileData.metadata?.bio || "Space explorer in the G-Bax universe",
        pfp:
          profileData.avatar ||
          "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        experience: 0,
        level: 1,
        credits: 100,
        source: "localStorage",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        metadata: profileData.metadata,
      };

      const blockchainKey = `honeycomb-profile-${player.toString()}`;

      localStorage.setItem(blockchainKey, JSON.stringify(localProfile));

      return localProfile;
    } catch (error) {
      throw new Error("Failed to create player profile");
    }
  }

  async getPlayerProfile(player: PublicKey): Promise<any> {
    try {
      const playerKey = player.toString();

      // Check cache first
      const cached = this.profileCache.get(playerKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.profile;
      }

      // Try to fetch from Honeycomb API first
      if (this.edgeClient && this.config.projectAddress) {
        try {
          // Use the EdgeClient API to find users
          const honeycombResponse = await this.edgeClient.findUsers({
            wallets: [player],
            includeProjectProfiles: [this.config.projectAddress],
          });

          // Check if user exists and has a profile
          const user =
            honeycombResponse.user && honeycombResponse.user.length > 0
              ? honeycombResponse.user[0]
              : null;
          const profile: any = user?.profiles?.[0] || null;

          const levelRaw =
            profile.platformData?.custom?.add[0]?.split(",") || 1;
          const level = levelRaw[1];

          if (user && profile) {
            // Transform Honeycomb profile to our format
            const honeycombProfile = {
              id: user.id,
              address: user?.address || playerKey,
              profileAddress: profile.address,
              projectAddress: profile.project,
              profileTreeAddress: profile.tree_id,
              name: profile.info.name || `Explorer ${playerKey.slice(0, 8)}`,
              bio: profile.info.bio || "Space explorer in the G-Bax universe",
              pfp:
                profile.info.pfp ||
                "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
              experience: parseInt(profile.platformData?.xp) || 0,
              level: parseInt(level) || 1,
              credits: profile.credits || 1000,
              source: "honeycomb",
              createdAt: profile.createdAt || new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              rawHoneycombData: honeycombResponse,
            };

            // Cache the profile
            this.profileCache.set(playerKey, {
              profile: honeycombProfile,
              timestamp: Date.now(),
            });

            return honeycombProfile;
          }
        } catch (honeycombError) {
          // silence
        }
      }

      const blockchainKey = `honeycomb-profile-${playerKey}`;
      const saved = localStorage.getItem(blockchainKey);

      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (parseError) {
          console.warn("Failed to parse cached profile, creating new one");
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async updatePlayerExperience(
    player: PublicKey,
    experience: number,
    playerKeypair?: Keypair | any,
  ): Promise<void> {
    try {
      // Fallback: Update in localStorage
      const blockchainKey = `honeycomb-profile-${player.toString()}`;
      const existing = localStorage.getItem(blockchainKey);
      let profile = {
        id: player.toString(),
        address: player.toString(),
        name: `Explorer ${player.toString().slice(0, 8)}`,
        experience: 0,
        credits: 1000,
        level: 1,
        source: "localStorage",
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };

      if (existing) {
        try {
          profile = { ...profile, ...JSON.parse(existing) };
        } catch (error) {
          console.warn("Failed to parse existing profile, using default");
        }
      }

      // Update experience and level
      profile.experience = experience;
      profile.level = Math.floor(experience / 1000) + 1; // Simple level calculation
      profile.lastUpdated = new Date().toISOString();

      // Save to localStorage
      localStorage.setItem(blockchainKey, JSON.stringify(profile));
    } catch (error) {
      throw new Error("Failed to update player experience");
    }
  }

  // Connection and health checks
  /**
   * Checks if the Solana connection is active
   * @returns Promise<boolean> - True if connected to Solana network
   */
  async isConnected(): Promise<boolean> {
    try {
      const slot = await this.connection.getSlot();

      return slot > 0;
    } catch (error) {
      console.error("❌ Connection check failed:", error);

      return false;
    }
  }

  /**
   * Gets current network information including cluster and slot
   * @returns Promise<{cluster: string, slot: number}> - Network information
   */
  async getNetworkInfo(): Promise<{ cluster: string; slot: number }> {
    try {
      const slot = await this.connection.getSlot();

      return {
        cluster: this.config.environment,
        slot,
      };
    } catch (error) {
      console.error("Failed to get network info:", error);

      return {
        cluster: this.config.environment,
        slot: 0,
      };
    }
  }

  // XP Sync Management
  /**
   * Gets the current XP sync status for a player
   * @param player - Player's public key
   * @returns Object containing sync status information
   */
  getXPSyncStatus(player: PublicKey): {
    hasPendingUpdates: boolean;
    pendingXP: number;
    lastUpdate: number;
  } {
    const playerKey = player.toString();
    const syncData = this.xpSyncQueue.get(playerKey);

    return {
      hasPendingUpdates: syncData ? syncData.pendingXP > 0 : false,
      pendingXP: syncData?.pendingXP || 0,
      lastUpdate: syncData?.lastUpdate || 0,
    };
  }

  /**
   * Forces synchronization of pending XP updates for a player
   * @param player - Player's public key
   * @returns Promise<boolean> - True if sync was successful
   */
  async forceXPSync(player: PublicKey): Promise<boolean> {
    try {
      const playerKey = player.toString();
      const syncData = this.xpSyncQueue.get(playerKey);

      if (!syncData || syncData.pendingXP <= 0) {
        return true; // Nothing to sync
      }

      // Update player experience with pending XP
      await this.updatePlayerExperience(player, syncData.pendingXP);

      // Clear the sync queue for this player
      this.xpSyncQueue.delete(playerKey);

      return true;
    } catch (error) {
      console.error("Failed to force XP sync:", error);

      return false;
    }
  }

  // Enhanced XP update with sync queue
  async updateChainPlayerExperience(
    player: PublicKey,
    experience: number,
    contextWallet?: any,
  ): Promise<void> {
    try {
      const playerKey = player.toString();

      // Add to sync queue
      const currentSync = this.xpSyncQueue.get(playerKey) || {
        pendingXP: 0,
        lastUpdate: 0,
      };

      this.xpSyncQueue.set(playerKey, {
        pendingXP: experience,
        lastUpdate: Date.now(),
      });

      // Try to update immediately
      await this.updatePlayerExperience(player, experience, contextWallet);

      // If successful, clear from the queue
      this.xpSyncQueue.delete(playerKey);
    } catch (error) {
      // Keep in queue for retry
      console.warn("XP update queued for retry:", error);
    }
  }

  // Progress sync methods
  async loadCompletePlayerProgress(player: PublicKey): Promise<any> {
    try {
      const profile = await this.getPlayerProfile(player);
      // Get missions from local mission service
      const { localMissionService } = await import("./localMissionService");
      const missions = localMissionService.getPlayerMissions(player.toString());
      // Get traits from local character service
      const { localCharacterService } = await import("./localCharacterService");
      const playerCharacter = localCharacterService.getPlayerCharacter(player.toString());
      const traits = playerCharacter?.traits || [];

      return {
        success: true,
        profile,
        missions,
        traits,
        syncedAt: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async saveCompletePlayerProgress(
    player: PublicKey,
    progressData: any,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      // Save profile data
      if (progressData.profile) {
        await this.updatePlayerExperience(
          player,
          progressData.profile.experience,
          contextWallet,
        );
      }

      // Save mission progress using local mission service
      if (progressData.missions && Array.isArray(progressData.missions)) {
        const { localMissionService } = await import("./localMissionService");
        for (const mission of progressData.missions) {
          if (!mission.completed) {
            try {
              localMissionService.updateMissionProgress(
                player.toString(),
                mission.missionId,
                mission.progress
              );
            } catch (error) {
              console.warn("Failed to update local mission progress:", error);
            }
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async syncProgressWithBlockchain(
    player: PublicKey,
    localProgress: any,
    contextWallet?: any,
  ): Promise<any> {
    try {
      // Load current blockchain state
      const blockchainProgress = await this.loadCompletePlayerProgress(player);

      if (!blockchainProgress.success) {
        // If a blockchain load fails, save local progress
        const saveSuccess = await this.saveCompletePlayerProgress(
          player,
          localProgress,
          contextWallet,
        );

        return {
          success: saveSuccess,
          syncedProgress: localProgress,
          conflicts: [],
        };
      }

      // Compare and resolve conflicts
      const conflicts = [];
      let syncedProgress = { ...localProgress };

      // Compare experience
      if (blockchainProgress.profile?.experience > localProgress.experience) {
        conflicts.push({
          field: "experience",
          local: localProgress.experience,
          blockchain: blockchainProgress.profile.experience,
          resolved: blockchainProgress.profile.experience,
        });
        syncedProgress.experience = blockchainProgress.profile.experience;
      } else if (
        localProgress.experience > (blockchainProgress.profile?.experience || 0)
      ) {
        // Local is ahead, update blockchain
        await this.updatePlayerExperience(
          player,
          localProgress.experience,
          contextWallet,
        );
      }

      return {
        success: true,
        syncedProgress,
        conflicts,
      };
    } catch (error) {
      return {
        success: false,
        syncedProgress: localProgress,
        conflicts: [],
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  getProgressSyncStatus(player: PublicKey): any {
    const playerKey = player.toString();
    const localKey = `g-bax-progress-${playerKey}`;
    const syncKey = `g-bax-sync-${playerKey}`;

    const hasLocalProgress = localStorage.getItem(localKey) !== null;
    const lastSyncTime = parseInt(localStorage.getItem(syncKey) || "0");

    return {
      hasLocalProgress,
      hasBlockchainProgress: true, // Assume blockchain always has data
      lastSyncTime,
      needsSync: hasLocalProgress && Date.now() - lastSyncTime > 300000, // 5 minutes
    };
  }

  // Additional utility methods that might be called
  /**
   * Gets the Honeycomb-edge client instance
   * @returns any - The edge client instance
   */
  getEdgeClient(): any {
    return this.edgeClient;
  }

  /**
   * Gets the configured project address
   * @returns string - The project address or empty string
   */
  getProjectAddress(): string {
    return this.config.projectAddress || "";
  }

  /**
   * Finds a user by their public key (alias for getPlayerProfile)
   * @param player - Player's public key
   * @returns Promise<any> - Player profile data
   */
  async findUser(player: PublicKey): Promise<any> {
    return await this.getPlayerProfile(player);
  }

  /**
   * Signs and sends a transaction using Honeycomb Protocol
   * @param transactionData - Transaction data from Honeycomb API
   * @param contextWallet
   * @returns Promise<any> - Transaction result
   */
  async signAndSendTransaction(
    transactionData: any,
    contextWallet: WalletContextState,
  ): Promise<TransactionResult> {
    try {
      if (!this.edgeClient) {
        throw new Error("Honeycomb edge client not available");
      }

      await sendClientTransactions(
          this.edgeClient,
          contextWallet,
          transactionData
      );

      return {
        success: true,
        signature: null,
        error: null,
      };
    } catch (error) {
      console.error("💥 Transaction signing failed:", error);
      return {
        success: false,
        signature: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Checks the connection status (alias for isConnected)
   * @returns Promise<boolean> - True if connected
   */
  async checkConnection(): Promise<boolean> {
    return await this.isConnected();
  }

  // Achievement System Methods
  async initializeAchievementSystem(
    authority: any,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      // For now, just return true as achievements are stored locally
      return true;
    } catch (error) {
      console.error("Failed to initialize achievement system:", error);

      return false;
    }
  }

  getPredefinedAchievements(): Map<string, any> {
    // Define predefined achievements
    const achievements = new Map();

    achievements.set("first-mining", {
      id: "first-mining",
      name: "First Strike",
      description: "Complete your first mining operation",
      category: "mining",
      requirements: { miningCount: 1 },
      rewards: { experience: 100, credits: 50 },
      rarity: "common",
    });

    achievements.set("mining-veteran", {
      id: "mining-veteran",
      name: "Mining Veteran",
      description: "Complete 50 mining operations",
      category: "mining",
      requirements: { miningCount: 50 },
      rewards: { experience: 1000, credits: 500 },
      rarity: "rare",
    });

    achievements.set("level-up", {
      id: "level-up",
      name: "Level Up",
      description: "Reach level 5",
      category: "progression",
      requirements: { level: 5 },
      rewards: { experience: 500, credits: 250 },
      rarity: "common",
    });

    achievements.set("mission-master", {
      id: "mission-master",
      name: "Mission Master",
      description: "Complete 10 missions",
      category: "missions",
      requirements: { missionsCompleted: 10 },
      rewards: { experience: 2000, credits: 1000 },
      rarity: "epic",
    });

    return achievements;
  }

  async checkAndAwardAchievements(
    player: PublicKey,
    playerStats: any,
    contextWallet?: any,
  ): Promise<string[]> {
    try {
      const playerKey = player.toString();
      const achievementsKey = `achievements-${playerKey}`;
      const existingAchievements = JSON.parse(
        localStorage.getItem(achievementsKey) || "[]",
      );

      const predefinedAchievements = this.getPredefinedAchievements();
      const newAchievements: string[] = [];

      // @ts-ignore
      for (const [achievementId, achievement] of predefinedAchievements) {
        if (existingAchievements.includes(achievementId)) continue;

        let meetsRequirements = true;
        const requirements = achievement.requirements;

        // Check each requirement
        if (
          requirements.miningCount &&
          playerStats.miningCount < requirements.miningCount
        ) {
          meetsRequirements = false;
        }
        if (requirements.level && playerStats.level < requirements.level) {
          meetsRequirements = false;
        }
        if (
          requirements.missionsCompleted &&
          playerStats.missionsCompleted < requirements.missionsCompleted
        ) {
          meetsRequirements = false;
        }

        if (meetsRequirements) {
          newAchievements.push(achievementId);
          existingAchievements.push(achievementId);
        }
      }

      if (newAchievements.length > 0) {
        localStorage.setItem(
          achievementsKey,
          JSON.stringify(existingAchievements),
        );
      }

      return newAchievements;
    } catch (error) {
      console.error("Failed to check and award achievements:", error);

      return [];
    }
  }

  async getPlayerAchievements(player: PublicKey): Promise<string[]> {
    try {
      const playerKey = player.toString();
      const achievementsKey = `achievements-${playerKey}`;

      return JSON.parse(localStorage.getItem(achievementsKey) || "[]");
    } catch (error) {
      return [];
    }
  }

  getAchievementSystemStatus(): any {
    const predefinedAchievements = this.getPredefinedAchievements();

    return {
      isInitialized: true,
      resourceAddress: null,
      achievementsCount: predefinedAchievements.size,
      playerAchievementsCount: 0,
    };
  }

  // Character System Methods
  async initializeCharacterSystem(
    authority: any,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      // For now, just return true as characters are stored locally
      return true;
    } catch (error) {
      console.error("Failed to initialize character system:", error);

      return false;
    }
  }

  /**
   * Creates a local character as fallback
   * @param player - Player's public key
   * @param initialTraits - Initial traits for the character
   * @returns string - Local character address
   */
  private createLocalCharacter(
    player: PublicKey,
    initialTraits: string[][] = [],
  ): string {
    try {
      const characterAddress = `character-${player.toString()}-${Date.now()}`;
      const character = {
        address: characterAddress,
        owner: player.toString(),
        traits: initialTraits.map((trait, index) => ({
          category: trait[0] || "Mining",
          name: trait[1] || "Novice",
          level: 1,
          address: `trait-${index}-${Date.now()}`,
        })),
        level: 1,
        experience: 0,
        createdAt: new Date(),
        lastUpdated: new Date(),
        source: "local",
      };

      const storageKey = `character-${player.toString()}`;

      localStorage.setItem(storageKey, JSON.stringify(character));

      return characterAddress;
    } catch (error) {
      throw new Error("Failed to create local character");
    }
  }

  /**
   * Finds all characters owned by a player using Honeycomb Protocol
   * @param player - Player's public key
   * @returns Promise<any[]> - Array of player characters
   */
  async findPlayerCharacters(player: PublicKey): Promise<any[]> {
    try {
      const characters: any[] = [];

      // First check local storage
      const localCharacters = this.getLocalPlayerCharacters(player);

      characters.push(...localCharacters);

      if (!this.edgeClient) {
        return characters;
      }

      try {
        // Fetch characters from Honeycomb
        const charactersResponse = await this.edgeClient.character({
          owner: player,
        });

        if (charactersResponse && charactersResponse.character) {
          const honeycombCharacters = Array.isArray(
            charactersResponse.character,
          )
            ? charactersResponse.character
            : [charactersResponse.character];

          for (const character of honeycombCharacters) {
            // Avoid duplicates
            const exists = characters.some(
              (c) => c.address === character.address,
            );

            if (!exists) {
              characters.push({
                address: character.address,
                owner: character.owner,
                source: character.source,
                usedBy: character.usedBy,
                createdAt: new Date(),
              });
            }
          }
        }

        return characters;
      } catch (honeycombError) {
        console.warn(
          "Failed to fetch characters from Honeycomb:",
          honeycombError,
        );

        return characters;
      }
    } catch (error) {
      console.error("Error in findPlayerCharacters:", error);

      return [];
    }
  }

  /**
   * Gets player characters from local storage
   * @param player - Player's public key
   * @returns any[] - Array of local characters
   */
  private getLocalPlayerCharacters(player: PublicKey): any[] {
    try {
      const storageKey = `character-${player.toString()}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const character = JSON.parse(stored);

        return [character];
      }

      return [];
    } catch (error) {
      console.error("Failed to get local player characters:", error);

      return [];
    }
  }

  async getCharacterTraits(characterAddress: string): Promise<any[]> {
    try {
      // Extract player key from character address
      const playerKey = characterAddress.split("-")[1];
      const storageKey = `character-${playerKey}`;
      const stored = localStorage.getItem(storageKey);

      if (stored) {
        const character = JSON.parse(stored);

        return character.traits || [];
      }

      return [];
    } catch (error) {
      return [];
    }
  }

  isCharacterSystemInitialized(): boolean {
    return true; // Always initialized for local storage
  }

  /**
   * Gets the assembler config address from project data
   * @returns string | null - Assembler config address
   */
  getAssemblerConfigAddress(): string | null {
    // Check environment variable
    const envAddress = process.env.NEXT_PUBLIC_ASSEMBLER_CONFIG_ADDRESS;

    if (envAddress) {
      return envAddress;
    }

    return null;
  }

  /**
   * Gets the character model address from project data
   * @returns string | null - Character model address
   */
  getCharacterModelAddress(): string | null {
    // Check environment variable
    const envAddress = process.env.NEXT_PUBLIC_CHARACTER_MODEL_ADDRESS;

    if (envAddress) {
      return envAddress;
    }

    return null;
  }

  /**
   * Gets the characters tree address from project data
   * @returns string | null - Characters tree address
   */
  getCharactersTreeAddress(): string | null {
    // Check environment variable
    const envAddress = process.env.NEXT_PUBLIC_CHARACTERS_TREE_ADDRESS;

    if (envAddress) {
      return envAddress;
    }

    return null;
  }

  // Guild System Methods
  async initializeGuildSystem(
    authority: any,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      // Initialize predefined guilds
      const guilds = this.getAllGuilds();
      const guildsKey = "g-bax-guilds";

      localStorage.setItem(guildsKey, JSON.stringify(Array.from(guilds)));

      return true;
    } catch (error) {
      console.error("Failed to initialize guild system:", error);

      return false;
    }
  }

  getAllGuilds(): any[] {
    return [
      {
        id: "miners-union",
        name: "Miners Union",
        description: "United we dig, divided we fall",
        category: "mining",
        memberCount: 0,
        benefits: {
          miningBonus: 0.15,
          experienceBonus: 0.1,
        },
        requirements: {
          miningLevel: 5,
        },
      },
      {
        id: "explorers-guild",
        name: "Explorers Guild",
        description: "Boldly go where no one has gone before",
        category: "exploration",
        memberCount: 0,
        benefits: {
          explorationBonus: 0.2,
          experienceBonus: 0.1,
        },
        requirements: {
          explorationLevel: 3,
        },
      },
      {
        id: "crafters-collective",
        name: "Crafters Collective",
        description: "Masters of creation and innovation",
        category: "crafting",
        memberCount: 0,
        benefits: {
          craftingBonus: 0.25,
          experienceBonus: 0.1,
        },
        requirements: {
          craftingLevel: 4,
        },
      },
    ];
  }

  async joinGuild(
    player: PublicKey,
    guildId: string,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      const playerKey = player.toString();
      const guildInfoKey = `guild-info-${playerKey}`;

      // Check if player is already in a guild
      const existingGuild = localStorage.getItem(guildInfoKey);

      if (existingGuild) {
        throw new Error("Player is already in a guild");
      }

      // Get guild info
      const guilds = this.getAllGuilds();
      const guild = guilds.find((g) => g.id === guildId);

      if (!guild) {
        throw new Error("Guild not found");
      }

      // Create guild membership
      const guildInfo = {
        guild,
        joinedAt: new Date(),
        contributions: {
          mining: 0,
          crafting: 0,
          exploration: 0,
          mission: 0,
          leadership: 0,
        },
        rank: "Member",
        totalContributions: 0,
      };

      localStorage.setItem(guildInfoKey, JSON.stringify(guildInfo));

      return true;
    } catch (error) {
      console.error("Failed to join guild:", error);

      return false;
    }
  }

  async leaveGuild(player: PublicKey, contextWallet?: any): Promise<boolean> {
    try {
      const playerKey = player.toString();
      const guildInfoKey = `guild-info-${playerKey}`;

      localStorage.removeItem(guildInfoKey);

      return true;
    } catch (error) {
      console.error("Failed to leave guild:", error);

      return false;
    }
  }

  async recordGuildContribution(
    player: PublicKey,
    contributionType:
      | "mining"
      | "crafting"
      | "exploration"
      | "mission"
      | "leadership",
    amount: number,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      const playerKey = player.toString();
      const guildInfoKey = `guild-info-${playerKey}`;
      const stored = localStorage.getItem(guildInfoKey);

      if (!stored) {
        return false; // Player not in a guild
      }

      const guildInfo = JSON.parse(stored);

      guildInfo.contributions[contributionType] += amount;
      guildInfo.totalContributions += amount;

      // Update rank based on total contributions
      if (guildInfo.totalContributions >= 1000) {
        guildInfo.rank = "Elder";
      } else if (guildInfo.totalContributions >= 500) {
        guildInfo.rank = "Veteran";
      } else if (guildInfo.totalContributions >= 100) {
        guildInfo.rank = "Senior Member";
      }

      localStorage.setItem(guildInfoKey, JSON.stringify(guildInfo));

      return true;
    } catch (error) {
      console.error("Failed to record guild contribution:", error);

      return false;
    }
  }

  async getPlayerGuild(player: PublicKey): Promise<any | null> {
    try {
      const playerKey = player.toString();
      const guildInfoKey = `guild-info-${playerKey}`;
      const stored = localStorage.getItem(guildInfoKey);

      if (stored) {
        return JSON.parse(stored);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  getGuildSystemStatus(): any {
    const guilds = this.getAllGuilds();

    return {
      isInitialized: true,
      resourceAddress: null,
      guildsCount: guilds.length,
      totalMembers: 0, // Would need to count across all players
    };
  }

  // Resource System Methods
  async initializeGameResources(
    authority: any,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      // Initialize predefined resources
      const resources = this.getAllGameResources();
      const resourcesKey = "g-bax-resources";

      localStorage.setItem(
        resourcesKey,
        JSON.stringify(Array.from(resources.values())),
      );

      return true;
    } catch (error) {
      console.error("Failed to initialize game resources:", error);

      return false;
    }
  }

  getAllGameResources(): Map<string, any> {
    const resources = new Map();

    // Mining Resources
    resources.set("iron-ore", {
      id: "iron-ore",
      name: "Iron Ore",
      description: "Raw iron ore extracted from asteroids",
      category: "mining",
      rarity: "common",
      baseValue: 10,
      stackable: true,
      maxStack: 1000,
    });

    resources.set("gold-ore", {
      id: "gold-ore",
      name: "Gold Ore",
      description: "Precious gold ore found in rare asteroids",
      category: "mining",
      rarity: "rare",
      baseValue: 50,
      stackable: true,
      maxStack: 500,
    });

    resources.set("quantum-crystal", {
      id: "quantum-crystal",
      name: "Quantum Crystal",
      description: "Exotic crystal with quantum properties",
      category: "mining",
      rarity: "legendary",
      baseValue: 500,
      stackable: true,
      maxStack: 100,
    });

    // Crafting Resources
    resources.set("refined-metal", {
      id: "refined-metal",
      name: "Refined Metal",
      description: "Processed metal ready for construction",
      category: "crafting",
      rarity: "common",
      baseValue: 25,
      stackable: true,
      maxStack: 500,
    });

    resources.set("energy-cell", {
      id: "energy-cell",
      name: "Energy Cell",
      description: "Portable energy storage device",
      category: "crafting",
      rarity: "uncommon",
      baseValue: 100,
      stackable: true,
      maxStack: 200,
    });

    // Exploration Resources
    resources.set("data-chip", {
      id: "data-chip",
      name: "Data Chip",
      description: "Contains valuable exploration data",
      category: "exploration",
      rarity: "uncommon",
      baseValue: 75,
      stackable: true,
      maxStack: 250,
    });

    return resources;
  }

  async awardResourceToPlayer(
    player: PublicKey,
    resourceId: string,
    amount: number,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      const playerKey = player.toString();
      const holdingsKey = `resource-holdings-${playerKey}`;
      const holdings = JSON.parse(localStorage.getItem(holdingsKey) || "{}");

      holdings[resourceId] = (holdings[resourceId] || 0) + amount;

      localStorage.setItem(holdingsKey, JSON.stringify(holdings));

      return true;
    } catch (error) {
      console.error("Failed to award resource to player:", error);

      return false;
    }
  }

  async transferResource(
    fromPlayer: PublicKey,
    toPlayer: PublicKey,
    resourceId: string,
    amount: number,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      const fromKey = fromPlayer.toString();
      const toKey = toPlayer.toString();
      const fromHoldingsKey = `resource-holdings-${fromKey}`;
      const toHoldingsKey = `resource-holdings-${toKey}`;

      const fromHoldings = JSON.parse(
        localStorage.getItem(fromHoldingsKey) || "{}",
      );
      const toHoldings = JSON.parse(
        localStorage.getItem(toHoldingsKey) || "{}",
      );

      // Check if sender has enough resources
      if ((fromHoldings[resourceId] || 0) < amount) {
        throw new Error("Insufficient resources");
      }

      // Transfer resources
      fromHoldings[resourceId] -= amount;
      toHoldings[resourceId] = (toHoldings[resourceId] || 0) + amount;

      // Clean up zero amounts
      if (fromHoldings[resourceId] <= 0) {
        delete fromHoldings[resourceId];
      }

      localStorage.setItem(fromHoldingsKey, JSON.stringify(fromHoldings));
      localStorage.setItem(toHoldingsKey, JSON.stringify(toHoldings));

      return true;
    } catch (error) {
      console.error("Failed to transfer resource:", error);

      return false;
    }
  }

  async consumePlayerResource(
    player: PublicKey,
    resourceId: string,
    amount: number,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      const playerKey = player.toString();
      const holdingsKey = `resource-holdings-${playerKey}`;
      const holdings = JSON.parse(localStorage.getItem(holdingsKey) || "{}");

      // Check if player has enough resources
      if ((holdings[resourceId] || 0) < amount) {
        throw new Error("Insufficient resources");
      }

      // Consume resources
      holdings[resourceId] -= amount;

      // Clean up zero amounts
      if (holdings[resourceId] <= 0) {
        delete holdings[resourceId];
      }

      localStorage.setItem(holdingsKey, JSON.stringify(holdings));

      return true;
    } catch (error) {
      console.error("Failed to consume player resource:", error);

      return false;
    }
  }

  async getPlayerResourceHoldings(
    player: PublicKey,
  ): Promise<Map<string, number>> {
    try {
      const playerKey = player.toString();
      const holdingsKey = `resource-holdings-${playerKey}`;
      const holdings = JSON.parse(localStorage.getItem(holdingsKey) || "{}");

      const holdingsMap = new Map<string, number>();

      Object.entries(holdings).forEach(([resourceId, amount]) => {
        holdingsMap.set(resourceId, amount as number);
      });

      return holdingsMap;
    } catch (error) {
      return new Map();
    }
  }

  getResourceSystemStatus(): any {
    const resources = this.getAllGameResources();

    return {
      isInitialized: true,
      resourceCount: resources.size,
      totalPlayers: 0, // Would need to count across all players
      totalHoldings: 0, // Would need to count across all holdings
    };
  }

  async initializePredefinedMissions(
    authority: any,
    resourceAddress: string,
    contextWallet?: any,
  ): Promise<boolean> {
    try {
      // Define predefined missions
      const predefinedMissions = [
        {
          id: "mining-basics",
          name: "Mining Basics",
          description: "Learn the fundamentals of asteroid mining",
          type: "mining",
          difficulty: "easy",
          duration: 300, // 5 minutes
          requirements: [],
          rewards: { experience: 100, credits: 50 },
        },
        {
          id: "exploration-101",
          name: "Exploration 101",
          description: "Explore your first sector of space",
          type: "exploration",
          difficulty: "easy",
          duration: 600, // 10 minutes
          requirements: [],
          rewards: { experience: 150, credits: 75 },
        },
        {
          id: "crafting-introduction",
          name: "Crafting Introduction",
          description: "Craft your first item",
          type: "crafting",
          difficulty: "easy",
          duration: 240, // 4 minutes
          requirements: [],
          rewards: { experience: 120, credits: 60 },
        },
        {
          id: "advanced-mining",
          name: "Advanced Mining",
          description: "Master advanced mining techniques",
          type: "mining",
          difficulty: "medium",
          duration: 900, // 15 minutes
          requirements: [{ type: "mission", id: "mining-basics" }],
          rewards: { experience: 300, credits: 150 },
        },
        {
          id: "deep-space-exploration",
          name: "Deep Space Exploration",
          description: "Venture into the unknown depths of space",
          type: "exploration",
          difficulty: "hard",
          duration: 1800, // 30 minutes
          requirements: [
            { type: "mission", id: "exploration-101" },
            { type: "level", value: 5 },
          ],
          rewards: { experience: 500, credits: 250 },
        },
      ];

      // Store predefined missions
      localStorage.setItem(
        "predefined-missions",
        JSON.stringify(predefinedMissions),
      );

      return true;
    } catch (error) {
      console.error("Failed to initialize predefined missions:", error);

      return false;
    }
  }

  getMissionPoolAddress(): string | null {
    try {
      const stored = localStorage.getItem("mission-pool");

      if (stored) {
        const missionPool = JSON.parse(stored);

        return missionPool.address;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  areMissionsInitialized(): boolean {
    return localStorage.getItem("predefined-missions") !== null;
  }

  getCreatedMissions(): Map<string, any> {
    try {
      const stored = localStorage.getItem("predefined-missions");

      if (stored) {
        const missions = JSON.parse(stored);
        const missionMap = new Map();

        missions.forEach((mission: any) => {
          missionMap.set(mission.id, mission);
        });

        return missionMap;
      }

      return new Map();
    } catch (error) {
      return new Map();
    }
  }

  // Helper methods for mission processing
  /**
   * Calculates mission difficulty based on requirements and rewards
   * @param mission - Mission data from Honeycomb
   * @returns string - Difficulty level
   */
  private calculateMissionDifficulty(mission: any): string {
    try {
      const minXp = mission.minXp || 0;
      const rewardCount = mission.rewards?.length || 0;
      const hasRequirements =
        mission.requirement && mission.requirement.kind !== "None";

      if (minXp > 1000 || rewardCount > 3 || hasRequirements) {
        return "hard";
      } else if (minXp > 500 || rewardCount > 1) {
        return "medium";
      } else {
        return "easy";
      }
    } catch (error) {
      return "easy";
    }
  }

  /**
   * Extracts mission duration from requirements
   * @param mission - Mission data from Honeycomb
   * @returns number - Duration in seconds
   */
  private extractMissionDuration(mission: any): number {
    try {
      if (mission.requirement && mission.requirement.kind === "Time") {
        return mission.requirement.params?.duration || 300;
      }

      return 300; // Default 5 minutes
    } catch (error) {
      return 300;
    }
  }

  /**
   * Determines a mission type based on requirements and rewards
   * @param mission - Mission data from Honeycomb
   * @returns string - Mission type
   */
  private determineMissionType(mission: any): string {
    try {
      const name = mission.name?.toLowerCase() || "";

      if (name.includes("mining") || name.includes("mine")) {
        return "mining";
      } else if (name.includes("exploration") || name.includes("explore")) {
        return "exploration";
      } else if (name.includes("crafting") || name.includes("craft")) {
        return "crafting";
      } else if (name.includes("combat") || name.includes("battle")) {
        return "combat";
      } else {
        return "general";
      }
    } catch (error) {
      return "general";
    }
  }

  /**
   * Calculates mission progress based on mission data
   * @param missionData - Mission participation data
   * @returns number - Progress percentage (0-100)
   */
  private calculateMissionProgress(missionData: any): number {
    try {
      const startTime = missionData.startTime || Date.now();
      const endTime = missionData.endTime;
      const duration = this.extractMissionDuration(missionData);

      if (endTime) {
        return 100; // Mission completed
      }

      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / (duration * 1000)) * 100, 100);

      return Math.round(progress);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Calculates trait effects based on level
   * @param baseEffects - Base trait effects
   * @param level - Trait level
   * @returns Record<string, number> - Calculated effects
   */
  private calculateTraitEffects(
    baseEffects: Record<string, number>,
    level: number,
  ): Record<string, number> {
    try {
      const effects: Record<string, number> = {};

      for (const [effect, baseValue] of Object.entries(baseEffects)) {
        // Scale effects by level (simple linear scaling)
        effects[effect] = baseValue * level;
      }

      return effects;
    } catch (error) {
      return baseEffects;
    }
  }
}
