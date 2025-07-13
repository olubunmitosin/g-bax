'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';
import { Input } from '@heroui/input';
import { Tabs, Tab } from '@heroui/tabs';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import WalletConnectionDialog from './WalletConnectionDialog';
import type { Resource, CraftingRecipe } from '@/types/game';
import type { CraftingOperation } from '@/systems/craftingSystem';
import { formatNumber, getRarityColor, getResourceTypeColor } from '@/utils/gameHelpers';
import { useGameStore } from '@/stores/gameStore';

interface CraftingInterfaceProps {
  availableRecipes: CraftingRecipe[];
  inventory: Resource[];
  activeCraftingOperations: CraftingOperation[];
  onStartCrafting: (recipeId: string) => void;
  onCancelCrafting: (operationId: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function CraftingInterface({
  availableRecipes,
  inventory,
  activeCraftingOperations,
  onStartCrafting,
  onCancelCrafting,
  onClose,
  className = "",
}: CraftingInterfaceProps) {
  const { isOpen, onOpen, onClose: onModalClose } = useDisclosure();
  const { isOpen: isWalletDialogOpen, onOpen: onWalletDialogOpen, onClose: onWalletDialogClose } = useDisclosure();
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [craftingProgress, setCraftingProgress] = useState<{ [key: string]: number }>({});

  // Get player from game store
  const { player } = useGameStore();

  // Update crafting progress
  useEffect(() => {
    const interval = setInterval(() => {
      const newProgress: { [key: string]: number } = {};
      
      activeCraftingOperations.forEach(operation => {
        const elapsed = Date.now() - operation.startTime;
        const progress = Math.min(elapsed / operation.duration, 1.0) * 100;
        newProgress[operation.id] = progress;
      });
      
      setCraftingProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, [activeCraftingOperations]);

  // Check if player can craft a recipe
  const canCraftRecipe = (recipe: CraftingRecipe): {
    canCraft: boolean;
    missingResources?: { resourceType: string; needed: number; have: number }[];
  } => {
    const missingResources: { resourceType: string; needed: number; have: number }[] = [];

    for (const requirement of recipe.requiredResources) {
      const playerAmount = getResourceAmount(inventory, requirement.resourceType);
      
      if (playerAmount < requirement.quantity) {
        missingResources.push({
          resourceType: requirement.resourceType,
          needed: requirement.quantity,
          have: playerAmount,
        });
      }
    }

    return {
      canCraft: missingResources.length === 0,
      missingResources: missingResources.length > 0 ? missingResources : undefined,
    };
  };

  // Get resource amount from inventory
  const getResourceAmount = (inventory: Resource[], resourceType: string): number => {
    return inventory
      .filter(resource => resource.type === resourceType)
      .reduce((total, resource) => total + resource.quantity, 0);
  };

  // Filter recipes based on search and tab
  const filteredRecipes = availableRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = selectedTab === 'all' || recipe.output.rarity === selectedTab;

    return matchesSearch && matchesTab;
  });

  // Get unique rarities for tabs
  const rarities = [...new Set(availableRecipes.map(recipe => recipe.output.rarity))];

  const handleRecipeClick = (recipe: CraftingRecipe) => {
    setSelectedRecipe(recipe);
    onOpen();
  };

  const handleStartCrafting = () => {
    if (selectedRecipe && player) {
      onStartCrafting(selectedRecipe.id);
      onModalClose();
    } else if (!player) {
      onModalClose();
      onWalletDialogOpen();
    }
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <>
      <Card className={`w-[500px] h-[700px] ${className}`}>
        <CardHeader className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Crafting Station</h3>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" color="primary">
              {availableRecipes.length} recipes
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
          {/* Search and Filter */}
          <div className="space-y-2">
            <Input
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              startContent={<span className="text-default-400">🔍</span>}
            />
            
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={(key) => setSelectedTab(key as string)}
              size="sm"
              variant="underlined"
            >
              <Tab key="all" title="All" />
              {rarities.map(rarity => (
                <Tab key={rarity} title={rarity.charAt(0).toUpperCase() + rarity.slice(1)} />
              ))}
            </Tabs>
          </div>

          {/* Active Crafting Operations */}
          {activeCraftingOperations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary">Active Crafting</h4>
              {activeCraftingOperations.map(operation => (
                <Card key={operation.id} className="bg-primary/10">
                  <CardBody className="p-3">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{operation.outputItem.name}</span>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => onCancelCrafting(operation.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                      <Progress
                        value={craftingProgress[operation.id] || 0}
                        color="primary"
                        size="sm"
                        showValueLabel
                        formatOptions={{ style: 'percent', maximumFractionDigits: 0 }}
                      />
                      <div className="text-xs text-default-500">
                        {formatTime(operation.duration - (Date.now() - operation.startTime))} remaining
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {/* Recipes Grid */}
          <div className="flex-1 overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <div className="text-center text-default-500 py-8">
                {searchTerm ? 'No recipes match your search' : 'No recipes available'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {filteredRecipes.map((recipe) => {
                  const craftCheck = canCraftRecipe(recipe);
                  return (
                    <Card
                      key={recipe.id}
                      isPressable
                      onPress={() => handleRecipeClick(recipe)}
                      className={`hover:scale-[1.02] transition-transform cursor-pointer ${
                        !craftCheck.canCraft ? 'opacity-60' : ''
                      }`}
                    >
                      <CardBody className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{recipe.name}</h4>
                              <p className="text-xs text-default-500 line-clamp-2">{recipe.description}</p>
                            </div>
                            <Chip
                              size="sm"
                              variant="flat"
                              style={{
                                backgroundColor: `${getRarityColor(recipe.output.rarity)}20`,
                                color: getRarityColor(recipe.output.rarity)
                              }}
                            >
                              {recipe.output.rarity}
                            </Chip>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-default-500">
                              Level {recipe.requiredLevel} • {formatTime(recipe.craftingTime)}
                            </span>
                            <div className="flex gap-1">
                              {recipe.requiredResources.map((req, index) => (
                                <Chip
                                  key={index}
                                  size="sm"
                                  variant="flat"
                                  color={getResourceTypeColor(req.resourceType) as any}
                                  className="text-xs"
                                >
                                  {req.quantity} {req.resourceType}
                                </Chip>
                              ))}
                            </div>
                          </div>
                          
                          {!craftCheck.canCraft && (
                            <div className="text-xs text-danger">
                              Missing: {craftCheck.missingResources?.map(mr => 
                                `${mr.needed - mr.have} ${mr.resourceType}`
                              ).join(', ')}
                            </div>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Recipe Details Modal */}
      <Modal isOpen={isOpen} onClose={onModalClose} size="lg">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span>{selectedRecipe?.name}</span>
              <Chip
                size="sm"
                variant="flat"
                style={{
                  backgroundColor: `${getRarityColor(selectedRecipe?.output.rarity || 'common')}20`,
                  color: getRarityColor(selectedRecipe?.output.rarity || 'common')
                }}
              >
                {selectedRecipe?.output.rarity}
              </Chip>
            </div>
          </ModalHeader>
          <ModalBody>
            {selectedRecipe && (
              <div className="space-y-4">
                <p className="text-sm text-default-600">{selectedRecipe.description}</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-default-500">Required Level</span>
                    <div className="text-lg font-bold">{selectedRecipe.requiredLevel}</div>
                  </div>
                  <div>
                    <span className="text-sm text-default-500">Crafting Time</span>
                    <div className="text-lg font-bold">{formatTime(selectedRecipe.craftingTime)}</div>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-default-500">Required Resources</span>
                  <div className="mt-2 space-y-2">
                    {selectedRecipe.requiredResources.map((req, index) => {
                      const available = getResourceAmount(inventory, req.resourceType);
                      const hasEnough = available >= req.quantity;
                      
                      return (
                        <div key={index} className="flex justify-between items-center p-2 bg-default-100 rounded">
                          <div className="flex items-center gap-2">
                            <Chip
                              size="sm"
                              color={getResourceTypeColor(req.resourceType) as any}
                              variant="flat"
                            >
                              {req.resourceType}
                            </Chip>
                            <span className="text-sm">{req.quantity} required</span>
                          </div>
                          <div className={`text-sm font-medium ${hasEnough ? 'text-success' : 'text-danger'}`}>
                            {available} / {req.quantity}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-default-500">Output</span>
                  <div className="mt-2 p-2 bg-default-100 rounded">
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={getResourceTypeColor(selectedRecipe.output.type) as any}
                        variant="flat"
                      >
                        {selectedRecipe.output.type}
                      </Chip>
                      <span className="text-sm font-medium">{selectedRecipe.output.name}</span>
                      <span className="text-xs text-default-500">x{selectedRecipe.output.quantity}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleStartCrafting}
              isDisabled={selectedRecipe ? !canCraftRecipe(selectedRecipe).canCraft : true}
            >
              {!player ? 'Connect Wallet to Craft' : 'Start Crafting'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Wallet Connection Dialog */}
      <WalletConnectionDialog isOpen={isWalletDialogOpen} onClose={onWalletDialogClose} />
    </>
  );
}
