'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useVerxioStore } from '@/stores/verxioStore';
import { formatNumber } from '@/utils/gameHelpers';

interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  value: number;
  tier?: string;
  guildName?: string;
}

export default function LeaderboardPage() {
  const [selectedCategory, setSelectedCategory] = useState('loyalty');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const { player } = usePlayerSync();
  const { playerLoyalty, availableGuilds, playerGuild } = useVerxioStore();



  // Generate leaderboard data
  useEffect(() => {
    const entries: LeaderboardEntry[] = [];

    // Add current player if they have real data
    if (player && playerLoyalty) {
      let value = 0;
      let tier = playerLoyalty.currentTier?.name || 'Novice Explorer';
      let guildName = playerGuild?.name || '';

      switch (selectedCategory) {
        case 'loyalty':
          value = playerLoyalty.points || 0;
          break;
        case 'reputation':
          value = playerLoyalty.reputation || 0;
          break;
        case 'experience':
          value = player.experience || 0;
          break;
      }

      if (value > 0) {
        entries.push({
          rank: 1,
          playerId: player.id,
          playerName: player.name || `Explorer ${player.id.slice(0, 8)}`,
          value,
          tier,
          guildName,
        });
      }
    }

    // Sort and set data
    entries.sort((a, b) => b.value - a.value);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    setLeaderboardData(entries);
  }, [selectedCategory, player, playerLoyalty, playerGuild]);

  const getPlayerRank = () => {
    if (!player) return null;
    return leaderboardData.find(entry => entry.playerId === player.id);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'loyalty': return '🏆';
      case 'reputation': return '⭐';
      case 'experience': return '📈';
      case 'guilds': return '🏛️';
      default: return '📊';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'loyalty': return 'Loyalty Points';
      case 'reputation': return 'Reputation';
      case 'experience': return 'Total Experience';
      case 'guilds': return 'Guild Rankings';
      default: return 'Unknown';
    }
  };

  const playerRank = getPlayerRank();

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pb-20 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Leaderboards</h1>
          <p className="text-lg text-default-600">
            See how you rank against other space explorers across different categories
          </p>
        </div>

        {/* Player's Current Rank */}
        {player && playerRank && (
          <Card className="mb-8 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 border-primary-500/20">
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {playerRank.rank <= 3 ? '🥇' : playerRank.rank <= 10 ? '🥈' : '🥉'}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Your Rank</h3>
                    <p className="text-default-600">#{playerRank.rank} in {getCategoryLabel(selectedCategory)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatNumber(playerRank.value)}</div>
                  <div className="text-sm text-default-500">
                    {selectedCategory === 'loyalty' ? 'Points' :
                      selectedCategory === 'reputation' ? 'Reputation' : 'Total XP'}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="mb-6">
          <Tabs
            selectedKey={selectedCategory}
            onSelectionChange={(key) => setSelectedCategory(key as string)}
            className="w-full"
          >
            <Tab key="loyalty" title="🏆 Loyalty Points" />
            <Tab key="reputation" title="⭐ Reputation" />
            <Tab key="experience" title="📈 Experience" />
          </Tabs>
        </div>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCategoryIcon(selectedCategory)}</span>
              <h3 className="text-xl font-bold">{getCategoryLabel(selectedCategory)} Leaderboard</h3>
            </div>
          </CardHeader>
          <CardBody>
            {leaderboardData.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-lg font-bold mb-2">No Rankings Yet</h3>
                <p className="text-default-600">
                  Be the first to appear on the leaderboard by earning {getCategoryLabel(selectedCategory).toLowerCase()}!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {leaderboardData.slice(0, 50).map((entry) => (
                  <div
                    key={entry.playerId}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${entry.playerId === player?.id
                      ? 'bg-primary-50 border border-primary-200'
                      : 'bg-default-50 hover:bg-default-100'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center">
                        {entry.rank <= 3 ? (
                          <span className="text-xl">
                            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="font-bold text-default-500">#{entry.rank}</span>
                        )}
                      </div>

                      <div>
                        <div className="font-medium">{entry.playerName}</div>
                        <div className="text-xs text-default-500">
                          {entry.playerId.slice(0, 8)}...{entry.playerId.slice(-8)}
                        </div>
                      </div>

                      {entry.guildName && (
                        <Chip size="sm" color="secondary" variant="flat">
                          {entry.guildName}
                        </Chip>
                      )}

                      {entry.tier && selectedCategory === 'loyalty' && (
                        <Chip size="sm" color="primary" variant="flat">
                          {entry.tier}
                        </Chip>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="font-bold">{formatNumber(entry.value)}</div>
                      <div className="text-xs text-default-500">
                        {selectedCategory === 'loyalty' ? 'points' :
                          selectedCategory === 'reputation' ? 'reputation' : 'total XP'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Guild Rankings */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏛️</span>
              <h3 className="text-xl font-bold">Guild Rankings</h3>
            </div>
          </CardHeader>
          <CardBody>
            {availableGuilds.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏛️</div>
                <h3 className="text-lg font-bold mb-2">No Guilds Yet</h3>
                <p className="text-default-600">
                  Guilds will appear here as players create and join them
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableGuilds
                  .sort((a, b) => b.totalReputation - a.totalReputation)
                  .map((guild, index) => (
                    <div
                      key={guild.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-default-50 hover:bg-default-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center">
                          {index < 3 ? (
                            <span className="text-xl">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                          ) : (
                            <span className="font-bold text-default-500">#{index + 1}</span>
                          )}
                        </div>

                        <div className="text-xl">
                          {guild.type === 'mining' ? '⛏️' :
                            guild.type === 'exploration' ? '🚀' :
                              guild.type === 'crafting' ? '🔨' : '🏛️'}
                        </div>

                        <div>
                          <div className="font-medium">{guild.name}</div>
                          <div className="text-xs text-default-500 capitalize">{guild.type} guild</div>
                        </div>

                        <Chip size="sm" color="primary" variant="flat">
                          Level {guild.level}
                        </Chip>
                      </div>

                      <div className="text-right">
                        <div className="font-bold">{formatNumber(guild.totalReputation)}</div>
                        <div className="text-xs text-default-500">{guild.memberCount} members</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Leaderboard Info */}
        <Card className="mt-8">
          <CardHeader>
            <h3 className="text-lg font-bold">About Rankings</h3>
          </CardHeader>
          <CardBody>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">🏆 How Rankings Work</h4>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>• Rankings update in real-time as you play</li>
                  <li>• Loyalty points earned through all activities</li>
                  <li>• Reputation gained through quality gameplay</li>
                  <li>• Experience tracks your total progression</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🎯 Climbing the Ranks</h4>
                <ul className="text-sm text-default-600 space-y-1">
                  <li>• Complete missions for bonus points</li>
                  <li>• Join guilds for multiplier bonuses</li>
                  <li>• Consistent play builds reputation</li>
                  <li>• Help others to gain community standing</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
