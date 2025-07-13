'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import type { Resource } from '@/types/game';
import { getRarityColor, getResourceTypeColor, formatNumber } from '@/utils/gameHelpers';

interface InventoryInterfaceProps {
  inventory: Resource[];
  onUseItem?: (itemId: string, quantity: number) => void;
  onDropItem?: (itemId: string, quantity: number) => void;
  onClose?: () => void;
  className?: string;
}

export default function InventoryInterface({
  inventory,
  onUseItem,
  onDropItem,
  onClose,
  className = "",
}: InventoryInterfaceProps) {
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  const [selectedItem, setSelectedItem] = useState<Resource | null>(null);
  const [dropQuantity, setDropQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

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
  const resourceTypes = [...new Set(inventory.map(item => item.type))];

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setDropQuantity(1);
    onOpen();
  };

  const handleUseItem = () => {
    if (selectedItem && onUseItem) {
      // Use the first item in the stack with the selected quantity
      const firstItem = selectedItem.items[0];
      const quantityToUse = Math.min(dropQuantity, selectedItem.totalQuantity);
      onUseItem(firstItem.id, quantityToUse);
      onModalClose();
    }
  };

  const handleDropItem = () => {
    if (selectedItem && onDropItem) {
      // Drop from the first available stack
      const firstItem = selectedItem.items[0];
      onDropItem(firstItem.id, dropQuantity);
      onModalClose();
    }
  };

  const getInventoryStats = () => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = Object.keys(groupedInventory).length;
    const rarityCount = inventory.reduce((acc, item) => {
      acc[item.rarity] = (acc[item.rarity] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);

    return { totalItems, uniqueItems, rarityCount };
  };

  const stats = getInventoryStats();

  return (
    <>
      <Card className={`w-96 h-[600px] ${className}`}>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Inventory</h3>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat">
              {stats.totalItems} items
            </Chip>
            <Chip size="sm" variant="flat" color="secondary">
              {stats.uniqueItems} types
            </Chip>
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
          {/* Search */}
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="sm"
            className="w-full"
          />

          {/* Inventory Stats */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.rarityCount).map(([rarity, count]) => (
              <Chip
                key={rarity}
                size="sm"
                variant="flat"
                className="justify-center"
                style={{ backgroundColor: `${getRarityColor(rarity)}20`, color: getRarityColor(rarity) }}
              >
                {rarity}: {count}
              </Chip>
            ))}
          </div>

          {/* Tabs for filtering */}
          <Tabs
            selectedKey={selectedTab}
            onSelectionChange={(key) => setSelectedTab(key as string)}
            size="sm"
            className="w-full"
          >
            <Tab key="all" title="All" />
            {resourceTypes.map(type => (
              <Tab key={type} title={type.charAt(0).toUpperCase() + type.slice(1)} />
            ))}
          </Tabs>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center text-default-500 py-8">
                {searchTerm ? 'No items match your search' : 'Inventory is empty'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map((item: any, index) => (
                  <Card
                    key={index}
                    isPressable
                    onPress={() => handleItemClick(item)}
                    className="hover:scale-105 transition-transform cursor-pointer"
                  >
                    <CardBody className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium truncate">{item.name}</h4>
                          <Chip
                            size="sm"
                            variant="flat"
                            style={{
                              backgroundColor: `${getRarityColor(item.rarity)}20`,
                              color: getRarityColor(item.rarity)
                            }}
                          >
                            {item.rarity}
                          </Chip>
                        </div>

                        <div className="flex justify-between items-center">
                          <Chip
                            size="sm"
                            color={getResourceTypeColor(item.type) as any}
                            variant="flat"
                          >
                            {item.type}
                          </Chip>
                          <span className="text-lg font-bold">
                            {formatNumber(item.totalQuantity)}
                          </span>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Item Detail Modal */}
      <Modal isOpen={isOpen} onClose={onModalClose}>
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <h3>{selectedItem?.name}</h3>
              <Chip
                size="sm"
                variant="flat"
                style={{
                  backgroundColor: selectedItem ? `${getRarityColor(selectedItem.rarity)}20` : '',
                  color: selectedItem ? getRarityColor(selectedItem.rarity) : ''
                }}
              >
                {selectedItem?.rarity}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedItem && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-default-500">Type</span>
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={getResourceTypeColor(selectedItem.type) as any}
                        variant="flat"
                      >
                        {selectedItem.type}
                      </Chip>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-default-500">Quantity</span>
                    <div className="text-lg font-bold">
                      {formatNumber(selectedItem.totalQuantity)}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-default-500">Description</span>
                  <p className="text-sm mt-1">
                    A valuable {selectedItem.rarity} {selectedItem.type} resource used in various crafting recipes.
                  </p>
                </div>

                {/* Individual items breakdown */}
                {selectedItem.items && selectedItem.items.length > 1 && (
                  <div>
                    <span className="text-sm text-default-500">Item Stacks ({selectedItem.items.length})</span>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {selectedItem.items.map((item: Resource, index: number) => (
                        <div key={index} className="flex justify-between text-xs bg-default-100 rounded p-2">
                          <span>Stack {index + 1}</span>
                          <span>{item.quantity} units</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity selector - shown for both Use and Drop actions */}
                {(onUseItem || onDropItem) && (
                  <div>
                    <span className="text-sm text-default-500">Quantity</span>
                    <Input
                      type="number"
                      min={1}
                      max={selectedItem.totalQuantity}
                      value={dropQuantity.toString()}
                      onChange={(e) => setDropQuantity(Math.max(1, Math.min(selectedItem.totalQuantity, parseInt(e.target.value) || 1)))}
                      size="sm"
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onModalClose}>
              Close
            </Button>
            {onUseItem && (
              <Button color="primary" onPress={handleUseItem}>
                Use {dropQuantity} {dropQuantity === 1 ? 'Item' : 'Items'}
              </Button>
            )}
            {onDropItem && (
              <Button color="danger" variant="light" onPress={handleDropItem}>
                Drop {dropQuantity}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
