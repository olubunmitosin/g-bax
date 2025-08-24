"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useGameStore } from "@/stores/gameStore";
import { usePlayerStats } from "./usePlayerStats";

/**
 * Hook for auto-saving player progress to database
 * Replaces localStorage-only auto-save with database persistence
 */
export function useAutoSave() {
  const { publicKey, connected } = useWallet();
  const { player } = useGameStore();
  const { updatePlayerStats, getCurrentStats } = usePlayerStats();
  
  const lastSaveRef = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSaveRef = useRef<boolean>(false);

  /**
   * Save current player stats to database
   */
  const savePlayerStats = useCallback(async () => {
    if (!connected || !publicKey || !player || pendingSaveRef.current) {
      return false;
    }

    try {
      pendingSaveRef.current = true;
      
      const currentStats = getCurrentStats();
      if (!currentStats) {
        return false;
      }

      // Save all current stats to database
      const success = await updatePlayerStats(
        {
          credits: currentStats.credits,
          level: currentStats.level,
          experience: currentStats.experience,
          reputation: currentStats.reputation,
        },
        "Auto-save"
      );

      if (success) {
        lastSaveRef.current = Date.now();
        console.log("Auto-save completed successfully");
        return true;
      } else {
        console.warn("Auto-save failed");
        return false;
      }
    } catch (error) {
      console.error("Auto-save error:", error);
      return false;
    } finally {
      pendingSaveRef.current = false;
    }
  }, [connected, publicKey, player, getCurrentStats, updatePlayerStats]);

  /**
   * Debounced save function
   */
  const debouncedSave = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSave = now - lastSaveRef.current;
    
    // Debounce to prevent too frequent saves (minimum 10 seconds between saves)
    if (timeSinceLastSave < 10000) {
      return;
    }

    savePlayerStats();
  }, [savePlayerStats]);

  /**
   * Manual save function for immediate saves
   */
  const saveNow = useCallback(async () => {
    return await savePlayerStats();
  }, [savePlayerStats]);

  // Set up auto-save interval
  useEffect(() => {
    if (!connected || !publicKey || !player) {
      // Clear interval if not connected
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
      return;
    }

    // Set up auto-save every 30 seconds
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(() => {
      debouncedSave();
    }, 30000); // 30 seconds

    // Cleanup on unmount or dependency change
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [connected, publicKey, player, debouncedSave]);

  // Save when player stats change (debounced)
  useEffect(() => {
    if (player && connected && publicKey) {
      debouncedSave();
    }
  }, [
    player?.credits,
    player?.level,
    player?.experience,
    connected,
    publicKey,
    debouncedSave,
  ]);

  // Save when wallet disconnects (immediate)
  useEffect(() => {
    if (!connected && lastSaveRef.current > 0) {
      // Save immediately when disconnecting
      savePlayerStats();
    }
  }, [connected, savePlayerStats]);

  // Save when page is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (connected && publicKey && player) {
        // Attempt synchronous save (may not complete)
        savePlayerStats();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [connected, publicKey, player, savePlayerStats]);

  return {
    saveNow,
    isAutoSaveEnabled: connected && !!publicKey && !!player,
    lastSaveTime: lastSaveRef.current,
    isPendingSave: pendingSaveRef.current,
  };
}
