"use client";

import { useEffect, useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { PREDEFINED_MISSIONS } from "@/data/missions";
import { useMissionRewards } from "./useMissionRewards";

/**
 * Hook to track mission progress and sync to Honeycomb Protocol
 */
export function useMissionProgressTracker() {
  const { publicKey, connected } = useWallet();

  // State for mission completion modal
  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    mission: any;
    rewardSummary: any;
  }>({
    isOpen: false,
    mission: null,
    rewardSummary: null,
  });
  const {
    updateMissionProgress: updateHoneycombMissionProgress,
    honeycombService,
    isConnected: honeycombConnected,
  } = useHoneycombStore();

  const {
    player,
    missions,
    activeMission,
    setMissions,
    setActiveMission,
    inventory,
  } = useGameStore();

  const { awardMissionRewards, formatRewardSummary } = useMissionRewards();

  // Track mining activities for mission progress
  const trackMiningActivity = useCallback(async (resourceType: string, quantity: number) => {
    if (!publicKey || !activeMission || !honeycombConnected) return;

    // Check if active mission is mining-related
    if (activeMission.type === "mining") {
      let progressIncrement = 0;

      switch (activeMission.id) {
        case "mining_001": // First Steps in Space - mine 1 asteroid
          progressIncrement = 1; // Each mining operation = 1 progress
          break;
        case "mining_002": // Resource Collector - mine 10 resources
          progressIncrement = quantity; // Progress based on quantity mined
          break;
        case "mining_003": // Deep Space Miner - mine 50 resources
          progressIncrement = quantity;
          break;
        default:
          break;
      }

      if (progressIncrement > 0) {
        const newProgress = Math.min(
          activeMission.progress + progressIncrement,
          activeMission.maxProgress
        );

        await updateMissionProgress(activeMission.id, newProgress);
      }
    }
  }, [publicKey, activeMission, honeycombConnected]);

  // Track crafting activities for mission progress
  const trackCraftingActivity = useCallback(async (itemType: string, quantity: number) => {
    if (!publicKey || !activeMission || !honeycombConnected) return;

    // Check if active mission is crafting-related
    if (activeMission.type === "crafting") {
      let progressIncrement = 0;

      switch (activeMission.id) {
        case "crafting_001": // First Creation - craft 1 item
          progressIncrement = 1;
          break;
        case "crafting_002": // Skilled Artisan - craft 5 items
          progressIncrement = quantity;
          break;
        case "crafting_003": // Master Crafter - craft 20 items
          progressIncrement = quantity;
          break;
        default:
          break;
      }

      if (progressIncrement > 0) {
        const newProgress = Math.min(
          activeMission.progress + progressIncrement,
          activeMission.maxProgress
        );

        await updateMissionProgress(activeMission.id, newProgress);
      }
    }
  }, [publicKey, activeMission, honeycombConnected]);

  // Track exploration activities for mission progress
  const trackExplorationActivity = useCallback(async (activityType: string) => {
    if (!publicKey || !activeMission || !honeycombConnected) return;

    // Check if active mission is exploration-related
    if (activeMission.type === "exploration") {
      let progressIncrement = 0;

      switch (activeMission.id) {
        case "exploration_001": // Space Navigator - explore 3 sectors
          if (activityType === "sector_explored") {
            progressIncrement = 1;
          }
          break;
        case "exploration_002": // Deep Explorer - explore 10 sectors
          if (activityType === "sector_explored") {
            progressIncrement = 1;
          }
          break;
        case "exploration_003": // Void Walker - explore 5 sectors with rare resources
          if (activityType === "rare_sector_explored") {
            progressIncrement = 1;
          }
          break;
        default:
          break;
      }

      if (progressIncrement > 0) {
        const newProgress = Math.min(
          activeMission.progress + progressIncrement,
          activeMission.maxProgress
        );

        await updateMissionProgress(activeMission.id, newProgress);
      }
    }
  }, [publicKey, activeMission, honeycombConnected]);

  // Update mission progress (both local and blockchain)
  const updateMissionProgress = useCallback(async (missionId: string, newProgress: number) => {
    if (!publicKey) return;

    try {
      // Update local state first for immediate feedback
      const updatedMissions = missions.map((mission) =>
        mission.id === missionId
          ? {
            ...mission,
            progress: newProgress,
            status: newProgress >= mission.maxProgress ? "completed" as const : "active" as const,
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

        // Award mission rewards
        await handleMissionRewards(updatedMission);
      }

      // Sync to Honeycomb Protocol
      if (honeycombConnected && honeycombService) {
        await updateHoneycombMissionProgress(publicKey, missionId, newProgress);
      }

    } catch (error) {
      console.error("Failed to update mission progress:", error);
    }
  }, [publicKey, missions, honeycombConnected, honeycombService, updateHoneycombMissionProgress]);

  // Award mission rewards when completed
  const handleMissionRewards = useCallback(async (completedMission: any) => {
    try {
      const rewardSummary = await awardMissionRewards(completedMission);

      if (rewardSummary) {
        const rewardText = formatRewardSummary(rewardSummary);
        console.log(`Mission "${completedMission.title}" completed! Rewards: ${rewardText}`);

        // Show mission completion modal
        setCompletionModal({
          isOpen: true,
          mission: completedMission,
          rewardSummary,
        });
      }
    } catch (error) {
      console.error("Failed to award mission rewards:", error);
    }
  }, [awardMissionRewards, formatRewardSummary]);

  // Close mission completion modal
  const closeCompletionModal = useCallback(() => {
    setCompletionModal({
      isOpen: false,
      mission: null,
      rewardSummary: null,
    });
  }, []);

  // Auto-track inventory changes for mission progress
  useEffect(() => {
    // This effect would monitor inventory changes and automatically track progress
    // For now, we'll rely on manual tracking calls from the game systems
  }, [inventory]);

  return {
    // Tracking functions
    trackMiningActivity,
    trackCraftingActivity,
    trackExplorationActivity,
    updateMissionProgress,

    // Mission completion modal
    completionModal,
    closeCompletionModal,

    // Status
    isTrackingEnabled: connected && honeycombConnected && !!activeMission,
    activeMission,
  };
}
