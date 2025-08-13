"use client";

import { useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { PREDEFINED_MISSIONS, getAvailableMissions } from "@/data/missions";
import { PREDEFINED_TRAITS, getAvailableTraits } from "@/data/traits";
import { getLevelFromExperience } from "@/utils/gameHelpers";
import { useMissionPoolManager } from "./useMissionPoolManager";

/**
 * Custom hook to integrate Honeycomb Protocol with wallet and game state
 */
export function useHoneycombIntegration() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const {
    honeycombService,
    isConnected: honeycombConnected,
    isInitializing,
    initializeHoneycomb,
    playerProfile,
    playerMissions,
    playerTraits,
    playerLevel,
    checkConnection,
  } = useHoneycombStore();

  const { player, missions, setMissions, setActiveMission, setPlayer } =
    useGameStore();

  // Mission pool management
  const missionPoolManager = useMissionPoolManager();

  // Initialize Honeycomb when connection is available
  useEffect(() => {
    if (connection && !honeycombService && !isInitializing) {
      const rpcUrl = connection.rpcEndpoint;
      const environment = rpcUrl.includes("test") ? "devnet" : "mainnet-beta";

      initializeHoneycomb(rpcUrl, environment);
    }
  }, [connection, honeycombService, isInitializing, initializeHoneycomb]);

  // Sync Honeycomb player profile with game store
  useEffect(() => {
    if (playerProfile && publicKey) {
      const experience = playerProfile.experience || 0;
      const gamePlayer = {
        id: publicKey.toString(),
        name: playerProfile.name || "Space Explorer",
        level: getLevelFromExperience(experience), // Calculate level from experience
        experience,
        position: [0, 0, 0] as [number, number, number],
        credits: playerProfile.credits || 1000,
      };

      setPlayer(gamePlayer);
    }
  }, [playerProfile, publicKey]);

  // Sync available missions with game store
  useEffect(() => {
    if (honeycombConnected && player) {
      // Get completed mission IDs from player missions
      const completedMissionIds = playerMissions
        .filter((m) => m.completed)
        .map((m) => m.missionId);

      // Get available missions based on player level and completed missions
      const availableMissions = getAvailableMissions(
        player.level,
        completedMissionIds,
      );

      // Convert to game store format and merge with predefined missions
      const gameMissions = PREDEFINED_MISSIONS.map((mission) => {
        const playerMission = playerMissions.find(
          (pm) => pm.missionId === mission.id,
        );
        const isAvailable = availableMissions.some(
          (am) => am.id === mission.id,
        );

        // Check if a mission is already completed in game store to preserve status
        const existingMission = missions.find((m) => m.id === mission.id);
        const isAlreadyCompleted = existingMission?.status === "completed";

        return {
          ...mission,
          status: isAlreadyCompleted
            ? "completed"
            : playerMission?.completed
              ? "completed"
              : playerMission
                ? "active"
                : isAvailable
                  ? "available"
                  : "locked",
          progress: existingMission?.progress ?? playerMission?.progress ?? 0,
        } as const;
      });

      // Only update if there are actual changes to prevent unnecessary re-renders
      const hasChanges = gameMissions.some((newMission, index) => {
        const existingMission = missions[index];

        return (
          !existingMission ||
          existingMission.status !== newMission.status ||
          existingMission.progress !== newMission.progress
        );
      });

      if (hasChanges || missions.length === 0) {
        setMissions(gameMissions);
      }
    }
  }, [honeycombConnected, player, playerMissions, missions]);

  // Periodic connection check
  useEffect(() => {
    if (honeycombService) {
      const interval = setInterval(() => {
        checkConnection();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [honeycombService, checkConnection]);

  // Mission management functions
  const startMission = async (missionId: string) => {
    if (!publicKey || !honeycombService) {
      throw new Error("Wallet not connected or Honeycomb not initialized");
    }

    try {
      await useHoneycombStore.getState().startMission(publicKey, missionId);

      // Update game store missions array
      const updatedMissions = missions.map((mission) =>
        mission.id === missionId
          ? { ...mission, status: "active" as const }
          : mission,
      );

      setMissions(updatedMissions);

      // Set the active mission explicitly
      const activeMission = updatedMissions.find((m) => m.id === missionId);

      if (activeMission) {
        setActiveMission(activeMission);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const updateMissionProgress = async (missionId: string, progress: number) => {
    if (!publicKey || !honeycombService) {
      throw new Error("Wallet not connected or Honeycomb not initialized");
    }

    try {
      // Update Honeycomb store
      await useHoneycombStore
        .getState()
        .updateMissionProgress(publicKey, missionId, progress);

      // Update game store missions array
      const updatedMissions = missions.map((mission) =>
        mission.id === missionId
          ? {
            ...mission,
            progress,
            status:
              progress >= mission.maxProgress
                ? ("completed" as const)
                : ("active" as const),
          }
          : mission,
      );

      setMissions(updatedMissions);

      // Update active mission if it's the one being updated
      const updatedMission = updatedMissions.find((m) => m.id === missionId);

      if (updatedMission && updatedMission.status === "active") {
        setActiveMission(updatedMission);
      } else if (updatedMission && updatedMission.status === "completed") {
        // Clear active mission if completed
        setActiveMission(null);
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const assignTrait = async (traitId: string) => {
    if (!publicKey || !honeycombService) {
      throw new Error("Wallet not connected or Honeycomb not initialized");
    }

    const traitDefinition = PREDEFINED_TRAITS.find((t) => t.id === traitId);

    if (!traitDefinition) {
      throw new Error("Trait not found");
    }

    try {
      await useHoneycombStore.getState().assignTrait(publicKey, {
        name: traitDefinition.name,
        category: traitDefinition.category,
        effects: traitDefinition.baseEffects,
        level: 1,
      });

      return true;
    } catch (error) {
      throw error;
    }
  };

  const upgradeTrait = async (traitId: string, newLevel: number) => {
    if (!publicKey || !honeycombService) {
      throw new Error("Wallet not connected or Honeycomb not initialized");
    }

    try {
      await useHoneycombStore
        .getState()
        .upgradeTrait(publicKey, traitId, newLevel);

      return true;
    } catch (error) {
      throw error;
    }
  };

  // Get available traits for current player
  const getPlayerAvailableTraits = () => {
    if (!player) return [];

    const completedMissionIds = playerMissions
      .filter((m) => m.completed)
      .map((m) => m.missionId);

    const playerTraitIds = playerTraits.map((t) => t.traitId);

    return getAvailableTraits(
      player.level,
      completedMissionIds,
      playerTraitIds,
    );
  };

  // Check if player can start a specific mission
  const canStartMission = (missionId: string) => {
    if (!player) return false;

    const mission = missions.find((m) => m.id === missionId);

    return mission?.status === "available";
  };

  // Get player's active mission
  const getActiveMission = () => {
    return missions.find((m) => m.status === "active") || null;
  };

  return {
    // Connection state
    isConnected: honeycombConnected,
    isInitializing,

    // Player data
    playerProfile,
    playerLevel,
    playerMissions,
    playerTraits,

    // Mission functions
    startMission,
    updateMissionProgress,
    canStartMission,
    getActiveMission,

    // Trait functions
    assignTrait,
    upgradeTrait,
    getPlayerAvailableTraits,

    // Mission pool management
    missionPoolManager,

    // Utility
    honeycombService,
  };
}
