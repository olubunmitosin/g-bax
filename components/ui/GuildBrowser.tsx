'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { useVerxioStore } from '@/stores/verxioStore';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import type { Guild } from '@/services/verxioService';
import { formatNumber } from '@/utils/gameHelpers';
import NotificationSystem, { useNotifications } from '@/components/ui/NotificationSystem';

interface GuildBrowserProps {
  onClose?: () => void;
  className?: string;
}

export default function GuildBrowser({ onClose: onClosePanel, className = "" }: GuildBrowserProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const {
    availableGuilds,
    playerGuild,
    playerLoyalty,
    isLoadingGuilds,
    joinGuild,
    leaveGuild,
    loadAvailableGuilds,
  } = useVerxioStore();

  const { player } = useGameStore();
  const { player: syncedPlayer } = usePlayerSync();
  const { notifications, removeNotification, showSuccess, showError, showWarning } = useNotifications();

  // Refresh guild data when component mounts or when joining/leaving
  useEffect(() => {
    loadAvailableGuilds();
  }, [loadAvailableGuilds]);

  // Get current guild data from availableGuilds (like leaderboard and guilds page)
  const getCurrentGuild = () => {
    if (!playerLoyalty?.guildId) return null;
    return availableGuilds.find(guild => guild.id === playerLoyalty.guildId) || null;
  };

  const currentGuild = getCurrentGuild();

  const handleGuildClick = (guild: Guild) => {
    setSelectedGuild(guild);
    onOpen();
  };

  const handleJoinGuild = async () => {
    if (!selectedGuild || !syncedPlayer) return;

    setIsJoining(true);
    try {
      // Convert player ID to PublicKey (assuming it's a valid public key string)
      const playerPublicKey = new (await import('@solana/web3.js')).PublicKey(syncedPlayer.id);
      const result = await joinGuild(playerPublicKey, selectedGuild.id);

      if (result.success) {
        showSuccess('Guild Joined!', `Welcome to ${selectedGuild.name}! You can now enjoy guild benefits.`);
        onClose();
      } else {
        showError('Failed to Join Guild', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      showError('Failed to Join Guild', 'An unexpected error occurred');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveGuild = async () => {
    if (!syncedPlayer || !currentGuild) return;

    setIsLeaving(true);
    try {
      const playerPublicKey = new (await import('@solana/web3.js')).PublicKey(syncedPlayer.id);
      const result = await leaveGuild(playerPublicKey);

      if (result.success) {
        showSuccess('Left Guild', `You have left ${currentGuild.name}. You can join another guild anytime.`);
      } else {
        showError('Failed to Leave Guild', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      showError('Failed to Leave Guild', 'An unexpected error occurred');
    } finally {
      setIsLeaving(false);
    }
  };

  const checkGuildRequirements = (guild: Guild): { canJoin: boolean; failedRequirements: string[] } => {
    const failedRequirements: string[] = [];

    if (!player || !playerLoyalty) {
      failedRequirements.push('Player data not available');
      return { canJoin: false, failedRequirements };
    }

    for (const requirement of guild.requirements) {
      switch (requirement.type) {
        case 'level':
          if (player.level < (requirement.value as number)) {
            failedRequirements.push(`Requires level ${requirement.value}, you are level ${player.level}`);
          }
          break;
        case 'reputation':
          if (playerLoyalty.reputation < (requirement.value as number)) {
            failedRequirements.push(`Requires ${requirement.value} reputation, you have ${playerLoyalty.reputation}`);
          }
          break;
        case 'achievement':
          if (!playerLoyalty.achievements.includes(requirement.value as string)) {
            failedRequirements.push(`Requires achievement: ${requirement.description}`);
          }
          break;
      }
    }

    return { canJoin: failedRequirements.length === 0, failedRequirements };
  };

  const getGuildTypeColor = (type: Guild['type']) => {
    switch (type) {
      case 'mining': return 'warning';
      case 'exploration': return 'primary';
      case 'crafting': return 'secondary';
      case 'combat': return 'danger';
      case 'mixed': return 'success';
      default: return 'default';
    }
  };

  const getGuildTypeIcon = (type: Guild['type']) => {
    switch (type) {
      case 'mining': return '⛏️';
      case 'exploration': return '🚀';
      case 'crafting': return '🔨';
      case 'combat': return '⚔️';
      case 'mixed': return '🌟';
      default: return '🏛️';
    }
  };

  if (isLoadingGuilds) {
    return (
      <Card className={`w-96 ${className}`}>
        <CardBody className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-default-500">Loading guilds...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card className={`w-96 h-[600px] ${className}`}>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Guild Browser</h3>
          <div className="flex items-center gap-2">
            {currentGuild && (
              <Chip size="sm" color="success" variant="flat">
                Member of {currentGuild.name}
              </Chip>
            )}
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={loadAvailableGuilds}
              isLoading={isLoadingGuilds}
              className="text-default-400 hover:text-default-600"
              title="Refresh guild data"
            >
              🔄
            </Button>
            {onClosePanel && (
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={onClosePanel}
                className="text-default-400 hover:text-default-600"
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody className="space-y-3 overflow-y-auto">
          {/* Current Guild Section */}
          {currentGuild && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold mb-2 text-success-600">Your Current Guild</h4>
              <Card className="border-success-200 bg-success-50">
                <CardBody className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getGuildTypeIcon(currentGuild.type)}</span>
                      <div>
                        <div className="font-semibold">{currentGuild.name}</div>
                        <div className="text-xs text-default-600">
                          Level {currentGuild.level} • {currentGuild.memberCount} members
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={handleLeaveGuild}
                      isLoading={isLeaving}
                      isDisabled={isLeaving}
                    >
                      Leave
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

          {/* Available Guilds */}
          <div>
            <h4 className="text-sm font-semibold mb-2">
              {currentGuild ? 'Other Available Guilds' : 'Available Guilds'}
            </h4>
            {availableGuilds.length === 0 ? (
              <div className="text-center text-default-500 py-8">
                No guilds available
              </div>
            ) : (
              availableGuilds
                .filter(guild => guild.id !== currentGuild?.id) // Don't show current guild in the list
                .map((guild) => (
                  <Card
                    key={guild.id}
                    isPressable
                    onPress={() => handleGuildClick(guild)}
                    className="hover:scale-105 transition-transform cursor-pointer"
                  >
                    <CardBody className="p-4">
                      <div className="space-y-3">
                        {/* Guild Header */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{getGuildTypeIcon(guild.type)}</span>
                              <h4 className="font-semibold truncate">{guild.name}</h4>
                            </div>
                            <p className="text-xs text-default-600 line-clamp-2">
                              {guild.description}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Chip
                              size="sm"
                              color={getGuildTypeColor(guild.type)}
                              variant="flat"
                            >
                              {guild.type}
                            </Chip>
                            <Chip size="sm" variant="flat">
                              Lv. {guild.level}
                            </Chip>
                          </div>
                        </div>

                        {/* Guild Stats */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-bold">{guild.memberCount}</div>
                            <div className="text-default-500">Members</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{formatNumber(guild.totalReputation)}</div>
                            <div className="text-default-500">Reputation</div>
                          </div>
                        </div>

                        {/* Benefits Preview */}
                        <div className="space-y-1">
                          <div className="text-xs font-medium">Benefits:</div>
                          <div className="flex flex-wrap gap-1">
                            {guild.benefits.slice(0, 2).map((benefit, index) => (
                              <Chip key={index} size="sm" variant="flat" color="success">
                                {benefit.description}
                              </Chip>
                            ))}
                            {guild.benefits.length > 2 && (
                              <Chip size="sm" variant="flat" color="default">
                                +{guild.benefits.length - 2} more
                              </Chip>
                            )}
                          </div>
                        </div>

                        {/* Requirements Check */}
                        <div className="flex justify-between items-center">
                          <div className="text-xs">
                            {checkGuildRequirements(guild) ? (
                              <span className="text-green-600">✓ Requirements met</span>
                            ) : (
                              <span className="text-red-600">✗ Requirements not met</span>
                            )}
                          </div>
                          {currentGuild?.id === guild.id && (
                            <Chip size="sm" color="primary" variant="flat">
                              Current Guild
                            </Chip>
                          )}
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Guild Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedGuild && getGuildTypeIcon(selectedGuild.type)}</span>
              <div>
                <h3 className="text-xl font-bold">{selectedGuild?.name}</h3>
                <div className="flex gap-2">
                  <Chip
                    size="sm"
                    color={selectedGuild ? getGuildTypeColor(selectedGuild.type) : 'default'}
                    variant="flat"
                  >
                    {selectedGuild?.type}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    Level {selectedGuild?.level}
                  </Chip>
                </div>
              </div>
            </div>
          </ModalHeader>

          <ModalBody>
            {selectedGuild && (
              <div className="space-y-4">
                <p className="text-default-600">{selectedGuild.description}</p>

                {/* Guild Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{selectedGuild.memberCount}</div>
                    <div className="text-sm text-default-500">Members</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatNumber(selectedGuild.totalReputation)}</div>
                    <div className="text-sm text-default-500">Reputation</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{selectedGuild.level}</div>
                    <div className="text-sm text-default-500">Guild Level</div>
                  </div>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="font-semibold mb-2">Guild Benefits</h4>
                  <div className="space-y-2">
                    {selectedGuild.benefits.map((benefit, index) => (
                      <div key={index} className="flex justify-between items-center bg-success-50 rounded p-2">
                        <span className="text-sm">{benefit.description}</span>
                        <Chip size="sm" color="success" variant="flat">
                          {benefit.value}x
                        </Chip>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h4 className="font-semibold mb-2">Requirements</h4>
                  <div className="space-y-2">
                    {selectedGuild.requirements.map((requirement, index) => {
                      const requirementCheck = checkGuildRequirements(selectedGuild);
                      const isRequirementMet = requirementCheck.canJoin || !requirementCheck.failedRequirements.some(failed =>
                        failed.includes(requirement.description) || failed.includes(requirement.value.toString())
                      );

                      return (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{requirement.description}</span>
                          <span className={`text-xs ${isRequirementMet ? 'text-success-600' : 'text-danger-600'}`}>
                            {isRequirementMet ? '✓' : '✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show failed requirements */}
                  {(() => {
                    const requirementCheck = checkGuildRequirements(selectedGuild);
                    if (!requirementCheck.canJoin && requirementCheck.failedRequirements.length > 0) {
                      return (
                        <div className="mt-3 p-3 bg-danger-50 rounded-lg border border-danger-200">
                          <h5 className="text-sm font-semibold text-danger-700 mb-1">Requirements Not Met:</h5>
                          <ul className="text-xs text-danger-600 space-y-1">
                            {requirementCheck.failedRequirements.map((failed, index) => (
                              <li key={index}>• {failed}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
            {selectedGuild && (
              <>
                {currentGuild?.id === selectedGuild.id ? (
                  <Button
                    color="danger"
                    variant="light"
                    onPress={handleLeaveGuild}
                    isLoading={isLeaving}
                    isDisabled={isLeaving}
                  >
                    Leave Guild
                  </Button>
                ) : currentGuild ? (
                  <Button
                    color="warning"
                    variant="light"
                    isDisabled={true}
                  >
                    Already in a Guild
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    onPress={handleJoinGuild}
                    isLoading={isJoining}
                    isDisabled={!checkGuildRequirements(selectedGuild).canJoin || !syncedPlayer || isJoining}
                  >
                    {!syncedPlayer ? 'Connect Wallet' : 'Join Guild'}
                  </Button>
                )}
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </>
  );
}
