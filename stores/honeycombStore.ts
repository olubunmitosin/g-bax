import type { HoneycombMission } from "@/types/game";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PublicKey } from "@solana/web3.js";
import { sendClientTransactions } from "@honeycomb-protocol/edge-client/client/walletHelpers";
import { sendTransactionForTests as sendTransactionT } from "@honeycomb-protocol/edge-client/client/helpers.js";
import base58 from "bs58";
import * as web3 from "@solana/web3.js";

import { HoneycombService } from "@/services/honeycombService";
import { getLevelFromExperience } from "@/utils/gameHelpers";
import {
  MissionProgress,
  PlayerTrait,
  HoneycombMissionPool,
  HoneycombMissionInstance,
  HoneycombCharacter,
  HoneycombCharacterTrait,
  HoneycombAssemblerConfig,
  HoneycombCharacterModel,
  HoneycombAchievement,
  PlayerAchievementProgress,
  AchievementSystemStatus,
  GameResource,
  PlayerResourceHolding,
  ResourceSystemStatus,
  Guild,
  PlayerGuildInfo,
  GuildSystemStatus,
} from "@/types";

export interface HoneycombState {
  // Service instance
  honeycombService: HoneycombService | null;

  // Connection state
  isConnected: boolean;
  isInitializing: boolean;
  networkInfo: { cluster: string; slot: number } | null;

  // Player profile
  playerProfile: any | null;
  isLoadingProfile: boolean;

  // Missions
  availableMissions: HoneycombMission[];
  playerMissions: MissionProgress[];
  activeMission: MissionProgress | null;
  isLoadingMissions: boolean;

  // Mission pool and on-chain missions
  missionPool: HoneycombMissionPool | null;
  createdMissions: Map<string, HoneycombMissionInstance>;
  isMissionSystemInitialized: boolean;

  // Character and trait system
  assemblerConfig: HoneycombAssemblerConfig | null;
  characterModel: HoneycombCharacterModel | null;
  playerCharacter: HoneycombCharacter | null;
  availableTraits: HoneycombCharacterTrait[];
  isCharacterSystemInitialized: boolean;
  isLoadingCharacter: boolean;

  // Achievement system
  availableAchievements: HoneycombAchievement[];
  playerAchievements: string[];
  achievementProgress: PlayerAchievementProgress[];
  isAchievementSystemInitialized: boolean;
  isLoadingAchievements: boolean;

  // Resource ownership system
  gameResources: GameResource[];
  playerResourceHoldings: PlayerResourceHolding[];
  isResourceSystemInitialized: boolean;
  isLoadingResources: boolean;

  // Guild progression system
  availableGuilds: Guild[];
  playerGuildInfo: PlayerGuildInfo | null;
  isGuildSystemInitialized: boolean;
  isLoadingGuild: boolean;

  // Traits (legacy)
  playerTraits: PlayerTrait[];
  isLoadingTraits: boolean;

  // Experience and progression
  playerExperience: number;
  playerLevel: number;

  // Actions
  initializeHoneycomb: (
    rpcUrl: string,
    environment: "devnet" | "mainnet-beta" | "honeynet",
  ) => Promise<void>;
  setupUserAccount: (
    playerPublicKey: PublicKey,
    contextWallet: any,
  ) => Promise<void>;
  updateUserAccount: (
    playerPublicKey: PublicKey,
    profileInfo: { name: string; bio: string; pfp: string },
    contextWallet?: any,
  ) => Promise<void>;

  // Mission actions
  loadAvailableMissions: () => Promise<void>;
  loadPlayerMissions: (playerPublicKey: PublicKey) => Promise<void>;
  startMission: (
    playerPublicKey: PublicKey,
    missionId: string,
  ) => Promise<void>;
  updateMissionProgress: (
    playerPublicKey: PublicKey,
    missionId: string,
    progress: number,
  ) => Promise<void>;

  // Mission pool and on-chain mission actions
  createMissionPool: (
    authority: PublicKey,
    characterModelAddress: string,
    contextWallet: any,
  ) => Promise<void>;
  initializePredefinedMissions: (
    authority: PublicKey,
    resourceAddress: string,
    contextWallet: any,
  ) => Promise<void>;
  getMissionPoolStatus: () => {
    isInitialized: boolean;
    poolAddress: string | null;
    missionsCount: number;
  };

  // Character and trait actions
  initializeCharacterSystem: (
    authority: PublicKey,
    contextWallet: any,
  ) => Promise<void>;
  createPlayerCharacter: (
    playerWallet: PublicKey,
    initialTraits?: string[][],
    contextWallet?: any,
  ) => Promise<void>;
  assignTraitToCharacter: (
    characterAddress: string,
    playerWallet: PublicKey,
    traitCategory: string,
    traitName: string,
    contextWallet?: any,
  ) => Promise<void>;
  loadPlayerCharacter: (playerWallet: PublicKey) => Promise<void>;
  getCharacterSystemStatus: () => {
    isInitialized: boolean;
    assemblerConfig: string | null;
    characterModel: string | null;
    charactersTree: string | null;
  };

  // Trait evolution actions
  evolveCharacterTrait: (
    characterAddress: string,
    playerWallet: PublicKey,
    currentTraitCategory: string,
    currentTraitName: string,
    newTraitName: string,
    contextWallet?: any,
  ) => Promise<void>;
  getTraitEvolutionStatus: (
    characterAddress: string,
    playerStats: any,
  ) => Promise<any[]>;
  checkTraitEvolution: (
    currentTraitName: string,
    playerStats: any,
  ) => { canEvolve: boolean; nextTrait?: string; requirements?: string };
  getPlayerTraitBonuses: (playerPublicKey: PublicKey) => Promise<{
    miningBonus: number;
    craftingBonus: number;
    explorationBonus: number;
    combatBonus: number;
    leadershipBonus: number;
    experienceBonus: number;
  }>;

  // Achievement system actions
  initializeAchievementSystem: (
    authority: PublicKey,
    contextWallet: any,
  ) => Promise<void>;
  checkAndAwardAchievements: (
    playerWallet: PublicKey,
    playerStats: any,
    contextWallet?: any,
  ) => Promise<string[]>;
  loadPlayerAchievements: (playerWallet: PublicKey) => Promise<void>;
  getAchievementSystemStatus: () => AchievementSystemStatus;

  // Cross-session progress persistence actions
  loadCompletePlayerProgress: (playerWallet: PublicKey) => Promise<any>;
  saveCompletePlayerProgress: (
    playerWallet: PublicKey,
    progressData: any,
    contextWallet?: any,
  ) => Promise<boolean>;
  syncProgressWithBlockchain: (
    playerWallet: PublicKey,
    localProgress: any,
    contextWallet?: any,
  ) => Promise<any>;
  getProgressSyncStatus: (playerWallet: PublicKey) => any;

  // Resource ownership system actions
  initializeGameResources: (
    authority: PublicKey,
    contextWallet: any,
  ) => Promise<void>;
  awardResourceToPlayer: (
    playerWallet: PublicKey,
    resourceId: string,
    amount: number,
    contextWallet?: any,
  ) => Promise<boolean>;
  transferResource: (
    fromWallet: PublicKey,
    toWallet: PublicKey,
    resourceId: string,
    amount: number,
    contextWallet?: any,
  ) => Promise<boolean>;
  consumePlayerResource: (
    playerWallet: PublicKey,
    resourceId: string,
    amount: number,
    contextWallet?: any,
  ) => Promise<boolean>;
  loadPlayerResourceHoldings: (playerWallet: PublicKey) => Promise<void>;
  getResourceSystemStatus: () => ResourceSystemStatus;

  // Guild progression system actions
  initializeGuildSystem: (
    authority: PublicKey,
    contextWallet: any,
  ) => Promise<void>;
  joinGuild: (
    playerWallet: PublicKey,
    guildId: string,
    contextWallet?: any,
  ) => Promise<boolean>;
  leaveGuild: (
    playerWallet: PublicKey,
    contextWallet?: any,
  ) => Promise<boolean>;
  recordGuildContribution: (
    playerWallet: PublicKey,
    contributionType: "mining" | "crafting" | "exploration" | "mission" | "leadership",
    amount: number,
    contextWallet?: any,
  ) => Promise<boolean>;
  loadPlayerGuild: (playerWallet: PublicKey) => Promise<void>;
  getGuildSystemStatus: () => GuildSystemStatus;

  updateChainPlayerExperience: (
    player: PublicKey,
    experience: number,
    contextWallet?: any,
  ) => Promise<void>;

  getUserAuthToken: (
    playerPublicKey: PublicKey,
    contextWallet: any,
  ) => Promise<string>;

  // Trait actions
  loadPlayerTraits: (playerPublicKey: PublicKey) => Promise<void>;
  assignTrait: (playerPublicKey: PublicKey, traitData: any) => Promise<void>;
  upgradeTrait: (
    playerPublicKey: PublicKey,
    traitId: string,
    newLevel: number,
  ) => Promise<void>;

  // Profile actions
  createPlayerProfile: (
    playerPublicKey: PublicKey,
    profileData: any,
  ) => Promise<void>;
  loadPlayerProfile: (playerPublicKey: PublicKey) => Promise<void>;
  updatePlayerExperience: (
    playerPublicKey: PublicKey,
    experience: number,
  ) => Promise<void>;

  // Enhanced XP sync actions
  forceXPSync: (playerPublicKey: PublicKey) => Promise<boolean>;
  getXPSyncStatus: (playerPublicKey: PublicKey) => {
    hasPendingUpdates: boolean;
    pendingXP: number;
    lastUpdate: number;
  };

  // Admin operations (server-side)
  createPlatformDataTransactionAdmin: (
    playerPublicKey: PublicKey,
    data: any,
    contextWallet: any,
  ) => Promise<{ success: boolean; error?: string; signature?: string }>;
  updatePlatformDataAdmin: (
    playerPublicKey: PublicKey,
    data: any,
    contextWallet: any,
  ) => Promise<{ success: boolean; error?: string; signature?: string }>;
  createResourceAdmin: (
    playerPublicKey: PublicKey,
    resourceData: any,
    contextWallet: any,
  ) => Promise<{ success: boolean; error?: string; signature?: string }>;
  updateMissionAdmin: (
    playerPublicKey: PublicKey,
    missionData: any,
    contextWallet: any,
  ) => Promise<{ success: boolean; error?: string; signature?: string }>;

  // Utility actions
  checkConnection: () => Promise<void>;
  reset: () => void;
}

export const useHoneycombStore = create<HoneycombState>()(
  devtools(
    (set, get) => ({
      // Initial state
      honeycombService: null,
      isConnected: false,
      isInitializing: false,
      networkInfo: null,
      playerProfile: null,
      isLoadingProfile: false,
      availableMissions: [],
      playerMissions: [],
      activeMission: null,
      isLoadingMissions: false,
      missionPool: null,
      createdMissions: new Map(),
      isMissionSystemInitialized: false,
      assemblerConfig: null,
      characterModel: null,
      playerCharacter: null,
      availableTraits: [],
      isCharacterSystemInitialized: false,
      isLoadingCharacter: false,
      availableAchievements: [],
      playerAchievements: [],
      achievementProgress: [],
      isAchievementSystemInitialized: false,
      isLoadingAchievements: false,
      gameResources: [],
      playerResourceHoldings: [],
      isResourceSystemInitialized: false,
      isLoadingResources: false,
      availableGuilds: [],
      playerGuildInfo: null,
      isGuildSystemInitialized: false,
      isLoadingGuild: false,
      playerTraits: [],
      isLoadingTraits: false,
      playerExperience: 0,
      playerLevel: 1,

      // Initialize Honeycomb service
      initializeHoneycomb: async (
        rpcUrl: string,
        environment: "devnet" | "mainnet-beta" | "honeynet",
      ) => {
        set({ isInitializing: true });

        try {
          // Always use honeynet for our setup
          const honeycombEnv = environment ?? "honeynet";

          const projectAddress =
            process.env.NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS;

          if (!projectAddress) {
            return;
          }

          const service = new HoneycombService({
            rpcUrl,
            environment: honeycombEnv,
            projectAddress: projectAddress || "",
            edgeApiUrl:
              process.env.NEXT_PUBLIC_HONEYCOMB_EDGE_API_URL ||
              "https://edge.test.honeycombprotocol.com/",
          });

          // Wait for initialization and check connection
          const isConnected = await service.checkConnection();
          const networkInfo = await service.getNetworkInfo();

          set({
            honeycombService: service,
            isConnected,
            networkInfo,
            isInitializing: false,
          });

          if (isConnected) {
            // Load available missions
            await get().loadAvailableMissions();
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          set({
            isConnected: false,
            isInitializing: false,
          });
        }
      },

      setupUserAccount: async (
        playerPublicKey: PublicKey,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          console.log("Honeycomb service not available");

          return;
        }

        // First check if user exists
        let user = await honeycombService.findUser(playerPublicKey);

        try {
          if (!user) {
            // User doesn't exist, create user with profile
            const defaultUserInfo = {
              name: `Explorer ${playerPublicKey.toString().slice(0, 8)}`,
              bio: "Space explorer in the G-Bax universe",
              pfp: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
            };

            // Add a profile tree if available
            const profilesTreeAddress =
              process.env.NEXT_PUBLIC_PROFILE_TREE_ADDRESS;

            // Ensure active profiles tree is known/active
            let activeTree = profilesTreeAddress;
            if (!activeTree) {
              activeTree = await honeycombService.ensureActiveProfilesTree(contextWallet);
            }

            const createUserParams: any = {
              project: honeycombService.getProjectAddress(),
              wallet: playerPublicKey.toString(),
              payer: playerPublicKey.toString(),
              userInfo: defaultUserInfo,
              // Use an explicit profilesTreeAddress whenever possible to bypass 'active' requirement
              profilesTreeAddress: activeTree || profilesTreeAddress,
            };

            const txBundle = await honeycombService
              .getEdgeClient()
              .createNewUserWithProfileTransaction(createUserParams);

            // Sign and send this transaction via service helper (handles normalization/retries)
            await honeycombService.signAndSendTransaction(
              txBundle.createNewUserWithProfileTransaction,
              contextWallet,
            );

            user = await honeycombService.findUser(playerPublicKey);
          }

          console.log("User and profile setup result:", user);

          // Load player profile
          await get().loadPlayerProfile(playerPublicKey);

          // Load player missions
          await get().loadPlayerMissions(playerPublicKey);

          // Load player traits
          await get().loadPlayerTraits(playerPublicKey);
        } catch (error: any) {
          console.error("Failed to connect player:", error);
        }
      },

      updateUserAccount: async (
        playerPublicKey: PublicKey,
        profileInfo: { name: string; bio: string; pfp: string },
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          console.warn("Honeycomb service not available");

          return;
        }

        try {
          // First, find the user and their profile
          const user = await honeycombService.findUser(playerPublicKey);

          if (!user) {
            throw new Error(
              "User not found. Please connect your wallet first.",
            );
          }

          const edgeClient = honeycombService.getEdgeClient();
          const projectAddress = honeycombService.getProjectAddress();

          if (!edgeClient || !projectAddress) {
            throw new Error("Honeycomb service not properly initialized");
          }

          if (!contextWallet) {
            throw new Error(
              "Wallet not connected. Please connect your wallet first.",
            );
          }

          const accessToken = await get().getUserAuthToken(
            playerPublicKey,
            contextWallet,
          );

          if (!accessToken) {
            console.log("Failed to get access token");

            return;
          }

          // Create profile update transaction
          const profileParams = {
            project: projectAddress,
            payer: playerPublicKey.toString(),
            info: {
              name: profileInfo.name,
              bio: profileInfo.bio,
              pfp: profileInfo.pfp,
            },
          };

          const { createUpdateUserTransaction: txResponse } =
            await honeycombService
              .getEdgeClient()
              .createUpdateUserTransaction(profileParams, {
                fetchOptions: {
                  headers: {
                    authorization: `Bearer ${accessToken}`,
                  },
                },
              });

          // Sign and send the transaction using service helper (normalization/retries)
          await honeycombService.signAndSendTransaction(
            txResponse,
            contextWallet,
          );

          // Reload the player profile to reflect changes
          await get().loadPlayerProfile(playerPublicKey);
        } catch (error: any) {
          throw error;
        }
      },

      getUserAuthToken: async (
        playerPublicKey: PublicKey,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          throw new Error("Honeycomb service not available");
        }

        try {
          const authRequestOptions = {
            wallet: playerPublicKey.toString(),
            useTx: false,
          };
          const resp = await honeycombService
            .getEdgeClient()
            .authRequest(authRequestOptions);

          if (
            !contextWallet ||
            typeof contextWallet.signMessage == "undefined"
          ) {
            throw new Error("Wallet not available for signing");
          }

          const encodedMessage = new TextEncoder().encode(
            resp.authRequest.message,
          );
          const signedUIntArray =
            await contextWallet.signMessage(encodedMessage);
          const signature = base58.encode(signedUIntArray);

          const authConfirmOptions = {
            wallet: playerPublicKey.toString(),
            signature: signature,
          };

          // Confirm authentication
          const confirmResp = await honeycombService
            .getEdgeClient()
            .authConfirm(authConfirmOptions);

          return confirmResp.authConfirm.accessToken;
        } catch (e: any) {
          console.log("Auth Token Failed: ", e);

          return null;
        }
      },

      updateChainPlayerExperience: async (
        player: PublicKey,
        experience: number,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        // Fallback 1: Try direct honeycomb service
        if (honeycombService && contextWallet) {
          try {
            // Find user's profile
            const profile = await honeycombService.getPlayerProfile(player);
            const currentXp = profile?.experience || 0;
            const xpDifference = experience - currentXp;

            // Only update if there's a positive difference
            if (xpDifference <= 0) {
              console.log("No XP update needed via direct method");

              return;
            }

            const adminKeyData = JSON.parse(
              process.env.NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY ?? "{}",
            );
            const adminKeypair = web3.Keypair.fromSecretKey(
              new Uint8Array(adminKeyData),
            );

            // Update platform data with new XP using direct method
            const { createUpdatePlatformDataTransaction: txResponse } =
              await honeycombService
                .getEdgeClient()
                .createUpdatePlatformDataTransaction({
                  profile: profile?.address,
                  authority: adminKeypair.publicKey.toString(),
                  platformData: {
                    addXp: 0, //experience,
                    custom: {
                      add: [
                        [
                          "level",
                          (Math.floor(experience / 1000) + 1).toString(),
                        ],
                      ],
                    },
                  },
                });

            const edgeClient = honeycombService.getEdgeClient();

            // sign and commit transaction
            await sendTransactionT(
              edgeClient,
              {
                transaction: txResponse.transaction,
                blockhash: txResponse.blockhash,
                lastValidBlockHeight: txResponse.lastValidBlockHeight,
              },
              [adminKeypair],
              {
                skipPreflight: true,
                commitment: "finalized",
              },
            );

            return txResponse;
          } catch (error) {
            console.log("Direct honeycomb service failed:", error);
          }
        }

        // Fallback 2: localStorage simulation (when no service available)
        console.log("Using localStorage fallback for experience update");
        const blockchainKey = `honeycomb-profile-${player.toString()}`;
        const existing = localStorage.getItem(blockchainKey);
        let profile = {
          id: player.toString(),
          name: `Explorer ${player.toString().slice(0, 8)}`,
          experience: 0,
          credits: 0,
          level: 1,
        };

        if (existing) {
          try {
            profile = JSON.parse(existing);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (error) { }
        }

        // Update experience and level
        profile.experience = experience;
        profile.level = Math.floor(experience / 1000) + 1;

        // Save to localStorage (simulating blockchain)
        localStorage.setItem(blockchainKey, JSON.stringify(profile));
        console.log("Experience updated in localStorage:", profile);
      },

      // Mission actions
      loadAvailableMissions: async () => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        set({ isLoadingMissions: true });

        try {
          const missions = await honeycombService.getAvailableMissions();

          set({ availableMissions: missions });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Handle error silently
        } finally {
          set({ isLoadingMissions: false });
        }
      },

      loadPlayerMissions: async (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const missions =
            await honeycombService.getPlayerMissions(playerPublicKey);
          const activeMission = missions.find((m) => !m.completed) || null;

          set({
            playerMissions: missions,
            activeMission,
          });
        } catch (error) {
          // Handle error silently
        }
      },

      startMission: async (playerPublicKey: PublicKey, missionId: string) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          // For now, use empty character addresses array - this would be populated with actual character data
          const characterAddresses: string[] = [];

          const missionProgress = await honeycombService.startMission(
            playerPublicKey,
            missionId,
            characterAddresses,
          );

          set((state) => ({
            playerMissions: [...state.playerMissions, missionProgress],
            activeMission: missionProgress,
          }));
        } catch (error) {
          throw error;
        }
      },

      updateMissionProgress: async (
        playerPublicKey: PublicKey,
        missionId: string,
        progress: number,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          // Get player's character addresses
          let characterAddresses: string[] = [];
          try {
            const characters = await honeycombService.findPlayerCharacters(playerPublicKey);
            characterAddresses = characters.map(char => char.address);
          } catch (error) {
            console.warn("Failed to get character addresses for mission progress:", error);
          }

          const updatedProgress = await honeycombService.updateMissionProgress(
            playerPublicKey,
            missionId,
            progress,
            characterAddresses,
          );

          set((state) => ({
            playerMissions: state.playerMissions.map((m) =>
              m.missionId === missionId ? updatedProgress : m,
            ),
            activeMission:
              state.activeMission?.missionId === missionId
                ? updatedProgress
                : state.activeMission,
          }));

          // If mission completed, update player experience
          if (updatedProgress.completed) {
            // Award experience based on mission rewards
            const experienceReward = updatedProgress.rewards.reduce(
              (total, reward) => {
                return total + (reward.experience || 0);
              },
              0,
            );

            if (experienceReward > 0) {
              await get().updatePlayerExperience(
                playerPublicKey,
                experienceReward,
              );
            }
          }
        } catch (error) {
          throw error;
        }
      },

      // Trait actions
      loadPlayerTraits: async (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        set({ isLoadingTraits: true });

        try {
          const traits =
            await honeycombService.getPlayerTraits(playerPublicKey);

          set({ playerTraits: traits });
        } catch (error) {
          // Handle error silently
        } finally {
          set({ isLoadingTraits: false });
        }
      },

      assignTrait: async (playerPublicKey: PublicKey, traitData: any, contextWallet?: any) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const trait = await honeycombService.assignTrait(
            playerPublicKey,
            traitData,
            contextWallet,
          );

          set((state) => ({
            playerTraits: [...state.playerTraits, trait],
          }));
        } catch (error) {
          throw error;
        }
      },

      upgradeTrait: async (
        playerPublicKey: PublicKey,
        traitId: string,
        newLevel: number,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const updatedTrait = await honeycombService.upgradeTrait(
            playerPublicKey,
            traitId,
            newLevel,
            contextWallet,
          );

          set((state) => ({
            playerTraits: state.playerTraits.map((t) =>
              t.traitId === traitId ? updatedTrait : t,
            ),
          }));
        } catch (error) {
          throw error;
        }
      },

      // Profile actions
      createPlayerProfile: async (
        playerPublicKey: PublicKey,
        profileData: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        set({ isLoadingProfile: true });

        try {
          const profile = await honeycombService
            .getEdgeClient()
            .createPlayerProfile(playerPublicKey, profileData);

          set({ playerProfile: profile });
        } catch (error) {
          throw error;
        } finally {
          set({ isLoadingProfile: false });
        }
      },

      loadPlayerProfile: async (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        set({ isLoadingProfile: true });

        try {
          const profile =
            await honeycombService.getPlayerProfile(playerPublicKey);

          set({
            playerProfile: profile,
            playerExperience: profile?.experience || 0,
            playerLevel: profile?.level || 1,
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Handle error silently
        } finally {
          set({ isLoadingProfile: false });
        }
      },

      updatePlayerExperience: async (
        playerPublicKey: PublicKey,
        experienceToAdd: number,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          // Use the enhanced real-time XP sync
          await honeycombService.updatePlayerExperience(
            playerPublicKey,
            experienceToAdd,
          );

          // Update local state immediately for instant feedback
          set((state) => {
            const newExperience = state.playerExperience + experienceToAdd;
            const newLevel = getLevelFromExperience(newExperience);

            return {
              playerExperience: newExperience,
              playerLevel: newLevel,
            };
          });

          console.log(`Added ${experienceToAdd} XP (queued for blockchain sync)`);
        } catch (error) {
          console.error("Failed to update player experience:", error);
          throw error;
        }
      },

      // Enhanced XP sync actions
      forceXPSync: async (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.forceXPSync(playerPublicKey);
          if (success) {
            console.log("XP force sync completed successfully");
          }
          return success;
        } catch (error) {
          console.error("Failed to force XP sync:", error);
          return false;
        }
      },

      getXPSyncStatus: (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          return {
            hasPendingUpdates: false,
            pendingXP: 0,
            lastUpdate: 0,
          };
        }

        return honeycombService.getXPSyncStatus(playerPublicKey);
      },

      // Achievement system actions
      initializeAchievementSystem: async (
        authority: PublicKey,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingAchievements: true });

          const success = await honeycombService.initializeAchievementSystem(
            authority,
            contextWallet,
          );

          if (success) {
            // Load available achievements
            const predefinedAchievements = honeycombService.getPredefinedAchievements();
            const achievementsArray = Array.from(predefinedAchievements.values());

            set({
              availableAchievements: achievementsArray,
              isAchievementSystemInitialized: true,
            });

            console.log("Achievement system initialized successfully");
          }
        } catch (error) {
          console.error("Failed to initialize achievement system:", error);
        } finally {
          set({ isLoadingAchievements: false });
        }
      },

      checkAndAwardAchievements: async (
        playerWallet: PublicKey,
        playerStats: any,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return [];

        try {
          const newAchievements = await honeycombService.checkAndAwardAchievements(
            playerWallet,
            playerStats,
            contextWallet,
          );

          if (newAchievements.length > 0) {
            // Reload player achievements
            await get().loadPlayerAchievements(playerWallet);
            console.log("New achievements awarded:", newAchievements);
          }

          return newAchievements;
        } catch (error) {
          console.error("Failed to check and award achievements:", error);
          return [];
        }
      },

      loadPlayerAchievements: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingAchievements: true });

          const playerAchievements = await honeycombService.getPlayerAchievements(playerWallet);

          set({
            playerAchievements,
          });

          console.log("Player achievements loaded:", playerAchievements.length);
        } catch (error) {
          console.error("Failed to load player achievements:", error);
        } finally {
          set({ isLoadingAchievements: false });
        }
      },

      getAchievementSystemStatus: () => {
        const { honeycombService } = get();
        const state = get();

        if (!honeycombService) {
          return {
            isInitialized: false,
            resourceAddress: null,
            achievementsCount: 0,
            playerAchievementsCount: 0,
          };
        }

        const systemStatus = honeycombService.getAchievementSystemStatus();
        return {
          ...systemStatus,
          playerAchievementsCount: state.playerAchievements.length,
        };
      },

      // Cross-session progress persistence actions
      loadCompletePlayerProgress: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return null;

        try {
          const progressData = await honeycombService.loadCompletePlayerProgress(playerWallet);

          if (progressData.success) {
            console.log("Complete player progress loaded from blockchain");
            return progressData;
          }

          return null;
        } catch (error) {
          console.error("Failed to load complete player progress:", error);
          return null;
        }
      },

      saveCompletePlayerProgress: async (
        playerWallet: PublicKey,
        progressData: any,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.saveCompletePlayerProgress(
            playerWallet,
            progressData,
            contextWallet,
          );

          if (success) {
            // Update sync timestamp
            const syncKey = `g-bax-sync-${playerWallet.toString()}`;
            localStorage.setItem(syncKey, Date.now().toString());
            console.log("Complete player progress saved to blockchain");
          }

          return success;
        } catch (error) {
          console.error("Failed to save complete player progress:", error);
          return false;
        }
      },

      syncProgressWithBlockchain: async (
        playerWallet: PublicKey,
        localProgress: any,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return null;

        try {
          const syncResult = await honeycombService.syncProgressWithBlockchain(
            playerWallet,
            localProgress,
            contextWallet,
          );

          if (syncResult.success) {
            // Update sync timestamp
            const syncKey = `g-bax-sync-${playerWallet.toString()}`;
            localStorage.setItem(syncKey, Date.now().toString());

            console.log("Progress synced with blockchain", {
              conflicts: syncResult.conflicts.length,
            });
          }

          return syncResult;
        } catch (error) {
          console.error("Failed to sync progress with blockchain:", error);
          return {
            syncedProgress: localProgress,
            conflicts: [],
            success: false,
          };
        }
      },

      getProgressSyncStatus: (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          return {
            hasLocalProgress: false,
            hasBlockchainProgress: false,
            lastSyncTime: 0,
            needsSync: false,
          };
        }

        return honeycombService.getProgressSyncStatus(playerWallet);
      },

      // Resource ownership system actions
      initializeGameResources: async (
        authority: PublicKey,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingResources: true });

          const success = await honeycombService.initializeGameResources(
            authority,
            contextWallet,
          );

          if (success) {
            // Load available game resources
            const gameResourcesMap = honeycombService.getAllGameResources();
            const gameResourcesArray = Array.from(gameResourcesMap.values());

            set({
              gameResources: gameResourcesArray,
              isResourceSystemInitialized: true,
            });

            console.log("Game resources initialized successfully");
          }
        } catch (error) {
          console.error("Failed to initialize game resources:", error);
        } finally {
          set({ isLoadingResources: false });
        }
      },

      awardResourceToPlayer: async (
        playerWallet: PublicKey,
        resourceId: string,
        amount: number,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.awardResourceToPlayer(
            playerWallet,
            resourceId,
            amount,
            contextWallet,
          );

          if (success) {
            // Reload player resource holdings
            await get().loadPlayerResourceHoldings(playerWallet);
            console.log(`Awarded ${amount} ${resourceId} to player`);
          }

          return success;
        } catch (error) {
          console.error("Failed to award resource to player:", error);
          return false;
        }
      },

      transferResource: async (
        fromWallet: PublicKey,
        toWallet: PublicKey,
        resourceId: string,
        amount: number,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.transferResource(
            fromWallet,
            toWallet,
            resourceId,
            amount,
            contextWallet,
          );

          if (success) {
            // Reload resource holdings for both players
            await get().loadPlayerResourceHoldings(fromWallet);
            await get().loadPlayerResourceHoldings(toWallet);
            console.log(`Transferred ${amount} ${resourceId} between players`);
          }

          return success;
        } catch (error) {
          console.error("Failed to transfer resource:", error);
          return false;
        }
      },

      consumePlayerResource: async (
        playerWallet: PublicKey,
        resourceId: string,
        amount: number,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.consumePlayerResource(
            playerWallet,
            resourceId,
            amount,
            contextWallet,
          );

          if (success) {
            // Reload player resource holdings
            await get().loadPlayerResourceHoldings(playerWallet);
            console.log(`Consumed ${amount} ${resourceId} from player`);
          }

          return success;
        } catch (error) {
          console.error("Failed to consume player resource:", error);
          return false;
        }
      },

      loadPlayerResourceHoldings: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingResources: true });

          const holdingsMap = await honeycombService.getPlayerResourceHoldings(playerWallet);

          // Convert Map to array format for state
          const holdingsArray: PlayerResourceHolding[] = [];
          holdingsMap.forEach((amount, resourceId) => {
            holdingsArray.push({
              resourceId,
              amount,
              lastUpdated: new Date(),
              onChain: true,
            });
          });

          set({
            playerResourceHoldings: holdingsArray,
          });

          console.log("Player resource holdings loaded:", holdingsArray.length);
        } catch (error) {
          console.error("Failed to load player resource holdings:", error);
        } finally {
          set({ isLoadingResources: false });
        }
      },

      getResourceSystemStatus: () => {
        const { honeycombService } = get();
        const state = get();

        if (!honeycombService) {
          return {
            isInitialized: false,
            resourceCount: 0,
            totalPlayers: 0,
            totalHoldings: 0,
          };
        }

        const systemStatus = honeycombService.getResourceSystemStatus();
        return {
          ...systemStatus,
          totalHoldings: state.playerResourceHoldings.length,
        };
      },

      // Guild progression system actions
      initializeGuildSystem: async (
        authority: PublicKey,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingGuild: true });

          const success = await honeycombService.initializeGuildSystem(
            authority,
            contextWallet,
          );

          if (success) {
            // Load available guilds
            const guilds = honeycombService.getAllGuilds();

            set({
              availableGuilds: guilds,
              isGuildSystemInitialized: true,
            });

            console.log("Guild system initialized successfully");
          }
        } catch (error) {
          console.error("Failed to initialize guild system:", error);
        } finally {
          set({ isLoadingGuild: false });
        }
      },

      joinGuild: async (
        playerWallet: PublicKey,
        guildId: string,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.joinGuild(
            playerWallet,
            guildId,
            contextWallet,
          );

          if (success) {
            // Reload player guild info and available guilds
            await get().loadPlayerGuild(playerWallet);

            // Update available guilds to reflect new member count
            const guilds = honeycombService.getAllGuilds();
            set({ availableGuilds: guilds });

            console.log(`Successfully joined guild: ${guildId}`);
          }

          return success;
        } catch (error) {
          console.error("Failed to join guild:", error);
          return false;
        }
      },

      leaveGuild: async (
        playerWallet: PublicKey,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.leaveGuild(
            playerWallet,
            contextWallet,
          );

          if (success) {
            // Clear player guild info and update available guilds
            set({ playerGuildInfo: null });

            const guilds = honeycombService.getAllGuilds();
            set({ availableGuilds: guilds });

            console.log("Successfully left guild");
          }

          return success;
        } catch (error) {
          console.error("Failed to leave guild:", error);
          return false;
        }
      },

      recordGuildContribution: async (
        playerWallet: PublicKey,
        contributionType: "mining" | "crafting" | "exploration" | "mission" | "leadership",
        amount: number,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return false;

        try {
          const success = await honeycombService.recordGuildContribution(
            playerWallet,
            contributionType,
            amount,
            contextWallet,
          );

          if (success) {
            // Reload player guild info to reflect new contributions
            await get().loadPlayerGuild(playerWallet);
            console.log(`Recorded ${contributionType} contribution: ${amount}`);
          }

          return success;
        } catch (error) {
          console.error("Failed to record guild contribution:", error);
          return false;
        }
      },

      loadPlayerGuild: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingGuild: true });

          const guildInfo = await honeycombService.getPlayerGuild(playerWallet);

          set({
            playerGuildInfo: guildInfo,
          });

          if (guildInfo) {
            console.log("Player guild info loaded:", guildInfo.guild.name);
          } else {
            console.log("Player is not in any guild");
          }
        } catch (error) {
          console.error("Failed to load player guild:", error);
        } finally {
          set({ isLoadingGuild: false });
        }
      },

      getGuildSystemStatus: () => {
        const { honeycombService } = get();

        if (!honeycombService) {
          return {
            isInitialized: false,
            resourceAddress: null,
            guildsCount: 0,
            totalMembers: 0,
          };
        }

        return honeycombService.getGuildSystemStatus();
      },

      // Mission pool and on-chain mission actions
      createMissionPool: async (
        authority: PublicKey,
        characterModelAddress: string,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const missionPool = await honeycombService.createMissionPool(
            authority,
            characterModelAddress,
            contextWallet,
          );

          if (missionPool) {
            set({
              missionPool,
              isMissionSystemInitialized: true,
            });
            console.log("Mission pool created successfully:", missionPool);
          }
        } catch (error) {
          console.error("Failed to create mission pool:", error);
        }
      },

      initializePredefinedMissions: async (
        authority: PublicKey,
        resourceAddress: string,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const success = await honeycombService.initializePredefinedMissions(
            authority,
            resourceAddress,
            contextWallet,
          );

          if (success) {
            const createdMissions = honeycombService.getCreatedMissions();
            set({
              createdMissions,
              isMissionSystemInitialized: true,
            });
            console.log("Predefined missions initialized successfully");
          }
        } catch (error) {
          console.error("Failed to initialize predefined missions:", error);
        }
      },

      getMissionPoolStatus: () => {
        const { honeycombService, missionPool, createdMissions } = get();
        return {
          isInitialized: honeycombService?.areMissionsInitialized() || false,
          poolAddress: honeycombService?.getMissionPoolAddress() || null,
          missionsCount: createdMissions.size,
        };
      },

      // Character and trait system actions
      initializeCharacterSystem: async (
        authority: PublicKey,
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingCharacter: true });

          const success = await honeycombService.initializeCharacterSystem(
            authority,
            contextWallet,
          );

          if (success) {
            set({
              assemblerConfig: {
                address: honeycombService.getAssemblerConfigAddress() || "",
                project: "",
                authority: authority.toString(),
                ticker: "G-BAX-TRAITS",
                order: ["Mining", "Crafting", "Exploration", "Combat", "Leadership"],
                treeAddress: "",
              },
              characterModel: {
                address: honeycombService.getCharacterModelAddress() || "",
                project: "",
                authority: authority.toString(),
                assemblerConfig: honeycombService.getAssemblerConfigAddress() || "",
                collectionName: "G-Bax Space Explorers",
                name: "G-Bax Character",
                symbol: "GBAX",
                description: "A space explorer character in the G-Bax universe",
              },
              isCharacterSystemInitialized: true,
            });
            console.log("Character system initialized successfully");
          }
        } catch (error) {
          console.error("Failed to initialize character system:", error);
        } finally {
          set({ isLoadingCharacter: false });
        }
      },

      createPlayerCharacter: async (
        playerWallet: PublicKey,
        initialTraits: string[][] = [],
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingCharacter: true });

          const characterAddress = await honeycombService.createPlayerCharacter(
            playerWallet,
            initialTraits,
            contextWallet,
          );

          if (characterAddress) {
            // Load the created character
            await get().loadPlayerCharacter(playerWallet);
            console.log("Player character created successfully:", characterAddress);
          }
        } catch (error) {
          console.error("Failed to create player character:", error);
        } finally {
          set({ isLoadingCharacter: false });
        }
      },

      assignTraitToCharacter: async (
        characterAddress: string,
        playerWallet: PublicKey,
        traitCategory: string,
        traitName: string,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const success = await honeycombService.assignTraitToCharacter(
            characterAddress,
            playerWallet,
            traitCategory,
            traitName,
            contextWallet,
          );

          if (success) {
            // Reload character to get updated traits
            await get().loadPlayerCharacter(playerWallet);
            console.log(`Trait assigned: ${traitCategory} - ${traitName}`);
          }
        } catch (error) {
          console.error("Failed to assign trait to character:", error);
        }
      },

      loadPlayerCharacter: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingCharacter: true });

          const characters = await honeycombService.findPlayerCharacters(playerWallet);

          if (characters.length > 0) {
            const character = characters[0]; // Use the first character
            const traits = await honeycombService.getCharacterTraits(character.address);

            set({
              playerCharacter: {
                address: character.address,
                owner: character.owner,
                traits,
                level: 1, // Default level
                experience: 0, // Default experience
                createdAt: new Date(),
                lastUpdated: new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Failed to load player character:", error);
        } finally {
          set({ isLoadingCharacter: false });
        }
      },

      getCharacterSystemStatus: () => {
        const { honeycombService } = get();
        return {
          isInitialized: honeycombService?.isCharacterSystemInitialized() || false,
          assemblerConfig: honeycombService?.getAssemblerConfigAddress() || null,
          characterModel: honeycombService?.getCharacterModelAddress() || null,
          charactersTree: honeycombService?.getCharactersTreeAddress() || null,
        };
      },

      // Trait evolution actions
      evolveCharacterTrait: async (
        characterAddress: string,
        playerWallet: PublicKey,
        currentTraitCategory: string,
        currentTraitName: string,
        newTraitName: string,
        contextWallet?: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const success = await honeycombService.evolveCharacterTrait(
            characterAddress,
            playerWallet,
            currentTraitCategory,
            currentTraitName,
            newTraitName,
            contextWallet,
          );

          if (success) {
            // Reload character to get updated traits
            await get().loadPlayerCharacter(playerWallet);
            console.log(`Trait evolved: ${currentTraitName} → ${newTraitName}`);
          }
        } catch (error) {
          console.error("Failed to evolve character trait:", error);
        }
      },

      getTraitEvolutionStatus: async (
        characterAddress: string,
        playerStats: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) return [];

        try {
          return await honeycombService.getTraitEvolutionStatus(
            characterAddress,
            playerStats,
          );
        } catch (error) {
          console.error("Failed to get trait evolution status:", error);
          return [];
        }
      },

      checkTraitEvolution: (
        currentTraitName: string,
        playerStats: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          return { canEvolve: false };
        }

        return honeycombService.canEvolveTrait(currentTraitName, playerStats);
      },

      // Utility actions
      checkConnection: async () => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const isConnected = await honeycombService.checkConnection();
          const networkInfo = await honeycombService.getNetworkInfo();

          set({ isConnected, networkInfo });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          set({ isConnected: false });
        }
      },

      getPlayerTraitBonuses: async (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) {
          return {
            miningBonus: 0,
            craftingBonus: 0,
            explorationBonus: 0,
            combatBonus: 0,
            leadershipBonus: 0,
            experienceBonus: 0,
          };
        }

        try {
          return await honeycombService.getPlayerTraitBonuses(playerPublicKey);
        } catch (error) {
          console.error("Failed to get player trait bonuses:", error);
          return {
            miningBonus: 0,
            craftingBonus: 0,
            explorationBonus: 0,
            combatBonus: 0,
            leadershipBonus: 0,
            experienceBonus: 0,
          };
        }
      },

      reset: () => {
        set({
          honeycombService: null,
          isConnected: false,
          isInitializing: false,
          networkInfo: null,
          playerProfile: null,
          isLoadingProfile: false,
          availableMissions: [],
          playerMissions: [],
          activeMission: null,
          isLoadingMissions: false,
          missionPool: null,
          createdMissions: new Map(),
          isMissionSystemInitialized: false,
          assemblerConfig: null,
          characterModel: null,
          playerCharacter: null,
          availableTraits: [],
          isCharacterSystemInitialized: false,
          isLoadingCharacter: false,
          availableAchievements: [],
          playerAchievements: [],
          achievementProgress: [],
          isAchievementSystemInitialized: false,
          isLoadingAchievements: false,
          gameResources: [],
          playerResourceHoldings: [],
          isResourceSystemInitialized: false,
          isLoadingResources: false,
          availableGuilds: [],
          playerGuildInfo: null,
          isGuildSystemInitialized: false,
          isLoadingGuild: false,
          playerTraits: [],
          isLoadingTraits: false,
          playerExperience: 0,
          playerLevel: 1,
        });
      },
    }),
    {
      name: "g-bax-honeycomb-store",
    },
  ),
);

// Export reset function for external use
export const resetHoneycombStore = () => {
  useHoneycombStore.getState().reset();
  // Also clear the persisted storage
  localStorage.removeItem("g-bax-honeycomb-storage");

  // Clear all individual honeycomb data
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith("honeycomb_")) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
};
