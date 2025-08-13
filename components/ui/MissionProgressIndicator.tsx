"use client";

import React from "react";
import { Card, CardBody } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";

import { useGameStore } from "@/stores/gameStore";
import { useMissionProgressTracker } from "@/hooks/useMissionProgressTracker";
import { formatNumber } from "@/utils/gameHelpers";

interface MissionProgressIndicatorProps {
  className?: string;
}

export default function MissionProgressIndicator({
  className = "",
}: MissionProgressIndicatorProps) {
  const { activeMission } = useGameStore();
  const { isTrackingEnabled } = useMissionProgressTracker();

  if (!activeMission || !isTrackingEnabled) {
    return null;
  }

  const progressPercentage = (activeMission.progress / activeMission.maxProgress) * 100;
  const isCompleted = activeMission.status === "completed";

  const getMissionTypeColor = (type: string) => {
    switch (type) {
      case "mining":
        return "warning";
      case "crafting":
        return "secondary";
      case "exploration":
        return "primary";
      default:
        return "default";
    }
  };

  const getMissionTypeIcon = (type: string) => {
    switch (type) {
      case "mining":
        return "⛏️";
      case "crafting":
        return "🔨";
      case "exploration":
        return "🚀";
      default:
        return "📋";
    }
  };

  return (
    <Card className={`w-80 ${className}`}>
      <CardBody className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xl">{getMissionTypeIcon(activeMission.type)}</span>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{activeMission.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Chip
                size="sm"
                color={getMissionTypeColor(activeMission.type)}
                variant="flat"
              >
                {activeMission.type}
              </Chip>
              {isCompleted && (
                <Chip size="sm" color="success" variant="flat">
                  Completed
                </Chip>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-default-600">Progress</span>
              <span className="text-xs font-medium">
                {activeMission.progress} / {activeMission.maxProgress}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              color={isCompleted ? "success" : getMissionTypeColor(activeMission.type)}
              size="sm"
              className="w-full"
            />
          </div>

          {/* Mission Description */}
          <p className="text-xs text-default-600 line-clamp-2">
            {activeMission.description}
          </p>

          {/* Rewards Preview */}
          <div className="flex flex-wrap gap-1">
            {activeMission.rewards.experience > 0 && (
              <Chip size="sm" variant="flat" color="primary">
                {formatNumber(activeMission.rewards.experience)} XP
              </Chip>
            )}
            {activeMission.rewards.credits > 0 && (
              <Chip size="sm" variant="flat" color="warning">
                {formatNumber(activeMission.rewards.credits)} Credits
              </Chip>
            )}
            {activeMission.rewards.resources && activeMission.rewards.resources.length > 0 && (
              <Chip size="sm" variant="flat" color="secondary">
                {activeMission.rewards.resources.length} Resources
              </Chip>
            )}
          </div>

          {/* Tracking Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-success">Tracking Active</span>
            </div>
            
            {isCompleted && (
              <Button size="sm" color="success" variant="flat" isDisabled>
                Completed
              </Button>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
