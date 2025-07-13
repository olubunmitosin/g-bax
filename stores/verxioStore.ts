import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { VerxioService, type PlayerLoyalty, type Guild, type GuildMember, type LoyaltyTier } from '@/services/verxioService';
import { PublicKey } from '@solana/web3.js';

export interface VerxioState {
  // Service instance
  verxioService: VerxioService | null;

  // Connection state
  isConnected: boolean;
  isInitializing: boolean;

  // Player loyalty
  playerLoyalty: PlayerLoyalty | null;
  isLoadingLoyalty: boolean;

  // Guilds
  availableGuilds: Guild[];
  playerGuild: Guild | null;
  guildMembers: GuildMember[];
  isLoadingGuilds: boolean;

  // Loyalty tiers
  loyaltyTiers: LoyaltyTier[];

  // Actions
  initializeVerxio: (apiKey?: string, environment?: 'development' | 'production') => Promise<void>;
  loadPlayerLoyalty: (playerPublicKey: PublicKey) => Promise<void>;
  awardLoyaltyPoints: (playerPublicKey: PublicKey, points: number, reason: string) => Promise<void>;
  refreshLoyaltyData: (playerPublicKey: PublicKey) => Promise<void>;
  loadAvailableGuilds: () => Promise<void>;
  forceRefreshGuildData: (playerPublicKey?: PublicKey) => Promise<void>;
  joinGuild: (playerPublicKey: PublicKey, guildId: string) => Promise<{ success: boolean; error?: string }>;
  leaveGuild: (playerPublicKey: PublicKey) => Promise<{ success: boolean; error?: string }>;
  loadGuildMembers: (guildId: string) => Promise<void>;
  updateReputation: (playerPublicKey: PublicKey, change: number, reason: string) => Promise<void>;

  // Utility actions
  getTierByPoints: (points: number) => LoyaltyTier | null;
  getPointsToNextTier: (currentPoints: number) => { needed: number; nextTier: LoyaltyTier | null };
  getMultiplierForPoints: (points: number) => number;
  reset: () => void;
}

export const useVerxioStore = create<VerxioState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        verxioService: null,
        isConnected: false,
        isInitializing: false,
        playerLoyalty: null,
        isLoadingLoyalty: false,
        availableGuilds: [],
        playerGuild: null,
        guildMembers: [],
        isLoadingGuilds: false,
        loyaltyTiers: [],

        // Initialize Verxio service
        initializeVerxio: async (apiKey?: string, environment: 'development' | 'production' = 'development') => {
          set({ isInitializing: true });

          try {
            const service = new VerxioService({
              apiKey,
              environment,
            });

            const isConnected = await service.initialize();
            const loyaltyTiers = service.getAllTiers();

            set({
              verxioService: service,
              isConnected,
              loyaltyTiers,
              isInitializing: false,
            });

            if (isConnected) {
              // Load available guilds
              await get().loadAvailableGuilds();
            }
          } catch (error) {
            set({
              isConnected: false,
              isInitializing: false,
            });
          }
        },

        // Load player loyalty information
        loadPlayerLoyalty: async (playerPublicKey: PublicKey) => {
          const { verxioService } = get();
          if (!verxioService) return;

          set({ isLoadingLoyalty: true });

          try {
            const loyalty = await verxioService.getPlayerLoyalty(playerPublicKey);

            // Ensure lastActivity is a proper Date object
            if (loyalty && loyalty.lastActivity) {
              loyalty.lastActivity = new Date(loyalty.lastActivity);
            }

            // If player has a guild, load guild info with fresh data
            let playerGuild = null;
            if (loyalty?.guildId) {
              // First refresh available guilds to get latest data
              await get().loadAvailableGuilds();
              const guilds = get().availableGuilds;
              playerGuild = guilds.find(g => g.id === loyalty.guildId) || null;

              if (playerGuild) {
                // Load guild members
                await get().loadGuildMembers(playerGuild.id);
              }
            }

            set({
              playerLoyalty: loyalty,
              playerGuild,
            });
          } catch (error) {
          } finally {
            set({ isLoadingLoyalty: false });
          }
        },

        // Award loyalty points
        awardLoyaltyPoints: async (playerPublicKey: PublicKey, points: number, reason: string) => {
          const { verxioService, playerLoyalty } = get();
          if (!verxioService) return;

          try {
            const success = await verxioService.awardPoints(playerPublicKey, points, reason);

            if (success && playerLoyalty) {
              // Update local state
              const newPoints = playerLoyalty.points + points;
              const newTotalPoints = playerLoyalty.totalPointsEarned + points;
              const newTier = verxioService.getTierByPoints(newPoints);

              set({
                playerLoyalty: {
                  ...playerLoyalty,
                  points: newPoints,
                  totalPointsEarned: newTotalPoints,
                  currentTier: newTier,
                  lastActivity: new Date(),
                },
              });
            }
          } catch (error) {
          }
        },

        // Force refresh loyalty data to fix any inconsistencies
        refreshLoyaltyData: async (playerPublicKey: PublicKey) => {
          const { verxioService } = get();
          if (!verxioService) return;

          try {
            set({ isLoadingLoyalty: true });

            // Refresh both loyalty and guild data to ensure consistency
            await get().forceRefreshGuildData(playerPublicKey);

            set({ isLoadingLoyalty: false });
          } catch (error) {
            set({ isLoadingLoyalty: false });
          }
        },

        // Load available guilds
        loadAvailableGuilds: async () => {
          const { verxioService } = get();
          if (!verxioService) return;

          set({ isLoadingGuilds: true });

          try {
            const guilds = await verxioService.getAvailableGuilds();
            set({ availableGuilds: guilds });
          } catch (error) {
          } finally {
            set({ isLoadingGuilds: false });
          }
        },

        // Force refresh all guild data (clears any cached state)
        forceRefreshGuildData: async (playerPublicKey?: PublicKey) => {
          const { verxioService } = get();
          if (!verxioService) return;

          set({ isLoadingGuilds: true, isLoadingLoyalty: true });

          try {
            // Clear current state first
            set({
              availableGuilds: [],
              playerGuild: null,
              guildMembers: []
            });

            // Load fresh guild data
            const guilds = await verxioService.getAvailableGuilds();
            set({ availableGuilds: guilds });

            // If player is provided, reload their loyalty data
            if (playerPublicKey) {
              const loyalty = await verxioService.getPlayerLoyalty(playerPublicKey);

              // Find player's guild with fresh data
              let playerGuild = null;
              if (loyalty?.guildId) {
                playerGuild = guilds.find(g => g.id === loyalty.guildId) || null;
                if (playerGuild) {
                  await get().loadGuildMembers(playerGuild.id);
                }
              }

              set({
                playerLoyalty: loyalty,
                playerGuild,
              });
            }
          } catch (error) {
          } finally {
            set({ isLoadingGuilds: false, isLoadingLoyalty: false });
          }
        },

        // Join a guild
        joinGuild: async (playerPublicKey: PublicKey, guildId: string) => {
          const { verxioService, availableGuilds, playerLoyalty } = get();
          if (!verxioService) return { success: false, error: 'Verxio service not available' };

          try {
            const result = await verxioService.joinGuild(playerPublicKey, guildId);

            if (result.success) {
              // Force multiple refreshes to ensure data consistency
              await get().loadAvailableGuilds();

              // Small delay to ensure localStorage is updated
              await new Promise(resolve => setTimeout(resolve, 100));

              // Refresh again to be absolutely sure
              await get().loadAvailableGuilds();

              // Get the updated guild data
              const updatedGuilds = get().availableGuilds;
              const guild = updatedGuilds.find(g => g.id === guildId);

              // Update player loyalty with guild info
              if (playerLoyalty && guild) {
                set({
                  playerLoyalty: {
                    ...playerLoyalty,
                    guildId: guild.id,
                    guildRank: 'member',
                  },
                  playerGuild: guild, // Use the updated guild data
                });

                // Load guild members
                await get().loadGuildMembers(guildId);

                // Force one more refresh to ensure UI is updated
                await get().loadAvailableGuilds();
              }
            }

            return result;
          } catch (error) {
            return { success: false, error: 'Failed to join guild' };
          }
        },

        // Leave a guild
        leaveGuild: async (playerPublicKey: PublicKey) => {
          const { verxioService, playerLoyalty } = get();
          if (!verxioService) return { success: false, error: 'Verxio service not available' };

          try {
            const result = await verxioService.leaveGuild(playerPublicKey);

            if (result.success) {
              // First refresh available guilds to get updated member counts
              await get().loadAvailableGuilds();

              // Update player loyalty to remove guild info
              if (playerLoyalty) {
                const updatedLoyalty = { ...playerLoyalty };
                delete updatedLoyalty.guildId;
                delete updatedLoyalty.guildRank;

                set({
                  playerLoyalty: updatedLoyalty,
                  playerGuild: null,
                  guildMembers: [],
                });
              }
            }

            return result;
          } catch (error) {
            return { success: false, error: 'Failed to leave guild' };
          }
        },

        // Load guild members
        loadGuildMembers: async (guildId: string) => {
          const { verxioService } = get();
          if (!verxioService) return;

          try {
            const members = await verxioService.getGuildMembers(guildId);
            set({ guildMembers: members });
          } catch (error) {
          }
        },

        // Update player reputation
        updateReputation: async (playerPublicKey: PublicKey, change: number, reason: string) => {
          const { verxioService, playerLoyalty } = get();
          if (!verxioService) return;

          try {
            const success = await verxioService.updateReputation(playerPublicKey, change, reason);

            if (success && playerLoyalty) {
              set({
                playerLoyalty: {
                  ...playerLoyalty,
                  reputation: playerLoyalty.reputation + change,
                  lastActivity: new Date(),
                },
              });
            }
          } catch (error) {
          }
        },

        // Utility functions
        getTierByPoints: (points: number) => {
          const { verxioService } = get();
          return verxioService?.getTierByPoints(points) || null;
        },

        getPointsToNextTier: (currentPoints: number) => {
          const { verxioService } = get();
          return verxioService?.getPointsToNextTier(currentPoints) || { needed: 0, nextTier: null };
        },

        getMultiplierForPoints: (points: number) => {
          const { verxioService } = get();
          return verxioService?.getMultiplierForPoints(points) || 1.0;
        },

        // Reset state
        reset: () => {
          set({
            verxioService: null,
            isConnected: false,
            isInitializing: false,
            playerLoyalty: null,
            isLoadingLoyalty: false,
            availableGuilds: [],
            playerGuild: null,
            guildMembers: [],
            isLoadingGuilds: false,
            loyaltyTiers: [],
          });
        },
      }),
      {
        name: 'g-bax-verxio-storage',
        partialize: (state) => ({
          playerLoyalty: state.playerLoyalty,
          playerGuild: state.playerGuild,
          guildMembers: state.guildMembers,
          availableGuilds: state.availableGuilds,
        }),
      }
    ),
    {
      name: 'g-bax-verxio-store',
    }
  )
);

// Export reset function for external use
export const resetVerxioStore = () => {
  useVerxioStore.getState().reset();
  // Also clear the persisted storage and individual loyalty data
  localStorage.removeItem('g-bax-verxio-storage');

  // Clear all individual verxio loyalty data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('verxio_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
