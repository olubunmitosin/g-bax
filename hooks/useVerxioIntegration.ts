'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useVerxioStore } from '@/stores/verxioStore';
import { useGameStore } from '@/stores/gameStore';
import { PublicKey } from '@solana/web3.js';

/**
 * Custom hook to integrate Verxio loyalty system with game mechanics
 */
export function useVerxioIntegration() {
  const { publicKey, connected } = useWallet();
  const { player, updatePlayerExperience } = useGameStore();

  const {
    verxioService,
    isConnected: verxioConnected,
    isInitializing,
    playerLoyalty,
    playerGuild,
    initializeVerxio,
    loadPlayerLoyalty,
    awardLoyaltyPoints,
    updateReputation,
    updateMemberActivity,
    getMultiplierForPoints,
  } = useVerxioStore();

  // Initialize Verxio when app starts
  useEffect(() => {
    if (!verxioService && !isInitializing) {
      // Verxio doesn't require an API key
      const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

      initializeVerxio(undefined, environment as 'development' | 'production');
    }
  }, [verxioService, isInitializing, initializeVerxio]);

  // Load player loyalty when wallet connects
  useEffect(() => {
    if (connected && publicKey && verxioConnected && !playerLoyalty) {
      loadPlayerLoyalty(publicKey);
    }
  }, [connected, publicKey, verxioConnected, playerLoyalty, loadPlayerLoyalty]);

  // Sync existing loyalty points with game store experience (one-time sync)
  useEffect(() => {
    if (playerLoyalty && player && player.experience === 0 && playerLoyalty.points > 0) {
      // If player has loyalty points but no game experience, sync them
      updatePlayerExperience(playerLoyalty.points);
    }
  }, [playerLoyalty, player, updatePlayerExperience]);

  // Award points for game activities
  const awardPointsForActivity = async (activity: string, basePoints: number) => {
    if (!connected || !publicKey || !verxioConnected) return;

    try {
      // Apply guild bonuses if player is in a guild
      let finalPoints = basePoints;
      if (playerGuild) {
        const experienceBonus = playerGuild.benefits.find(b => b.type === 'experience_boost');
        if (experienceBonus) {
          finalPoints = Math.floor(basePoints * experienceBonus.value);
        }
      }

      await awardLoyaltyPoints(publicKey, finalPoints, activity);

      // Sync loyalty points with game store experience (1 loyalty point = 1 XP)
      updatePlayerExperience(finalPoints);

      // Also update reputation for certain activities
      if (activity.includes('mining') || activity.includes('crafting')) {
        await updateReputation(publicKey, Math.floor(finalPoints / 10), activity);
      }

      // Contribute to guild reputation if player is in a guild
      if (playerGuild && verxioService) {
        const guildContribution = Math.floor(finalPoints / 5); // 20% of points go to guild
        await verxioService.updateGuildContribution(
          publicKey,
          playerGuild.id,
          guildContribution,
          activity
        );
      }

      return finalPoints;
    } catch (error) {
      return 0;
    }
  };

  // Track player activity for guild leadership
  const trackPlayerActivity = async () => {
    if (!connected || !publicKey || !verxioConnected) return;

    try {
      await updateMemberActivity(publicKey);
    } catch (error) {
      // Silently fail - activity tracking is not critical
    }
  };

  // Get current loyalty multiplier
  const getCurrentMultiplier = (): number => {
    if (!playerLoyalty) return 1.0;

    let multiplier = getMultiplierForPoints(playerLoyalty.points);

    // Apply guild bonuses (additive, not multiplicative to prevent exponential growth)
    if (playerGuild) {
      let guildBonus = 0;
      playerGuild.benefits.forEach(benefit => {
        switch (benefit.type) {
          case 'experience_boost':
          case 'resource_bonus':
          case 'mining_efficiency':
          case 'crafting_speed':
            // Convert to additive bonus (benefit.value - 1) and cap at 0.5 (50%)
            guildBonus += Math.min(benefit.value - 1, 0.5);
            break;
        }
      });
      // Cap total guild bonus at 100%
      multiplier += Math.min(guildBonus, 1.0);
    }

    // Cap final multiplier at 3.0 (200% bonus maximum)
    return Math.min(multiplier, 3.0);
  };

  // Get guild benefits for specific activity
  const getGuildBenefits = (activityType: 'mining' | 'crafting' | 'exploration' | 'combat') => {
    if (!playerGuild) return {};

    const benefits: Record<string, number> = {};

    playerGuild.benefits.forEach(benefit => {
      switch (benefit.type) {
        case 'mining_efficiency':
          if (activityType === 'mining') {
            benefits.efficiency = benefit.value;
          }
          break;
        case 'crafting_speed':
          if (activityType === 'crafting') {
            benefits.speed = benefit.value;
          }
          break;
        case 'experience_boost':
          benefits.experience = benefit.value;
          break;
        case 'resource_bonus':
          if (activityType === 'mining') {
            benefits.resourceBonus = benefit.value;
          }
          break;
      }
    });

    return benefits;
  };

  // Check if player can join a specific guild
  const canJoinGuild = (guildId: string): { canJoin: boolean; reason?: string } => {
    if (!player) {
      return { canJoin: false, reason: 'No player data available' };
    }

    if (playerGuild) {
      return { canJoin: false, reason: 'Already in a guild' };
    }

    // Additional checks would go here based on guild requirements
    return { canJoin: true };
  };

  // Calculate loyalty points for different activities
  const calculateActivityPoints = (activity: string, data?: any): number => {
    const basePoints: Record<string, number> = {
      'mining_complete': 10,
      'crafting_complete': 15,
      'mission_complete': 25,
      'exploration_discovery': 20,
      'guild_contribution': 30,
      'daily_login': 5,
      'achievement_unlock': 50,
    };

    let points = basePoints[activity] || 0;

    // Apply multipliers based on activity data
    if (data) {
      switch (activity) {
        case 'mining_complete':
          points += (data.resourcesFound || 0) * 2;
          break;
        case 'crafting_complete':
          points += data.itemRarity === 'legendary' ? 20 : data.itemRarity === 'epic' ? 10 : 0;
          break;
        case 'mission_complete':
          points += (data.difficulty || 1) * 10;
          break;
      }
    }

    return points;
  };

  // Get player's loyalty tier progress
  const getLoyaltyProgress = () => {
    if (!playerLoyalty) return null;

    const currentTier = playerLoyalty.currentTier;
    const points = playerLoyalty.points;

    const progressInTier = points - currentTier.minPoints;
    const tierRange = currentTier.maxPoints === Infinity
      ? 1
      : currentTier.maxPoints - currentTier.minPoints;

    const progressPercentage = tierRange === 1 ? 100 : (progressInTier / tierRange) * 100;

    return {
      currentTier,
      points,
      progressInTier,
      tierRange,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
    };
  };

  // Get guild contribution opportunities
  const getGuildContributions = () => {
    if (!playerGuild) return [];

    return [
      {
        id: 'resource_donation',
        name: 'Donate Resources',
        description: 'Contribute resources to guild treasury',
        pointsReward: 15,
        requirements: ['Have resources in inventory'],
      },
      {
        id: 'mission_completion',
        name: 'Complete Guild Missions',
        description: 'Complete missions on behalf of the guild',
        pointsReward: 30,
        requirements: ['Be guild member'],
      },
      {
        id: 'recruitment',
        name: 'Recruit New Members',
        description: 'Invite new players to join the guild',
        pointsReward: 50,
        requirements: ['Guild officer rank or higher'],
      },
    ];
  };

  return {
    // Connection state
    isConnected: verxioConnected,
    isInitializing,

    // Player data
    playerLoyalty,
    playerGuild,

    // Utility functions
    awardPointsForActivity,
    trackPlayerActivity,
    getCurrentMultiplier,
    getGuildBenefits,
    canJoinGuild,
    calculateActivityPoints,
    getLoyaltyProgress,
    getGuildContributions,

    // Service access
    verxioService,
  };
}
