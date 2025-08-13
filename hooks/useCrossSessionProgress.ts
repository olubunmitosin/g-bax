"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";

/**
 * Hook to manage cross-session progress persistence
 * Ensures player progress is fully recoverable from blockchain across different devices and sessions
 */
export function useCrossSessionProgress() {
  const { publicKey, connected } = useWallet();
  const { player, setPlayer, inventory, missions, activeMission } = useGameStore();
  const {
    honeycombService,
    isConnected: honeycombConnected,
    loadCompletePlayerProgress,
    saveCompletePlayerProgress,
    syncProgressWithBlockchain,
    getProgressSyncStatus,
  } = useHoneycombStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [syncConflicts, setSyncConflicts] = useState<string[]>([]);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Get current local progress data
  const getLocalProgress = useCallback(() => {
    if (!player) return null;

    return {
      id: player.id,
      name: player.name,
      level: player.level,
      experience: player.experience,
      credits: player.credits,
      position: player.position,
      stats: player.stats || {},
      inventory: inventory || [],
      missions: missions || [],
      activeMission: activeMission || null,
      lastUpdated: Date.now(),
    };
  }, [player, inventory, missions, activeMission]);

  // Save local progress to localStorage
  const saveLocalProgress = useCallback(() => {
    if (!publicKey || !player) return;

    const progressData = getLocalProgress();
    if (progressData) {
      const localKey = `g-bax-progress-${publicKey.toString()}`;
      localStorage.setItem(localKey, JSON.stringify(progressData));
    }
  }, [publicKey, player, getLocalProgress]);

  // Load local progress from localStorage
  const loadLocalProgress = useCallback(() => {
    if (!publicKey) return null;

    try {
      const localKey = `g-bax-progress-${publicKey.toString()}`;
      const savedData = localStorage.getItem(localKey);

      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      // Failed to load local progress
    }

    return null;
  }, [publicKey]);

  // Load complete progress from blockchain
  const loadFromBlockchain = useCallback(async () => {
    if (!publicKey || !honeycombConnected) return null;

    setIsLoading(true);
    try {
      const blockchainProgress = await loadCompletePlayerProgress(publicKey);

      if (blockchainProgress && blockchainProgress.success) {return blockchainProgress;
      }

      return null;
    } catch (error) {return null;
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, honeycombConnected, loadCompletePlayerProgress]);

  // Save progress to blockchain
  const saveToBlockchain = useCallback(async (progressData?: any) => {
    if (!publicKey || !honeycombConnected) return false;

    const dataToSave = progressData || getLocalProgress();
    if (!dataToSave) return false;

    try {
      const success = await saveCompletePlayerProgress(publicKey, dataToSave);

      if (success) {
        setLastSyncTime(Date.now());}

      return success;
    } catch (error) {return false;
    }
  }, [publicKey, honeycombConnected, saveCompletePlayerProgress, getLocalProgress]);

  // Sync local progress with blockchain
  const syncProgress = useCallback(async () => {
    if (!publicKey || !honeycombConnected || isSyncing) return null;

    const localProgress = getLocalProgress();
    if (!localProgress) return null;

    setIsSyncing(true);
    setSyncConflicts([]);

    try {
      const syncResult = await syncProgressWithBlockchain(publicKey, localProgress);

      if (syncResult && syncResult.success) {
        // Update local state with synced progress
        if (syncResult.syncedProgress) {
          setPlayer(syncResult.syncedProgress);
        }

        // Track conflicts
        if (syncResult.conflicts.length > 0) {
          setSyncConflicts(syncResult.conflicts);}

        setLastSyncTime(Date.now());}

      return syncResult;
    } catch (error) {return null;
    } finally {
      setIsSyncing(false);
    }
  }, [publicKey, honeycombConnected, isSyncing, getLocalProgress, syncProgressWithBlockchain]);

  // Initialize progress on wallet connection
  const initializeProgress = useCallback(async () => {
    if (!publicKey || !connected || !honeycombConnected) return;

    setIsLoading(true);
    try {
      // 1. Try to load from blockchain first
      const blockchainProgress = await loadFromBlockchain();

      if (blockchainProgress && blockchainProgress.profile) {
        // Use blockchain data as primary source
        const playerData = {
          id: publicKey.toString(),
          name: blockchainProgress.profile.name || `Explorer ${publicKey.toString().slice(0, 8)}`,
          level: blockchainProgress.profile.level || 1,
          experience: blockchainProgress.profile.experience || 0,
          credits: blockchainProgress.profile.credits || 1000,
          position: [0, 0, 0] as [number, number, number],
          stats: blockchainProgress.stats || {},
        };

        setPlayer(playerData);return;
      }

      // 2. Fallback to local progress
      const localProgress = loadLocalProgress();

      if (localProgress) {
        setPlayer(localProgress);// Sync local progress to blockchain
        setTimeout(() => {
          saveToBlockchain(localProgress);
        }, 2000);
        return;
      }

      // 3. Create new player
      const newPlayer = {
        id: publicKey.toString(),
        name: `Explorer ${publicKey.toString().slice(0, 8)}`,
        level: 1,
        experience: 0,
        credits: 1000,
        position: [0, 0, 0] as [number, number, number],
        stats: {},
      };

      setPlayer(newPlayer);// Save new player to blockchain
      setTimeout(() => {
        saveToBlockchain(newPlayer);
      }, 3000);

    } catch (error) {} finally {
      setIsLoading(false);
    }
  }, [publicKey, connected, honeycombConnected, loadFromBlockchain, loadLocalProgress, saveToBlockchain]);

  // Auto-save local progress when player data changes
  useEffect(() => {
    if (player && publicKey) {
      saveLocalProgress();
    }
  }, [player, publicKey, saveLocalProgress]);

  // Auto-sync with blockchain periodically
  useEffect(() => {
    if (!autoSyncEnabled || !publicKey || !honeycombConnected || !player) return;

    const syncInterval = setInterval(() => {
      const status = getProgressSyncStatus(publicKey);

      if (status.needsSync) {
        syncProgress();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(syncInterval);
  }, [autoSyncEnabled, publicKey, honeycombConnected, getProgressSyncStatus, syncProgress]);

  // Initialize progress when wallet connects
  useEffect(() => {
    if (connected && honeycombConnected && publicKey && !player) {
      const timer = setTimeout(() => {
        initializeProgress();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [connected, honeycombConnected, publicKey, player, initializeProgress]);

  // Get sync status
  const getSyncStatus = useCallback(() => {
    if (!publicKey) {
      return {
        hasLocalProgress: false,
        hasBlockchainProgress: false,
        lastSyncTime: 0,
        needsSync: false,
      };
    }

    return getProgressSyncStatus(publicKey);
  }, [publicKey, getProgressSyncStatus]);

  // Clear all progress data
  const clearAllProgress = useCallback(() => {
    if (!publicKey) return;

    // Clear local storage
    const localKey = `g-bax-progress-${publicKey.toString()}`;
    const syncKey = `g-bax-sync-${publicKey.toString()}`;
    localStorage.removeItem(localKey);
    localStorage.removeItem(syncKey);

    // Reset state
    setSyncConflicts([]);
    setLastSyncTime(0);}, [publicKey]);

  return {
    // State
    isLoading,
    isSyncing,
    lastSyncTime,
    syncConflicts,
    autoSyncEnabled,

    // Actions
    loadFromBlockchain,
    saveToBlockchain,
    syncProgress,
    initializeProgress,
    clearAllProgress,
    setAutoSyncEnabled,

    // Status
    syncStatus: getSyncStatus(),
    hasConflicts: syncConflicts.length > 0,
    canSync: !!(publicKey && honeycombConnected && player),
  };
}
