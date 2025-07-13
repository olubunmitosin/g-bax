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
  initializeVerxio: (apiKey: string, environment: 'development' | 'production') => Promise<void>;
  loadPlayerLoyalty: (playerPublicKey: PublicKey) => Promise<void>;
  awardLoyaltyPoints: (playerPublicKey: PublicKey, points: number, reason: string) => Promise<void>;
  loadAvailableGuilds: () => Promise<void>;
  joinGuild: (playerPublicKey: PublicKey, guildId: string) => Promise<void>;
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
        initializeVerxio: async (apiKey: string, environment: 'development' | 'production') => {
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

            // If player has a guild, load guild info
            let playerGuild = null;
            if (loyalty?.guildId) {
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

        // Join a guild
        joinGuild: async (playerPublicKey: PublicKey, guildId: string) => {
          const { verxioService, availableGuilds, playerLoyalty } = get();
          if (!verxioService) return;

          try {
            const success = await verxioService.joinGuild(playerPublicKey, guildId);

            if (success) {
              const guild = availableGuilds.find(g => g.id === guildId);

              // Update player loyalty with guild info
              if (playerLoyalty && guild) {
                set({
                  playerLoyalty: {
                    ...playerLoyalty,
                    guildId: guild.id,
                    guildRank: 'member',
                  },
                  playerGuild: guild,
                });

                // Load guild members
                await get().loadGuildMembers(guildId);
              }
            }
          } catch (error) {
            throw error;
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
