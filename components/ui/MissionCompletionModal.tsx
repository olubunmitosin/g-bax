"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";

import { formatNumber } from "@/utils/gameHelpers";

interface MissionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mission: any;
  rewardSummary: any;
}

export default function MissionCompletionModal({
  isOpen,
  onClose,
  mission,
  rewardSummary,
}: MissionCompletionModalProps) {
  if (!mission || !rewardSummary) return null;

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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
      backdrop="blur"
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getMissionTypeIcon(mission.type)}</span>
            <div>
              <h3 className="text-xl font-bold text-success">Mission Completed!</h3>
              <p className="text-sm text-default-600">{mission.title}</p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Mission Info */}
            <Card>
              <CardBody className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Chip
                    size="sm"
                    color={getMissionTypeColor(mission.type)}
                    variant="flat"
                  >
                    {mission.type}
                  </Chip>
                  <Chip size="sm" color="success" variant="flat">
                    Completed
                  </Chip>
                </div>
                <p className="text-sm text-default-600">
                  {mission.description}
                </p>
              </CardBody>
            </Card>

            <Divider />

            {/* Rewards Section */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <span>🎁</span>
                Rewards Earned
              </h4>
              
              <div className="space-y-3">
                {/* Experience */}
                {rewardSummary.experience > 0 && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⭐</span>
                      <span className="font-medium">Experience Points</span>
                    </div>
                    <Chip color="primary" variant="flat">
                      +{formatNumber(rewardSummary.experience)} XP
                    </Chip>
                  </div>
                )}

                {/* Credits */}
                {rewardSummary.credits > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <span className="font-medium">Credits</span>
                    </div>
                    <Chip color="warning" variant="flat">
                      +{formatNumber(rewardSummary.credits)}
                    </Chip>
                  </div>
                )}

                {/* Resources */}
                {rewardSummary.resources.length > 0 && (
                  <div className="p-3 bg-secondary/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">📦</span>
                      <span className="font-medium">Resources</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rewardSummary.resources.map((resource: any, index: number) => (
                        <Chip key={index} size="sm" color="secondary" variant="flat">
                          {resource.quantity} {resource.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}

                {/* Loyalty Points */}
                {rewardSummary.loyaltyPoints > 0 && (
                  <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏆</span>
                      <span className="font-medium">Loyalty Points</span>
                    </div>
                    <Chip color="success" variant="flat">
                      +{formatNumber(rewardSummary.loyaltyPoints)}
                    </Chip>
                  </div>
                )}
              </div>
            </div>

            {/* Blockchain Sync Status */}
            <div className="p-3 bg-default/5 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-xs text-success font-medium">
                  Progress synced to blockchain
                </span>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            color="primary" 
            onPress={onClose}
            className="w-full"
          >
            Continue Exploring
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
