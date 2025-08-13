/**
 * Local Mission Integration Hook
 * Replaces Honeycomb mission integration with local-only functionality
 */

import { useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocalMissionStore } from "@/stores/localMissionStore";
import { useGameStore } from "@/stores/gameStore";
import type { Mission } from "@/stores/gameStore";

export function useLocalMissionIntegration() {
  const { publicKey, connected } = useWallet();
  const { player } = useGameStore();

  const {
    missions,
    activeMission,
    completedMissions,
    missionProgress,
    isLoading,
    isInitialized,
    error,
    initialize,
    loadAvailableMissions,
    startMission: startLocalMission,
    updateMissionProgress: updateLocalMissionProgress,
    completeMission: completeLocalMission,
    getPlayerMissions,
    resetMissions,
    clearError,
    syncMissionData,
  } = useLocalMissionStore();

  // Get player ID (use wallet public key or fallback)
  const getPlayerId = useCallback(() => {
    return publicKey?.toString() || "local-player";
  }, [publicKey]);

  // Initialize mission system when wallet connects or player data is available
  useEffect(() => {
    const playerId = getPlayerId();

    if (!isInitialized && (connected || player)) {
      initialize(playerId);
    }
  }, [connected, player, isInitialized, initialize, getPlayerId]);

  // Load available missions when player level changes
  useEffect(() => {
    const playerId = getPlayerId();

    if (isInitialized && player) {
      loadAvailableMissions(playerId, player.level);
    }
  }, [isInitialized, player?.level, loadAvailableMissions, getPlayerId]);

  // Sync mission data across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "g-bax-missions" && e.newValue) {
        syncMissionData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [syncMissionData]);

  // Start a mission
  const startMission = useCallback(async (missionId: string) => {
    const playerId = getPlayerId();

    try {
      const missionProgress = await startLocalMission(playerId, missionId);
      return missionProgress;
    } catch (error) {
      throw error;
    }
  }, [startLocalMission, getPlayerId]);

  // Update mission progress
  const updateMissionProgress = useCallback(async (missionId: string, progress: number) => {
    const playerId = getPlayerId();

    try {
      const missionProgress = await updateLocalMissionProgress(playerId, missionId, progress);return missionProgress;
    } catch (error) {throw error;
    }
  }, [updateLocalMissionProgress, getPlayerId]);

  // Complete a mission
  const completeMission = useCallback(async (missionId: string) => {
    const playerId = getPlayerId();

    try {
      const missionProgress = await completeLocalMission(playerId, missionId);return missionProgress;
    } catch (error) {throw error;
    }
  }, [completeLocalMission, getPlayerId]);

  // Check if a mission can be started
  const canStartMission = useCallback((mission: Mission) => {
    // Can't start if there's already an active mission
    if (activeMission) {
      return false;
    }

    // Can't start if mission is not available
    if (mission.status !== "available") {
      return false;
    }

    // Can't start if already completed
    if (completedMissions.includes(mission.id)) {
      return false;
    }

    return true;
  }, [activeMission, completedMissions]);

  // Get mission progress for a specific mission
  const getMissionProgress = useCallback((missionId: string) => {
    return missionProgress[missionId] || null;
  }, [missionProgress]);

  // Get all player missions
  const getPlayerMissionList = useCallback(() => {
    const playerId = getPlayerId();
    return getPlayerMissions(playerId);
  }, [getPlayerMissions, getPlayerId]);

  // Reset all missions (for testing or new player)
  const resetAllMissions = useCallback(async () => {
    const playerId = getPlayerId();

    try {
      await resetMissions(playerId);} catch (error) {throw error;
    }
  }, [resetMissions, getPlayerId]);

  // Get mission statistics
  const getMissionStats = useCallback(() => {
    const totalMissions = missions.length;
    const completedCount = completedMissions.length;
    const availableCount = missions.filter(m => m.status === "available").length;
    const lockedCount = missions.filter(m => m.status === "locked").length;

    return {
      total: totalMissions,
      completed: completedCount,
      available: availableCount,
      locked: lockedCount,
      completionRate: totalMissions > 0 ? (completedCount / totalMissions) * 100 : 0,
    };
  }, [missions, completedMissions]);

  // Check if mission system is ready
  const isReady = isInitialized && !isLoading && !error;

  return {
    // Mission data
    missions,
    activeMission,
    completedMissions,
    missionProgress,

    // State
    isLoading,
    isInitialized,
    isReady,
    error,

    // Actions
    startMission,
    updateMissionProgress,
    completeMission,
    canStartMission,
    resetAllMissions,

    // Utilities
    getMissionProgress,
    getPlayerMissionList,
    getMissionStats,
    clearError,

    // Player context
    playerId: getPlayerId(),
    isConnected: connected || !!player,
  };
}

// Export mission types for backward compatibility
export type { Mission } from "@/stores/gameStore";
export type { LocalMissionProgress } from "@/services/localMissionService";
