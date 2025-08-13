"use client";

import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";

import { useTraitBonuses } from "@/hooks/useTraitBonuses";
import { useCharacterSystemManager } from "@/hooks/useCharacterSystemManager";

interface TraitBonusesPanelProps {
  className?: string;
}

export default function TraitBonusesPanel({
  className = "",
}: TraitBonusesPanelProps) {
  const {
    bonuses,
    getBonusSummary,
    getTotalBonusPercentage,
    getSynergyBonus,
    hasTraits,
    isActive,
  } = useTraitBonuses();

  const { playerCharacter } = useCharacterSystemManager();

  if (!isActive || !hasTraits) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💫</span>
            <span className="text-sm text-default-600">
              No trait bonuses active
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const bonusSummary = getBonusSummary();
  const totalBonus = getTotalBonusPercentage();
  const synergyBonus = getSynergyBonus();

  // Get bonus color based on percentage
  const getBonusColor = (bonus: number) => {
    if (bonus >= 30) return "warning"; // High bonus
    if (bonus >= 15) return "secondary"; // Medium bonus
    if (bonus >= 5) return "primary"; // Low bonus
    return "default";
  };

  // Get activity icon
  const getActivityIcon = (activity: string) => {
    switch (activity) {
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
      case "Experience":
        return "⭐";
      default:
        return "🎯";
    }
  };

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <h4 className="font-semibold flex items-center gap-2">
          <span>💫</span>
          Trait Bonuses
        </h4>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Total Bonus Summary */}
          <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Total Bonus Power</span>
              <Chip
                size="sm"
                color={getBonusColor(totalBonus)}
                variant="flat"
              >
                +{totalBonus.toFixed(0)}%
              </Chip>
            </div>
            <Progress
              value={Math.min(totalBonus, 100)}
              color={getBonusColor(totalBonus)}
              size="sm"
              className="w-full"
            />
            <div className="text-xs text-default-600 mt-1">
              {playerCharacter?.traits.length || 0} active traits
            </div>
          </div>

          {/* Individual Bonuses */}
          {bonusSummary.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Active Bonuses</h5>
              <div className="space-y-2">
                {Object.entries(bonuses).map(([key, value]) => {
                  if (value <= 0) return null;
                  
                  const activityName = key.replace("Bonus", "");
                  const displayName = activityName.charAt(0).toUpperCase() + activityName.slice(1);
                  
                  return (
                    <div key={key} className="flex items-center justify-between p-2 bg-default/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>{getActivityIcon(displayName)}</span>
                        <span className="text-sm">{displayName}</span>
                      </div>
                      <Chip
                        size="sm"
                        color={getBonusColor(value)}
                        variant="flat"
                      >
                        +{value}%
                      </Chip>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Synergy Bonus */}
          {synergyBonus > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2">Synergy Effects</h5>
              <div className="p-2 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🔗</span>
                    <span className="text-sm">Multi-Trait Synergy</span>
                  </div>
                  <Chip
                    size="sm"
                    color="warning"
                    variant="flat"
                  >
                    +{synergyBonus}%
                  </Chip>
                </div>
                <div className="text-xs text-warning-600 mt-1">
                  Bonus from having multiple high-level traits
                </div>
              </div>
            </div>
          )}

          <Divider />

          {/* Bonus Effects Explanation */}
          <div>
            <h5 className="text-sm font-medium mb-2">How Bonuses Work</h5>
            <div className="space-y-1 text-xs text-default-600">
              {bonuses.miningBonus > 0 && (
                <div>• Mining: +{bonuses.miningBonus}% resource yield</div>
              )}
              {bonuses.craftingBonus > 0 && (
                <div>• Crafting: +{bonuses.craftingBonus}% crafting speed</div>
              )}
              {bonuses.explorationBonus > 0 && (
                <div>• Exploration: +{bonuses.explorationBonus}% exploration rewards</div>
              )}
              {bonuses.combatBonus > 0 && (
                <div>• Combat: +{bonuses.combatBonus}% combat effectiveness</div>
              )}
              {bonuses.leadershipBonus > 0 && (
                <div>• Leadership: +{bonuses.leadershipBonus}% team bonuses</div>
              )}
              {bonuses.experienceBonus > 0 && (
                <div>• Experience: +{bonuses.experienceBonus}% XP gain</div>
              )}
            </div>
          </div>

          {/* Character Traits Summary */}
          <div>
            <h5 className="text-sm font-medium mb-2">Your Traits</h5>
            <div className="flex flex-wrap gap-1">
              {playerCharacter?.traits.map(([category, name], index) => (
                <Chip
                  key={index}
                  size="sm"
                  color={getBonusColor(bonuses[`${category.toLowerCase()}Bonus` as keyof typeof bonuses] || 0)}
                  variant="flat"
                >
                  {name}
                </Chip>
              ))}
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success">Traits verified on blockchain</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
