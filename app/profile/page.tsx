'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useVerxioStore } from '@/stores/verxioStore';
import { useWalletStore } from '@/stores/walletStore';
import { useHoneycombStore } from '@/stores/honeycombStore';
import { formatNumber, getLevelFromExperience, getExperienceProgress } from '@/utils/gameHelpers';
import LoyaltyDashboard from '@/components/ui/LoyaltyDashboard';

export default function ProfilePage() {
  const { inventory, missions } = useGameStore();
  const { player } = usePlayerSync();
  const { playerLoyalty, playerGuild } = useVerxioStore();
  const { solBalance } = useWalletStore();
  const { playerExperience, playerLevel } = useHoneycombStore();

  if (!player) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardBody className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Player Profile</h2>
            <p className="text-default-600 mb-6">
              Connect your wallet to view your player profile and statistics
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const activeMissions = missions.filter(m => m.status === 'active').length;
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = inventory.length;

  // Calculate unified experience from all sources
  const getUnifiedExperience = () => {
    // Priority order: Honeycomb experience > Game store experience > Verxio loyalty points as experience
    if (playerExperience > 0) {
      return playerExperience; // Honeycomb has the authoritative experience
    } else if (player.experience > 0) {
      return player.experience; // Game store experience
    } else if (playerLoyalty && playerLoyalty.points > 0) {
      // Convert loyalty points to experience (1 loyalty point = 1 XP)
      return playerLoyalty.points;
    }
    return 0;
  };

  const unifiedExperience = getUnifiedExperience();
  const currentLevel = getLevelFromExperience(unifiedExperience);
  const experienceProgress = getExperienceProgress(unifiedExperience);

  // Calculate inventory value
  const inventoryValue = inventory.reduce((total, item) => {
    const rarityMultiplier = {
      common: 10,
      rare: 50,
      epic: 200,
      legendary: 1000,
    }[item.rarity] || 10;
    return total + (item.quantity * rarityMultiplier);
  }, 0);

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pb-20 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Player Profile</h1>
          <p className="text-lg text-default-600">
            Your complete space exploration statistics and achievements
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <h3 className="text-xl font-bold">Basic Information</h3>
                  <Chip color="success" variant="flat">
                    Level {currentLevel}
                  </Chip>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-default-500">Player Name</span>
                      <p className="font-medium">{player.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-default-500">Wallet Address</span>
                      <p className="font-mono text-sm">{player.id.slice(0, 8)}...{player.id.slice(-8)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-default-500">Current Level</span>
                      <p className="font-medium">Level {currentLevel}</p>
                    </div>
                    <div>
                      <span className="text-sm text-default-500">Experience Points</span>
                      <p className="font-medium">{formatNumber(unifiedExperience)} XP</p>
                      {playerLoyalty && playerLoyalty.points > 0 && unifiedExperience === playerLoyalty.points && (
                        <p className="text-xs text-default-400">From loyalty points</p>
                      )}
                    </div>
                    <div>
                      <span className="text-sm text-default-500">Level Progress</span>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{formatNumber(experienceProgress.experienceInLevel)} XP</span>
                          <span>{formatNumber(experienceProgress.experienceToNextLevel)} XP to next level</span>
                        </div>
                        <Progress
                          value={experienceProgress.progressPercentage}
                          color="success"
                          size="sm"
                          showValueLabel
                          formatOptions={{ style: 'percent', maximumFractionDigits: 1 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-default-500">Credits</span>
                      <p className="font-medium">{formatNumber(player.credits)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-default-500">SOL Balance</span>
                      <p className="font-medium">{solBalance.toFixed(4)} SOL</p>
                    </div>
                    <div>
                      <span className="text-sm text-default-500">Current Position</span>
                      <p className="font-mono text-sm">
                        ({player.position[0].toFixed(1)}, {player.position[1].toFixed(1)}, {player.position[2].toFixed(1)})
                      </p>
                    </div>
                    {playerLoyalty && (
                      <div>
                        <span className="text-sm text-default-500">Loyalty Tier</span>
                        <div className="flex items-center gap-2">
                          <span>{playerLoyalty.currentTier.icon}</span>
                          <span className="font-medium">{playerLoyalty.currentTier.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold">Statistics</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-500">{completedMissions}</div>
                    <div className="text-sm text-default-500">Missions Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-warning-500">{activeMissions}</div>
                    <div className="text-sm text-default-500">Active Missions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-500">{totalItems}</div>
                    <div className="text-sm text-default-500">Total Items</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary-500">{uniqueItems}</div>
                    <div className="text-sm text-default-500">Unique Items</div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Inventory Summary */}
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold">Inventory Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Inventory Value</h4>
                    <div className="text-2xl font-bold text-success-500 mb-2">
                      {formatNumber(inventoryValue)} Credits
                    </div>
                    <p className="text-sm text-default-500">
                      Estimated total value of all items in your inventory
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Item Distribution</h4>
                    <div className="space-y-2">
                      {['common', 'rare', 'epic', 'legendary'].map(rarity => {
                        const count = inventory.filter(item => item.rarity === rarity).length;
                        const percentage = uniqueItems > 0 ? (count / uniqueItems) * 100 : 0;

                        return (
                          <div key={rarity}>
                            <div className="flex justify-between text-sm">
                              <span className="capitalize">{rarity}</span>
                              <span>{count} items</span>
                            </div>
                            <Progress value={percentage} size="sm" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Guild Information */}
            {playerGuild && (
              <Card>
                <CardHeader>
                  <h3 className="text-xl font-bold">Guild Membership</h3>
                </CardHeader>
                <CardBody>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-3xl">
                      {playerGuild.type === 'mining' ? '⛏️' :
                        playerGuild.type === 'exploration' ? '🚀' :
                          playerGuild.type === 'crafting' ? '🔨' : '🏛️'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{playerGuild.name}</h4>
                      <p className="text-default-600">{playerGuild.description}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="font-bold">Level {playerGuild.level}</div>
                      <div className="text-sm text-default-500">Guild Level</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{playerGuild.memberCount}</div>
                      <div className="text-sm text-default-500">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">{formatNumber(playerGuild.totalReputation)}</div>
                      <div className="text-sm text-default-500">Reputation</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Loyalty Dashboard Sidebar */}
          <div>
            <LoyaltyDashboard />
          </div>
        </div>

        {/* Achievements Section */}
        {playerLoyalty && playerLoyalty.achievements.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-xl font-bold">Achievements</h3>
            </CardHeader>
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {playerLoyalty.achievements.map((achievement, index) => (
                  <Chip key={index} color="warning" variant="flat">
                    🏆 {achievement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
