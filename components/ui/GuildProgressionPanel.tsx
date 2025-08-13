"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";

import { useGuildProgression } from "@/hooks/useGuildProgression";
import { Guild } from "@/types";
import { formatNumber } from "@/utils/gameHelpers";

interface GuildProgressionPanelProps {
  className?: string;
}

export default function GuildProgressionPanel({
  className = "",
}: GuildProgressionPanelProps) {
  const {
    availableGuilds,
    playerGuildInfo,
    isGuildSystemInitialized,
    isLoadingGuild,
    isJoining,
    isLeaving,
    joinPlayerGuild,
    leavePlayerGuild,
    getGuildsByCategory,
    meetsGuildRequirements,
    getEligibleGuilds,
    getGuildBenefits,
    getPlayerRank,
    isGuildLeader,
    getGuildStats,
    getNextLevelRequirements,
    hasGuild,
    canJoinGuild,
  } = useGuildProgression();

  const [selectedTab, setSelectedTab] = useState("overview");

  // Get rank color
  const getRankColor = (rank: string) => {
    switch (rank) {
      case "leader":
        return "warning";
      case "officer":
        return "secondary";
      case "member":
        return "primary";
      default:
        return "default";
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "mining":
        return "⛏️";
      case "crafting":
        return "🔨";
      case "exploration":
        return "🚀";
      case "combat":
        return "⚔️";
      case "leadership":
        return "👑";
      default:
        return "🏛️";
    }
  };

  // Render guild card
  const renderGuildCard = (guild: Guild, isPlayerGuild: boolean = false) => {
    const meetsReqs = meetsGuildRequirements(guild);
    const isFull = guild.memberCount >= guild.maxMembers;

    return (
      <div
        key={guild.id}
        className={`p-3 rounded-lg border ${isPlayerGuild
            ? "bg-success/10 border-success/20"
            : meetsReqs && !isFull
              ? "bg-primary/10 border-primary/20"
              : "bg-default/5 border-default/20"
          }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{guild.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h6 className="font-medium text-sm">{guild.name}</h6>
              <Chip
                size="sm"
                color={isPlayerGuild ? "success" : meetsReqs ? "primary" : "default"}
                variant="flat"
              >
                Level {guild.level}
              </Chip>
              {isPlayerGuild && (
                <Chip size="sm" color={getRankColor(getPlayerRank())} variant="flat">
                  {getPlayerRank()}
                </Chip>
              )}
            </div>
            <p className="text-xs text-default-600 mb-2">
              {guild.description}
            </p>

            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-default-500">
                {getCategoryIcon(guild.category)} {guild.category}
              </span>
              <span className="text-default-500">
                {guild.memberCount}/{guild.maxMembers} members
              </span>
            </div>

            {/* Requirements */}
            <div className="text-xs text-default-600 mb-2">
              <strong>Requirements:</strong> {Object.entries(guild.requirements).map(([key, value]) =>
                `${key}: ${value}`
              ).join(", ")}
            </div>

            {/* Benefits */}
            <div className="text-xs text-default-600 mb-2">
              <strong>Benefits:</strong> {Object.entries(guild.benefits).map(([key, value]) =>
                `${key}: +${value}%`
              ).join(", ")}
            </div>

            {/* Action Button */}
            {isPlayerGuild ? (
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={leavePlayerGuild}
                isLoading={isLeaving}
                className="w-full"
              >
                Leave Guild
              </Button>
            ) : canJoinGuild && meetsReqs && !isFull ? (
              <Button
                size="sm"
                color="primary"
                variant="flat"
                onPress={() => joinPlayerGuild(guild.id)}
                isLoading={isJoining}
                className="w-full"
              >
                Join Guild
              </Button>
            ) : (
              <div className="text-xs text-default-500 text-center py-1">
                {isFull ? "Guild Full" : !meetsReqs ? "Requirements Not Met" : "Already in Guild"}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isGuildSystemInitialized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-sm text-warning">Guild system initializing...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const stats = getGuildStats();
  const eligibleGuilds = getEligibleGuilds();
  const nextLevel = getNextLevelRequirements();

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🏛️</span>
            Guild Progression
          </h4>
          <Chip
            size="sm"
            color={hasGuild ? "success" : canJoinGuild ? "primary" : "default"}
            variant="flat"
          >
            {hasGuild ? "Member" : canJoinGuild ? "Available" : "Locked"}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Player Guild Status */}
          {hasGuild && playerGuildInfo && (
            <div className="p-3 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Guild</span>
                <Chip size="sm" color={getRankColor(getPlayerRank())} variant="flat">
                  {getPlayerRank()}
                </Chip>
              </div>
              <div className="text-sm font-medium mb-1">{playerGuildInfo.guild.name}</div>
              <div className="text-xs text-default-600 mb-2">
                Contributions: {formatNumber(playerGuildInfo.membership.contributions)}
              </div>

              {/* Guild Level Progress */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Guild Level {playerGuildInfo.guild.level}</span>
                  <span>{nextLevel.progress.toFixed(0)}%</span>
                </div>
                <Progress
                  value={nextLevel.progress}
                  color="success"
                  size="sm"
                  className="w-full"
                />
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
                {/* Current Guild */}
                {hasGuild && playerGuildInfo && (
                  <div>
                    <h6 className="text-sm font-medium mb-2">Your Guild</h6>
                    {renderGuildCard(playerGuildInfo.guild, true)}
                  </div>
                )}

                {/* Eligible Guilds */}
                {!hasGuild && eligibleGuilds.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium mb-2">Available to Join</h6>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {eligibleGuilds.slice(0, 3).map(guild => renderGuildCard(guild))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="p-2 bg-default/5 rounded-lg">
                  <h6 className="text-xs font-medium mb-2">Guild Statistics</h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Total Guilds: {stats.totalGuilds}</div>
                    <div>Eligible: {stats.eligibleGuilds}</div>
                    {hasGuild && (
                      <>
                        <div>Your Rank: {stats.playerRank}</div>
                        <div>Contributions: {formatNumber(stats.playerContributions)}</div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Tab>

            <Tab key="browse" title="Browse Guilds">
              <div className="space-y-3 mt-3">
                {/* Guild Categories */}
                {["mining", "crafting", "exploration", "combat", "leadership"].map(category => {
                  const categoryGuilds = getGuildsByCategory(category);
                  if (categoryGuilds.length === 0) return null;

                  return (
                    <div key={category}>
                      <h6 className="text-sm font-medium mb-2 capitalize flex items-center gap-2">
                        {getCategoryIcon(category)} {category} Guilds
                      </h6>
                      <div className="space-y-2">
                        {categoryGuilds.map(guild => renderGuildCard(guild))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tab>

            <Tab key="benefits" title="Benefits">
              <div className="space-y-3 mt-3">
                {hasGuild ? (
                  <div>
                    <h6 className="text-sm font-medium mb-2">Active Benefits</h6>
                    <div className="space-y-2">
                      {Object.entries(getGuildBenefits()).map(([benefit, value]) => (
                        <div key={benefit} className="flex justify-between p-2 bg-success/5 rounded-lg">
                          <span className="text-sm capitalize">{benefit.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <Chip size="sm" color="success" variant="flat">
                            +{value as number}%
                          </Chip>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-default-500 text-sm py-4">
                    Join a guild to unlock benefits
                  </div>
                )}
              </div>
            </Tab>
          </Tabs>

          <Divider />

          {/* Blockchain Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success">Guild progress synced to blockchain</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
