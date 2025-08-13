"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { Guild, PlayerGuildInfo } from "@/types";

/**
 * Hook to manage guild progression and blockchain synchronization
 */
export function useGuildProgression() {
  const { publicKey, connected } = useWallet();
  const { player } = useGameStore();
  const {
    honeycombService,
    isConnected: honeycombConnected,
    availableGuilds,
    playerGuildInfo,
    isGuildSystemInitialized,
    isLoadingGuild,
    initializeGuildSystem,
    joinGuild,
    leaveGuild,
    recordGuildContribution,
    loadPlayerGuild,
    getGuildSystemStatus,
  } = useHoneycombStore();

  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Auto-initialize guild system when conditions are met
  useEffect(() => {
    if (
      connected &&
      honeycombConnected &&
      publicKey &&
      !isGuildSystemInitialized &&
      !isLoadingGuild
    ) {
      const timer = setTimeout(() => {
        initializeGuildSystem(publicKey, undefined);
      }, 10000); // Wait 10 seconds after connection to avoid conflicts

      return () => clearTimeout(timer);
    }
  }, [connected, honeycombConnected, publicKey, isGuildSystemInitialized, isLoadingGuild]);

  // Auto-load player guild when system is ready
  useEffect(() => {
    if (
      isGuildSystemInitialized &&
      publicKey &&
      !playerGuildInfo &&
      !isLoadingGuild
    ) {
      const timer = setTimeout(() => {
        loadPlayerGuild(publicKey);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isGuildSystemInitialized, publicKey, playerGuildInfo, isLoadingGuild]);

  // Get guild by ID
  const getGuildById = (guildId: string): Guild | null => {
    return availableGuilds.find(g => g.id === guildId) || null;
  };

  // Get guilds by category
  const getGuildsByCategory = (category: string): Guild[] => {
    return availableGuilds.filter(g => g.category === category);
  };

  // Check if player meets guild requirements
  const meetsGuildRequirements = (guild: Guild): boolean => {
    if (!player) return false;

    const requirements = guild.requirements;
    const playerStats = {
      level: player.level || 1,
      miningOperations: player.stats?.miningOperations || 0,
      itemsCrafted: player.stats?.itemsCrafted || 0,
      sectorsExplored: player.stats?.sectorsExplored || 0,
      combatWins: player.stats?.combatWins || 0,
      leadershipActions: player.stats?.leadershipActions || 0,
      achievements: player.stats?.achievements || 0,
    };

    return Object.entries(requirements).every(([key, value]) => {
      return playerStats[key as keyof typeof playerStats] >= value;
    });
  };

  // Get eligible guilds for player
  const getEligibleGuilds = (): Guild[] => {
    return availableGuilds.filter(guild =>
      meetsGuildRequirements(guild) && guild.memberCount < guild.maxMembers
    );
  };

  // Join a guild
  const joinPlayerGuild = async (guildId: string): Promise<boolean> => {
    if (!publicKey || !isGuildSystemInitialized || playerGuildInfo) return false;

    setIsJoining(true);
    try {
      const success = await joinGuild(publicKey, guildId);

      if (success) {}

      return success;
    } catch (error) {return false;
    } finally {
      setIsJoining(false);
    }
  };

  // Leave current guild
  const leavePlayerGuild = async (): Promise<boolean> => {
    if (!publicKey || !isGuildSystemInitialized || !playerGuildInfo) return false;

    setIsLeaving(true);
    try {
      const success = await leaveGuild(publicKey);

      if (success) {}

      return success;
    } catch (error) {return false;
    } finally {
      setIsLeaving(false);
    }
  };

  // Record contribution for activity
  const recordContribution = async (
    contributionType: "mining" | "crafting" | "exploration" | "mission" | "leadership",
    amount: number = 1,
  ): Promise<boolean> => {
    if (!publicKey || !isGuildSystemInitialized || !playerGuildInfo) return false;

    try {
      const success = await recordGuildContribution(
        publicKey,
        contributionType,
        amount,
      );

      if (success) {}

      return success;
    } catch (error) {return false;
    }
  };

  // Get guild benefits for player
  const getGuildBenefits = (): any => {
    if (!playerGuildInfo) return {};

    return playerGuildInfo.guild.benefits;
  };

  // Calculate guild bonus for activity
  const getGuildBonus = (activityType: string): number => {
    const benefits = getGuildBenefits();

    switch (activityType) {
      case "mining":
        return benefits.miningBonus || 0;
      case "crafting":
        return benefits.craftingBonus || 0;
      case "exploration":
        return benefits.explorationBonus || 0;
      case "combat":
        return benefits.combatBonus || 0;
      case "leadership":
        return benefits.leadershipBonus || 0;
      case "experience":
        return benefits.experienceBonus || 0;
      default:
        return benefits.allActivitiesBonus || 0;
    }
  };

  // Get player's guild rank
  const getPlayerRank = (): string => {
    return playerGuildInfo?.membership.rank || "none";
  };

  // Check if player is guild leader
  const isGuildLeader = (): boolean => {
    return getPlayerRank() === "leader";
  };

  // Get guild statistics
  const getGuildStats = () => {
    if (!playerGuildInfo) {
      return {
        totalGuilds: availableGuilds.length,
        eligibleGuilds: getEligibleGuilds().length,
        playerGuild: null,
        playerRank: "none",
        playerContributions: 0,
      };
    }

    return {
      totalGuilds: availableGuilds.length,
      eligibleGuilds: getEligibleGuilds().length,
      playerGuild: playerGuildInfo.guild.name,
      playerRank: playerGuildInfo.membership.rank,
      playerContributions: playerGuildInfo.membership.contributions,
      guildLevel: playerGuildInfo.guild.level,
      guildExperience: playerGuildInfo.guild.experience,
      guildMembers: playerGuildInfo.guild.memberCount,
    };
  };

  // Get contribution multiplier for activity type
  const getContributionMultiplier = (contributionType: string): number => {
    const multipliers = {
      mining: 1,
      crafting: 2,
      exploration: 3,
      mission: 5,
      leadership: 10,
    };

    return multipliers[contributionType as keyof typeof multipliers] || 1;
  };

  // Get next guild level requirements
  const getNextLevelRequirements = (): { current: number; required: number; progress: number } => {
    if (!playerGuildInfo) {
      return { current: 0, required: 1000, progress: 0 };
    }

    const currentLevel = playerGuildInfo.guild.level;
    const currentExp = playerGuildInfo.guild.experience;
    const requiredExp = currentLevel * 1000;
    const progress = ((currentExp % 1000) / 1000) * 100;

    return {
      current: currentExp,
      required: requiredExp,
      progress,
    };
  };

  return {
    // State
    availableGuilds,
    playerGuildInfo,
    isGuildSystemInitialized,
    isLoadingGuild,
    isJoining,
    isLeaving,

    // Actions
    joinPlayerGuild,
    leavePlayerGuild,
    recordContribution,

    // Getters
    getGuildById,
    getGuildsByCategory,
    meetsGuildRequirements,
    getEligibleGuilds,
    getGuildBenefits,
    getGuildBonus,
    getPlayerRank,
    isGuildLeader,
    getGuildStats,
    getContributionMultiplier,
    getNextLevelRequirements,

    // Status
    status: getGuildSystemStatus(),
    hasGuild: !!playerGuildInfo,
    canJoinGuild: !!(publicKey && honeycombConnected && isGuildSystemInitialized && !playerGuildInfo),
  };
}
