import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

import { getLevelFromExperience } from "@/utils/gameHelpers";

// Game state types
export interface Player {
  id: string;
  name: string;
  bio: string;
  address: string;
  createdAt: string;
  lastUpdated: string;
  pfp: string;
  profileAddress: string;
  projectAddress: string;
  profileTreeAddress: string;
  source: string;
  level: number;
  experience: number;
  position: [number, number, number];
  credits: number;
  stats?: {
    miningOperations?: number;
    itemsCrafted?: number;
    sectorsExplored?: number;
    combatWins?: number;
    leadershipActions?: number;
    missionsCompleted?: number;
    traitCategories?: number;
    achievements?: number;
  };
}

export interface Resource {
  id: string;
  name: string;
  type: "crystal" | "metal" | "energy";
  quantity: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: "mining" | "crafting" | "exploration";
  status: "available" | "active" | "completed" | "locked";
  rewards: {
    experience: number;
    credits: number;
    resources?: Resource[];
  };
  progress: number;
  maxProgress: number;
}

export interface GameState {
  // Player data
  player: Player | null;

  // Inventory
  inventory: Resource[];

  // Missions
  missions: Mission[];
  activeMission: Mission | null;

  // Game state
  isLoading: boolean;
  currentScene: "menu" | "space" | "crafting" | "missions";

  // Actions
  setPlayer: (player: Player | null) => void;
  updatePlayerPosition: (position: [number, number, number]) => void;
  updatePlayerExperience: (experience: number) => void;
  setInventory: (inventory: Resource[]) => void;
  addResource: (resource: Resource) => void;
  removeResource: (resourceId: string, quantity: number) => void;
  setMissions: (missions: Mission[]) => void;
  setActiveMission: (mission: Mission | null) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  setCurrentScene: (scene: GameState["currentScene"]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
  saveProgress: () => void;
  loadProgress: () => void;
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        player: null,
        inventory: [],
        missions: [],
        activeMission: null,
        isLoading: false,
        currentScene: "menu",

        // Actions
        setPlayer: (player) => {
          if (player) {
            // Ensure level is calculated correctly from experience
            const correctedLevel = getLevelFromExperience(player.experience);
            const correctedPlayer = { ...player, level: correctedLevel };

            set({ player: correctedPlayer });
          } else {
            set({ player });
          }
        },

        updatePlayerPosition: (position) =>
          set((state) => ({
            player: state.player ? { ...state.player, position } : null,
          })),

        updatePlayerExperience: (experienceGained) =>
          set((state) => {
            if (!state.player) return state;

            const newExperience = state.player.experience + experienceGained;
            const newLevel = getLevelFromExperience(newExperience);

            return {
              player: {
                ...state.player,
                experience: newExperience,
                level: newLevel,
              },
            };
          }),

        setInventory: (inventory) => set({ inventory }),

        addResource: (resource) =>
          set((state) => {
            const existingResource = state.inventory.find(
              (r) => r.id === resource.id,
            );

            if (existingResource) {
              return {
                inventory: state.inventory.map((r) =>
                  r.id === resource.id
                    ? { ...r, quantity: r.quantity + resource.quantity }
                    : r,
                ),
              };
            }

            return {
              inventory: [...state.inventory, resource],
            };
          }),

        removeResource: (resourceId, quantity) =>
          set((state) => ({
            inventory: state.inventory
              .map((r) =>
                r.id === resourceId
                  ? { ...r, quantity: Math.max(0, r.quantity - quantity) }
                  : r,
              )
              .filter((r) => r.quantity > 0),
          })),

        setMissions: (missions) => set({ missions }),

        setActiveMission: (mission) => set({ activeMission: mission }),

        updateMissionProgress: (missionId, progress) =>
          set((state) => {
            const updatedMissions = state.missions.map((m) =>
              m.id === missionId
                ? {
                    ...m,
                    progress,
                    status:
                      progress >= m.maxProgress
                        ? ("completed" as const)
                        : m.status,
                  }
                : m,
            );

            const updatedMission = updatedMissions.find(
              (m) => m.id === missionId,
            );
            let newActiveMission = state.activeMission;

            if (state.activeMission?.id === missionId) {
              if (updatedMission && updatedMission.status === "completed") {
                // Clear active mission if completed
                newActiveMission = null;
              } else if (updatedMission) {
                // Update active mission progress
                newActiveMission = { ...updatedMission };
              }
            }

            return {
              missions: updatedMissions,
              activeMission: newActiveMission,
            };
          }),

        setCurrentScene: (scene) => set({ currentScene: scene }),

        setLoading: (loading) => set({ isLoading: loading }),

        reset: () =>
          set({
            player: null,
            inventory: [],
            missions: [],
            activeMission: null,
            isLoading: false,
            currentScene: "menu",
          }),

        saveProgress: () => {
          const state = get();
          const gameData = {
            player: state.player,
            inventory: state.inventory,
            missions: state.missions,
            activeMission: state.activeMission,
            currentScene: state.currentScene,
            lastSaved: new Date().toISOString(),
          };

          localStorage.setItem("g-bax-game-progress", JSON.stringify(gameData));
        },

        loadProgress: () => {
          // This method is now handled by useProgressSync hook
          // to prevent infinite loops
        },
      }),
      {
        name: "g-bax-game-storage",
        partialize: (state) => ({
          player: state.player,
          inventory: state.inventory,
          missions: state.missions,
          activeMission: state.activeMission,
          currentScene: state.currentScene,
        }),
      },
    ),
    {
      name: "g-bax-game-store",
    },
  ),
);

// Export reset function for external use
export const resetGameStore = () => {
  useGameStore.getState().reset();
  // Also clear the persisted storage
  localStorage.removeItem("g-bax-game-storage");
  localStorage.removeItem("g-bax-game-progress");
};
