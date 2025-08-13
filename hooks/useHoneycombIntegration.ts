"use client";

import { useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { PREDEFINED_MISSIONS, getAvailableMissions } from "@/data/missions";
import { PREDEFINED_TRAITS, getAvailableTraits } from "@/data/traits";
import { getLevelFromExperience } from "@/utils/gameHelpers";
import { useMissionPoolManager } from "./useMissionPoolManager";
import { useLocalMissionIntegration } from "./useLocalMissionIntegration";
import { useLocalCharacterIntegration } from "./useLocalCharacterIntegration";

/**
 * Custom hook to integrate Honeycomb Protocol with wallet and game state
 * Now delegates mission and character functionality to local services
 * while preserving profile, experience, and other on-chain functionality
 */
export function useHoneycombIntegration() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const {
    honeycombService,
    isConnected: honeycombConnected,
    isInitializing,
    playerProfile,
    playerMissions,
    playerTraits,
    playerLevel,
    checkConnection,
  } = useHoneycombStore();

  const { player, missions, setMissions, setActiveMission, setPlayer } =
    useGameStore();

  // Local services integration
  const localMissionIntegration = useLocalMissionIntegration();
  const localCharacterIntegration = useLocalCharacterIntegration();

  // Mission pool management (now uses local services)
  const missionPoolManager = useMissionPoolManager();

  // Note: UseWalletSetup hook now handles Honeycomb initialization
  // to prevent duplicate initialization calls

  // Sync Honeycomb player profile with game store
  useEffect(() => {
    if (playerProfile && publicKey) {
      const experience = playerProfile.experience || 0;
      const gamePlayer = {
        id: publicKey.toString(),
        name: playerProfile.name || "Space Explorer",
        bio: playerProfile.bio || "Space explorer in the G-Bax universe",
        address: playerProfile.address || publicKey.toString(),
        createdAt: playerProfile.createdAt || new Date().toISOString(),
        lastUpdated: playerProfile.lastUpdated || new Date().toISOString(),
        pfp: playerProfile.pfp || "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        profileAddress: playerProfile.profileAddress || "",
        projectAddress: playerProfile.projectAddress || "",
        profileTreeAddress: playerProfile.profileTreeAddress || "",
        source: playerProfile.source || "honeycomb",
        level: getLevelFromExperience(experience), // Calculate level from experience
        experience,
        position: [0, 0, 0] as [number, number, number],
        credits: playerProfile.credits || 1000,
        stats: playerProfile.stats || {
          miningOperations: 0,
          itemsCrafted: 0,
          sectorsExplored: 0,
          combatWins: 0,
          leadershipActions: 0,
          missionsCompleted: 0,
          traitCategories: 0,
          achievements: 0,
        },
      };

      setPlayer(gamePlayer);
    }
  }, [playerProfile, publicKey, setPlayer]);

  // Sync missions from local service with game store
  useEffect(() => {
    if (localMissionIntegration.isReady && player) {
      // Use local mission data instead of Honeycomb
      const localMissions = localMissionIntegration.missions;

      // Only update if there are actual changes to prevent unnecessary re-renders
      const hasChanges = localMissions.some((newMission, index) => {
        const existingMission = missions[index];

        return (
          !existingMission ||
          existingMission.status !== newMission.status ||
          existingMission.progress !== newMission.progress
        );
      });

      if (hasChanges || missions.length === 0) {
        setMissions(localMissions);
      }

      // Sync active mission
      if (localMissionIntegration.activeMission) {
        setActiveMission(localMissionIntegration.activeMission);
      }
    }
  }, [localMissionIntegration.isReady, localMissionIntegration.missions, localMissionIntegration.activeMission, player, missions, setMissions, setActiveMission]);

  // Periodic connection check
  useEffect(() => {
    if (honeycombService) {
      const interval = setInterval(() => {
        checkConnection();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [honeycombService, checkConnection]);

  // Mission management functions - now delegate to local services
  const startMission = async (missionId: string) => {
    try {
      // Use local mission service instead of Honeycomb
      const result = await localMissionIntegration.startMission(missionId);return true;
    } catch (error) {throw error;
    }
  };

  const updateMissionProgress = async (missionId: string, progress: number) => {
    try {
      // Use local mission service instead of Honeycomb
      const result = await localMissionIntegration.updateMissionProgress(missionId, progress);return true;
    } catch (error) {throw error;
    }
  };

  // Trait management functions - now delegate to local services
  const assignTrait = async (traitId: string) => {
    const traitDefinition = PREDEFINED_TRAITS.find((t) => t.id === traitId);

    if (!traitDefinition) {
      throw new Error("Trait not found");
    }

    try {
      // Use local character service instead of Honeycomb
      const result = await localCharacterIntegration.assignTrait(
        traitDefinition.category,
        traitDefinition.name
      );return true;
    } catch (error) {throw error;
    }
  };

  const upgradeTrait = async (traitId: string, newLevel: number) => {
    try {
      // Use local character service for trait evolution
      const result = await localCharacterIntegration.evolveTrait(traitId);return true;
    } catch (error) {throw error;
    }
  };

  // Get available traits for current player - use local character service
  const getPlayerAvailableTraits = () => {
    if (!localCharacterIntegration.activeCharacter) return [];

    return localCharacterIntegration.getAvailableTraitsForCharacter();
  };

  // Check if player can start a specific mission - use local mission service
  const canStartMission = (missionId: string) => {
    return localMissionIntegration.canStartMission(missionId);
  };

  // Get player's active mission - use local mission service
  const getActiveMission = () => {
    return localMissionIntegration.activeMission;
  };

  return {
    // Connection state
    isConnected: honeycombConnected,
    isInitializing,

    // Player data (from Honeycomb - preserved for profile/experience)
    playerProfile,
    playerLevel,
    playerMissions: localMissionIntegration.missionProgress, // Use local mission progress
    playerTraits: localCharacterIntegration.activeCharacter?.traits || [], // Use local character traits

    // Mission functions (delegated to local services)
    startMission,
    updateMissionProgress,
    canStartMission,
    getActiveMission,

    // Trait functions (delegated to local services)
    assignTrait,
    upgradeTrait,
    getPlayerAvailableTraits,

    // Mission pool management (now uses local services)
    missionPoolManager,

    // Local service integrations
    localMissionIntegration,
    localCharacterIntegration,

    // Utility (preserved for profile/experience functionality)
    honeycombService,
  };
}
