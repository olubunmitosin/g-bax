/**
 * Local Mission Store
 * Zustand store for managing missions using local storage
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Mission, Resource } from "@/stores/gameStore";
import { localMissionService, type LocalMissionProgress, type LocalMissionData } from "@/services/localMissionService";

export interface LocalMissionState {
  // Mission data
  missions: Mission[];
  activeMission: Mission | null;
  completedMissions: string[];
  missionProgress: Record<string, LocalMissionProgress>;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Error handling
  error: string | null;

  // Player context
  currentPlayerId: string | null;

  // Actions
  initialize: (playerId: string) => Promise<void>;
  loadAvailableMissions: (playerId: string, playerLevel?: number) => Promise<void>;
  startMission: (playerId: string, missionId: string) => Promise<LocalMissionProgress>;
  updateMissionProgress: (playerId: string, missionId: string, progress: number) => Promise<LocalMissionProgress>;
  completeMission: (playerId: string, missionId: string) => Promise<LocalMissionProgress>;
  getPlayerMissions: (playerId: string) => LocalMissionProgress[];
  resetMissions: (playerId: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  createBackup: () => void;
  restoreFromBackup: () => Promise<boolean>;

  // Sync actions
  syncMissionData: () => void;
  getLastSyncTimestamp: () => string | null;
}

export const useLocalMissionStore = create<LocalMissionState>()(
  devtools(
    persist(
      (set, get): LocalMissionState => ({
        // Initial state
        missions: [],
        activeMission: null,
        completedMissions: [],
        missionProgress: {},
        isLoading: false,
        isInitialized: false,
        error: null,
        currentPlayerId: null,

        // Initialize the mission system
        initialize: async (playerId: string) => {
          set({ isLoading: true, error: null, currentPlayerId: playerId });

          try {
            const missionData = localMissionService.initialize(playerId);

            set({
              missions: missionData.missions,
              activeMission: missionData.activeMission,
              completedMissions: missionData.completedMissions,
              missionProgress: missionData.missionProgress,
              isInitialized: true,
              isLoading: false,
            });
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to initialize missions",
              isLoading: false,
            });
          }
        },

        // Load available missions for a player
        loadAvailableMissions: async (playerId: string, playerLevel: number = 1) => {
          set({ isLoading: true, error: null });

          try {
            const availableMissions = localMissionService.getAvailableMissions(playerId, playerLevel);

            set({
              missions: availableMissions,
              isLoading: false,
            });
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to load missions",
              isLoading: false,
            });
          }
        },

        // Start a mission
        startMission: async (playerId: string, missionId: string) => {
          set({ isLoading: true, error: null });

          try {
            const missionProgress = localMissionService.startMission(playerId, missionId);
            const activeMission = localMissionService.getActiveMission(playerId);
            const missions = localMissionService.getAvailableMissions(playerId);

            set({
              missions,
              activeMission,
              missionProgress: {
                ...get().missionProgress,
                [missionId]: missionProgress,
              },
              isLoading: false,
            });

            return missionProgress;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to start mission";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },

        // Update mission progress
        updateMissionProgress: async (playerId: string, missionId: string, progress: number) => {
          try {
            const missionProgress = localMissionService.updateMissionProgress(playerId, missionId, progress);
            const activeMission = localMissionService.getActiveMission(playerId);
            const missions = localMissionService.getAvailableMissions(playerId);

            // Update completed missions if mission was completed
            const completedMissions = missionProgress.completed
              ? [...get().completedMissions.filter(id => id !== missionId), missionId]
              : get().completedMissions;

            set({
              missions,
              activeMission,
              completedMissions,
              missionProgress: {
                ...get().missionProgress,
                [missionId]: missionProgress,
              },
            });

            return missionProgress;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to update mission progress";
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Complete a mission
        completeMission: async (playerId: string, missionId: string) => {
          try {
            const missionProgress = localMissionService.completeMission(playerId, missionId);
            const activeMission = localMissionService.getActiveMission(playerId);
            const missions = localMissionService.getAvailableMissions(playerId);

            set({
              missions,
              activeMission,
              completedMissions: [...get().completedMissions.filter(id => id !== missionId), missionId],
              missionProgress: {
                ...get().missionProgress,
                [missionId]: missionProgress,
              },
            });

            return missionProgress;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to complete mission";
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Get player missions
        getPlayerMissions: (playerId: string) => {
          return localMissionService.getPlayerMissions(playerId);
        },

        // Reset missions
        resetMissions: async (playerId: string) => {
          set({ isLoading: true, error: null });

          try {
            const missionData = localMissionService.resetMissions(playerId);

            set({
              missions: missionData.missions,
              activeMission: missionData.activeMission,
              completedMissions: missionData.completedMissions,
              missionProgress: missionData.missionProgress,
              isLoading: false,
            });
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to reset missions",
              isLoading: false,
            });
          }
        },

        // Clear error
        clearError: () => set({ error: null }),

        // Create backup
        createBackup: () => {
          try {
            localMissionService.createBackup();
          } catch (error) {set({ error: "Failed to create backup" });
          }
        },

        // Restore from backup
        restoreFromBackup: async () => {
          set({ isLoading: true, error: null });

          try {
            const restoredData = localMissionService.restoreFromBackup();

            if (restoredData) {
              set({
                missions: restoredData.missions,
                activeMission: restoredData.activeMission,
                completedMissions: restoredData.completedMissions,
                missionProgress: restoredData.missionProgress,
                isLoading: false,
              });
              return true;
            } else {
              set({
                error: "No backup data found",
                isLoading: false,
              });
              return false;
            }
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to restore from backup",
              isLoading: false,
            });
            return false;
          }
        },

        // Sync mission data (for consistency across tabs)
        syncMissionData: () => {
          const { currentPlayerId } = get();
          if (!currentPlayerId) return;

          try {
            const missionData = localMissionService.initialize(currentPlayerId);

            set({
              missions: missionData.missions,
              activeMission: missionData.activeMission,
              completedMissions: missionData.completedMissions,
              missionProgress: missionData.missionProgress,
            });
          } catch (error) {}
        },

        // Get last sync timestamp
        getLastSyncTimestamp: () => {
          try {
            const data = localStorage.getItem("g-bax-missions");
            if (data) {
              const parsed = JSON.parse(data) as LocalMissionData;
              return parsed.lastSyncTimestamp;
            }
          } catch (error) {}
          return null;
        },
      }),
      {
        name: "local-mission-store",
        partialize: (state) => ({
          // Only persist essential data, let the service handle the rest
          currentPlayerId: state.currentPlayerId,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    {
      name: "local-mission-store",
    }
  )
);
