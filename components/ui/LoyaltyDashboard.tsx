'use client';

import React from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { useVerxioStore } from '@/stores/verxioStore';
import { formatNumber } from '@/utils/gameHelpers';
import { useWallet } from '@solana/wallet-adapter-react';

interface LoyaltyDashboardProps {
  onClose?: () => void;
  className?: string;
}

export default function LoyaltyDashboard({ onClose, className = "" }: LoyaltyDashboardProps) {
  const { publicKey } = useWallet();
  const {
    playerLoyalty,
    playerGuild,
    loyaltyTiers,
    isLoadingLoyalty,
    getPointsToNextTier,
    refreshLoyaltyData,
  } = useVerxioStore();

  const handleRefreshLoyalty = async () => {
    if (publicKey) {
      await refreshLoyaltyData(publicKey);
    }
  };

  if (isLoadingLoyalty) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-default-500">Loading loyalty data...</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!playerLoyalty) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader>
          <h3 className="text-lg font-semibold">Loyalty System</h3>
        </CardHeader>
        <CardBody>
          <p className="text-default-500 text-center">
            Connect your wallet to view loyalty status
          </p>
        </CardBody>
      </Card>
    );
  }

  const { needed: pointsToNext, nextTier } = getPointsToNextTier(playerLoyalty.points);
  const currentTier = playerLoyalty.currentTier;
  const progressInTier = playerLoyalty.points - currentTier.minPoints;
  const tierRange = currentTier.maxPoints - currentTier.minPoints;
  const tierProgress = tierRange === Infinity ? 100 : (progressInTier / tierRange) * 100;

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Loyalty Status</h3>
        <div className="flex items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            style={{
              backgroundColor: `${currentTier.color}20`,
              color: currentTier.color,
            }}
          >
            {currentTier.icon} {currentTier.name}
          </Chip>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={handleRefreshLoyalty}
            isLoading={isLoadingLoyalty}
            className="text-default-400 hover:text-default-600"
            title="Refresh loyalty data"
          >
            🔄
          </Button>
          {onClose && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={onClose}
              className="text-default-400 hover:text-default-600"
            >
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardBody className="space-y-4">
        {/* Current Tier Info */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Loyalty Points</span>
            <span className="text-lg font-bold">{formatNumber(playerLoyalty.points)}</span>
          </div>

          {nextTier ? (
            <>
              <Progress
                value={tierProgress}
                className="w-full"
                color="primary"
                label={`Progress to ${nextTier.name}`}
                showValueLabel
              />
              <div className="text-xs text-default-500 text-center">
                {formatNumber(pointsToNext)} points needed for {nextTier.name}
              </div>
            </>
          ) : (
            <div className="text-center">
              <Progress value={100} className="w-full" color="warning" />
              <div className="text-xs text-warning mt-1">Maximum tier reached!</div>
            </div>
          )}
        </div>

        {/* Multiplier */}
        <div className="bg-success-50 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-success-700">Current Multiplier</span>
            <span className="text-lg font-bold text-success-700">
              {currentTier.multiplier}x
            </span>
          </div>
          <p className="text-xs text-success-600 mt-1">
            All rewards are multiplied by this amount
          </p>
        </div>

        {/* Reputation */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Reputation</span>
          <Chip
            size="sm"
            color={playerLoyalty.reputation >= 100 ? 'success' : 'default'}
            variant="flat"
          >
            {formatNumber(playerLoyalty.reputation)}
          </Chip>
        </div>

        {/* Guild Info */}
        {playerGuild ? (
          <div className="bg-purple-50 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-purple-700">Guild</span>
              <Chip size="sm" color="secondary" variant="flat">
                Level {playerGuild.level}
              </Chip>
            </div>
            <h4 className="font-semibold text-purple-800">{playerGuild.name}</h4>
            <p className="text-xs text-purple-600 mt-1">{playerGuild.description}</p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-purple-600">
                {playerGuild.memberCount} members
              </span>
              <span className="text-xs text-purple-600">
                Rank: {playerLoyalty.guildRank}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-default-100 rounded-lg p-3 text-center">
            <p className="text-sm text-default-600 mb-2">No guild membership</p>
            <Button size="sm" color="primary" variant="flat">
              Browse Guilds
            </Button>
          </div>
        )}

        {/* Current Benefits */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Current Benefits</h4>
          <div className="space-y-1">
            {currentTier.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-green-500 text-xs">✓</span>
                <span className="text-xs text-default-600">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        {playerLoyalty.achievements.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Recent Achievements</h4>
            <div className="flex flex-wrap gap-1">
              {playerLoyalty.achievements.slice(0, 3).map((achievement, index) => (
                <Chip key={index} size="sm" variant="flat" color="warning">
                  🏆 {achievement.replace('_', ' ')}
                </Chip>
              ))}
              {playerLoyalty.achievements.length > 3 && (
                <Chip size="sm" variant="flat" color="default">
                  +{playerLoyalty.achievements.length - 3} more
                </Chip>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold text-lg">{formatNumber(playerLoyalty.totalPointsEarned)}</div>
            <div className="text-default-500">Total Earned</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">
              {Math.floor((Date.now() - new Date(playerLoyalty.lastActivity).getTime()) / (1000 * 60 * 60 * 24))}d
            </div>
            <div className="text-default-500">Last Active</div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
