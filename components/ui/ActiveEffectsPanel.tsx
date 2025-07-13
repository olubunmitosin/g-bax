'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Button } from '@heroui/button';
import { Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from '@heroui/modal';
import { useItemEffectsStore } from '@/stores/itemEffectsStore';

interface ActiveEffectsPanelProps {
  onClose?: () => void;
  className?: string;
}

export default function ActiveEffectsPanel({ onClose, className = "" }: ActiveEffectsPanelProps) {
  const { activeEffects, clearExpiredEffects, getActiveMultipliers } = useItemEffectsStore();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [, forceUpdate] = useState({});
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();

  // Update current time every second to show accurate remaining time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      clearExpiredEffects(); // Clean up expired effects
      forceUpdate({}); // Force re-render to ensure UI updates
    }, 1000);

    return () => clearInterval(interval);
  }, [clearExpiredEffects]);

  const formatTimeRemaining = (effect: any): string => {
    const elapsed = currentTime - effect.startTime;
    const remaining = Math.max(0, effect.duration - elapsed);

    if (remaining === 0) return 'Expired';

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const getProgressPercentage = (effect: any): number => {
    const elapsed = currentTime - effect.startTime;
    const progress = Math.min(elapsed / effect.duration, 1) * 100;
    return 100 - progress; // Invert so it shows remaining time
  };

  const getEffectColor = (type: string): string => {
    switch (type) {
      case 'mining_efficiency':
        return 'warning';
      case 'crafting_speed':
        return 'secondary';
      case 'experience_boost':
        return 'success';
      case 'resource_yield':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getEffectIcon = (type: string): string => {
    switch (type) {
      case 'mining_efficiency':
        return '⛏️';
      case 'crafting_speed':
        return '🔨';
      case 'experience_boost':
        return '⭐';
      case 'resource_yield':
        return '💎';
      default:
        return '✨';
    }
  };

  const activeEffectsList = activeEffects.filter(effect => {
    const elapsed = currentTime - effect.startTime;
    return elapsed < effect.duration;
  });

  const multipliers = getActiveMultipliers();

  // Compact summary for the main panel
  const getCompactSummary = () => {
    if (activeEffectsList.length === 0) {
      return "No active effects";
    }

    const bonuses = [];
    if (multipliers.miningEfficiency > 1.0) {
      bonuses.push(`⛏️ ${Math.round(multipliers.miningEfficiency * 100)}%`);
    }
    if (multipliers.craftingSpeed > 1.0) {
      bonuses.push(`🔨 ${Math.round(multipliers.craftingSpeed * 100)}%`);
    }
    if (multipliers.experienceBoost > 1.0) {
      bonuses.push(`⭐ ${Math.round(multipliers.experienceBoost * 100)}%`);
    }
    if (multipliers.resourceYield > 1.0) {
      bonuses.push(`💎 ${Math.round(multipliers.resourceYield * 100)}%`);
    }

    return bonuses.length > 0 ? bonuses.join(" ") : `${activeEffectsList.length} effects`;
  };

  // Compact panel that can be clicked to expand
  const compactPanel = (
    <div
      className={`bg-black/30 backdrop-blur-sm rounded-lg p-3 border border-white/10 cursor-pointer hover:bg-black/40 transition-colors ${className}`}
      onClick={onOpen}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-green-300">Active Effects</h3>
        {onClose && (
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-default-400 hover:text-default-600"
          >
            ✕
          </Button>
        )}
      </div>
      <div className="text-xs text-white/70 mt-1">
        {getCompactSummary()}
        {activeEffectsList.length > 0 && (
          <span className="text-blue-300 ml-2">Click for details</span>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Compact Panel */}
      {compactPanel}

      {/* Detailed Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onModalClose}
        size="2xl"
        scrollBehavior="inside"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">Active Effects Details</h2>
            <p className="text-sm text-default-500">
              {activeEffectsList.length === 0
                ? "No active effects - use items from inventory to gain bonuses"
                : `${activeEffectsList.length} active effect${activeEffectsList.length > 1 ? 's' : ''}`
              }
            </p>
          </ModalHeader>
          <ModalBody className="pb-6">
            {activeEffectsList.length > 0 ? (
              <>
                {/* Current Multipliers Summary */}
                <div className="bg-default-50 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-lg mb-3">Current Bonuses</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⛏️</span>
                      <div>
                        <div className="font-semibold text-warning-600">
                          {(multipliers.miningEfficiency * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-default-600">Mining Efficiency</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🔨</span>
                      <div>
                        <div className="font-semibold text-secondary-600">
                          {(multipliers.craftingSpeed * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-default-600">Crafting Speed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <div className="font-semibold text-success-600">
                          {(multipliers.experienceBoost * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-default-600">Experience Gain</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">💎</span>
                      <div>
                        <div className="font-semibold text-primary-600">
                          {(multipliers.resourceYield * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-default-600">Resource Yield</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Effects */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Individual Effects</h4>
                  {activeEffectsList.map((effect) => (
                    <div key={effect.id} className="border border-default-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getEffectIcon(effect.type)}</span>
                          <div>
                            <div className="font-semibold text-lg">{effect.name}</div>
                            <div className="text-sm text-default-600">
                              +{Math.round((effect.multiplier - 1) * 100)}% boost
                            </div>
                          </div>
                        </div>
                        <Chip
                          size="lg"
                          color={getEffectColor(effect.type)}
                          variant="flat"
                        >
                          {formatTimeRemaining(effect)}
                        </Chip>
                      </div>

                      <Progress
                        size="md"
                        value={getProgressPercentage(effect)}
                        color={getEffectColor(effect)}
                        className="mb-2"
                      />

                      <p className="text-sm text-default-600">{effect.description}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-2">No Active Effects</h3>
                <p className="text-default-500 mb-4">
                  Use items from your inventory to gain temporary bonuses for mining, crafting, and experience.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h4 className="font-semibold text-blue-700 mb-2">💡 How to Get Effects:</h4>
                  <ul className="text-sm text-blue-600 space-y-1">
                    <li>• <strong>Energy items</strong> boost mining efficiency</li>
                    <li>• <strong>Crystals</strong> provide experience boosts + immediate XP</li>
                    <li>• <strong>Metals</strong> enhance crafting speed + resource yield</li>
                    <li>• <strong>Higher rarity items</strong> provide stronger effects</li>
                  </ul>
                </div>
              </div>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
