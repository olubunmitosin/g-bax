'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';
import { Tabs, Tab } from '@heroui/tabs';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useLocalMissionIntegration } from '@/hooks/useLocalMissionIntegration';
import { PREDEFINED_MISSIONS, MISSION_CATEGORIES, getMissionsByCategory } from '@/data/missions';
import { formatNumber } from '@/utils/gameHelpers';

export default function MissionsPage() {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MISSION_CATEGORIES>('BEGINNER');
  const { missions, activeMission } = useGameStore();
  const { player } = usePlayerSync();
  const { startMission, canStartMission } = useLocalMissionIntegration();
  const categoryMissions = getMissionsByCategory(selectedCategory);

  const getMissionStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'warning';
      case 'available': return 'primary';
      case 'locked': return 'default';
      default: return 'default';
    }
  };

  const getMissionStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '';
      case 'active': return '';
      case 'available': return '';
      case 'locked': return '';
      default: return '';
    }
  };

  const handleStartMission = async (missionId: string) => {
    if (!player) return;

    try {
      await startMission(missionId);
    } catch (error) {
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pb-20 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Mission Control</h1>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            Embark on exciting missions to earn experience, credits, and rare resources.
            Complete missions to unlock new areas, abilities, and advance your space exploration career.
          </p>
        </div>

        {/* Active Mission Banner */}
        {activeMission && (
          <Card className="mb-8 bg-gradient-to-r from-warning-500/10 to-primary-500/10 border-warning-500/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-bold">Active Mission</h3>
                  <p className="text-default-600">Currently in progress</p>
                </div>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-lg mb-2">{activeMission.title}</h4>
                  <p className="text-default-600 mb-3">{activeMission.description}</p>
                  <div className="flex gap-2">
                    <Chip size="sm" color="warning" variant="flat">
                      {activeMission.type}
                    </Chip>
                    <Chip size="sm" color="primary" variant="flat">
                      {formatNumber(activeMission.rewards.experience)} XP
                    </Chip>
                    <Chip size="sm" color="success" variant="flat">
                      {formatNumber(activeMission.rewards.credits)} Credits
                    </Chip>
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{activeMission.progress}/{activeMission.maxProgress}</span>
                    </div>
                  </div>
                  <Progress
                    value={(activeMission.progress / activeMission.maxProgress) * 100}
                    color="warning"
                    className="mb-3"
                    aria-label={`Active mission progress: ${activeMission.progress} of ${activeMission.maxProgress} completed`}
                  />
                  <p className="text-sm text-default-500">
                    Continue playing to complete this mission automatically
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Mission Categories */}
        <div className="mb-6">
          <Tabs
            selectedKey={selectedCategory}
            onSelectionChange={(key) => setSelectedCategory(key as keyof typeof MISSION_CATEGORIES)}
            className="w-full"
          >
            {Object.entries(MISSION_CATEGORIES).map(([key, category]) => (
              <Tab key={key} title={category.name} />
            ))}
          </Tabs>
        </div>

        {/* Category Description */}
        <div className="mb-6">
          <Card>
            <CardBody>
              <h3 className="font-semibold mb-2">{MISSION_CATEGORIES[selectedCategory].name}</h3>
              <p className="text-default-600">{MISSION_CATEGORIES[selectedCategory].description}</p>
            </CardBody>
          </Card>
        </div>

        {/* Mission Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryMissions.map((mission) => {
            const gameMission = missions.find(m => m.id === mission.id);
            const status = gameMission?.status || 'locked';
            const progress = gameMission?.progress || 0;

            return (
              <Card key={mission.id} className="h-full">
                <CardHeader>
                  <div className="flex justify-between items-start w-full">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getMissionStatusIcon(status)}</span>
                        <h4 className="font-semibold">{mission.title}</h4>
                      </div>
                      <Chip
                        size="sm"
                        color={getMissionStatusColor(status)}
                        variant="flat"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Chip>
                    </div>
                  </div>
                </CardHeader>

                <CardBody className="space-y-4">
                  <p className="text-sm text-default-600">{mission.description}</p>

                  {/* Progress Bar */}
                  {status === 'active' && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{progress}/{mission.maxProgress}</span>
                      </div>
                      <Progress
                        value={(progress / mission.maxProgress) * 100}
                        color="primary"
                        aria-label={`Mission progress: ${progress} of ${mission.maxProgress} completed`}
                      />
                    </div>
                  )}

                  {/* Rewards */}
                  <div>
                    <h5 className="font-medium mb-2">Rewards</h5>
                    <div className="flex flex-wrap gap-1">
                      <Chip size="sm" color="primary" variant="flat">
                        {formatNumber(mission.rewards.experience)} XP
                      </Chip>
                      <Chip size="sm" color="success" variant="flat">
                        {formatNumber(mission.rewards.credits)} Credits
                      </Chip>
                      {mission.rewards.resources && mission.rewards.resources.length > 0 && (
                        <Chip size="sm" color="secondary" variant="flat">
                          +{mission.rewards.resources.length} Items
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* Mission Type */}
                  <div className="flex justify-between items-center">
                    <Chip size="sm" variant="flat">
                      {mission.type}
                    </Chip>

                    {status === 'available' && canStartMission(mission) && (
                      <Button
                        size="sm"
                        color="primary"
                        onPress={() => handleStartMission(mission.id)}
                        isDisabled={!player}
                        aria-label={!player ? 'Connect wallet to start mission' : `Start mission: ${mission.title}`}
                      >
                        {!player ? 'Connect Wallet' : 'Start Mission'}
                      </Button>
                    )}

                    {status === 'locked' && (
                      <Button size="sm" variant="flat" isDisabled aria-label="Mission locked - complete previous missions to unlock">
                        Locked
                      </Button>
                    )}

                    {status === 'completed' && (
                      <Button size="sm" color="success" variant="flat" isDisabled aria-label="Mission completed successfully">
                        Completed
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>

        {/* Mission System Info */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <h3 className="text-xl font-bold">How Missions Work</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Mission Types</h4>
                  <ul className="space-y-1 text-sm text-default-600">
                    <li><strong>Mining:</strong> Extract resources from asteroids and nodes</li>
                    <li><strong>Exploration:</strong> Discover new sectors and objects</li>
                    <li><strong>Crafting:</strong> Create tools and equipment</li>
                    <li><strong>Advanced:</strong> Complex multi-step challenges</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Progression</h4>
                  <ul className="space-y-1 text-sm text-default-600">
                    <li><strong>Automatic:</strong> Missions progress as you play</li>
                    <li><strong>Unlocking:</strong> Complete missions to unlock new ones</li>
                    <li><strong>Rewards:</strong> Earn XP, credits, and rare items</li>
                    <li><strong>On-Chain:</strong> Progress saved to blockchain</li>
                  </ul>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
