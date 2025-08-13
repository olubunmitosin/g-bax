"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { HoneycombAchievement } from "@/types";

/**
 * Hook to track and award achievements based on player actions
 */
export function useAchievementTracker() {
  const { publicKey, connected } = useWallet();
  const { player } = useGameStore();
  const {
    honeycombService,
    isConnected: honeycombConnected,
    availableAchievements,
    playerAchievements,
    isAchievementSystemInitialized,
    isLoadingAchievements,
    initializeAchievementSystem,
    checkAndAwardAchievements,
    loadPlayerAchievements,
    getAchievementSystemStatus,
  } = useHoneycombStore();

  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  // Auto-initialize achievement system when conditions are met
  useEffect(() => {
    if (
      connected &&
      honeycombConnected &&
      publicKey &&
      !isAchievementSystemInitialized &&
      !isLoadingAchievements
    ) {
      const timer = setTimeout(() => {
        initializeAchievementSystem(publicKey, undefined);
      }, 5000); // Wait 5 seconds after connection

      return () => clearTimeout(timer);
    }
  }, [connected, honeycombConnected, publicKey, isAchievementSystemInitialized, isLoadingAchievements]);

  // Auto-load player achievements when system is ready
  useEffect(() => {
    if (
      isAchievementSystemInitialized &&
      publicKey &&
      playerAchievements.length === 0 &&
      !isLoadingAchievements
    ) {
      const timer = setTimeout(() => {
        loadPlayerAchievements(publicKey);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAchievementSystemInitialized, publicKey, playerAchievements.length, isLoadingAchievements]);

  // Calculate player stats for achievement checking
  const getPlayerStats = () => {
    if (!player || !publicKey) {
      return {
        miningCount: 0,
        craftingCount: 0,
        explorationCount: 0,
        level: 1,
        missionsCompleted: 0,
        traitCategories: 0,
        blockchainXP: 0,
      };
    }

    // Get activity counts from localStorage (tracked by trackActivity)
    const playerKey = publicKey.toString();
    const miningFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-mining`) || "0");
    const craftingFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-crafting`) || "0");
    const explorationFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-exploration`) || "0");
    const missionsFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-mission_complete`) || "0");

    return {
      miningCount: Math.max(player.stats?.miningOperations || 0, miningFromStorage),
      craftingCount: Math.max(player.stats?.itemsCrafted || 0, craftingFromStorage),
      explorationCount: Math.max(player.stats?.sectorsExplored || 0, explorationFromStorage),
      level: player.level || 1,
      missionsCompleted: Math.max(player.stats?.missionsCompleted || 0, missionsFromStorage),
      traitCategories: player.stats?.traitCategories || 0,
      blockchainXP: player.experience || 0,
    };
  };

  // Check for new achievements
  const checkAchievements = async () => {
    if (!publicKey || !isAchievementSystemInitialized || isChecking) {
      return [];
    }

    setIsChecking(true);
    try {
      const playerStats = getPlayerStats();
      const newAchievementIds = await checkAndAwardAchievements(
        publicKey,
        playerStats,
      );

      if (newAchievementIds.length > 0) {
        setNewAchievements(prev => [...prev, ...newAchievementIds]);
      }

      return newAchievementIds;
    } catch (error) {
      return [];
    } finally {
      setIsChecking(false);
    }
  };

  // Track specific activity and check achievements
  const trackActivity = async (
    activity: "mining" | "crafting" | "exploration" | "mission_complete" | "level_up",
    amount: number = 1,
  ) => {
    if (!publicKey || !isAchievementSystemInitialized) {
      return [];
    }

    try {
      // Update activity tracking in localStorage for immediate feedback
      const activityKey = `activity-${publicKey.toString()}-${activity}`;
      const currentCount = parseInt(localStorage.getItem(activityKey) || "0");
      const newCount = currentCount + amount;
      localStorage.setItem(activityKey, newCount.toString());// Small delay to ensure game state is updated, then check achievements
      setTimeout(async () => {
        const newAchievements = await checkAchievements();
        if (newAchievements.length > 0) {}
      }, 500);

      return [];
    } catch (error) {return [];
    }
  };

  // Get achievement by ID
  const getAchievementById = (achievementId: string): HoneycombAchievement | null => {
    return availableAchievements.find(a => a.id === achievementId) || null;
  };

  // Get achievements by category
  const getAchievementsByCategory = (category: string): HoneycombAchievement[] => {
    return availableAchievements.filter(a => a.category === category);
  };

  // Get unlocked achievements
  const getUnlockedAchievements = (): HoneycombAchievement[] => {
    return availableAchievements.filter(a => playerAchievements.includes(a.id));
  };

  // Get locked achievements
  const getLockedAchievements = (): HoneycombAchievement[] => {
    return availableAchievements.filter(a => !playerAchievements.includes(a.id));
  };

  // Get achievement progress
  const getAchievementProgress = (achievementId: string): number => {
    const achievement = getAchievementById(achievementId);
    if (!achievement || playerAchievements.includes(achievementId)) {
      return 100; // Already unlocked
    }

    const playerStats = getPlayerStats();
    const requirements = achievement.requirements;

    // Calculate progress based on requirements
    let totalProgress = 0;
    let requirementCount = 0;

    Object.entries(requirements).forEach(([key, value]) => {
      const currentValue = playerStats[key as keyof typeof playerStats] || 0;
      const progress = Math.min((currentValue / value) * 100, 100);
      totalProgress += progress;
      requirementCount++;
    });

    return requirementCount > 0 ? totalProgress / requirementCount : 0;
  };

  // Get next achievable achievements
  const getNextAchievements = (): HoneycombAchievement[] => {
    const locked = getLockedAchievements();
    return locked
      .map(achievement => ({
        achievement,
        progress: getAchievementProgress(achievement.id),
      }))
      .filter(({ progress }) => progress > 0)
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)
      .map(({ achievement }) => achievement);
  };

  // Clear new achievement notifications
  const clearNewAchievements = () => {
    setNewAchievements([]);
  };

  // Get achievement statistics
  const getAchievementStats = () => {
    const total = availableAchievements.length;
    const unlocked = playerAchievements.length;
    const locked = total - unlocked;

    const byCategory = availableAchievements.reduce((acc, achievement) => {
      const category = achievement.category;
      if (!acc[category]) {
        acc[category] = { total: 0, unlocked: 0 };
      }
      acc[category].total++;
      if (playerAchievements.includes(achievement.id)) {
        acc[category].unlocked++;
      }
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>);

    const byRarity = availableAchievements.reduce((acc, achievement) => {
      const rarity = achievement.rarity;
      if (!acc[rarity]) {
        acc[rarity] = { total: 0, unlocked: 0 };
      }
      acc[rarity].total++;
      if (playerAchievements.includes(achievement.id)) {
        acc[rarity].unlocked++;
      }
      return acc;
    }, {} as Record<string, { total: number; unlocked: number }>);

    return {
      total,
      unlocked,
      locked,
      completionPercentage: total > 0 ? (unlocked / total) * 100 : 0,
      byCategory,
      byRarity,
    };
  };

  return {
    // State
    availableAchievements,
    playerAchievements,
    newAchievements,
    isAchievementSystemInitialized,
    isLoadingAchievements,
    isChecking,

    // Actions
    checkAchievements,
    trackActivity,
    clearNewAchievements,

    // Getters
    getAchievementById,
    getAchievementsByCategory,
    getUnlockedAchievements,
    getLockedAchievements,
    getAchievementProgress,
    getNextAchievements,
    getAchievementStats,

    // Status
    status: getAchievementSystemStatus(),
  };
}
