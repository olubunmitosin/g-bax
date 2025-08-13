/**
 * Local Character Store
 * Zustand store for managing characters and traits using local storage
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { TraitDefinition } from "@/data/traits";
import {
  localCharacterService,
  type LocalCharacter,
  type LocalCharacterTrait,
  type LocalCharacterData
} from "@/services/localCharacterService";

export interface LocalCharacterState {
  // Character data
  characters: Record<string, LocalCharacter>;
  activeCharacter: LocalCharacter | null;

  // Loading states
  isLoading: boolean;
  isInitialized: boolean;

  // Error handling
  error: string | null;

  // Player context
  currentPlayerId: string | null;

  // Actions
  initialize: (playerId: string) => Promise<void>;
  createCharacter: (playerId: string, characterName: string, initialTraits?: string[][]) => Promise<LocalCharacter>;
  loadPlayerCharacter: (playerId: string) => Promise<void>;
  assignTrait: (characterId: string, traitCategory: string, traitName: string) => Promise<LocalCharacter>;
  evolveTrait: (characterId: string, traitId: string, newTraitName?: string) => Promise<LocalCharacter>;
  addExperience: (characterId: string, experience: number) => Promise<LocalCharacter>;
  getAvailableTraits: (characterId: string) => TraitDefinition[];
  resetCharacters: () => Promise<void>;

  // Utility actions
  clearError: () => void;
  createBackup: () => void;
  restoreFromBackup: () => Promise<boolean>;

  // Sync actions
  syncCharacterData: () => void;
  getLastSyncTimestamp: () => string | null;
}

export const useLocalCharacterStore = create<LocalCharacterState>()(
  devtools(
    persist(
      (set, get): LocalCharacterState => ({
        // Initial state
        characters: {},
        activeCharacter: null,
        isLoading: false,
        isInitialized: false,
        error: null,
        currentPlayerId: null,

        // Initialize the character system
        initialize: async (playerId: string) => {
          set({ isLoading: true, error: null, currentPlayerId: playerId });

          try {
            const characterData = localCharacterService.initialize(playerId);

            // Load player's character if exists
            const playerCharacter = localCharacterService.getPlayerCharacter(playerId);

            set({
              characters: characterData.characters,
              activeCharacter: playerCharacter,
              isInitialized: true,
              isLoading: false,
            });
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to initialize characters",
              isLoading: false,
            });
          }
        },

        // Create a new character
        createCharacter: async (playerId: string, characterName: string, initialTraits: string[][] = []) => {
          set({ isLoading: true, error: null });

          try {
            const character = localCharacterService.createCharacter(playerId, characterName, initialTraits);

            set({
              characters: {
                ...get().characters,
                [character.id]: character,
              },
              activeCharacter: character,
              isLoading: false,
            });

            return character;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to create character";
            set({
              error: errorMessage,
              isLoading: false,
            });
            throw new Error(errorMessage);
          }
        },

        // Load player's character
        loadPlayerCharacter: async (playerId: string) => {
          set({ isLoading: true, error: null });

          try {
            const character = localCharacterService.getPlayerCharacter(playerId);

            set({
              activeCharacter: character,
              isLoading: false,
            });
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to load character",
              isLoading: false,
            });
          }
        },

        // Assign a trait to character
        assignTrait: async (characterId: string, traitCategory: string, traitName: string) => {
          try {
            const updatedCharacter = localCharacterService.assignTrait(characterId, traitCategory, traitName);

            set({
              characters: {
                ...get().characters,
                [characterId]: updatedCharacter,
              },
              activeCharacter: get().activeCharacter?.id === characterId ? updatedCharacter : get().activeCharacter,
            });

            return updatedCharacter;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to assign trait";
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Evolve a trait
        evolveTrait: async (characterId: string, traitId: string, newTraitName?: string) => {
          try {
            const updatedCharacter = localCharacterService.evolveTrait(characterId, traitId, newTraitName);

            set({
              characters: {
                ...get().characters,
                [characterId]: updatedCharacter,
              },
              activeCharacter: get().activeCharacter?.id === characterId ? updatedCharacter : get().activeCharacter,
            });

            return updatedCharacter;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to evolve trait";
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Add experience to character
        addExperience: async (characterId: string, experience: number) => {
          try {
            const updatedCharacter = localCharacterService.addExperience(characterId, experience);

            set({
              characters: {
                ...get().characters,
                [characterId]: updatedCharacter,
              },
              activeCharacter: get().activeCharacter?.id === characterId ? updatedCharacter : get().activeCharacter,
            });

            return updatedCharacter;
          } catch (error) {const errorMessage = error instanceof Error ? error.message : "Failed to add experience";
            set({ error: errorMessage });
            throw new Error(errorMessage);
          }
        },

        // Get available traits for character
        getAvailableTraits: (characterId: string) => {
          return localCharacterService.getAvailableTraitsForCharacter(characterId);
        },

        // Reset characters
        resetCharacters: async () => {
          set({ isLoading: true, error: null });

          try {
            const characterData = localCharacterService.resetCharacters();

            set({
              characters: characterData.characters,
              activeCharacter: null,
              isLoading: false,
            });
          } catch (error) {set({
              error: error instanceof Error ? error.message : "Failed to reset characters",
              isLoading: false,
            });
          }
        },

        // Clear error
        clearError: () => set({ error: null }),

        // Create backup
        createBackup: () => {
          try {
            localCharacterService.createBackup();
          } catch (error) {set({ error: "Failed to create backup" });
          }
        },

        // Restore from backup
        restoreFromBackup: async () => {
          set({ isLoading: true, error: null });

          try {
            const restoredData = localCharacterService.restoreFromBackup();

            if (restoredData) {
              const { currentPlayerId } = get();
              const playerCharacter = currentPlayerId
                ? localCharacterService.getPlayerCharacter(currentPlayerId)
                : null;

              set({
                characters: restoredData.characters,
                activeCharacter: playerCharacter,
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

        // Sync character data (for consistency across tabs)
        syncCharacterData: () => {
          const { currentPlayerId } = get();
          if (!currentPlayerId) return;

          try {
            const characterData = localCharacterService.initialize(currentPlayerId);
            const playerCharacter = localCharacterService.getPlayerCharacter(currentPlayerId);

            set({
              characters: characterData.characters,
              activeCharacter: playerCharacter,
            });
          } catch (error) {}
        },

        // Get last sync timestamp
        getLastSyncTimestamp: () => {
          try {
            const data = localStorage.getItem("g-bax-characters");
            if (data) {
              const parsed = JSON.parse(data) as LocalCharacterData;
              return parsed.lastSyncTimestamp;
            }
          } catch (error) {}
          return null;
        },
      }),
      {
        name: "local-character-store",
        partialize: (state) => ({
          // Only persist essential data, let the service handle the rest
          currentPlayerId: state.currentPlayerId,
          isInitialized: state.isInitialized,
        }),
      }
    ),
    {
      name: "local-character-store",
    }
  )
);
