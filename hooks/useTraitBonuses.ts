"use client";

// No longer need useEffect and useState since bonuses come directly from local character system
import { useLocalCharacterIntegration } from "@/hooks/useLocalCharacterIntegration";

/**
 * Hook to calculate and apply trait-based gameplay bonuses using local character system
 */
export function useTraitBonuses() {
  const { activeCharacter: playerCharacter, isReady: isCharacterSystemInitialized, getTraitBonuses } = useLocalCharacterIntegration();

  // Get bonuses directly from the local character system
  const bonuses = getTraitBonuses();

  // Apply mining bonus to mining results
  const applyMiningBonus = (baseAmount: number): number => {
    const multiplier = 1 + (bonuses.miningBonus / 100);
    return Math.floor(baseAmount * multiplier);
  };

  // Apply crafting bonus to crafting speed/results
  const applyCraftingBonus = (baseTime: number): number => {
    const speedMultiplier = 1 + (bonuses.craftingBonus / 100);
    return Math.max(1000, Math.floor(baseTime / speedMultiplier)); // Minimum 1 second
  };

  // Apply exploration bonus to exploration rewards
  const applyExplorationBonus = (baseReward: number): number => {
    const multiplier = 1 + (bonuses.explorationBonus / 100);
    return Math.floor(baseReward * multiplier);
  };

  // Apply experience bonus to XP gains
  const applyExperienceBonus = (baseXP: number): number => {
    const multiplier = 1 + (bonuses.experienceBonus / 100);
    return Math.floor(baseXP * multiplier);
  };

  // Get trait bonus summary for display
  const getBonusSummary = () => {
    const activeBonuses = [];

    if (bonuses.miningBonus > 0) {
      activeBonuses.push(`Mining: +${bonuses.miningBonus}%`);
    }
    if (bonuses.craftingBonus > 0) {
      activeBonuses.push(`Crafting: +${bonuses.craftingBonus}%`);
    }
    if (bonuses.explorationBonus > 0) {
      activeBonuses.push(`Exploration: +${bonuses.explorationBonus}%`);
    }
    if (bonuses.combatBonus > 0) {
      activeBonuses.push(`Combat: +${bonuses.combatBonus}%`);
    }
    if (bonuses.leadershipBonus > 0) {
      activeBonuses.push(`Leadership: +${bonuses.leadershipBonus}%`);
    }
    if (bonuses.experienceBonus > 0) {
      activeBonuses.push(`Experience: +${bonuses.experienceBonus}%`);
    }

    return activeBonuses;
  };

  // Get total bonus percentage (for display purposes)
  const getTotalBonusPercentage = (): number => {
    return Object.values(bonuses).reduce((sum, bonus) => sum + bonus, 0);
  };

  // Check if player has specific trait category
  const hasTraitCategory = (category: string): boolean => {
    if (!playerCharacter) return false;
    return playerCharacter.traits.some(([traitCategory]) => traitCategory === category);
  };

  // Get highest trait in category
  const getHighestTraitInCategory = (category: string): string | null => {
    if (!playerCharacter) return null;

    const categoryTraits = playerCharacter.traits.filter(([traitCategory]) => traitCategory === category);
    if (categoryTraits.length === 0) return null;

    // Return the trait name (assuming only one trait per category)
    return categoryTraits[0][1];
  };

  // Get trait level (based on trait name)
  const getTraitLevel = (traitName: string): number => {
    if (traitName.includes("Novice") || traitName.includes("Apprentice") || traitName.includes("Space") || traitName.includes("Defender") || traitName.includes("Team")) {
      return 1;
    } else if (traitName.includes("Expert") || traitName.includes("Skilled") || traitName.includes("Deep") || traitName.includes("Warrior") || traitName.includes("Squad")) {
      return 2;
    } else if (traitName.includes("Master") || traitName.includes("Champion") || traitName.includes("Guild Master") || traitName.includes("Void")) {
      return 3;
    }
    return 0;
  };

  // Calculate trait synergy bonus (when player has multiple high-level traits)
  const getSynergyBonus = (): number => {
    if (!playerCharacter) return 0;

    const traitLevels = playerCharacter.traits.map(([, traitName]) => getTraitLevel(traitName));
    const highLevelTraits = traitLevels.filter(level => level >= 2).length;
    const maxLevelTraits = traitLevels.filter(level => level >= 3).length;

    // Synergy bonus: 5% per high-level trait, 10% per max-level trait
    return (highLevelTraits * 5) + (maxLevelTraits * 10);
  };

  return {
    // Current bonuses
    bonuses,

    // Bonus application functions
    applyMiningBonus,
    applyCraftingBonus,
    applyExplorationBonus,
    applyExperienceBonus,

    // Utility functions
    getBonusSummary,
    getTotalBonusPercentage,
    hasTraitCategory,
    getHighestTraitInCategory,
    getTraitLevel,
    getSynergyBonus,

    // Status
    hasTraits: (playerCharacter?.traits?.length || 0) > 0,
    isActive: isCharacterSystemInitialized && !!playerCharacter,
  };
}
