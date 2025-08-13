/**
 * Local Character Integration Hook
 * Replaces Honeycomb character integration with local-only functionality
 */

import { useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocalCharacterStore } from "@/stores/localCharacterStore";
import { useGameStore } from "@/stores/gameStore";
import type { LocalCharacter, LocalCharacterTrait } from "@/services/localCharacterService";
import type { TraitDefinition } from "@/data/traits";

export function useLocalCharacterIntegration() {
  const { publicKey, connected } = useWallet();
  const { player } = useGameStore();

  const {
    characters,
    activeCharacter,
    isLoading,
    isInitialized,
    error,
    initialize,
    createCharacter: createLocalCharacter,
    loadPlayerCharacter,
    assignTrait: assignLocalTrait,
    evolveTrait: evolveLocalTrait,
    addExperience: addLocalExperience,
    getAvailableTraits,
    resetCharacters,
    clearError,
    syncCharacterData,
  } = useLocalCharacterStore();

  // Get player ID (use wallet public key or fallback)
  const getPlayerId = useCallback(() => {
    return publicKey?.toString() || "local-player";
  }, [publicKey]);

  // Initialize character system when wallet connects or player data is available
  useEffect(() => {
    const playerId = getPlayerId();

    if (!isInitialized && (connected || player)) {
      initialize(playerId);
    }
  }, [connected, player, isInitialized, initialize, getPlayerId]);

  // Load player character when initialized
  useEffect(() => {
    const playerId = getPlayerId();

    if (isInitialized && !activeCharacter) {
      loadPlayerCharacter(playerId);
    }
  }, [isInitialized, activeCharacter, loadPlayerCharacter, getPlayerId]);

  // Sync character data across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "g-bax-characters" && e.newValue) {
        syncCharacterData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncCharacterData]);

  // Create a new character
  const createCharacter = useCallback(async (
    characterName: string = "Space Explorer",
    initialTraits: string[][] = []
  ) => {
    const playerId = getPlayerId();

    try {
      const character = await createLocalCharacter(playerId, characterName, initialTraits);
      return character;
    } catch (error) {
      throw error;
    }
  }, [createLocalCharacter, getPlayerId]);

  // Assign a trait to the active character
  const assignTrait = useCallback(async (traitCategory: string, traitName: string) => {
    if (!activeCharacter) {
      throw new Error("No active character");
    }

    try {
      const updatedCharacter = await assignLocalTrait(activeCharacter.id, traitCategory, traitName);return updatedCharacter;
    } catch (error) {throw error;
    }
  }, [assignLocalTrait, activeCharacter]);

  // Evolve a trait
  const evolveTrait = useCallback(async (traitId: string, newTraitName?: string) => {
    if (!activeCharacter) {
      throw new Error("No active character");
    }

    try {
      const updatedCharacter = await evolveLocalTrait(activeCharacter.id, traitId, newTraitName);return updatedCharacter;
    } catch (error) {throw error;
    }
  }, [evolveLocalTrait, activeCharacter]);

  // Add experience to character
  const addExperience = useCallback(async (experience: number) => {
    if (!activeCharacter) {
      throw new Error("No active character");
    }

    try {
      const updatedCharacter = await addLocalExperience(activeCharacter.id, experience);
      return updatedCharacter;
    } catch (error) {
      throw error;
    }
  }, [addLocalExperience, activeCharacter]);

  // Get available traits for the active character
  const getAvailableTraitsForCharacter = useCallback(() => {
    if (!activeCharacter) return [];
    return getAvailableTraits(activeCharacter.id);
  }, [getAvailableTraits, activeCharacter]);

  // Check if character needs to be created
  const needsCharacter = !activeCharacter && isInitialized;

  // Check if character system is ready
  const isReady = isInitialized && !isLoading && !error;

  // Get character statistics
  const getCharacterStats = useCallback(() => {
    if (!activeCharacter) {
      return {
        level: 0,
        experience: 0,
        traitsCount: 0,
        totalBonuses: 0,
      };
    }

    const totalBonuses = Object.values(activeCharacter.bonuses).reduce((sum, bonus) => sum + bonus, 0);

    return {
      level: activeCharacter.level,
      experience: activeCharacter.experience,
      traitsCount: activeCharacter.traits.length,
      totalBonuses: Math.round(totalBonuses),
    };
  }, [activeCharacter]);

  // Get trait bonuses
  const getTraitBonuses = useCallback(() => {
    return activeCharacter?.bonuses || {
      miningBonus: 0,
      craftingBonus: 0,
      explorationBonus: 0,
      combatBonus: 0,
      leadershipBonus: 0,
      experienceBonus: 0,
    };
  }, [activeCharacter]);

  // Get trait by category and name
  const getTraitBenefits = useCallback((category: string, name: string) => {
    if (!activeCharacter) return { description: "No character" };

    const trait = activeCharacter.traits.find(
      t => t.category === category.toLowerCase() && t.name === name
    );

    if (!trait) return { description: "Trait not found" };

    const effectsDescription = Object.entries(trait.effects)
      .map(([effect, value]) => `${effect}: ${value}`)
      .join(", ");

    return {
      description: effectsDescription || "No effects",
      level: trait.level,
      experience: trait.experience,
      effects: trait.effects,
    };
  }, [activeCharacter]);

  // Check if a trait can be evolved
  const canEvolveTrait = useCallback((traitId: string) => {
    if (!activeCharacter) return false;

    const trait = activeCharacter.traits.find(t => t.id === traitId);
    if (!trait) return false;

    // Simple evolution check: can evolve if level < 5 and has enough experience
    return trait.level < 5 && trait.experience >= 100;
  }, [activeCharacter]);

  // Reset all characters (for testing or new player)
  const resetAllCharacters = useCallback(async () => {
    try {
      await resetCharacters();} catch (error) {throw error;
    }
  }, [resetCharacters]);

  return {
    // Character data
    characters,
    activeCharacter,

    // State
    isLoading,
    isInitialized,
    isReady,
    needsCharacter,
    error,

    // Actions
    createCharacter,
    assignTrait,
    evolveTrait,
    addExperience,
    resetAllCharacters,

    // Utilities
    getAvailableTraitsForCharacter,
    getCharacterStats,
    getTraitBonuses,
    getTraitBenefits,
    canEvolveTrait,
    clearError,

    // Player context
    playerId: getPlayerId(),
    isConnected: connected || !!player,
  };
}

// Export types for backward compatibility
export type { LocalCharacter, LocalCharacterTrait } from "@/services/localCharacterService";
export type { TraitDefinition } from "@/data/traits";
