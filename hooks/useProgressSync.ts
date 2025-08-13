"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useGameStore } from "@/stores/gameStore";
import { useVerxioStore, resetVerxioStore } from "@/stores/verxioStore";
import { useHoneycombStore } from "@/stores/honeycombStore";
// import { useCrossSessionProgress } from "./useCrossSessionProgress";
import { resetItemEffectsStore } from "@/stores/itemEffectsStore";

/**
 * Hook to automatically sync game progress to localStorage and blockchain
 */
export function useProgressSync() {
  const { connected, publicKey } = useWallet();
  const contextWallet = useWallet();
  const gameState = useGameStore();
  const verxioState = useVerxioStore();
  const honeycombState = useHoneycombStore();
  // Cross-session progress hook available if needed
  // const { initializeProgress, syncProgress } = useCrossSessionProgress();

  const lastSaveRef = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!gameState.player) return;

    const autoSave = () => {
      gameState.saveProgress();
    };

    // Save immediately when state changes (debounced)
    const now = Date.now();

    if (now - lastSaveRef.current > 5000) {
      // Debounce to 5 seconds
      lastSaveRef.current = now;
      autoSave();
    }

    // Set up interval for regular saves
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(autoSave, 30000); // Every 30 seconds

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [
    gameState.player?.id, // Only track player ID to avoid infinite loops
    gameState.inventory.length,
    gameState.missions.length,
    gameState.activeMission?.id,
  ]);

  // Note: Player progress loading is now handled automatically by other hooks

  // Clear all data when wallet disconnects
  useEffect(() => {
    const currentPlayer = gameState.player;

    if (!connected && currentPlayer) {
      // Save final progress to blockchain before clearing
      syncToBlockchain();

      // Save to localStorage as backup (with a wallet-specific key)
      const walletSpecificKey = `g-bax-game-progress-${currentPlayer.id}`;
      const gameData = {
        player: currentPlayer,
        inventory: gameState.inventory,
        missions: gameState.missions,
        activeMission: gameState.activeMission,
        currentScene: gameState.currentScene,
        lastSaved: new Date().toISOString(),
      };

      localStorage.setItem(walletSpecificKey, JSON.stringify(gameData));

      // Clear all game states
      gameState.reset();

      // Clear general localStorage data
      localStorage.removeItem("g-bax-game-progress");

      // Clear Verxio state and localStorage
      resetVerxioStore();

      // Clear item effects and localStorage
      resetItemEffectsStore();
    }
  }, [connected]);

  // Save progress before page unloaded
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameState.player) {
        gameState.saveProgress();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameState]);

  // Sync with blockchain when connected
  useEffect(() => {
    if (
      connected &&
      publicKey &&
      honeycombState.isConnected &&
      gameState.player
    ) {
      // Sync player progress to blockchain
      syncToBlockchain();
    }
  }, [
    connected,
    publicKey,
    honeycombState.isConnected,
    gameState.player?.experience,
    gameState.player?.level,
  ]);

  // Function to sync progress to blockchain
  const syncToBlockchain = async () => {
    if (
      !connected ||
      !publicKey ||
      !honeycombState.honeycombService ||
      !gameState.player
    )
      return;

    try {
      // Update player experience on blockchain
      await honeycombState.updateChainPlayerExperience(
        publicKey,
        gameState.player.experience,
        contextWallet,
      );

      // Update mission progress using local mission service
      if (gameState.activeMission) {
        const { localMissionService } = await import("@/services/localMissionService");
        try {
          localMissionService.updateMissionProgress(
            publicKey.toString(),
            gameState.activeMission.id,
            gameState.activeMission.progress,
          );
        } catch (error) {
          console.warn("Failed to update local mission progress:", error);
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // Silently handle blockchain sync errors
    }
  };

  return {
    isConnected: connected,
    hasProgress: !!gameState.player,
    lastSaved: lastSaveRef.current,
    saveNow: () => {
      if (gameState.player) {
        gameState.saveProgress();
        lastSaveRef.current = Date.now();
      }
    },
    loadProgress: () => {
      // Manual load progress implementation
      const saved = localStorage.getItem("g-bax-game-progress");

      if (saved && connected && publicKey) {
        try {
          const gameData = JSON.parse(saved);

          if (gameData.player && gameData.player.id === publicKey.toString()) {
            gameState.setPlayer(gameData.player);
            gameState.setInventory(gameData.inventory || []);
            gameState.setMissions(gameData.missions || []);
            if (gameData.activeMission) {
              gameState.setActiveMission(gameData.activeMission);
            }
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) { }
      }
    },
    resetProgress: () => {
      gameState.reset();
      verxioState.reset();
      honeycombState.reset();

      // Clear localStorage
      const keysToRemove = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (
          key &&
          (key.startsWith("g-bax-") ||
            key.startsWith("verxio_") ||
            key.startsWith("honeycomb_"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    },
  };
}
