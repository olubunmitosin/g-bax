"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Progress } from "@heroui/progress";

import { useCharacterSystemManager } from "@/hooks/useCharacterSystemManager";
import { formatNumber } from "@/utils/gameHelpers";

interface TraitAssignmentPanelProps {
  className?: string;
}

export default function TraitAssignmentPanel({
  className = "",
}: TraitAssignmentPanelProps) {
  const {
    playerCharacter,
    isCharacterSystemInitialized,
    isLoadingCharacter,
    assignTrait,
    getAvailableTraits,
    getTraitBenefits,
    createCharacter,
    needsCharacter,
  } = useCharacterSystemManager();

  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedTrait, setSelectedTrait] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  const availableTraits = getAvailableTraits();

  // Handle trait assignment
  const handleAssignTrait = async () => {
    if (!selectedCategory || !selectedTrait) return;

    setIsAssigning(true);
    try {
      await assignTrait(selectedCategory, selectedTrait);
      setSelectedCategory("");
      setSelectedTrait("");
    } catch (error) {
      console.error("Failed to assign trait:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle character creation
  const handleCreateCharacter = async () => {
    setIsAssigning(true);
    try {
      await createCharacter([["Mining", "Novice Miner"]]); // Start with basic mining trait
    } catch (error) {
      console.error("Failed to create character:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  // Get trait category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Mining":
        return "⛏️";
      case "Crafting":
        return "🔨";
      case "Exploration":
        return "🚀";
      case "Combat":
        return "⚔️";
      case "Leadership":
        return "👑";
      default:
        return "🎯";
    }
  };

  // Get trait rarity color
  const getTraitColor = (traitName: string) => {
    if (traitName.includes("Master") || traitName.includes("Champion") || traitName.includes("Guild Master")) {
      return "warning"; // Legendary
    } else if (traitName.includes("Expert") || traitName.includes("Skilled") || traitName.includes("Deep") || traitName.includes("Warrior") || traitName.includes("Squad")) {
      return "secondary"; // Epic
    } else if (traitName.includes("Novice") || traitName.includes("Apprentice") || traitName.includes("Space") || traitName.includes("Defender") || traitName.includes("Team")) {
      return "primary"; // Common
    }
    return "default";
  };

  // Remove the character system initialization check to prevent blinking

  if (needsCharacter) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardHeader className="pb-2">
          <h4 className="font-semibold flex items-center gap-2">
            <span>🎭</span>
            Create Character
          </h4>
        </CardHeader>
        <CardBody className="pt-0">
          <div className="space-y-3">
            <p className="text-sm text-default-600">
              Create your space explorer character to start earning traits and bonuses!
            </p>

            <Button
              color="primary"
              onPress={handleCreateCharacter}
              isLoading={isAssigning}
              className="w-full"
            >
              Create Character
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!playerCharacter) {
    return (
      <Card className={`w-80 ${className}`}>
        <CardBody className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm text-default-600">Create a character to assign traits</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className={`w-80 ${className}`}>
      <CardHeader className="pb-2">
        <h4 className="font-semibold flex items-center gap-2">
          <span>🎭</span>
          Character Traits
        </h4>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="space-y-4">
          {/* Current Traits */}
          <div>
            <h5 className="text-sm font-medium mb-2">Current Traits</h5>
            <div className="flex flex-wrap gap-1">
              {playerCharacter.traits.length > 0 ? (
                playerCharacter.traits.map(([category, name], index) => {
                  const benefits = getTraitBenefits(category, name);
                  return (
                    <Chip
                      key={index}
                      size="sm"
                      color={getTraitColor(name)}
                      variant="flat"
                      startContent={getCategoryIcon(category)}
                    >
                      {name}
                    </Chip>
                  );
                })
              ) : (
                <span className="text-xs text-default-500">No traits assigned</span>
              )}
            </div>
          </div>

          <Divider />

          {/* Trait Assignment */}
          <div>
            <h5 className="text-sm font-medium mb-2">Assign New Trait</h5>
            <div className="space-y-2">
              {/* Category Selection */}
              <Select
                placeholder="Select category"
                size="sm"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedTrait(""); // Reset trait selection
                }}
              >
                {Object.keys(availableTraits).map((category) => (
                  <SelectItem key={category}>
                    <div className="flex items-center gap-2">
                      <span>{getCategoryIcon(category)}</span>
                      <span>{category}</span>
                    </div>
                  </SelectItem>
                ))}
              </Select>

              {/* Trait Selection */}
              {selectedCategory && (
                <Select
                  placeholder="Select trait"
                  size="sm"
                  value={selectedTrait}
                  onChange={(e) => setSelectedTrait(e.target.value)}
                >
                  {availableTraits[selectedCategory as keyof typeof availableTraits].map((trait: string) => {
                    const benefits = getTraitBenefits(selectedCategory, trait);
                    return (
                      <SelectItem key={trait}>
                        <div className="flex flex-col">
                          <span>{trait}</span>
                          <span className="text-xs text-default-500">
                            {benefits.description}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </Select>
              )}

              {/* Trait Benefits Preview */}
              {selectedCategory && selectedTrait && (
                <div className="p-2 bg-default/5 rounded-lg">
                  <div className="text-xs text-default-600">
                    <strong>Benefits:</strong>
                  </div>
                  <div className="text-xs">
                    {getTraitBenefits(selectedCategory, selectedTrait).description}
                  </div>
                </div>
              )}

              {/* Assign Button */}
              <Button
                color="primary"
                size="sm"
                onPress={handleAssignTrait}
                isDisabled={!selectedCategory || !selectedTrait}
                isLoading={isAssigning}
                className="w-full"
              >
                Assign Trait
              </Button>
            </div>
          </div>

          {/* Character Info */}
          <div className="p-2 bg-default/5 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-default-600">Character Level:</span>
              <span className="font-medium">{playerCharacter.level}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-default-600">Experience:</span>
              <span className="font-medium">{formatNumber(playerCharacter.experience)}</span>
            </div>
          </div>

          {/* Blockchain Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-success">Synced to blockchain</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
