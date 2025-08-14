import type { HoneycombMission } from "@/types/game";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PublicKey } from "@solana/web3.js";
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
    profileInfo: { name: string; bio: string; pfp: string, username: string },
    contextWallet?: any,
  ) => Promise<void>;

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
    contributionType:
      | "mining"
      | "crafting"
      | "exploration"
      | "mission"
      | "leadership",
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
        const currentState = get();

        // Prevent multiple simultaneous initializations
        if (currentState.isInitializing || currentState.honeycombService) {
          return;
        }

        set({ isInitializing: true });

        try {
          // Always use honeynet for our setup
          const honeycombEnv = environment ?? "honeynet";

          const projectAddress =
            process.env.NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS;

          if (!projectAddress) {
            set({ isInitializing: false });

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

            const createUserParams: any = {
              project: honeycombService.getProjectAddress(),
              wallet: playerPublicKey.toString(),
              payer: playerPublicKey.toString(),
              userInfo: defaultUserInfo,
              profilesTreeAddress: profilesTreeAddress,
            };

            const txBundle = await honeycombService
              .getEdgeClient()
              .createNewUserWithProfileTransaction(createUserParams);

            // Sign and send this transaction via service helper (handles normalization/retries)
            await honeycombService.signAndSendTransaction(
              txBundle.createNewUserWithProfileTransaction,
              contextWallet,
            );

            await honeycombService.findUser(playerPublicKey);
          }

          // Load player profile
          await get().loadPlayerProfile(playerPublicKey);
        } catch (error: any) {
          // Silent error handling
        }
      },

      updateUserAccount: async (
        playerPublicKey: PublicKey,
        profileInfo: { name: string; bio: string; pfp: string },
        contextWallet: any,
      ) => {
        const { honeycombService } = get();

        if (!honeycombService) {
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

          const signResult = await honeycombService.signAndSendTransaction(
            txResponse,
            contextWallet,
          );

          console.log("📋 Transaction result:", signResult);

          if (!signResult.success) {
            throw new Error(`Transaction failed: ${signResult.error}`);
          }

        
          let retries = 0;
          const maxRetries = 3;
          let profileLoaded = false;

          while (retries < maxRetries && !profileLoaded) {
            try {
              // Clear cache again before each retry
              // honeycombService.clearProfileCache(playerPublicKey);

              // Wait longer on each retry
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
              }

              // Reload the player profile to reflect changes
              await get().loadPlayerProfile(playerPublicKey);

              // Check if the profile was updated with the new name
              const currentProfile = get().playerProfile;
              if (currentProfile && currentProfile.name === profileInfo.name) {
                profileLoaded = true;
              } else {
                retries++;
              }
            } catch (error) {
              retries++;
              if (retries >= maxRetries) {
                throw error;
              }
            }
          }

          // If retries failed, update the profile locally as a fallback
          if (!profileLoaded) {
            const currentProfile = get().playerProfile;
            if (currentProfile) {
              set({
                playerProfile: {
                  ...currentProfile,
                  name: profileInfo.name,
                  bio: profileInfo.bio,
                  pfp: profileInfo.pfp,
                  lastUpdated: new Date().toISOString(),
                }
              });
            }
          }
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
            if(!profile) {
              return;
            }
            const currentXp = profile?.experience || 0;
            const xpDifference = experience - currentXp;

            // Only update if there's a positive difference
            if (xpDifference <= 0) {
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
          } catch (error) { }
        }

        // Fallback 2: localStorage simulation (when no service available)
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
          } catch (error) { }
        }

        // Update experience and level
        profile.experience = experience;
        profile.level = Math.floor(experience / 1000) + 1;

        // Save to localStorage (simulating blockchain)
        localStorage.setItem(blockchainKey, JSON.stringify(profile));
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
        } catch (error) {
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
          }

          return success;
        } catch (error) {
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
            const predefinedAchievements =
              honeycombService.getPredefinedAchievements();
            const achievementsArray = Array.from(
              predefinedAchievements.values(),
            );

            set({
              availableAchievements: achievementsArray,
              isAchievementSystemInitialized: true,
            });
          }
        } catch (error) {
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
          const newAchievements =
            await honeycombService.checkAndAwardAchievements(
              playerWallet,
              playerStats,
              contextWallet,
            );

          if (newAchievements.length > 0) {
            // Reload player achievements
            await get().loadPlayerAchievements(playerWallet);
          }

          return newAchievements;
        } catch (error) {
          return [];
        }
      },

      loadPlayerAchievements: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingAchievements: true });

          const playerAchievements =
            await honeycombService.getPlayerAchievements(playerWallet);

          set({
            playerAchievements,
          });
        } catch (error) {
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
          const progressData =
            await honeycombService.loadCompletePlayerProgress(playerWallet);

          if (progressData.success) {
            return progressData;
          }

          return null;
        } catch (error) {
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
          }

          return success;
        } catch (error) {
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
          }

          return syncResult;
        } catch (error) {
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
          }
        } catch (error) {
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
          }

          return success;
        } catch (error) {
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
          }

          return success;
        } catch (error) {
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
          }

          return success;
        } catch (error) {
          return false;
        }
      },

      loadPlayerResourceHoldings: async (playerWallet: PublicKey) => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          set({ isLoadingResources: true });

          const holdingsMap =
            await honeycombService.getPlayerResourceHoldings(playerWallet);

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
        } catch (error) {
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
          }
        } catch (error) {
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
          }

          return success;
        } catch (error) {
          return false;
        }
      },

      leaveGuild: async (playerWallet: PublicKey, contextWallet?: any) => {
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
          }

          return success;
        } catch (error) {
          return false;
        }
      },

      recordGuildContribution: async (
        playerWallet: PublicKey,
        contributionType:
          | "mining"
          | "crafting"
          | "exploration"
          | "mission"
          | "leadership",
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
          }

          return success;
        } catch (error) {
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
          } else {
          }
        } catch (error) {
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

      // Utility actions
      checkConnection: async () => {
        const { honeycombService } = get();

        if (!honeycombService) return;

        try {
          const isConnected = await honeycombService.checkConnection();
          const networkInfo = await honeycombService.getNetworkInfo();

          set({ isConnected, networkInfo });
        } catch (error) {
          set({ isConnected: false });
        }
      },

      getPlayerTraitBonuses: async (playerPublicKey: PublicKey) => {
        try {
          // Get trait bonuses from local character service
          const { localCharacterService } = await import("../services/localCharacterService");
          const playerCharacter = localCharacterService.getPlayerCharacter(playerPublicKey.toString());

          if (playerCharacter) {
            return playerCharacter.bonuses;
          }

          return {
            miningBonus: 0,
            craftingBonus: 0,
            explorationBonus: 0,
            combatBonus: 0,
            leadershipBonus: 0,
            experienceBonus: 0,
          };
        } catch (error) {
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
