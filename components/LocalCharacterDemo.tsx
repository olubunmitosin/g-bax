/**
 * Local Character System Demo Component
 * Demonstrates the local character and trait system functionality
 */

"use client";

import React, { useState } from "react";
import { useLocalCharacterIntegration } from "@/hooks/useLocalCharacterIntegration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, User, Zap, RotateCcw, Plus } from "lucide-react";

export function LocalCharacterDemo() {
  const {
    activeCharacter,
    isLoading,
    isReady,
    needsCharacter,
    error,
    createCharacter,
    assignTrait,
    evolveTrait,
    addExperience,
    resetAllCharacters,
    getAvailableTraitsForCharacter,
    getCharacterStats,
    getTraitBonuses,
    getTraitBenefits,
    canEvolveTrait,
    clearError,
    playerId,
    isConnected,
  } = useLocalCharacterIntegration();

  const [characterName, setCharacterName] = useState("Space Explorer");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTrait, setSelectedTrait] = useState("");
  const [experienceAmount, setExperienceAmount] = useState(100);

  const stats = getCharacterStats();
  const bonuses = getTraitBonuses();
  const availableTraits = getAvailableTraitsForCharacter();

  // Group available traits by category
  const traitsByCategory = availableTraits.reduce((acc, trait) => {
    const category = trait.category.charAt(0).toUpperCase() + trait.category.slice(1);
    if (!acc[category]) acc[category] = [];
    acc[category].push(trait);
    return acc;
  }, {} as Record<string, typeof availableTraits>);

  const handleCreateCharacter = async () => {
    try {
      await createCharacter(characterName, []);
    } catch (error) {
      console.error("Failed to create character:", error);
    }
  };

  const handleAssignTrait = async () => {
    if (!selectedCategory || !selectedTrait) return;
    
    try {
      await assignTrait(selectedCategory.toLowerCase(), selectedTrait);
      setSelectedCategory("");
      setSelectedTrait("");
    } catch (error) {
      console.error("Failed to assign trait:", error);
    }
  };

  const handleAddExperience = async () => {
    try {
      await addExperience(experienceAmount);
    } catch (error) {
      console.error("Failed to add experience:", error);
    }
  };

  const handleEvolveTrait = async (traitId: string) => {
    try {
      await evolveTrait(traitId);
    } catch (error) {
      console.error("Failed to evolve trait:", error);
    }
  };

  const handleResetCharacters = async () => {
    try {
      await resetAllCharacters();
      setCharacterName("Space Explorer");
      setSelectedCategory("");
      setSelectedTrait("");
    } catch (error) {
      console.error("Failed to reset characters:", error);
    }
  };

  if (!isReady) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Local Character System
          </CardTitle>
          <CardDescription>
            {isLoading ? "Loading character system..." : "Initializing..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <Button variant="outline" size="sm" onClick={clearError}>
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Local Character System Demo
          </CardTitle>
          <CardDescription>
            Player ID: {playerId} | Connected: {isConnected ? "Yes" : "No"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.level}</div>
              <div className="text-sm text-gray-600">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.experience}</div>
              <div className="text-sm text-gray-600">Experience</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.traitsCount}</div>
              <div className="text-sm text-gray-600">Traits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalBonuses}%</div>
              <div className="text-sm text-gray-600">Total Bonuses</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{error}</span>
              <Button variant="outline" size="sm" onClick={clearError}>
                Clear Error
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Creation */}
      {needsCharacter && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Create Your Character
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Character Name</label>
                <Input
                  value={characterName}
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="Enter character name"
                />
              </div>
              <Button onClick={handleCreateCharacter} disabled={!characterName.trim()}>
                Create Character
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Character Details */}
      {activeCharacter && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="traits">Traits</TabsTrigger>
            <TabsTrigger value="bonuses">Bonuses</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{activeCharacter.name}</CardTitle>
                <CardDescription>Level {activeCharacter.level} Character</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Experience</span>
                      <span>{activeCharacter.experience} XP</span>
                    </div>
                    <Progress value={(activeCharacter.experience % 100)} className="w-full" />
                    <div className="text-xs text-gray-500 mt-1">
                      {100 - (activeCharacter.experience % 100)} XP to next level
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Created:</strong> {new Date(activeCharacter.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <strong>Last Updated:</strong> {new Date(activeCharacter.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="traits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Current Traits ({activeCharacter.traits.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {activeCharacter.traits.length > 0 ? (
                    activeCharacter.traits.map((trait, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">{trait.name}</div>
                          <div className="text-sm text-gray-600 capitalize">{trait.category} • Level {trait.level}</div>
                          <div className="text-xs text-gray-500">
                            Effects: {Object.entries(trait.effects).map(([key, value]) => `${key}: ${value}`).join(", ")}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">Lv.{trait.level}</Badge>
                          {canEvolveTrait(trait.id) && (
                            <Button size="sm" onClick={() => handleEvolveTrait(trait.id)}>
                              Evolve
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No traits assigned yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assign New Trait */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Assign New Trait
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(traitsByCategory).map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={selectedTrait} 
                    onValueChange={setSelectedTrait}
                    disabled={!selectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select trait" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCategory && traitsByCategory[selectedCategory]?.map(trait => (
                        <SelectItem key={trait.id} value={trait.name}>
                          {trait.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={handleAssignTrait}
                    disabled={!selectedCategory || !selectedTrait}
                  >
                    Assign Trait
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bonuses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Active Bonuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(bonuses).map(([key, value]) => {
                    const bonusName = key.replace("Bonus", "");
                    const displayName = bonusName.charAt(0).toUpperCase() + bonusName.slice(1);
                    
                    return (
                      <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{displayName}</span>
                        <Badge variant={value > 0 ? "default" : "secondary"}>
                          +{value.toFixed(1)}%
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Character Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Experience */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Add Experience</label>
                    <Input
                      type="number"
                      value={experienceAmount}
                      onChange={(e) => setExperienceAmount(Number(e.target.value))}
                      min="1"
                      max="1000"
                    />
                  </div>
                  <Button onClick={handleAddExperience}>
                    Add XP
                  </Button>
                </div>

                {/* Reset Characters */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-red-600">Reset Character System</h3>
                      <p className="text-sm text-gray-600">Clear all character data and start fresh</p>
                    </div>
                    <Button
                      onClick={handleResetCharacters}
                      variant="destructive"
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
