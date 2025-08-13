/**
 * Local Mission System Demo Component
 * Demonstrates the local mission system functionality
 */

"use client";

import React, { useState, useEffect } from "react";
import { useLocalMissionIntegration } from "@/hooks/useLocalMissionIntegration";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Clock, Play, RotateCcw } from "lucide-react";

export function LocalMissionDemo() {
  const {
    missions,
    activeMission,
    completedMissions,
    missionProgress,
    isLoading,
    isReady,
    error,
    startMission,
    updateMissionProgress,
    completeMission,
    canStartMission,
    resetAllMissions,
    getMissionProgress,
    getMissionStats,
    clearError,
    playerId,
    isConnected,
  } = useLocalMissionIntegration();

  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState<number>(0);

  const stats = getMissionStats();

  const handleStartMission = async (missionId: string) => {
    try {
      await startMission(missionId);
      setSelectedMission(missionId);
    } catch (error) {
      console.error("Failed to start mission:", error);
    }
  };

  const handleUpdateProgress = async (missionId: string, progress: number) => {
    try {
      await updateMissionProgress(missionId, progress);
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const handleCompleteMission = async (missionId: string) => {
    try {
      await completeMission(missionId);
    } catch (error) {
      console.error("Failed to complete mission:", error);
    }
  };

  const handleResetMissions = async () => {
    try {
      await resetAllMissions();
      setSelectedMission(null);
      setProgressInput(0);
    } catch (error) {
      console.error("Failed to reset missions:", error);
    }
  };

  if (!isReady) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Local Mission System
          </CardTitle>
          <CardDescription>
            {isLoading ? "Loading mission system..." : "Initializing..."}
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
            Local Mission System Demo
          </CardTitle>
          <CardDescription>
            Player ID: {playerId} | Connected: {isConnected ? "Yes" : "No"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Missions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.available}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.locked}</div>
              <div className="text-sm text-gray-600">Locked</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-2">Completion Rate</div>
            <Progress value={stats.completionRate} className="w-full" />
            <div className="text-xs text-gray-500 mt-1">{stats.completionRate.toFixed(1)}%</div>
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

      {/* Active Mission */}
      {activeMission && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-500" />
              Active Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{activeMission.title}</h3>
                <p className="text-sm text-gray-600">{activeMission.description}</p>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span>{activeMission.progress}/{activeMission.maxProgress}</span>
                </div>
                <Progress 
                  value={(activeMission.progress / activeMission.maxProgress) * 100} 
                  className="w-full" 
                />
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={activeMission.maxProgress}
                  value={progressInput}
                  onChange={(e) => setProgressInput(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md w-24"
                  placeholder="Progress"
                />
                <Button
                  onClick={() => handleUpdateProgress(activeMission.id, progressInput)}
                  size="sm"
                >
                  Update Progress
                </Button>
                <Button
                  onClick={() => handleCompleteMission(activeMission.id)}
                  variant="outline"
                  size="sm"
                >
                  Complete Mission
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mission Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="available">Available Missions</TabsTrigger>
          <TabsTrigger value="completed">Completed Missions</TabsTrigger>
          <TabsTrigger value="all">All Missions</TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4">
            {missions
              .filter(mission => mission.status === "available" && !completedMissions.includes(mission.id))
              .map((mission) => (
                <Card key={mission.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{mission.title}</CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <Badge variant="secondary">{mission.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Rewards: {mission.rewards.experience} XP, {mission.rewards.credits} Credits
                      </div>
                      <Button
                        onClick={() => handleStartMission(mission.id)}
                        disabled={!canStartMission(mission)}
                        size="sm"
                      >
                        Start Mission
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {missions
              .filter(mission => completedMissions.includes(mission.id))
              .map((mission) => {
                const progress = getMissionProgress(mission.id);
                return (
                  <Card key={mission.id} className="opacity-75">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {mission.title}
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </CardTitle>
                          <CardDescription>{mission.description}</CardDescription>
                        </div>
                        <Badge variant="secondary">{mission.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-600">
                        Completed: {progress?.completedAt ? new Date(progress.completedAt).toLocaleDateString() : "Unknown"}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4">
            {missions.map((mission) => {
              const progress = getMissionProgress(mission.id);
              const isCompleted = completedMissions.includes(mission.id);
              
              return (
                <Card key={mission.id} className={isCompleted ? "opacity-75" : ""}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {mission.title}
                          {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </CardTitle>
                        <CardDescription>{mission.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{mission.type}</Badge>
                        <Badge variant={
                          mission.status === "available" ? "default" :
                          mission.status === "active" ? "destructive" :
                          mission.status === "completed" ? "secondary" : "outline"
                        }>
                          {mission.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        Rewards: {mission.rewards.experience} XP, {mission.rewards.credits} Credits
                      </div>
                      {progress && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{progress.progress}/{mission.maxProgress}</span>
                          </div>
                          <Progress 
                            value={(progress.progress / mission.maxProgress) * 100} 
                            className="w-full h-2" 
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Reset Button */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Reset Mission System</h3>
              <p className="text-sm text-gray-600">Clear all mission progress and start fresh</p>
            </div>
            <Button
              onClick={handleResetMissions}
              variant="destructive"
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All Missions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
