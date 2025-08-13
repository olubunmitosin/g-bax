"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { useLocalCharacterIntegration } from "@/hooks/useLocalCharacterIntegration";

/**
 * Hook to manage local character system initialization and management
 * Replaces Honeycomb character system with local functionality
 */
export function useCharacterSystemManager() {
  const { publicKey, connected } = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const {
    activeCharacter: playerCharacter,
    isReady: isCharacterSystemInitialized,
    isLoading: isLoadingCharacter,
    needsCharacter,
    createCharacter,
    assignTrait,
    getAvailableTraitsForCharacter,
    getTraitBenefits,
    getCharacterStats,
    resetAllCharacters,
  } = useLocalCharacterIntegration();

  // Local character system doesn't need initialization
  const needsInitialization = false;

  // needsCharacter is provided by the local character integration

  // Initialize character system (local system initializes automatically)
  const initializeSystem = async () => {return true;
  };

  // Create character for player (using local system)
  const createCharacterForPlayer = async (
    initialTraits: string[][] = [],
    characterName: string = "Space Explorer"
  ) => {
    try {await createCharacter(characterName, initialTraits);return true;
    } catch (error) {return false;
    }
  };

  // Assign trait to player character (using local system)
  const assignTraitToPlayer = async (
    traitCategory: string,
    traitName: string
  ) => {
    if (!playerCharacter) {
      return false;
    }

    try {await assignTrait(traitCategory, traitName);return true;
    } catch (error) {return false;
    }
  };

  // Disabled auto-initialization to prevent blinking and concurrent refetching
  // useEffect(() => {
  //   if (needsInitialization && !isInitializing) {
  //     const timer = setTimeout(() => {
  //       initializeSystem();
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [needsInitialization, isInitializing]);

  // Disabled auto-loading to prevent blinking and concurrent refetching
  // useEffect(() => {
  //   if (isCharacterSystemInitialized && publicKey && !playerCharacter && !isLoadingCharacter) {
  //     const timer = setTimeout(() => {
  //       loadPlayerCharacter(publicKey);
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isCharacterSystemInitialized, publicKey, playerCharacter, isLoadingCharacter]);

  // Get current status
  const getStatus = () => {
    return {
      isInitialized: isCharacterSystemInitialized,
      needsInitialization,
      needsCharacter,
      isInitializing,
      error: initializationError,
      canInitialize: connected && publicKey && !isInitializing,
      hasCharacter: !!playerCharacter,
    };
  };

  // Get available trait categories and names (using local system)
  const getAvailableTraitsForPlayer = () => {
    if (!playerCharacter) return {};

    const availableTraits = getAvailableTraitsForCharacter();
    const grouped: Record<string, string[]> = {};

    availableTraits.forEach(trait => {
      const category = trait.category.charAt(0).toUpperCase() + trait.category.slice(1);
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(trait.name);
    });

    return grouped;
  };

  // getTraitBenefits is provided by useLocalCharacterIntegration

  return {
    // Status
    isInitializing,
    needsInitialization,
    needsCharacter,
    error: initializationError,
    status: getStatus(),

    // Actions
    initializeSystem,
    createCharacter: createCharacterForPlayer,
    assignTrait: assignTraitToPlayer,

    // Data
    playerCharacter,
    isCharacterSystemInitialized,
    isLoadingCharacter,

    // Helpers
    getAvailableTraits: getAvailableTraitsForPlayer,
    getTraitBenefits,
  };
}
