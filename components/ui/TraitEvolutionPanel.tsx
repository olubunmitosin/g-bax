"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";

import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { useCharacterSystemManager } from "@/hooks/useCharacterSystemManager";
import { formatNumber } from "@/utils/gameHelpers";

interface TraitEvolutionPanelProps {
  className?: string;
}

export default function TraitEvolutionPanel({
  className = "",
}: TraitEvolutionPanelProps) {
  const { publicKey } = useWallet();
  const { player } = useGameStore();
  const {
    playerCharacter,
    isCharacterSystemInitialized,
    evolveCharacterTrait,
    getTraitEvolutionStatus,
    checkTraitEvolution,
  } = useHoneycombStore();

  const { getTraitBenefits } = useCharacterSystemManager();

  const [evolutionStatus, setEvolutionStatus] = useState<any[]>([]);
  const [isEvolving, setIsEvolving] = useState<string | null>(null);

  // Get real player stats from game data and localStorage activity tracking
  const playerStats = useMemo(() => {
    if (!player || !publicKey) {
      return {
        miningCount: 0,
        craftingCount: 0,
        explorationCount: 0,
        combatWins: 0,
        leadershipActions: 0,
        level: 1,
        experience: 0,
      };
    }

    // Get activity counts from localStorage (tracked by achievement system)
    const playerKey = publicKey.toString();
    const miningFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-mining`) || "0");
    const craftingFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-crafting`) || "0");
    const explorationFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-exploration`) || "0");
    const missionsFromStorage = parseInt(localStorage.getItem(`activity-${playerKey}-mission_complete`) || "0");

    return {
      miningCount: Math.max(player.stats?.miningOperations || 0, miningFromStorage),
      craftingCount: Math.max(player.stats?.itemsCrafted || 0, craftingFromStorage),
      explorationCount: Math.max(player.stats?.sectorsExplored || 0, explorationFromStorage),
      combatWins: player.stats?.combatWins || 0,
      leadershipActions: Math.max(player.stats?.leadershipActions || 0, missionsFromStorage),
      level: player.level || 1,
      experience: player.experience || 0,
    };
  }, [player, publicKey]);

  // Load trait evolution status
  useEffect(() => {
    if (playerCharacter && isCharacterSystemInitialized) {
      loadEvolutionStatus();
    }
  }, [playerCharacter, isCharacterSystemInitialized, player]);

  const loadEvolutionStatus = async () => {
    if (!playerCharacter) return;

    try {
      const status = await getTraitEvolutionStatus(
        playerCharacter.address,
        playerStats,
      );
      setEvolutionStatus(status);
    } catch (error) {
      console.error("Failed to load evolution status:", error);
    }
  };

  // Handle trait evolution
  const handleEvolveTrait = async (
    category: string,
    currentTrait: string,
    nextTrait: string,
  ) => {
    if (!playerCharacter) return;

    setIsEvolving(`${category}_${currentTrait}`);
    try {
      await evolveCharacterTrait(
        playerCharacter.address,
        new PublicKey(playerCharacter.owner),
        category,
        currentTrait,
        nextTrait,
      );

      // Reload evolution status
      await loadEvolutionStatus();
    } catch (error) {
      console.error("Failed to evolve trait:", error);
    } finally {
      setIsEvolving(null);
    }
  };

  // Get trait category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Mining":
        return "⛏️";
      case "Crafting":
        return "🔨";
      case "Exploration":
        return "🚀";
      case "Combat":
        return "⚔️";
      case "Leadership":
        return "👑";
      default:
        return "🎯";
    }
  };

  // Get trait rarity color
  const getTraitColor = (traitName: string) => {
    if (traitName.includes("Master") || traitName.includes("Champion") || traitName.includes("Guild Master")) {
      return "warning"; // Legendary
    } else if (traitName.includes("Expert") || traitName.includes("Skilled") || traitName.includes("Deep") || traitName.includes("Warrior") || traitName.includes("Squad")) {
      return "secondary"; // Epic
    } else if (traitName.includes("Novice") || traitName.includes("Apprentice") || traitName.includes("Space") || traitName.includes("Defender") || traitName.includes("Team")) {
      return "primary"; // Common
    }
    return "default";
  };

  // Calculate progress percentage for requirements
  const getProgressPercentage = (requirements: string, category: string) => {
    if (requirements.includes("Mine") && requirements.includes("asteroids")) {
      const required = parseInt(requirements.match(/\d+/)?.[0] || "0");
      return Math.min((playerStats.miningCount / required) * 100, 100);
    } else if (requirements.includes("Craft") && requirements.includes("items")) {
      const required = parseInt(requirements.match(/\d+/)?.[0] || "0");
      return Math.min((playerStats.craftingCount / required) * 100, 100);
    } else if (requirements.includes("Explore") && requirements.includes("sectors")) {
      const required = parseInt(requirements.match(/\d+/)?.[0] || "0");
      return Math.min((playerStats.explorationCount / required) * 100, 100);
    } else if (requirements.includes("level")) {
      const required = parseInt(requirements.match(/level (\d+)/)?.[1] || "0");
      return Math.min((playerStats.level / required) * 100, 100);
    }
    return 0;
  };

  if (!playerCharacter) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🚀</span>
            <span className="text-sm text-default-600">Create a character to see trait evolution</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const evolvableTraits = evolutionStatus.filter(trait => trait.canEvolve);
  const nonEvolvableTraits = evolutionStatus.filter(trait => !trait.canEvolve && trait.nextTrait);

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <h4 className="font-semibold flex items-center gap-2">
          <span>🧬</span>
          Trait Evolution
        </h4>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Evolvable Traits */}
          {evolvableTraits.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-success">Ready to Evolve</h5>
              <div className="space-y-2">
                {evolvableTraits.map((trait, index) => (
                  <div key={index} className="p-3 bg-success/10 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>{getCategoryIcon(trait.category)}</span>
                        <Chip
                          size="sm"
                          color={getTraitColor(trait.currentTrait)}
                          variant="flat"
                        >
                          {trait.currentTrait}
                        </Chip>
                        <span className="text-xs">→</span>
                        <Chip
                          size="sm"
                          color={getTraitColor(trait.nextTrait)}
                          variant="flat"
                        >
                          {trait.nextTrait}
                        </Chip>
                      </div>
                    </div>

                    <div className="text-xs text-success mb-2">
                      ✅ Requirements met: {trait.requirements}
                    </div>

                    <div className="text-xs text-default-600 mb-2">
                      <strong>New Benefits:</strong> {getTraitBenefits(trait.category, trait.nextTrait).description}
                    </div>

                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() => handleEvolveTrait(trait.category, trait.currentTrait, trait.nextTrait)}
                      isLoading={isEvolving === `${trait.category}_${trait.currentTrait}`}
                      className="w-full"
                    >
                      Evolve Trait
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Non-Evolvable Traits with Progress */}
          {nonEvolvableTraits.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Evolution Progress</h5>
              <div className="space-y-2">
                {nonEvolvableTraits.map((trait, index) => {
                  const progress = getProgressPercentage(trait.requirements, trait.category);
                  return (
                    <div key={index} className="p-3 bg-default/5 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span>{getCategoryIcon(trait.category)}</span>
                        <Chip
                          size="sm"
                          color={getTraitColor(trait.currentTrait)}
                          variant="flat"
                        >
                          {trait.currentTrait}
                        </Chip>
                        <span className="text-xs">→</span>
                        <Chip
                          size="sm"
                          color={getTraitColor(trait.nextTrait)}
                          variant="flat"
                        >
                          {trait.nextTrait}
                        </Chip>
                      </div>

                      <div className="text-xs text-default-600 mb-2">
                        Requirements: {trait.requirements}
                      </div>

                      <Progress
                        value={progress}
                        color={progress >= 100 ? "success" : "primary"}
                        size="sm"
                        className="w-full"
                      />
                      <div className="text-xs text-default-500 mt-1">
                        {progress.toFixed(0)}% complete
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Max Level Traits */}
          {evolutionStatus.filter(trait => !trait.nextTrait).length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Mastered Traits</h5>
              <div className="flex flex-wrap gap-1">
                {evolutionStatus
                  .filter(trait => !trait.nextTrait)
                  .map((trait, index) => (
                    <Chip
                      key={index}
                      size="sm"
                      color="warning"
                      variant="flat"
                      startContent={getCategoryIcon(trait.category)}
                    >
                      {trait.currentTrait} ⭐
                    </Chip>
                  ))}
              </div>
            </div>
          )}

          {evolutionStatus.length === 0 && (
            <div className="text-center text-default-500 text-sm">
              No traits available for evolution
            </div>
          )}

          <Divider />

          {/* Player Stats Summary */}
          <div className="p-2 bg-default/5 rounded-lg">
            <h6 className="text-xs font-medium mb-2">Your Progress</h6>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Mining: {formatNumber(playerStats.miningCount)}</div>
              <div>Crafting: {formatNumber(playerStats.craftingCount)}</div>
              <div>Exploration: {formatNumber(playerStats.explorationCount)}</div>
              <div>Level: {playerStats.level}</div>
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success">Evolution synced to blockchain</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
