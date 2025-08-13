"use client";

import { useEffect, useState } from "react";
import { useHoneycombStore } from "@/stores/honeycombStore";
import { useCharacterSystemManager } from "./useCharacterSystemManager";

/**
 * Hook to calculate and apply trait-based gameplay bonuses
 */
export function useTraitBonuses() {
  const { playerCharacter, isCharacterSystemInitialized } = useHoneycombStore();
  const { getTraitBenefits } = useCharacterSystemManager();

  const [bonuses, setBonuses] = useState({
    miningBonus: 0,
    craftingBonus: 0,
    explorationBonus: 0,
    combatBonus: 0,
    leadershipBonus: 0,
    experienceBonus: 0,
  });

  // Calculate bonuses from character traits
  useEffect(() => {
    if (!playerCharacter || !isCharacterSystemInitialized) {
      setBonuses({
        miningBonus: 0,
        craftingBonus: 0,
        explorationBonus: 0,
        combatBonus: 0,
        leadershipBonus: 0,
        experienceBonus: 0,
      });
      return;
    }

    let totalBonuses = {
      miningBonus: 0,
      craftingBonus: 0,
      explorationBonus: 0,
      combatBonus: 0,
      leadershipBonus: 0,
      experienceBonus: 0,
    };

    // Calculate bonuses from each trait
    playerCharacter.traits.forEach(([category, traitName]) => {
      const benefits = getTraitBenefits(category, traitName);

      if (benefits.miningBonus) {
        totalBonuses.miningBonus += benefits.miningBonus;
      }
      if (benefits.craftingBonus) {
        totalBonuses.craftingBonus += benefits.craftingBonus;
      }
      if (benefits.explorationBonus) {
        totalBonuses.explorationBonus += benefits.explorationBonus;
      }
      if (benefits.combatBonus) {
        totalBonuses.combatBonus += benefits.combatBonus;
      }
      if (benefits.leadershipBonus) {
        totalBonuses.leadershipBonus += benefits.leadershipBonus;
      }
    });

    // Add experience bonus based on total trait bonuses (synergy effect)
    const totalTraitBonuses = Object.values(totalBonuses).reduce((sum, bonus) => sum + bonus, 0);
    totalBonuses.experienceBonus = Math.floor(totalTraitBonuses * 0.1); // 10% of total bonuses as XP bonus

    setBonuses(totalBonuses);
  }, [playerCharacter, isCharacterSystemInitialized, getTraitBenefits]);

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
