'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { useGameStore } from '@/stores/gameStore';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useItemEffectsStore } from '@/stores/itemEffectsStore';
import { getRarityColor, getResourceTypeColor, formatNumber } from '@/utils/gameHelpers';
import InventoryInterface from '@/components/ui/InventoryInterface';
import NotificationSystem, { useNotifications } from '@/components/ui/NotificationSystem';

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { inventory, removeResource, updatePlayerExperience } = useGameStore();
  const { player } = usePlayerSync();
  const { addEffect } = useItemEffectsStore();
  const { notifications, removeNotification, showSuccess, showInfo, showWarning } = useNotifications();

  if (!player) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardBody className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Inventory</h2>
            <p className="text-default-600 mb-6">
              Connect your wallet to view your inventory and manage items
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Group inventory items by type and rarity
  const groupedInventory = inventory.reduce((acc, item) => {
    const key = `${item.type}_${item.rarity}`;
    if (!acc[key]) {
      acc[key] = {
        ...item,
        totalQuantity: 0,
        items: [],
      };
    }
    acc[key].totalQuantity += item.quantity;
    acc[key].items.push(item);
    return acc;
  }, {} as Record<string, any>);

  // Filter items based on search and tab
  const filteredItems = Object.values(groupedInventory).filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = selectedTab === 'all' || item.type === selectedTab;

    return matchesSearch && matchesTab;
  });

  // Get unique resource types for tabs
  const resourceTypes: string[] = [];
  const typeSet = new Set<string>();
  inventory.forEach((item) => {
    if (!typeSet.has(item.type)) {
      typeSet.add(item.type);
      resourceTypes.push(item.type);
    }
  });

  // Calculate inventory statistics
  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueItems = Object.keys(groupedInventory).length;
  const rarityCount = inventory.reduce((acc, item) => {
    acc[item.rarity] = (acc[item.rarity] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  // Calculate inventory value
  const inventoryValue = inventory.reduce((total, item) => {
    const rarityMultiplier = {
      common: 10,
      rare: 50,
      epic: 200,
      legendary: 1000,
    }[item.rarity] || 10;
    return total + (item.quantity * rarityMultiplier);
  }, 0);

  const handleUseItem = (itemId: string, quantity: number) => {
    const item = inventory.find(r => r.id === itemId);
    if (!item) return;

    // Check if we have enough quantity
    if (item.quantity < quantity) {
      showWarning(
        'Insufficient Quantity',
        `Cannot use ${quantity} ${item.name}(s) - only have ${item.quantity}`
      );
      return;
    }

    // Remove the specified quantity of the item
    removeResource(itemId, quantity);

    // Use new tiered benefit system
    const baseDuration = 300000; // 5 minutes base duration
    const totalDuration = baseDuration * quantity;

    switch (item.type) {
      case 'energy':
        // Energy items provide mining efficiency boost using tiered system
        useItemEffectsStore.getState().useItems('mining_efficiency', quantity, totalDuration, `${item.name} Mining Boost`);

        showSuccess(
          'Mining Efficiency Boosted!',
          `Used ${quantity} ${item.name}(s) - Check Active Effects panel for your current tier bonus!`
        );
        break;

      case 'crystal':
        // Crystals provide experience boost using tiered system
        const rarityMultiplier = {
          common: 1.0,
          rare: 1.5,
          epic: 2.0,
          legendary: 3.0,
        }[item.rarity] || 1.0;

        const experienceGained = quantity * 50 * rarityMultiplier; // 50-150 XP per crystal based on rarity
        const expDuration = 600000 * quantity; // 10 minutes per crystal

        updatePlayerExperience(Math.floor(experienceGained));
        useItemEffectsStore.getState().useItems('experience_boost', quantity, expDuration, `${item.name} Experience Boost`);

        showSuccess(
          'Experience Boosted!',
          `Used ${quantity} ${item.name}(s) - Gained ${Math.floor(experienceGained)} XP and tiered experience boost!`
        );
        break;

      case 'metal':
        // Metals provide crafting speed and resource yield boost using tiered system
        const metalDuration = 450000 * quantity; // 7.5 minutes per metal

        useItemEffectsStore.getState().useItems('crafting_speed', quantity, metalDuration, `${item.name} Crafting Boost`);
        useItemEffectsStore.getState().useItems('resource_yield', quantity, metalDuration, `${item.name} Resource Yield`);

        showSuccess(
          'Equipment Enhanced!',
          `Used ${quantity} ${item.name}(s) - Check Active Effects panel for your current tier bonuses!`
        );
        break;

      default:
        // Generic items provide small temporary boosts using tiered system
        const genericDuration = 180000 * quantity; // 3 minutes per item

        useItemEffectsStore.getState().useItems('mining_efficiency', quantity, genericDuration, `${item.name} Boost`);

        showInfo(
          'Item Used',
          `Used ${quantity} ${item.name}(s) - Check Active Effects panel for your current tier bonus!`
        );
        break;
    }
  };

  const handleDropItem = (itemId: string, quantity: number) => {
    removeResource(itemId, quantity);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pb-20 max-w-6xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Inventory Management</h1>
          <p className="text-lg text-default-600">
            Manage your collected resources, tools, and equipment. Use items for bonuses or drop unwanted items.
          </p>
        </div>

        {/* Inventory Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-primary-500">{totalItems}</div>
              <div className="text-sm text-default-500">Total Items</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-secondary-500">{uniqueItems}</div>
              <div className="text-sm text-default-500">Unique Types</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-success-500">{formatNumber(inventoryValue)}</div>
              <div className="text-sm text-default-500">Est. Value (Credits)</div>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="text-center">
              <div className="text-2xl font-bold text-warning-500">{resourceTypes.length}</div>
              <div className="text-sm text-default-500">Resource Types</div>
            </CardBody>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Inventory */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-xl font-bold">Your Items</h3>
              </CardHeader>
              <CardBody>
                <InventoryInterface
                  inventory={inventory}
                  onUseItem={handleUseItem}
                  onDropItem={handleDropItem}
                  className="border-none shadow-none"
                />
              </CardBody>
            </Card>
          </div>

          {/* Inventory Analysis */}
          <div className="space-y-6">
            {/* Rarity Distribution */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Rarity Distribution</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {Object.entries(rarityCount).map(([rarity, count]) => (
                    <div key={rarity} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getRarityColor(rarity) }}
                        />
                        <span className="capitalize text-sm">{rarity}</span>
                      </div>
                      <Chip
                        size="sm"
                        variant="flat"
                        style={{
                          backgroundColor: `${getRarityColor(rarity)}20`,
                          color: getRarityColor(rarity)
                        }}
                      >
                        {count}
                      </Chip>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Resource Types */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Resource Types</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  {resourceTypes.map(type => {
                    const typeCount = inventory
                      .filter(item => item.type === type)
                      .reduce((sum, item) => sum + item.quantity, 0);

                    return (
                      <div key={type} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm capitalize">{type}</span>
                        </div>
                        <Chip
                          size="sm"
                          color={getResourceTypeColor(type) as any}
                          variant="flat"
                        >
                          {typeCount}
                        </Chip>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <h3 className="text-lg font-bold">Quick Actions</h3>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="font-semibold text-blue-700 mb-1">💡 Item Usage Tips</h4>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Energy items restore mining efficiency</li>
                      <li>• Crystals provide experience boosts</li>
                      <li>• Metals enhance equipment performance</li>
                      <li>• Rare items unlock special abilities</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="font-semibold text-green-700 mb-1">🎯 Inventory Management</h4>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• Use items for immediate benefits</li>
                      <li>• Drop unwanted items to free space</li>
                      <li>• Save rare items for crafting</li>
                      <li>• Monitor inventory value growth</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <h4 className="font-semibold text-purple-700 mb-1">🔨 Crafting Ready</h4>
                    <p className="text-xs text-purple-600">
                      You have {inventory.filter(item => item.rarity !== 'common').length} rare+ items
                      ready for advanced crafting recipes.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>

        {/* Empty Inventory State */}
        {inventory.length === 0 && (
          <Card className="mt-8">
            <CardBody className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-2">Empty Inventory</h3>
              <p className="text-default-600 mb-4">
                Start mining asteroids and completing missions to collect resources and items!
              </p>
              <div className="text-sm text-default-500">
                Head to the exploration area and click on asteroids to begin mining.
              </div>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
    </div>
  );
}
