'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { useVerxioStore } from '@/stores/verxioStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { formatNumber } from '@/utils/gameHelpers';
import GuildBrowser from '@/components/ui/GuildBrowser';

export default function GuildsPage() {
  const [showBrowser, setShowBrowser] = useState(false);
  const { playerGuild, guildMembers, availableGuilds, loadAvailableGuilds, loadPlayerLoyalty, isLoadingGuilds, forceRefreshGuildData, playerLoyalty } = useVerxioStore();
  const { player } = usePlayerSync();

  // Get current guild data from availableGuilds (like leaderboard does)
  const getCurrentGuild = () => {
    if (!playerLoyalty?.guildId) return null;
    return availableGuilds.find(guild => guild.id === playerLoyalty.guildId) || null;
  };

  const currentGuild = getCurrentGuild();

  // Refresh guild data when page loads
  useEffect(() => {
    if (player?.id) {
      const playerPublicKey = new (require('@solana/web3.js')).PublicKey(player.id);
      forceRefreshGuildData(playerPublicKey);
    } else {
      loadAvailableGuilds();
    }
  }, [forceRefreshGuildData, loadAvailableGuilds, player?.id]);

  const getGuildTypeIcon = (type: string) => {
    switch (type) {
      case 'mining': return '⛏️';
      case 'exploration': return '🚀';
      case 'crafting': return '🔨';
      case 'combat': return '⚔️';
      case 'mixed': return '🌟';
      default: return '🏛️';
    }
  };

  const getGuildTypeColor = (type: string) => {
    switch (type) {
      case 'mining': return 'warning';
      case 'exploration': return 'primary';
      case 'crafting': return 'secondary';
      case 'combat': return 'danger';
      case 'mixed': return 'success';
      default: return 'default';
    }
  };

  const handleRefreshData = async () => {
    if (player?.id) {
      const playerPublicKey = new (require('@solana/web3.js')).PublicKey(player.id);
      await forceRefreshGuildData(playerPublicKey);
    } else {
      await loadAvailableGuilds();
    }
  };

  // Debug function to check localStorage data
  const debugGuildData = () => {
    console.log('=== GUILD DEBUG DATA ===');
    const guildsData = localStorage.getItem('verxio_guilds');
    if (guildsData) {
      const guilds = JSON.parse(guildsData);
      console.log('Guilds in localStorage:', guilds);
    }

    if (player?.id) {
      const membershipData = localStorage.getItem(`verxio_guild_member_${player.id}`);
      console.log('Player membership data:', membershipData);

      const loyaltyData = localStorage.getItem(`verxio_loyalty_${player.id}`);
      console.log('Player loyalty data:', loyaltyData);
    }

    console.log('Current playerGuild state:', playerGuild);
    console.log('Current availableGuilds state:', availableGuilds);
    console.log('========================');
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pb-20 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Guild System</h1>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            Join forces with other space explorers! Guilds provide bonuses, community, and shared progression.
            Work together to build the strongest guild in the galaxy.
          </p>
        </div>

        {/* Player Guild Status */}
        {player ? (
          currentGuild ? (
            <Card className="mb-8 bg-gradient-to-r from-success-500/10 to-primary-500/10 border-success-500/20">
              <CardHeader>
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getGuildTypeIcon(currentGuild.type)}</span>
                    <div>
                      <h3 className="text-xl font-bold">{currentGuild.name}</h3>
                      <p className="text-default-600">Your Guild</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={handleRefreshData}
                      isLoading={isLoadingGuilds}
                      title="Refresh guild data"
                    >
                      🔄
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={debugGuildData}
                      title="Debug guild data"
                    >
                      🐛
                    </Button>
                    <Button
                      size="sm"
                      color="warning"
                      variant="flat"
                      onPress={handleRefreshData}
                      isLoading={isLoadingGuilds}
                    >
                      Force Refresh
                    </Button>
                    <Chip color="success" variant="flat">
                      Member
                    </Chip>
                    <Chip color="primary" variant="flat">
                      Level {currentGuild.level}
                    </Chip>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Guild Info</h4>
                    <p className="text-sm text-default-600 mb-3">{currentGuild.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Members:</span>
                        <span className="text-sm font-medium">{currentGuild.memberCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Reputation:</span>
                        <span className="text-sm font-medium">{formatNumber(currentGuild.totalReputation)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Type:</span>
                        <Chip size="sm" color={getGuildTypeColor(currentGuild.type)} variant="flat">
                          {currentGuild.type}
                        </Chip>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Guild Benefits</h4>
                    <div className="space-y-2">
                      {currentGuild.benefits.map((benefit, index) => (
                        <div key={index} className="bg-success-50 rounded p-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{benefit.description}</span>
                            <Chip size="sm" color="success" variant="flat">
                              {benefit.value}x
                            </Chip>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Guild Progress</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Level Progress</span>
                          <span>Level {playerGuild.level}</span>
                        </div>
                        <Progress
                          value={Math.min(100, (playerGuild.totalReputation % 1000) / 10)}
                          color="primary"
                        />
                        <p className="text-xs text-default-500 mt-1">
                          {1000 - (playerGuild.totalReputation % 1000)} reputation to next level
                        </p>
                      </div>

                      {guildMembers.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium mb-2">Recent Members</h5>
                          <div className="space-y-1">
                            {guildMembers.slice(0, 3).map((member, index) => (
                              <div key={index} className="flex justify-between text-xs">
                                <span>{member.playerName}</span>
                                <span className="text-default-500">{member.rank}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="mb-8 bg-gradient-to-r from-warning-500/10 to-primary-500/10 border-warning-500/20">
              <CardBody className="text-center py-8">
                <h3 className="text-xl font-bold mb-2">No Guild Membership</h3>
                <p className="text-default-600 mb-4">
                  You're not currently a member of any guild. Join one to unlock bonuses and community features!
                </p>
                <Button
                  color="primary"
                  onPress={() => setShowBrowser(true)}
                >
                  Browse Available Guilds
                </Button>
              </CardBody>
            </Card>
          )
        ) : (
          <Card className="mb-8">
            <CardBody className="text-center py-8">
              <h3 className="text-xl font-bold mb-2">Connect Wallet</h3>
              <p className="text-default-600">
                Connect your wallet to view and join guilds
              </p>
            </CardBody>
          </Card>
        )}

        {/* Guild Browser */}
        {showBrowser && (
          <div className="mb-8">
            <GuildBrowser onClose={() => setShowBrowser(false)} />
          </div>
        )}

        {/* Available Guilds Overview */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Available Guilds</h2>
            <Button
              color="primary"
              variant="flat"
              onPress={() => setShowBrowser(!showBrowser)}
            >
              {showBrowser ? 'Hide Browser' : 'Browse Guilds'}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {availableGuilds.map((guild) => (
              <Card key={guild.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getGuildTypeIcon(guild.type)}</span>
                    <div>
                      <h4 className="font-semibold">{guild.name}</h4>
                      <Chip size="sm" color={getGuildTypeColor(guild.type)} variant="flat">
                        {guild.type}
                      </Chip>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-sm text-default-600 mb-3">{guild.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <div className="font-bold">{guild.memberCount}</div>
                      <div className="text-default-500">Members</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">Lv.{guild.level}</div>
                      <div className="text-default-500">Guild Level</div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>

        {/* Guild System Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold">Guild Benefits</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">🏛️ Community</h4>
                <p className="text-sm text-default-600">
                  Connect with like-minded players, share strategies, and build lasting friendships in the cosmos.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">⚡ Bonuses</h4>
                <p className="text-sm text-default-600">
                  Gain passive bonuses to mining speed, crafting efficiency, experience gain, and resource yields.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🎯 Shared Goals</h4>
                <p className="text-sm text-default-600">
                  Work together to level up your guild, unlock better benefits, and compete with other guilds.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">🏆 Recognition</h4>
                <p className="text-sm text-default-600">
                  Build reputation within your guild and the broader community through contributions and achievements.
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold">How Guilds Work</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Join a Guild</h4>
                <p className="text-sm text-default-600">
                  Meet the requirements and join a guild that matches your playstyle and goals.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">2. Contribute</h4>
                <p className="text-sm text-default-600">
                  Your activities automatically contribute to guild reputation and progression.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">3. Level Up</h4>
                <p className="text-sm text-default-600">
                  As your guild gains reputation, it levels up and unlocks better benefits for all members.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">4. Advance Ranks</h4>
                <p className="text-sm text-default-600">
                  Active contributors can advance from Member to Officer to Leader, gaining additional privileges.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
