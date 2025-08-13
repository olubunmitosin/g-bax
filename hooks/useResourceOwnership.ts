"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { GameResource, PlayerResourceHolding } from "@/types";

/**
 * Hook to manage on-chain resource ownership and inventory
 */
export function useResourceOwnership() {
  const { publicKey, connected } = useWallet();
  const {
    honeycombService,
    isConnected: honeycombConnected,
    gameResources,
    playerResourceHoldings,
    isResourceSystemInitialized,
    isLoadingResources,
    initializeGameResources,
    awardResourceToPlayer,
    transferResource,
    consumePlayerResource,
    loadPlayerResourceHoldings,
    getResourceSystemStatus,
  } = useHoneycombStore();

  const [isTransferring, setIsTransferring] = useState(false);
  const [isConsuming, setIsConsuming] = useState(false);

  // Auto-initialize resource system when conditions are met
  useEffect(() => {
    if (
      connected &&
      honeycombConnected &&
      publicKey &&
      !isResourceSystemInitialized &&
      !isLoadingResources
    ) {
      const timer = setTimeout(() => {
        initializeGameResources(publicKey, undefined);
      }, 8000); // Wait 8 seconds after connection to avoid conflicts

      return () => clearTimeout(timer);
    }
  }, [connected, honeycombConnected, publicKey, isResourceSystemInitialized, isLoadingResources]);

  // Auto-load player resource holdings when system is ready
  useEffect(() => {
    if (
      isResourceSystemInitialized &&
      publicKey &&
      playerResourceHoldings.length === 0 &&
      !isLoadingResources
    ) {
      const timer = setTimeout(() => {
        loadPlayerResourceHoldings(publicKey);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isResourceSystemInitialized, publicKey, playerResourceHoldings.length, isLoadingResources]);

  // Get resource by ID
  const getResourceById = (resourceId: string): GameResource | null => {
    return gameResources.find(r => r.id === resourceId) || null;
  };

  // Get player's holding for a specific resource
  const getPlayerResourceAmount = (resourceId: string): number => {
    const holding = playerResourceHoldings.find(h => h.resourceId === resourceId);
    return holding?.amount || 0;
  };

  // Get resources by category
  const getResourcesByCategory = (category: string): GameResource[] => {
    return gameResources.filter(r => r.category === category);
  };

  // Get resources by rarity
  const getResourcesByRarity = (rarity: string): GameResource[] => {
    return gameResources.filter(r => r.rarity === rarity);
  };

  // Get player's total resource count
  const getTotalResourceCount = (): number => {
    return playerResourceHoldings.reduce((total, holding) => total + holding.amount, 0);
  };

  // Get player's resources by category
  const getPlayerResourcesByCategory = (category: string): PlayerResourceHolding[] => {
    return playerResourceHoldings.filter(holding => {
      const resource = getResourceById(holding.resourceId);
      return resource?.category === category;
    });
  };

  // Get player's most valuable resources
  const getMostValuableResources = (): PlayerResourceHolding[] => {
    return playerResourceHoldings
      .filter(holding => holding.amount > 0)
      .sort((a, b) => {
        const resourceA = getResourceById(a.resourceId);
        const resourceB = getResourceById(b.resourceId);

        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        const rarityA = rarityOrder[resourceA?.rarity as keyof typeof rarityOrder] || 0;
        const rarityB = rarityOrder[resourceB?.rarity as keyof typeof rarityOrder] || 0;

        return rarityB - rarityA;
      })
      .slice(0, 10);
  };

  // Award mining rewards as on-chain resources
  const awardMiningRewards = async (
    miningResults: Array<{ type: string; quantity: number; rarity: string }>,
  ): Promise<boolean> => {
    if (!publicKey || !isResourceSystemInitialized) return false;

    try {
      const success = await honeycombService?.awardMiningRewards(
        publicKey,
        miningResults,
      );

      if (success) {
        // Reload holdings to reflect new resources
        await loadPlayerResourceHoldings(publicKey);
      }

      return success || false;
    } catch (error) {
      return false;
    }
  };

  // Award crafting result as on-chain resource
  const awardCraftingResult = async (
    craftedItem: { type: string; rarity: string },
  ): Promise<boolean> => {
    if (!publicKey || !isResourceSystemInitialized) return false;

    try {
      const success = await honeycombService?.awardCraftingResult(
        publicKey,
        craftedItem,
      );

      if (success) {
        // Reload holdings to reflect new item
        await loadPlayerResourceHoldings(publicKey);
      }

      return success || false;
    } catch (error) {return false;
    }
  };

  // Transfer resource to another player
  const transferResourceToPlayer = async (
    toPlayerAddress: string,
    resourceId: string,
    amount: number,
  ): Promise<boolean> => {
    if (!publicKey || !isResourceSystemInitialized) return false;

    setIsTransferring(true);
    try {
      const toPublicKey = new (await import("@solana/web3.js")).PublicKey(toPlayerAddress);
      const success = await transferResource(
        publicKey,
        toPublicKey,
        resourceId,
        amount,
      );

      if (success) {}

      return success;
    } catch (error) {return false;
    } finally {
      setIsTransferring(false);
    }
  };

  // Consume resource for crafting or other activities
  const consumeResource = async (
    resourceId: string,
    amount: number,
  ): Promise<boolean> => {
    if (!publicKey || !isResourceSystemInitialized) return false;

    setIsConsuming(true);
    try {
      const success = await consumePlayerResource(
        publicKey,
        resourceId,
        amount,
      );

      if (success) {}

      return success;
    } catch (error) {return false;
    } finally {
      setIsConsuming(false);
    }
  };

  // Check if player has enough resources for a recipe
  const hasResourcesForRecipe = (
    requiredResources: Array<{ resourceId: string; amount: number }>,
  ): boolean => {
    return requiredResources.every(requirement => {
      const playerAmount = getPlayerResourceAmount(requirement.resourceId);
      return playerAmount >= requirement.amount;
    });
  };

  // Get resource statistics
  const getResourceStats = () => {
    const totalResources = getTotalResourceCount();
    const uniqueResources = playerResourceHoldings.filter(h => h.amount > 0).length;

    const byCategory = gameResources.reduce((acc, resource) => {
      const category = resource.category;
      if (!acc[category]) {
        acc[category] = { total: 0, owned: 0 };
      }
      acc[category].total++;

      const playerAmount = getPlayerResourceAmount(resource.id);
      if (playerAmount > 0) {
        acc[category].owned++;
      }

      return acc;
    }, {} as Record<string, { total: number; owned: number }>);

    const byRarity = gameResources.reduce((acc, resource) => {
      const rarity = resource.rarity;
      if (!acc[rarity]) {
        acc[rarity] = { total: 0, owned: 0 };
      }
      acc[rarity].total++;

      const playerAmount = getPlayerResourceAmount(resource.id);
      if (playerAmount > 0) {
        acc[rarity].owned++;
      }

      return acc;
    }, {} as Record<string, { total: number; owned: number }>);

    return {
      totalResources,
      uniqueResources,
      totalTypes: gameResources.length,
      collectionPercentage: gameResources.length > 0 ? (uniqueResources / gameResources.length) * 100 : 0,
      byCategory,
      byRarity,
    };
  };

  return {
    // State
    gameResources,
    playerResourceHoldings,
    isResourceSystemInitialized,
    isLoadingResources,
    isTransferring,
    isConsuming,

    // Actions
    awardMiningRewards,
    awardCraftingResult,
    transferResourceToPlayer,
    consumeResource,

    // Getters
    getResourceById,
    getPlayerResourceAmount,
    getResourcesByCategory,
    getResourcesByRarity,
    getTotalResourceCount,
    getPlayerResourcesByCategory,
    getMostValuableResources,
    hasResourcesForRecipe,
    getResourceStats,

    // Status
    status: getResourceSystemStatus(),
    canUseResources: !!(publicKey && honeycombConnected && isResourceSystemInitialized),
  };
}
