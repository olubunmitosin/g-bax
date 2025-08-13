"use client";

import type { SpaceObject } from "@/types/game";
import type { MiningOperation } from "@/systems/miningSystem";

import React, { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Progress } from "@heroui/progress";
import { Chip } from "@heroui/chip";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

import WalletConnectionDialog from "./WalletConnectionDialog";

import { useGameStore } from "@/stores/gameStore";
import { GAME_CONFIG } from "@/utils/constants";

interface MiningInterfaceProps {
  selectedObject: SpaceObject | null;
  onStartMining: (objectId: string) => void;
  onCancelMining: (operationId: string) => void;
  activeMiningOperations: MiningOperation[];
  className?: string;
}

export default function MiningInterface({
  selectedObject,
  onStartMining,
  onCancelMining,
  activeMiningOperations,
  className = "",
}: MiningInterfaceProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isWalletDialogOpen,
    onOpen: onWalletDialogOpen,
    onClose: onWalletDialogClose,
  } = useDisclosure();
  const [miningProgress, setMiningProgress] = useState<{
    [key: string]: number;
  }>({});

  // Get player from game store
  const { player } = useGameStore();

  // Update mining progress
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress: { [key: string]: number } = {};

      activeMiningOperations.forEach((operation) => {
        const elapsed = Date.now() - operation.startTime;
        const progress = Math.min((elapsed / operation.duration) * 100, 100);

        newProgress[operation.id] = progress;
      });

      setMiningProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [activeMiningOperations]);

  const canMineObject = (object: SpaceObject): boolean => {
    return object.type === "asteroid" || object.type === "resource_node";
  };

  const isObjectBeingMined = (objectId: string): boolean => {
    return activeMiningOperations.some(
      (op) => op.targetObjectId === objectId && !op.isCompleted,
    );
  };

  const getObjectMiningOperation = (
    objectId: string,
  ): MiningOperation | null => {
    return (
      activeMiningOperations.find(
        (op) => op.targetObjectId === objectId && !op.isCompleted,
      ) || null
    );
  };

  const handleStartMining = () => {
    // Check if player/wallet is connected
    if (!player) {
      onClose(); // Close mining modal
      onWalletDialogOpen(); // Open wallet connection dialog

      return;
    }

    if (selectedObject) {
      onStartMining(selectedObject.id);
      onClose();
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);

    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}m ${remainingSeconds}s`;
  };

  const getResourceTypeColor = (type: string) => {
    switch (type) {
      case "crystal":
        return "secondary";
      case "metal":
        return "default";
      case "energy":
        return "warning";
      default:
        return "primary";
    }
  };

  const getEstimatedYield = (object: SpaceObject) => {
    // Calculate base resource count (1-3 items)
    const baseResourceCount = Math.floor(Math.random() * 3) + 1;

    // Calculate duration based on object type
    let duration = GAME_CONFIG.MINING_DURATION;

    if (object.type === "asteroid") {
      duration = GAME_CONFIG.MINING_DURATION * 0.8; // Asteroids are easier
    } else if (object.type === "resource_node") {
      duration = GAME_CONFIG.MINING_DURATION * 1.5; // Resource nodes take longer
    }

    // Get resource types from object
    let resourceTypes: string[] = ["random"];
    if (object.resources && object.resources.length > 0) {
      const typeSet = new Set<string>();
      object.resources.forEach((r) => {
        typeSet.add(r.type);
      });
      resourceTypes = Array.from(typeSet);
    }

    return {
      resourceCount: `1-3`,
      resourceTypes: resourceTypes.join("/"),
      duration: Math.round((duration / 1000) * 10) / 10, // Convert to seconds with 1 decimal
      experience: 25,
    };
  };

  if (!selectedObject) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader>
          <h3 className="text-lg font-semibold">Mining Interface</h3>
        </CardHeader>
        <CardBody>
          <p className="text-default-500">Select an object to begin mining</p>
        </CardBody>
      </Card>
    );
  }

  const canMine = canMineObject(selectedObject);
  const isBeingMined = isObjectBeingMined(selectedObject.id);
  const miningOperation = getObjectMiningOperation(selectedObject.id);

  return (
    <>
      <Card className={`w-80 ${className}`}>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Mining Interface</h3>
          <Chip color={canMine ? "success" : "danger"} size="sm" variant="flat">
            {canMine ? "Mineable" : "Not Mineable"}
          </Chip>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Object Information */}
          <div className="space-y-2">
            <h4 className="font-medium">Selected Object</h4>
            <div className="text-sm space-y-1">
              <div>
                Type:{" "}
                <span className="capitalize">
                  {selectedObject.type.replace("_", " ")}
                </span>
              </div>
              <div>
                Health: {selectedObject.health}/{selectedObject.maxHealth}
              </div>
              {selectedObject.resources &&
                selectedObject.resources.length > 0 && (
                  <div>
                    Resources:
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedObject.resources.map((resource, index) => (
                        <Chip
                          key={index}
                          color={getResourceTypeColor(resource.type)}
                          size="sm"
                          variant="flat"
                        >
                          {resource.quantity}x {resource.type}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Mining Status */}
          {isBeingMined && miningOperation ? (
            <div className="space-y-3">
              <h4 className="font-medium text-warning">Mining in Progress</h4>
              <Progress
                showValueLabel
                className="w-full"
                color="warning"
                label="Mining Progress"
                value={miningProgress[miningOperation.id] || 0}
              />
              <div className="text-sm text-default-600">
                Time Remaining:{" "}
                {formatTimeRemaining(
                  miningOperation.duration -
                  (Date.now() - miningOperation.startTime),
                )}
              </div>
              <Button
                aria-label={`Cancel mining operation on ${selectedObject.type.replace("_", " ")}`}
                className="w-full"
                color="danger"
                variant="light"
                onPress={() => onCancelMining(miningOperation.id)}
              >
                Cancel Mining
              </Button>
            </div>
          ) : canMine ? (
            <Button
              aria-label={
                selectedObject.health === 0
                  ? `Object depleted - cannot mine ${selectedObject.type.replace("_", " ")}`
                  : !player
                    ? "Connect wallet to start mining operation"
                    : `Start mining ${selectedObject.type.replace("_", " ")}`
              }
              className="w-full"
              color="primary"
              isDisabled={selectedObject.health === 0}
              onPress={player ? onOpen : onWalletDialogOpen}
            >
              {selectedObject.health === 0
                ? "Object Depleted"
                : !player
                  ? "Connect Wallet to Mine"
                  : "Start Mining"}
            </Button>
          ) : (
            <div className="text-center text-default-500">
              This object cannot be mined
            </div>
          )}

          {/* Active Mining Operations Summary */}
          {activeMiningOperations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">
                Active Operations ({activeMiningOperations.length})
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {activeMiningOperations.map((operation) => (
                  <div
                    key={operation.id}
                    className="text-xs bg-default-100 rounded p-2"
                  >
                    <div className="flex justify-between items-center">
                      <span>Operation {operation.id.slice(-6)}</span>
                      <span>
                        {Math.round(miningProgress[operation.id] || 0)}%
                      </span>
                    </div>
                    <Progress
                      aria-label={`Mining operation ${operation.id.slice(-6)} progress: ${Math.round(miningProgress[operation.id] || 0)}%`}
                      className="mt-1"
                      color="primary"
                      size="sm"
                      value={miningProgress[operation.id] || 0}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Mining Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>
            <h3>Confirm Mining Operation</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>
                Start mining operation on this{" "}
                {selectedObject.type.replace("_", " ")}?
              </p>

              <div className="bg-default-100 rounded-lg p-3 space-y-2">
                <h4 className="font-medium">Estimated Yield</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const estimatedYield = getEstimatedYield(selectedObject);

                    return (
                      <>
                        <div>
                          Resources: {estimatedYield.resourceCount}{" "}
                          {estimatedYield.resourceTypes} items
                        </div>
                        <div>Experience: {estimatedYield.experience} XP</div>
                        <div>Duration: ~{estimatedYield.duration} seconds</div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {selectedObject.resources &&
                selectedObject.resources.length > 0 && (
                  <div className="bg-success-50 rounded-lg p-3">
                    <h4 className="font-medium text-success-700">
                      Known Resources
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedObject.resources.map((resource, index) => (
                        <Chip
                          key={index}
                          color="success"
                          size="sm"
                          variant="flat"
                        >
                          {resource.quantity}x {resource.name}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              aria-label="Cancel mining operation"
              variant="light"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              aria-label={`Confirm and start mining ${selectedObject.type.replace("_", " ")}`}
              color="primary"
              onPress={handleStartMining}
            >
              Start Mining
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Wallet Connection Dialog */}
      <WalletConnectionDialog
        action="mining"
        isOpen={isWalletDialogOpen}
        message="You need to connect your Solana wallet to start mining operations."
        title="Connect Wallet to Mine"
        onClose={onWalletDialogClose}
      />
    </>
  );
}
