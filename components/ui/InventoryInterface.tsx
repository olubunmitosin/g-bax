"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";

import { Resource } from "@/stores/gameStore";
import {
  getRarityColor,
  getResourceTypeColor,
  formatNumber,
} from "@/utils/gameHelpers";

// Extended interface for grouped inventory items
interface GroupedInventoryItem extends Resource {
  totalQuantity: number;
  items: Resource[];
}

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
  const [selectedItem, setSelectedItem] = useState<GroupedInventoryItem | null>(
    null,
  );
  const [dropQuantity, setDropQuantity] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Group inventory items by type and rarity
  const groupedInventory = inventory.reduce(
    (acc, item) => {
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
    },
    {} as Record<string, GroupedInventoryItem>,
  );

  // Filter items based on search and tab
  const filteredItems = Object.values(groupedInventory).filter(
    (item: GroupedInventoryItem) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = selectedTab === "all" || item.type === selectedTab;

      return matchesSearch && matchesTab;
    },
  );

  // Get unique resource types for tabs
  const resourceTypes: string[] = [];
  const typeSet = new Set<string>();

  inventory.forEach((item) => {
    if (!typeSet.has(item.type)) {
      typeSet.add(item.type);
      resourceTypes.push(item.type);
    }
  });

  const handleItemClick = (item: GroupedInventoryItem) => {
    setSelectedItem(item);
    setDropQuantity(1);
    onOpen();
  };

  const handleUseItem = () => {
    if (selectedItem && onUseItem) {
      const quantityToUse = Math.min(dropQuantity, selectedItem.totalQuantity);
      let remainingQuantity = quantityToUse;

      // Use items from the stack, starting with the first item
      for (const item of selectedItem.items) {
        if (remainingQuantity <= 0) break;

        const useFromThisItem = Math.min(remainingQuantity, item.quantity);

        onUseItem(item.id, useFromThisItem);
        remainingQuantity -= useFromThisItem;
      }

      onModalClose();
    }
  };

  const handleDropItem = () => {
    if (selectedItem && onDropItem) {
      let remainingQuantity = dropQuantity;

      // Drop items from the stack, starting with the first item
      for (const item of selectedItem.items) {
        if (remainingQuantity <= 0) break;

        const dropFromThisItem = Math.min(remainingQuantity, item.quantity);

        onDropItem(item.id, dropFromThisItem);
        remainingQuantity -= dropFromThisItem;
      }

      onModalClose();
    }
  };

  const getInventoryStats = () => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = Object.keys(groupedInventory).length;
    const rarityCount = inventory.reduce(
      (acc, item) => {
        acc[item.rarity] = (acc[item.rarity] || 0) + item.quantity;

        return acc;
      },
      {} as Record<string, number>,
    );

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
            <Chip color="secondary" size="sm" variant="flat">
              {stats.uniqueItems} types
            </Chip>
            {onClose && (
              <Button
                isIconOnly
                aria-label="Close inventory"
                className="text-default-400 hover:text-default-600"
                size="sm"
                variant="light"
                onPress={onClose}
              >
                ✕
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody className="space-y-4">
          {/* Search */}
          <Input
            className="w-full"
            placeholder="Search items..."
            size="sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Inventory Stats */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.rarityCount).map(([rarity, count]) => (
              <Chip
                key={rarity}
                className="justify-center"
                size="sm"
                style={{
                  backgroundColor: `${getRarityColor(rarity)}20`,
                  color: getRarityColor(rarity),
                }}
                variant="flat"
              >
                {rarity}: {count}
              </Chip>
            ))}
          </div>

          {/* Tabs for filtering */}
          <Tabs
            className="w-full"
            selectedKey={selectedTab}
            size="sm"
            onSelectionChange={(key) => setSelectedTab(key as string)}
          >
            <Tab key="all" title="All" />
            {resourceTypes.map((type) => (
              <Tab
                key={type}
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              />
            ))}
          </Tabs>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <div className="text-center text-default-500 py-8">
                {searchTerm
                  ? "No items match your search"
                  : "Inventory is empty"}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map((item: GroupedInventoryItem) => (
                  <Card
                    key={`${item.type}_${item.rarity}_${item.name}`}
                    isPressable
                    className="hover:scale-105 transition-transform cursor-pointer"
                    onPress={() => handleItemClick(item)}
                  >
                    <CardBody className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium truncate">
                            {item.name}
                          </h4>
                          <Chip
                            size="sm"
                            style={{
                              backgroundColor: `${getRarityColor(item.rarity)}20`,
                              color: getRarityColor(item.rarity),
                            }}
                            variant="flat"
                          >
                            {item.rarity}
                          </Chip>
                        </div>

                        <div className="flex justify-between items-center">
                          <Chip
                            color={getResourceTypeColor(item.type) as any}
                            size="sm"
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
                style={{
                  backgroundColor: selectedItem
                    ? `${getRarityColor(selectedItem.rarity)}20`
                    : "",
                  color: selectedItem
                    ? getRarityColor(selectedItem.rarity)
                    : "",
                }}
                variant="flat"
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
                        color={getResourceTypeColor(selectedItem.type) as any}
                        size="sm"
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
                    A valuable {selectedItem.rarity} {selectedItem.type}{" "}
                    resource used in various crafting recipes.
                  </p>
                </div>

                {/* Individual items breakdown */}
                {selectedItem.items && selectedItem.items.length > 1 && (
                  <div>
                    <span className="text-sm text-default-500">
                      Item Stacks ({selectedItem.items.length})
                    </span>
                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {selectedItem.items.map(
                        (item: Resource, index: number) => (
                          <div
                            key={`${item.id || item.type}_${item.quantity}_${index}`}
                            className="flex justify-between text-xs bg-default-100 rounded p-2"
                          >
                            <span>Stack {index + 1}</span>
                            <span>{item.quantity} units</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Quantity selector - shown for both Use and Drop actions */}
                {(onUseItem || onDropItem) && (
                  <div>
                    <span className="text-sm text-default-500">Quantity</span>
                    <Input
                      className="mt-1"
                      max={selectedItem.totalQuantity}
                      min={1}
                      size="sm"
                      type="number"
                      value={dropQuantity.toString()}
                      onChange={(e) =>
                        setDropQuantity(
                          Math.max(
                            1,
                            Math.min(
                              selectedItem.totalQuantity,
                              parseInt(e.target.value) || 1,
                            ),
                          ),
                        )
                      }
                    />
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              aria-label="Close item details"
              variant="light"
              onPress={onModalClose}
            >
              Close
            </Button>
            {onUseItem && (
              <Button
                aria-label={`Use ${dropQuantity} ${selectedItem?.name || "item"}${dropQuantity === 1 ? "" : "s"}`}
                color="primary"
                onPress={handleUseItem}
              >
                Use {dropQuantity} {dropQuantity === 1 ? "Item" : "Items"}
              </Button>
            )}
            {onDropItem && (
              <Button
                aria-label={`Drop ${dropQuantity} ${selectedItem?.name || "item"}${dropQuantity === 1 ? "" : "s"}`}
                color="danger"
                variant="light"
                onPress={handleDropItem}
              >
                Drop {dropQuantity}
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
