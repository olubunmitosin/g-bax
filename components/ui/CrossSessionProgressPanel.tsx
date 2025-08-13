"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Switch } from "@heroui/switch";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";

import { useCrossSessionProgress } from "@/hooks/useCrossSessionProgress";
import { formatNumber } from "@/utils/gameHelpers";

interface CrossSessionProgressPanelProps {
  className?: string;
}

export default function CrossSessionProgressPanel({
  className = "",
}: CrossSessionProgressPanelProps) {
  const {
    isLoading,
    isSyncing,
    lastSyncTime,
    syncConflicts,
    autoSyncEnabled,
    loadFromBlockchain,
    saveToBlockchain,
    syncProgress,
    clearAllProgress,
    setAutoSyncEnabled,
    syncStatus,
    hasConflicts,
    canSync,
  } = useCrossSessionProgress();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Format time since last sync
  const getTimeSinceSync = () => {
    if (lastSyncTime === 0) return "Never";
    
    const seconds = Math.floor((Date.now() - lastSyncTime) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get sync status color
  const getSyncStatusColor = () => {
    if (isLoading || isSyncing) return "warning";
    if (hasConflicts) return "danger";
    if (syncStatus.needsSync) return "warning";
    if (canSync) return "success";
    return "default";
  };

  // Get sync status text
  const getSyncStatusText = () => {
    if (isLoading) return "Loading...";
    if (isSyncing) return "Syncing...";
    if (hasConflicts) return "Conflicts detected";
    if (syncStatus.needsSync) return "Sync needed";
    if (canSync) return "Synced";
    return "Not connected";
  };

  if (!canSync) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-default rounded-full" />
            <span className="text-sm text-default-600">
              Cross-session sync unavailable
            </span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🔄</span>
            Cross-Session Progress
          </h4>
          <Chip
            size="sm"
            color={getSyncStatusColor()}
            variant="flat"
          >
            {getSyncStatusText()}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Sync Status Overview */}
          <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sync Status</span>
              <div className="flex items-center gap-2">
                {syncStatus.hasLocalProgress && (
                  <Chip size="sm" color="primary" variant="flat">
                    Local
                  </Chip>
                )}
                {syncStatus.hasBlockchainProgress && (
                  <Chip size="sm" color="success" variant="flat">
                    Blockchain
                  </Chip>
                )}
              </div>
            </div>
            
            {(isLoading || isSyncing) && (
              <Progress
                value={100}
                color={getSyncStatusColor()}
                size="sm"
                className="w-full mb-2"
                isIndeterminate
              />
            )}

            <div className="text-xs text-default-600">
              Last sync: {getTimeSinceSync()}
            </div>
          </div>

          {/* Conflicts Warning */}
          {hasConflicts && (
            <div className="p-3 bg-danger/10 rounded-lg border border-danger/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-danger">⚠️ Sync Conflicts</span>
              </div>
              <div className="text-xs text-danger-600 mb-2">
                Conflicts detected in: {syncConflicts.join(", ")}
              </div>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={syncProgress}
                isLoading={isSyncing}
                className="w-full"
              >
                Resolve Conflicts
              </Button>
            </div>
          )}

          {/* Auto-Sync Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-Sync</div>
              <div className="text-xs text-default-600">
                Automatically sync every 5 minutes
              </div>
            </div>
            <Switch
              isSelected={autoSyncEnabled}
              onValueChange={setAutoSyncEnabled}
              size="sm"
            />
          </div>

          {/* Manual Sync Actions */}
          <div className="space-y-2">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={syncProgress}
              isLoading={isSyncing}
              isDisabled={isLoading}
              className="w-full"
            >
              Sync Now
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={loadFromBlockchain}
                isLoading={isLoading}
                isDisabled={isSyncing}
              >
                Load from Blockchain
              </Button>
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={() => saveToBlockchain()}
                isLoading={isSyncing}
                isDisabled={isLoading}
              >
                Save to Blockchain
              </Button>
            </div>
          </div>

          <Divider />

          {/* Advanced Options */}
          <div>
            <Button
              size="sm"
              variant="light"
              onPress={() => setShowAdvanced(!showAdvanced)}
              className="w-full"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced Options
            </Button>

            {showAdvanced && (
              <div className="mt-3 space-y-3">
                {/* Progress Storage Info */}
                <div className="p-2 bg-default/5 rounded-lg">
                  <h6 className="text-xs font-medium mb-2">Storage Status</h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Local:</span>
                      <span className={syncStatus.hasLocalProgress ? "text-success" : "text-default-500"}>
                        {syncStatus.hasLocalProgress ? "✓" : "✗"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Blockchain:</span>
                      <span className={syncStatus.hasBlockchainProgress ? "text-success" : "text-default-500"}>
                        {syncStatus.hasBlockchainProgress ? "✓" : "✗"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sync Benefits */}
                <div className="p-2 bg-default/5 rounded-lg">
                  <div className="text-xs text-default-600">
                    <strong>Cross-session benefits:</strong>
                  </div>
                  <ul className="text-xs text-default-500 mt-1 space-y-1">
                    <li>• Progress saved across devices</li>
                    <li>• Automatic conflict resolution</li>
                    <li>• Blockchain-verified progress</li>
                    <li>• Permanent data storage</li>
                  </ul>
                </div>

                {/* Danger Zone */}
                <div className="p-2 bg-danger/5 rounded-lg border border-danger/20">
                  <h6 className="text-xs font-medium text-danger mb-2">Danger Zone</h6>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={clearAllProgress}
                    className="w-full"
                  >
                    Clear All Progress Data
                  </Button>
                  <div className="text-xs text-danger-600 mt-1">
                    This will clear all local and sync data (blockchain data remains)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              getSyncStatusColor() === "success" ? "bg-success" :
              getSyncStatusColor() === "warning" ? "bg-warning" :
              getSyncStatusColor() === "danger" ? "bg-danger" : "bg-default"
            }`} />
            <span className="text-xs">
              {canSync 
                ? "Cross-session sync active" 
                : "Cross-session sync unavailable"
              }
            </span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
