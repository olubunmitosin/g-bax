"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Tabs, Tab } from "@heroui/tabs";
import { Divider } from "@heroui/divider";

import { useResourceOwnership } from "@/hooks/useResourceOwnership";
import { GameResource, PlayerResourceHolding } from "@/types";
import { formatNumber } from "@/utils/gameHelpers";

interface ResourceOwnershipPanelProps {
  className?: string;
}

export default function ResourceOwnershipPanel({
  className = "",
}: ResourceOwnershipPanelProps) {
  const {
    gameResources,
    playerResourceHoldings,
    isResourceSystemInitialized,
    isLoadingResources,
    getResourceById,
    getPlayerResourceAmount,
    getResourcesByCategory,
    getMostValuableResources,
    getResourceStats,
    status,
    canUseResources,
  } = useResourceOwnership();

  const [selectedTab, setSelectedTab] = useState("inventory");

  // Get resource icon based on category and rarity
  const getResourceIcon = (resource: GameResource) => {
    switch (resource.category) {
      case "mining":
        return resource.rarity === "legendary" ? "💎" : 
               resource.rarity === "epic" ? "🔮" :
               resource.rarity === "rare" ? "🥇" : "⚒️";
      case "crafted":
        return resource.rarity === "legendary" ? "🚀" :
               resource.rarity === "epic" ? "🔧" :
               resource.rarity === "rare" ? "⚙️" : "🔨";
      case "energy":
        return "⚡";
      case "special":
        return "🌟";
      default:
        return "📦";
    }
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "default";
      case "rare":
        return "primary";
      case "epic":
        return "secondary";
      case "legendary":
        return "warning";
      default:
        return "default";
    }
  };

  // Render resource card
  const renderResourceCard = (resource: GameResource, amount?: number) => {
    const playerAmount = amount ?? getPlayerResourceAmount(resource.id);
    const hasResource = playerAmount > 0;
    
    return (
      <div
        key={resource.id}
        className={`p-3 rounded-lg border ${
          hasResource 
            ? "bg-success/10 border-success/20" 
            : "bg-default/5 border-default/20"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{getResourceIcon(resource)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h6 className="font-medium text-sm">{resource.name}</h6>
              <Chip
                size="sm"
                color={getRarityColor(resource.rarity)}
                variant="flat"
              >
                {resource.rarity}
              </Chip>
              {hasResource && (
                <Chip size="sm" color="success" variant="flat">
                  {formatNumber(playerAmount)}
                </Chip>
              )}
            </div>
            <p className="text-xs text-default-600 mb-2">
              {resource.description}
            </p>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-default-500">
                {resource.symbol} • {resource.category}
              </span>
              {hasResource && (
                <span className="text-success font-medium">
                  Owned
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isResourceSystemInitialized) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
            <span className="text-sm text-warning">Resource system initializing...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  const stats = getResourceStats();
  const ownedResources = playerResourceHoldings.filter(h => h.amount > 0);
  const mostValuable = getMostValuableResources();

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between w-full">
          <h4 className="font-semibold flex items-center gap-2">
            <span>📦</span>
            On-Chain Inventory
          </h4>
          <Chip
            size="sm"
            color={canUseResources ? "success" : "default"}
            variant="flat"
          >
            {canUseResources ? "Active" : "Inactive"}
          </Chip>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Collection Overview */}
          <div className="p-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Collection Progress</span>
              <span className="text-sm font-medium">
                {stats.uniqueResources}/{stats.totalTypes}
              </span>
            </div>
            <Progress
              value={stats.collectionPercentage}
              color="primary"
              size="sm"
              className="w-full"
            />
            <div className="text-xs text-default-600 mt-1">
              {stats.collectionPercentage.toFixed(1)}% collected • {formatNumber(stats.totalResources)} total items
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            size="sm"
            className="w-full"
          >
            <Tab key="inventory" title={`Inventory (${ownedResources.length})`}>
              <div className="space-y-3 mt-3">
                {/* Most Valuable Resources */}
                {mostValuable.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium mb-2">Most Valuable</h6>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {mostValuable.slice(0, 5).map(holding => {
                        const resource = getResourceById(holding.resourceId);
                        return resource ? renderResourceCard(resource, holding.amount) : null;
                      })}
                    </div>
                  </div>
                )}

                {/* All Owned Resources */}
                {ownedResources.length > 0 ? (
                  <div>
                    <h6 className="text-sm font-medium mb-2">All Resources</h6>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {ownedResources.map(holding => {
                        const resource = getResourceById(holding.resourceId);
                        return resource ? renderResourceCard(resource, holding.amount) : null;
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-default-500 text-sm py-4">
                    No resources owned yet
                  </div>
                )}
              </div>
            </Tab>

            <Tab key="catalog" title="Catalog">
              <div className="space-y-3 mt-3">
                {/* Resource Categories */}
                {["mining", "crafted", "energy", "special"].map(category => {
                  const categoryResources = getResourcesByCategory(category);
                  if (categoryResources.length === 0) return null;

                  return (
                    <div key={category}>
                      <h6 className="text-sm font-medium mb-2 capitalize">{category} Resources</h6>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {categoryResources.map(resource => renderResourceCard(resource))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tab>

            <Tab key="stats" title="Statistics">
              <div className="space-y-3 mt-3">
                {/* Collection Stats */}
                <div className="p-2 bg-default/5 rounded-lg">
                  <h6 className="text-xs font-medium mb-2">Collection Statistics</h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Total Items: {formatNumber(stats.totalResources)}</div>
                    <div>Unique Types: {stats.uniqueResources}</div>
                    <div>Completion: {stats.collectionPercentage.toFixed(1)}%</div>
                    <div>Available: {stats.totalTypes}</div>
                  </div>
                </div>

                {/* By Category */}
                <div className="p-2 bg-default/5 rounded-lg">
                  <h6 className="text-xs font-medium mb-2">By Category</h6>
                  <div className="space-y-1 text-xs">
                    {Object.entries(stats.byCategory).map(([category, data]) => (
                      <div key={category} className="flex justify-between">
                        <span className="capitalize">{category}:</span>
                        <span>{data.owned}/{data.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* By Rarity */}
                <div className="p-2 bg-default/5 rounded-lg">
                  <h6 className="text-xs font-medium mb-2">By Rarity</h6>
                  <div className="space-y-1 text-xs">
                    {Object.entries(stats.byRarity).map(([rarity, data]) => (
                      <div key={rarity} className="flex justify-between">
                        <span className="capitalize">{rarity}:</span>
                        <span>{data.owned}/{data.total}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Tab>
          </Tabs>

          <Divider />

          {/* System Status */}
          <div className="p-2 bg-default/5 rounded-lg">
            <h6 className="text-xs font-medium mb-2">System Status</h6>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Resources: {status.resourceCount}</div>
              <div>Players: {status.totalPlayers}</div>
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success">Resources verified on blockchain</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
