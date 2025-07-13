'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { useVerxioStore } from '@/stores/verxioStore';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import type { Guild } from '@/services/verxioService';
import { formatNumber } from '@/utils/gameHelpers';

interface GuildBrowserProps {
  onClose?: () => void;
  className?: string;
}

export default function GuildBrowser({ onClose: onClosePanel, className = "" }: GuildBrowserProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);

  const {
    availableGuilds,
    playerGuild,
    isLoadingGuilds,
    joinGuild,
  } = useVerxioStore();

  const { player } = useGameStore();
  const { player: syncedPlayer } = usePlayerSync();

  const handleGuildClick = (guild: Guild) => {
    setSelectedGuild(guild);
    onOpen();
  };

  const handleJoinGuild = async () => {
    if (!selectedGuild || !syncedPlayer) return;

    try {
      // Check requirements
      const meetsRequirements = checkGuildRequirements(selectedGuild);
      if (!meetsRequirements) {
        return;
      }

      // Convert player ID to PublicKey (assuming it's a valid public key string)
      const playerPublicKey = new (await import('@solana/web3.js')).PublicKey(syncedPlayer.id);
      await joinGuild(playerPublicKey, selectedGuild.id);
      onClose();
    } catch (error) {
    }
  };

  const checkGuildRequirements = (guild: Guild): boolean => {
    if (!player) return false;

    for (const requirement of guild.requirements) {
      switch (requirement.type) {
        case 'level':
          if (player.level < (requirement.value as number)) {
            return false;
          }
          break;
        case 'reputation':
          // Would check player reputation here
          break;
        case 'achievement':
          // Would check player achievements here
          break;
      }
    }
    return true;
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
            {playerGuild && (
              <Chip size="sm" color="success" variant="flat">
                Member of {playerGuild.name}
              </Chip>
            )}
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
          {availableGuilds.length === 0 ? (
            <div className="text-center text-default-500 py-8">
              No guilds available
            </div>
          ) : (
            availableGuilds.map((guild) => (
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
                      {playerGuild?.id === guild.id && (
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
                    {selectedGuild.requirements.map((requirement, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm">{requirement.description}</span>
                        <span className="text-xs text-default-500">
                          {checkGuildRequirements(selectedGuild) ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Close
            </Button>
            {selectedGuild && playerGuild?.id !== selectedGuild.id && (
              <Button
                color="primary"
                onPress={handleJoinGuild}
                isDisabled={!checkGuildRequirements(selectedGuild) || !syncedPlayer}
              >
                {!syncedPlayer ? 'Connect Wallet' : 'Join Guild'}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
