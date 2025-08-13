"use client";

import React, { useState, useEffect } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { useWallet } from "@solana/wallet-adapter-react";

import { useHoneycombStore } from "@/stores/honeycombStore";
import { useGameStore } from "@/stores/gameStore";
import { formatNumber } from "@/utils/gameHelpers";

interface XPSyncStatusProps {
  className?: string;
}

export default function XPSyncStatus({
  className = "",
}: XPSyncStatusProps) {
  const { publicKey, connected } = useWallet();
  const { player } = useGameStore();
  const {
    honeycombService,
    isConnected: honeycombConnected,
    playerExperience,
    playerLevel,
    getXPSyncStatus,
    forceXPSync,
  } = useHoneycombStore();

  const [syncStatus, setSyncStatus] = useState({
    hasPendingUpdates: false,
    pendingXP: 0,
    lastUpdate: 0,
  });
  const [isForcingSync, setIsForcingSync] = useState(false);

  // Update sync status every second
  useEffect(() => {
    if (!publicKey || !honeycombConnected) return;

    const updateStatus = () => {
      const status = getXPSyncStatus(publicKey);
      setSyncStatus(status);
    };

    updateStatus(); // Initial update
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [publicKey, honeycombConnected, getXPSyncStatus]);

  // Handle force sync
  const handleForceSync = async () => {
    if (!publicKey) return;

    setIsForcingSync(true);
    try {
      const success = await forceXPSync(publicKey);
      if (success) {
        // Update status after successful sync
        const newStatus = getXPSyncStatus(publicKey);
        setSyncStatus(newStatus);
      }
    } catch (error) {
      console.error("Failed to force sync:", error);
    } finally {
      setIsForcingSync(false);
    }
  };

  // Calculate time since last update
  const getTimeSinceLastUpdate = () => {
    if (syncStatus.lastUpdate === 0) return "Never";
    
    const seconds = Math.floor((Date.now() - syncStatus.lastUpdate) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Get sync status color
  const getSyncStatusColor = () => {
    if (!connected || !honeycombConnected) return "default";
    if (syncStatus.hasPendingUpdates) return "warning";
    return "success";
  };

  // Get sync status text
  const getSyncStatusText = () => {
    if (!connected) return "Wallet not connected";
    if (!honeycombConnected) return "Honeycomb not connected";
    if (syncStatus.hasPendingUpdates) return "Sync pending";
    return "Synced";
  };

  if (!connected || !honeycombConnected) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-default rounded-full" />
            <span className="text-sm text-default-600">
              {!connected ? "Wallet not connected" : "Honeycomb not connected"}
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardBody className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <span>⚡</span>
              XP Blockchain Sync
            </h4>
            <Chip
              size="sm"
              color={getSyncStatusColor()}
              variant="flat"
            >
              {getSyncStatusText()}
            </Chip>
          </div>

          {/* Current XP Status */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-600">Local XP:</span>
              <span className="font-medium">{formatNumber(player?.experience || 0)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-600">Blockchain XP:</span>
              <span className="font-medium">{formatNumber(playerExperience)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-default-600">Level:</span>
              <span className="font-medium">{playerLevel}</span>
            </div>
          </div>

          {/* Pending Updates */}
          {syncStatus.hasPendingUpdates && (
            <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-warning">Pending Sync</span>
                <Chip size="sm" color="warning" variant="flat">
                  +{formatNumber(syncStatus.pendingXP)} XP
                </Chip>
              </div>
              <div className="text-xs text-warning-600 mb-2">
                Experience will be synced to blockchain automatically
              </div>
              <Progress
                value={100}
                color="warning"
                size="sm"
                className="w-full"
                isIndeterminate
              />
            </div>
          )}

          {/* Sync Actions */}
          <div className="space-y-2">
            {syncStatus.hasPendingUpdates && (
              <Button
                size="sm"
                color="warning"
                variant="flat"
                onPress={handleForceSync}
                isLoading={isForcingSync}
                className="w-full"
              >
                Force Sync Now
              </Button>
            )}

            {/* Last Update Info */}
            <div className="flex items-center justify-between text-xs text-default-500">
              <span>Last sync:</span>
              <span>{getTimeSinceLastUpdate()}</span>
            </div>
          </div>

          {/* Sync Benefits */}
          <div className="p-2 bg-default/5 rounded-lg">
            <div className="text-xs text-default-600">
              <strong>Real-time sync benefits:</strong>
            </div>
            <ul className="text-xs text-default-500 mt-1 space-y-1">
              <li>• Instant local feedback</li>
              <li>• Batched blockchain updates</li>
              <li>• Cross-device progress sync</li>
              <li>• Permanent on-chain storage</li>
            </ul>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              getSyncStatusColor() === "success" ? "bg-success" :
              getSyncStatusColor() === "warning" ? "bg-warning" : "bg-default"
            }`} />
            <span className="text-xs">
              {syncStatus.hasPendingUpdates 
                ? "Blockchain sync in progress..." 
                : "All progress synced to blockchain"
              }
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
