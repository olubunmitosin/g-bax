"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useGameStore } from "@/stores/gameStore";
import { useHoneycombStore } from "@/stores/honeycombStore";
import { useVerxioIntegration } from "./useVerxioIntegration";
import { useAchievementTracker } from "./useAchievementTracker";
import { useGuildProgression } from "./useGuildProgression";
import { formatNumber } from "@/utils/gameHelpers";

/**
 * Hook to handle mission completion rewards and distribution
 */
export function useMissionRewards() {
  const { publicKey } = useWallet();
  const {
    player,
    addResource,
    updatePlayerExperience,
    setPlayer,
  } = useGameStore();

  const {
    updatePlayerExperience: updateHoneycombExperience,
    honeycombService,
    isConnected: honeycombConnected,
  } = useHoneycombStore();

  const { awardPointsForActivity } = useVerxioIntegration();
  const { trackActivity } = useAchievementTracker();
  const { recordContribution } = useGuildProgression();

  // Award mission completion rewards
  const awardMissionRewards = useCallback(async (completedMission: any) => {
    if (!player || !publicKey) {
      console.warn("Cannot award rewards: player or wallet not available");
      return null;
    }

    const { rewards } = completedMission;
    const rewardSummary = {
      experience: 0,
      credits: 0,
      resources: [] as any[],
      loyaltyPoints: 0,
    };

    try {
      // 1. Award Experience Points
      if (rewards.experience > 0) {
        rewardSummary.experience = rewards.experience;

        // Update local experience
        updatePlayerExperience(rewards.experience);

        // Update player level if needed
        const newExperience = player.experience + rewards.experience;
        const newLevel = Math.floor(newExperience / 1000) + 1;

        if (newLevel > player.level) {
          setPlayer({
            ...player,
            experience: newExperience,
            level: newLevel,
          });
          console.log(`Level up! Player reached level ${newLevel}`);
        }

        // Sync experience to blockchain using enhanced real-time sync
        if (honeycombConnected && honeycombService) {
          try {
            await updateHoneycombExperience(publicKey, rewards.experience);
            console.log("Experience synced to blockchain via enhanced sync");
          } catch (error) {
            console.warn("Failed to sync experience to blockchain:", error);
          }
        }
      }

      // 2. Award Credits
      if (rewards.credits > 0) {
        rewardSummary.credits = rewards.credits;

        // Update player credits
        setPlayer({
          ...player,
          credits: player.credits + rewards.credits,
        });
      }

      // 3. Award Resources
      if (rewards.resources && rewards.resources.length > 0) {
        rewardSummary.resources = rewards.resources;

        // Add each resource to inventory
        for (const resource of rewards.resources) {
          addResource(resource);
        }
      }

      // 4. Award Loyalty Points (bonus for mission completion)
      const baseLoyaltyPoints = Math.floor(rewards.experience * 0.5) + rewards.credits * 0.1;
      if (baseLoyaltyPoints > 0) {
        try {
          const loyaltyPoints = await awardPointsForActivity(
            `mission_completed_${completedMission.type}`,
            baseLoyaltyPoints
          );
          rewardSummary.loyaltyPoints = loyaltyPoints || 0;
        } catch (error) {
          console.warn("Failed to award loyalty points:", error);
        }
      }

      // 5. Track achievement progress for mission completion
      try {
        await trackActivity("mission_complete", 1);
      } catch (error) {
        console.warn("Failed to track mission achievement:", error);
      }

      // 6. Record guild contribution for mission completion
      try {
        await recordContribution("mission", 1);
      } catch (error) {
        console.warn("Failed to record guild mission contribution:", error);
      }

      // 7. Log mission completion
      console.log(`Mission "${completedMission.title}" completed!`, {
        mission: completedMission,
        rewards: rewardSummary,
      });

      return rewardSummary;
    } catch (error) {
      console.error("Failed to award mission rewards:", error);
      return null;
    }
  }, [
    player,
    publicKey,
    addResource,
    updatePlayerExperience,
    setPlayer,
    updateHoneycombExperience,
    honeycombService,
    honeycombConnected,
    awardPointsForActivity,
    trackActivity,
    recordContribution,
  ]);

  // Create a formatted reward summary for display
  const formatRewardSummary = useCallback((rewardSummary: any) => {
    const parts = [];

    if (rewardSummary.experience > 0) {
      parts.push(`${formatNumber(rewardSummary.experience)} XP`);
    }

    if (rewardSummary.credits > 0) {
      parts.push(`${formatNumber(rewardSummary.credits)} Credits`);
    }

    if (rewardSummary.resources.length > 0) {
      const resourceText = rewardSummary.resources
        .map((r: any) => `${r.quantity} ${r.name}`)
        .join(", ");
      parts.push(resourceText);
    }

    if (rewardSummary.loyaltyPoints > 0) {
      parts.push(`${formatNumber(rewardSummary.loyaltyPoints)} Loyalty Points`);
    }

    return parts.join(", ");
  }, []);

  // Check if rewards can be awarded
  const canAwardRewards = useCallback(() => {
    return !!(player && publicKey);
  }, [player, publicKey]);

  // Get mission reward preview
  const getMissionRewardPreview = useCallback((mission: any) => {
    const preview = [];

    if (mission.rewards.experience > 0) {
      preview.push(`${formatNumber(mission.rewards.experience)} XP`);
    }

    if (mission.rewards.credits > 0) {
      preview.push(`${formatNumber(mission.rewards.credits)} Credits`);
    }

    if (mission.rewards.resources && mission.rewards.resources.length > 0) {
      preview.push(`${mission.rewards.resources.length} Resources`);
    }

    // Add estimated loyalty points
    const estimatedLoyalty = Math.floor(mission.rewards.experience * 0.5) + mission.rewards.credits * 0.1;
    if (estimatedLoyalty > 0) {
      preview.push(`~${formatNumber(estimatedLoyalty)} Loyalty Points`);
    }

    return preview.join(" + ");
  }, []);

  return {
    // Main functions
    awardMissionRewards,
    formatRewardSummary,
    getMissionRewardPreview,

    // Status
    canAwardRewards: canAwardRewards(),
    isBlockchainSyncEnabled: honeycombConnected,
  };
}
