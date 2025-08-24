"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { useGameStore } from "@/stores/gameStore";
import { useHoneycombStore } from "@/stores/honeycombStore";
import backendHoneycombService from "@/services/backendHoneycombService";
import { getLevelFromExperience } from "@/utils/gameHelpers";

/**
 * Hook for managing player stats with hybrid database system
 * Replaces direct localStorage and in-memory stat modifications
 */
export function usePlayerStats() {
  const { publicKey } = useWallet();
  const { player, setPlayer } = useGameStore();
  const honeycombStore = useHoneycombStore();

  /**
   * Update player stats in database and sync with stores
   */
  const updatePlayerStats = useCallback(async (
    stats: {
      credits?: number;
      level?: number;
      experience?: number;
      reputation?: number;
    },
    description?: string
  ) => {
    if (!publicKey || !player) {
      return false;
    }

    try {
      // Update stats in database via backend API
      const updatedStats = await backendHoneycombService.updatePlayerStats(
        publicKey,
        stats
      );

      if (updatedStats) {
        // Update game store
        const updatedPlayer = {
          ...player,
          credits: updatedStats.credits || player.credits,
          level: updatedStats.level || player.level,
          experience: updatedStats.experience || player.experience,
        };

        setPlayer(updatedPlayer);

        // Update honeycomb store if profile exists
        if (honeycombStore.playerProfile) {
          honeycombStore.updatePlayerProfileStats({
            credits: updatedStats.credits,
            level: updatedStats.level,
            experience: updatedStats.experience,
            reputation: updatedStats.reputation,
          });
        }

        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }, [publicKey, player, honeycombStore, setPlayer]);

  /**
   * Add credits to player
   */
  const addCredits = useCallback(async (amount: number, description?: string) => {
    if (!player) return false;

    const newCredits = Math.max(0, player.credits + amount);
    return await updatePlayerStats({ credits: newCredits }, description || `Credits ${amount > 0 ? 'gained' : 'spent'}: ${Math.abs(amount)}`);
  }, [player, updatePlayerStats]);

  /**
   * Add experience to player (automatically calculates level)
   */
  const addExperience = useCallback(async (amount: number, description?: string) => {
    if (!player) return false;

    const newExperience = Math.max(0, player.experience + amount);
    const newLevel = getLevelFromExperience(newExperience);

    return await updatePlayerStats(
      {
        experience: newExperience,
        level: newLevel
      },
      description || `Experience gained: ${amount}`
    );
  }, [player, updatePlayerStats]);

  /**
   * Set player level (automatically calculates experience if needed)
   */
  const setLevel = useCallback(async (level: number, description?: string) => {
    if (!player) return false;

    const newLevel = Math.max(1, level);
    // Keep current experience if it's appropriate for the level, otherwise set minimum for level
    const minExperienceForLevel = (newLevel - 1) * 1000;
    const newExperience = Math.max(minExperienceForLevel, player.experience);

    return await updatePlayerStats(
      {
        level: newLevel,
        experience: newExperience
      },
      description || `Level set to: ${newLevel}`
    );
  }, [player, updatePlayerStats]);

  /**
   * Add reputation to player
   */
  const addReputation = useCallback(async (amount: number, description?: string) => {
    if (!player) return false;

    // Get current reputation from profile or default to 0
    const currentReputation = honeycombStore.playerProfile?.reputation || 0;
    const newReputation = Math.max(0, currentReputation + amount);

    return await updatePlayerStats(
      { reputation: newReputation },
      description || `Reputation ${amount > 0 ? 'gained' : 'lost'}: ${Math.abs(amount)}`
    );
  }, [player, honeycombStore.playerProfile, updatePlayerStats]);

  /**
   * Set specific stat values
   */
  const setCredits = useCallback(async (amount: number, description?: string) => {
    const newCredits = Math.max(0, amount);
    return await updatePlayerStats({ credits: newCredits }, description || `Credits set to: ${newCredits}`);
  }, [updatePlayerStats]);

  const setExperience = useCallback(async (amount: number, description?: string) => {
    const newExperience = Math.max(0, amount);
    const newLevel = getLevelFromExperience(newExperience);
    return await updatePlayerStats(
      {
        experience: newExperience,
        level: newLevel
      },
      description || `Experience set to: ${newExperience}`
    );
  }, [updatePlayerStats]);

  const setReputation = useCallback(async (amount: number, description?: string) => {
    const newReputation = Math.max(0, amount);
    return await updatePlayerStats({ reputation: newReputation }, description || `Reputation set to: ${newReputation}`);
  }, [updatePlayerStats]);

  /**
   * Get current player stats
   */
  const getCurrentStats = useCallback(() => {
    if (!player) return null;

    return {
      credits: player.credits,
      level: player.level,
      experience: player.experience,
      reputation: honeycombStore.playerProfile?.reputation || 0,
    };
  }, [player, honeycombStore.playerProfile]);

  /**
   * Check if player can afford something
   */
  const canAfford = useCallback((cost: number) => {
    return player ? player.credits >= cost : false;
  }, [player]);

  return {
    // Main update function
    updatePlayerStats,

    // Convenience functions for specific stats
    addCredits,
    addExperience,
    addReputation,
    setCredits,
    setExperience,
    setLevel,
    setReputation,

    // Utility functions
    getCurrentStats,
    canAfford,

    // Status
    isReady: !!publicKey && !!player,
  };
}
