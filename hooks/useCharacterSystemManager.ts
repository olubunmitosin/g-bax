"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { useHoneycombStore } from "@/stores/honeycombStore";

/**
 * Hook to manage Honeycomb character system initialization and management
 */
export function useCharacterSystemManager() {
  const { publicKey, connected } = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const {
    honeycombService,
    isConnected: honeycombConnected,
    assemblerConfig,
    characterModel,
    playerCharacter,
    isCharacterSystemInitialized,
    isLoadingCharacter,
    initializeCharacterSystem,
    createPlayerCharacter,
    loadPlayerCharacter,
    assignTraitToCharacter,
    getCharacterSystemStatus,
  } = useHoneycombStore();

  // Disable character system initialization to avoid blockchain issues
  const needsInitialization = false;

  // Simplified character check to prevent blinking
  const needsCharacter = connected && !playerCharacter && !isLoadingCharacter;

  // Initialize character system
  const initializeSystem = async (contextWallet?: any) => {
    if (!publicKey || !honeycombService || isInitializing) {
      return false;
    }

    setIsInitializing(true);
    setInitializationError(null);

    try {
      console.log("Starting character system initialization...");

      await initializeCharacterSystem(publicKey, contextWallet);

      console.log("Character system initialization completed successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize character system:", error);
      setInitializationError(error instanceof Error ? error.message : "Unknown error");
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Create character for player
  const createCharacter = async (
    initialTraits: string[][] = [],
    contextWallet?: any,
  ) => {
    if (!publicKey || !honeycombService) {
      return false;
    }

    try {
      console.log("Creating player character...");

      await createPlayerCharacter(publicKey, initialTraits, contextWallet);

      console.log("Player character created successfully");
      return true;
    } catch (error) {
      console.error("Failed to create player character:", error);
      return false;
    }
  };

  // Assign trait to player character
  const assignTrait = async (
    traitCategory: string,
    traitName: string,
    contextWallet?: any,
  ) => {
    if (!publicKey || !playerCharacter) {
      return false;
    }

    try {
      console.log(`Assigning trait: ${traitCategory} - ${traitName}`);

      await assignTraitToCharacter(
        playerCharacter.address,
        publicKey,
        traitCategory,
        traitName,
        contextWallet,
      );

      console.log("Trait assigned successfully");
      return true;
    } catch (error) {
      console.error("Failed to assign trait:", error);
      return false;
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
    const systemStatus = getCharacterSystemStatus();
    return {
      ...systemStatus,
      needsInitialization,
      needsCharacter,
      isInitializing,
      error: initializationError,
      canInitialize: connected && honeycombConnected && publicKey && !isInitializing,
      hasCharacter: !!playerCharacter,
    };
  };

  // Get available trait categories and names
  const getAvailableTraits = () => {
    return {
      Mining: ["Novice Miner", "Expert Miner", "Master Miner"],
      Crafting: ["Apprentice Crafter", "Skilled Artisan", "Master Crafter"],
      Exploration: ["Space Navigator", "Deep Explorer", "Void Walker"],
      Combat: ["Defender", "Warrior", "Champion"],
      Leadership: ["Team Player", "Squad Leader", "Guild Master"],
    };
  };

  // Get trait benefits
  const getTraitBenefits = useCallback((category: string, name: string) => {
    const benefits: Record<string, Record<string, any>> = {
      Mining: {
        "Novice Miner": { miningBonus: 5, description: "+5% mining efficiency" },
        "Expert Miner": { miningBonus: 15, description: "+15% mining efficiency" },
        "Master Miner": { miningBonus: 30, description: "+30% mining efficiency" },
      },
      Crafting: {
        "Apprentice Crafter": { craftingBonus: 5, description: "+5% crafting speed" },
        "Skilled Artisan": { craftingBonus: 15, description: "+15% crafting speed" },
        "Master Crafter": { craftingBonus: 30, description: "+30% crafting speed" },
      },
      Exploration: {
        "Space Navigator": { explorationBonus: 5, description: "+5% exploration rewards" },
        "Deep Explorer": { explorationBonus: 15, description: "+15% exploration rewards" },
        "Void Walker": { explorationBonus: 30, description: "+30% exploration rewards" },
      },
      Combat: {
        "Defender": { combatBonus: 5, description: "+5% combat effectiveness" },
        "Warrior": { combatBonus: 15, description: "+15% combat effectiveness" },
        "Champion": { combatBonus: 30, description: "+30% combat effectiveness" },
      },
      Leadership: {
        "Team Player": { leadershipBonus: 5, description: "+5% team bonuses" },
        "Squad Leader": { leadershipBonus: 15, description: "+15% team bonuses" },
        "Guild Master": { leadershipBonus: 30, description: "+30% team bonuses" },
      },
    };

    return benefits[category]?.[name] || { description: "Unknown trait" };
  }, []);

  return {
    // Status
    isInitializing,
    needsInitialization,
    needsCharacter,
    error: initializationError,
    status: getStatus(),

    // Actions
    initializeSystem,
    createCharacter,
    assignTrait,

    // Data
    assemblerConfig,
    characterModel,
    playerCharacter,
    isCharacterSystemInitialized,
    isLoadingCharacter,

    // Helpers
    getAvailableTraits,
    getTraitBenefits,
  };
}
