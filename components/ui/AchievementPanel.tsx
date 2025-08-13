"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";

import { useAchievementTracker } from "@/hooks/useAchievementTracker";
import { HoneycombAchievement } from "@/types";
import { formatNumber } from "@/utils/gameHelpers";

interface AchievementPanelProps {
  className?: string;
}

export default function AchievementPanel({
  className = "",
}: AchievementPanelProps) {
  const {
    availableAchievements,
    playerAchievements,
    newAchievements,
    isAchievementSystemInitialized,
    isLoadingAchievements,
    getUnlockedAchievements,
    getLockedAchievements,
    getAchievementProgress,
    getNextAchievements,
    getAchievementStats,
    clearNewAchievements,
  } = useAchievementTracker();

  const [selectedTab, setSelectedTab] = useState("overview");

  // Get achievement icon based on category
  const getAchievementIcon = (achievement: HoneycombAchievement) => {
    switch (achievement.category) {
      case "mining":
        return "⛏️";
      case "crafting":
        return "🔨";
      case "exploration":
        return "🚀";
      case "progression":
        return "⭐";
      case "missions":
        return "🎯";
      case "special":
        return "💎";
      default:
        return "🏆";
    }
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "default";
      case "rare":
        return "primary";
      case "epic":
        return "secondary";
      case "legendary":
        return "warning";
      default:
        return "default";
    }
  };

  // Render achievement card
  const renderAchievementCard = (achievement: HoneycombAchievement, isUnlocked: boolean) => {
    const progress = getAchievementProgress(achievement.id);
    
    return (
      <div
        key={achievement.id}
        className={`p-3 rounded-lg border ${
          isUnlocked 
            ? "bg-success/10 border-success/20" 
            : "bg-default/5 border-default/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getAchievementIcon(achievement)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h6 className="font-medium text-sm">{achievement.name}</h6>
              <Chip
                size="sm"
                color={getRarityColor(achievement.rarity)}
                variant="flat"
              >
                {achievement.rarity}
              </Chip>
              {isUnlocked && (
                <Chip size="sm" color="success" variant="flat">
                  ✓
                </Chip>
              )}
            </div>
            <p className="text-xs text-default-600 mb-2">
              {achievement.description}
            </p>
            
            {!isUnlocked && (
              <div className="mb-2">
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
            )}

            <div className="text-xs text-default-500">
              <strong>Rewards:</strong> {formatNumber(achievement.rewards.experience)} XP, {formatNumber(achievement.rewards.credits)} credits
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAchievementSystemInitialized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-sm text-warning">Achievement system initializing...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const stats = getAchievementStats();
  const unlockedAchievements = getUnlockedAchievements();
  const lockedAchievements = getLockedAchievements();
  const nextAchievements = getNextAchievements();

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🏆</span>
            Achievements
          </h4>
          {newAchievements.length > 0 && (
            <Button
              size="sm"
              color="success"
              variant="flat"
              onPress={clearNewAchievements}
            >
              Clear ({newAchievements.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Progress Overview */}
          <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm font-medium">
                {stats.unlocked}/{stats.total}
              </span>
            </div>
            <Progress
              value={stats.completionPercentage}
              color="primary"
              size="sm"
              className="w-full"
            />
            <div className="text-xs text-default-600 mt-1">
              {stats.completionPercentage.toFixed(1)}% complete
            </div>
          </div>

          {/* New Achievements */}
          {newAchievements.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-success">🎉 New Achievements!</h5>
              <div className="space-y-2">
                {newAchievements.map(achievementId => {
                  const achievement = availableAchievements.find(a => a.id === achievementId);
                  return achievement ? renderAchievementCard(achievement, true) : null;
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            size="sm"
            className="w-full"
          >
            <Tab key="overview" title="Overview">
              <div className="space-y-3 mt-3">
                {/* Next Achievements */}
                {nextAchievements.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium mb-2">Next to Unlock</h6>
                    <div className="space-y-2">
                      {nextAchievements.slice(0, 3).map(achievement =>
                        renderAchievementCard(achievement, false)
                      )}
                    </div>
                  </div>
                )}

                {/* Recent Unlocked */}
                {unlockedAchievements.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium mb-2">Recently Unlocked</h6>
                    <div className="space-y-2">
                      {unlockedAchievements.slice(-2).map(achievement => 
                        renderAchievementCard(achievement, true)
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="unlocked" title={`Unlocked (${stats.unlocked})`}>
              <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                {unlockedAchievements.length > 0 ? (
                  unlockedAchievements.map(achievement => 
                    renderAchievementCard(achievement, true)
                  )
                ) : (
                  <div className="text-center text-default-500 text-sm py-4">
                    No achievements unlocked yet
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="locked" title={`Locked (${stats.locked})`}>
              <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
                {lockedAchievements.length > 0 ? (
                  lockedAchievements.map(achievement => 
                    renderAchievementCard(achievement, false)
                  )
                ) : (
                  <div className="text-center text-success text-sm py-4">
                    All achievements unlocked! 🎉
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>

          <Divider />

          {/* Statistics */}
          <div className="p-2 bg-default/5 rounded-lg">
            <h6 className="text-xs font-medium mb-2">Statistics</h6>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(stats.byRarity).map(([rarity, data]) => (
                <div key={rarity} className="flex justify-between">
                  <span className="capitalize">{rarity}:</span>
                  <span>{data.unlocked}/{data.total}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success">Achievements verified on blockchain</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
