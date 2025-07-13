import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Game state types
export interface Player {
  id: string;
  name: string;
  level: number;
  experience: number;
  position: [number, number, number];
  credits: number;
}

export interface Resource {
  id: string;
  name: string;
  type: 'crystal' | 'metal' | 'energy';
  quantity: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: 'mining' | 'crafting' | 'exploration';
  status: 'available' | 'active' | 'completed';
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
  currentScene: 'menu' | 'space' | 'crafting' | 'missions';

  // Actions
  setPlayer: (player: Player) => void;
  updatePlayerPosition: (position: [number, number, number]) => void;
  updatePlayerExperience: (experience: number) => void;
  setInventory: (inventory: Resource[]) => void;
  addResource: (resource: Resource) => void;
  removeResource: (resourceId: string, quantity: number) => void;
  setMissions: (missions: Mission[]) => void;
  setActiveMission: (mission: Mission | null) => void;
  updateMissionProgress: (missionId: string, progress: number) => void;
  setCurrentScene: (scene: GameState['currentScene']) => void;
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
        currentScene: 'menu',

        // Actions
        setPlayer: (player) => set({ player }),

        updatePlayerPosition: (position) =>
          set((state) => ({
            player: state.player ? { ...state.player, position } : null,
          })),

        updatePlayerExperience: (experienceGained) =>
          set((state) => {
            if (!state.player) return state;

            const newExperience = state.player.experience + experienceGained;
            const newLevel = Math.floor(newExperience / 1000) + 1; // Level up every 1000 XP

            return {
              player: {
                ...state.player,
                experience: newExperience,
                level: Math.max(state.player.level, newLevel)
              }
            };
          }),

        setInventory: (inventory) => set({ inventory }),

        addResource: (resource) =>
          set((state) => {
            const existingResource = state.inventory.find(
              (r) => r.id === resource.id
            );

            if (existingResource) {
              return {
                inventory: state.inventory.map((r) =>
                  r.id === resource.id
                    ? { ...r, quantity: r.quantity + resource.quantity }
                    : r
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
                  : r
              )
              .filter((r) => r.quantity > 0),
          })),

        setMissions: (missions) => set({ missions }),

        setActiveMission: (mission) => set({ activeMission: mission }),

        updateMissionProgress: (missionId, progress) =>
          set((state) => ({
            missions: state.missions.map((m) =>
              m.id === missionId ? { ...m, progress } : m
            ),
            activeMission:
              state.activeMission?.id === missionId
                ? { ...state.activeMission, progress }
                : state.activeMission,
          })),

        setCurrentScene: (scene) => set({ currentScene: scene }),

        setLoading: (loading) => set({ isLoading: loading }),

        reset: () => set({
          player: null,
          inventory: [],
          missions: [],
          activeMission: null,
          isLoading: false,
          currentScene: 'menu',
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
          localStorage.setItem('g-bax-game-progress', JSON.stringify(gameData));
        },

        loadProgress: () => {
          // This method is now handled by useProgressSync hook
          // to prevent infinite loops
        },
      }),
      {
        name: 'g-bax-game-storage',
        partialize: (state) => ({
          player: state.player,
          inventory: state.inventory,
          missions: state.missions,
          activeMission: state.activeMission,
          currentScene: state.currentScene,
        }),
      }
    ),
    {
      name: 'g-bax-game-store',
    }
  )
);

// Export reset function for external use
export const resetGameStore = () => {
  useGameStore.getState().reset();
  // Also clear the persisted storage
  localStorage.removeItem('g-bax-game-storage');
  localStorage.removeItem('g-bax-game-progress');
};
