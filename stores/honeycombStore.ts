import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { HoneycombService, type MissionProgress, type PlayerTrait } from '@/services/honeycombService';
import type { HoneycombMission } from '@/types/game';
import { PublicKey } from '@solana/web3.js';
import { getLevelFromExperience } from '@/utils/gameHelpers';

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

  // Traits
  playerTraits: PlayerTrait[];
  isLoadingTraits: boolean;

  // Experience and progression
  playerExperience: number;
  playerLevel: number;

  // Actions
  initializeHoneycomb: (rpcUrl: string, environment: 'devnet' | 'mainnet-beta') => Promise<void>;
  connectPlayer: (playerPublicKey: PublicKey) => Promise<void>;

  // Mission actions
  loadAvailableMissions: () => Promise<void>;
  loadPlayerMissions: (playerPublicKey: PublicKey) => Promise<void>;
  startMission: (playerPublicKey: PublicKey, missionId: string) => Promise<void>;
  updateMissionProgress: (playerPublicKey: PublicKey, missionId: string, progress: number) => Promise<void>;

  // Trait actions
  loadPlayerTraits: (playerPublicKey: PublicKey) => Promise<void>;
  assignTrait: (playerPublicKey: PublicKey, traitData: any) => Promise<void>;
  upgradeTrait: (playerPublicKey: PublicKey, traitId: string, newLevel: number) => Promise<void>;

  // Profile actions
  createPlayerProfile: (playerPublicKey: PublicKey, profileData: any) => Promise<void>;
  loadPlayerProfile: (playerPublicKey: PublicKey) => Promise<void>;
  updatePlayerExperience: (playerPublicKey: PublicKey, experience: number) => Promise<void>;
  updateMissionProgress: (playerPublicKey: PublicKey, missionId: string, progress: number) => Promise<void>;

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
      playerTraits: [],
      isLoadingTraits: false,
      playerExperience: 0,
      playerLevel: 1,

      // Initialize Honeycomb service
      initializeHoneycomb: async (rpcUrl: string, environment: 'devnet' | 'mainnet-beta') => {
        set({ isInitializing: true });

        try {
          const service = new HoneycombService({
            rpcUrl,
            environment,
          });

          const isConnected = await service.isConnected();
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
        } catch (error) {
          set({
            isConnected: false,
            isInitializing: false,
          });
        }
      },

      // Connect player and load their data
      connectPlayer: async (playerPublicKey: PublicKey) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          // Load player profile
          await get().loadPlayerProfile(playerPublicKey);

          // Load player missions
          await get().loadPlayerMissions(playerPublicKey);

          // Load player traits
          await get().loadPlayerTraits(playerPublicKey);
        } catch (error) {
          // Handle connection error silently
        }
      },

      // Mission actions
      loadAvailableMissions: async () => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        set({ isLoadingMissions: true });

        try {
          const missions = await honeycombService.getAvailableMissions();
          set({ availableMissions: missions });
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
          const missions = await honeycombService.getPlayerMissions(playerPublicKey);
          const activeMission = missions.find(m => !m.completed) || null;

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
          const missionProgress = await honeycombService.startMission(playerPublicKey, missionId);

          set(state => ({
            playerMissions: [...state.playerMissions, missionProgress],
            activeMission: missionProgress,
          }));
        } catch (error) {
          throw error;
        }
      },

      updateMissionProgress: async (playerPublicKey: PublicKey, missionId: string, progress: number) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          const updatedProgress = await honeycombService.updateMissionProgress(
            playerPublicKey,
            missionId,
            progress
          );

          set(state => ({
            playerMissions: state.playerMissions.map(m =>
              m.missionId === missionId ? updatedProgress : m
            ),
            activeMission: state.activeMission?.missionId === missionId ? updatedProgress : state.activeMission,
          }));

          // If mission completed, update player experience
          if (updatedProgress.completed) {
            // Award experience based on mission rewards
            const experienceReward = updatedProgress.rewards.reduce((total, reward) => {
              return total + (reward.experience || 0);
            }, 0);

            if (experienceReward > 0) {
              await get().updatePlayerExperience(playerPublicKey, experienceReward);
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
          const traits = await honeycombService.getPlayerTraits(playerPublicKey);
          set({ playerTraits: traits });
        } catch (error) {
          // Handle error silently
        } finally {
          set({ isLoadingTraits: false });
        }
      },

      assignTrait: async (playerPublicKey: PublicKey, traitData: any) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          const trait = await honeycombService.assignTrait(playerPublicKey, traitData);

          set(state => ({
            playerTraits: [...state.playerTraits, trait],
          }));
        } catch (error) {
          throw error;
        }
      },

      upgradeTrait: async (playerPublicKey: PublicKey, traitId: string, newLevel: number) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          const updatedTrait = await honeycombService.upgradeTrait(playerPublicKey, traitId, newLevel);

          set(state => ({
            playerTraits: state.playerTraits.map(t =>
              t.traitId === traitId ? updatedTrait : t
            ),
          }));
        } catch (error) {
          throw error;
        }
      },

      // Profile actions
      createPlayerProfile: async (playerPublicKey: PublicKey, profileData: any) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        set({ isLoadingProfile: true });

        try {
          const profile = await honeycombService.createPlayerProfile(playerPublicKey, profileData);
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
          const profile = await honeycombService.getPlayerProfile(playerPublicKey);
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

      updatePlayerExperience: async (playerPublicKey: PublicKey, experience: number) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          await honeycombService.updatePlayerExperience(playerPublicKey, experience);

          set(state => {
            const newExperience = state.playerExperience + experience;
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

      updateMissionProgress: async (playerPublicKey: PublicKey, missionId: string, progress: number) => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          await honeycombService.updateMissionProgress(playerPublicKey, missionId, progress);

          set(state => ({
            playerMissions: state.playerMissions.map(mission =>
              mission.missionId === missionId
                ? { ...mission, progress }
                : mission
            ),
          }));
        } catch (error) {
          // Silently handle mission progress update errors
        }
      },

      // Utility actions
      checkConnection: async () => {
        const { honeycombService } = get();
        if (!honeycombService) return;

        try {
          const isConnected = await honeycombService.isConnected();
          const networkInfo = await honeycombService.getNetworkInfo();

          set({ isConnected, networkInfo });
        } catch (error) {
          set({ isConnected: false });
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
          playerTraits: [],
          isLoadingTraits: false,
          playerExperience: 0,
          playerLevel: 1,
        });
      },
    }),
    {
      name: 'g-bax-honeycomb-store',
    }
  )
);

// Export reset function for external use
export const resetHoneycombStore = () => {
  useHoneycombStore.getState().reset();
  // Also clear the persisted storage
  localStorage.removeItem('g-bax-honeycomb-storage');

  // Clear all individual honeycomb data
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('honeycomb_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
