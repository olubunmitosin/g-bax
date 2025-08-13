/**
 * Local Mission Service
 * Handles all mission operations using local storage instead of blockchain
 */

import type { Mission, Resource } from "@/stores/gameStore";
import { PREDEFINED_MISSIONS, MISSION_REQUIREMENTS } from "@/data/missions";

export interface LocalMissionProgress {
  missionId: string;
  playerId: string;
  progress: number;
  completed: boolean;
  rewards: {
    experience: number;
    credits: number;
    resources?: Resource[];
  };
  startedAt: string;
  completedAt?: string;
  lastUpdated: string;
}

export interface LocalMissionData {
  missions: Mission[];
  activeMission: Mission | null;
  completedMissions: string[];
  missionProgress: Record<string, LocalMissionProgress>;
  lastSyncTimestamp: string;
}

export class LocalMissionService {
  private readonly STORAGE_KEY = "g-bax-missions";
  private readonly BACKUP_KEY = "g-bax-missions-backup";

  /**
   * Initialize the local mission system
   */
  initialize(playerId: string): LocalMissionData {
    try {
      const existingData = this.loadMissionData();
      if (existingData) {
        // Merge with any new predefined missions
        const updatedMissions = this.mergeMissions(existingData.missions);
        const updatedData = {
          ...existingData,
          missions: updatedMissions,
          lastSyncTimestamp: new Date().toISOString(),
        };
        this.saveMissionData(updatedData);
        return updatedData;
      }

      // Create initial mission data
      const initialData: LocalMissionData = {
        missions: this.initializeMissions(playerId),
        activeMission: null,
        completedMissions: [],
        missionProgress: {},
        lastSyncTimestamp: new Date().toISOString(),
      };

      this.saveMissionData(initialData);
      return initialData;
    } catch (error) {return this.createFallbackData(playerId);
    }
  }

  /**
   * Get all available missions for a player
   */
  getAvailableMissions(playerId: string, playerLevel: number = 1): Mission[] {
    const data = this.loadMissionData();
    if (!data) return [];

    return data.missions.filter((mission) => {
      // Check if mission is unlocked based on requirements
      const requirements = MISSION_REQUIREMENTS[mission.id as keyof typeof MISSION_REQUIREMENTS];

      if (requirements) {
        // Check level requirement
        if (requirements.level && playerLevel < requirements.level) {
          return false;
        }

        // Check completed missions requirement
        if (requirements.completedMissions) {
          const hasCompletedRequired = requirements.completedMissions.every(
            (reqMissionId) => data.completedMissions.includes(reqMissionId)
          );
          if (!hasCompletedRequired) {
            return false;
          }
        }
      }

      return mission.status !== "locked";
    });
  }

  /**
   * Start a mission
   */
  startMission(playerId: string, missionId: string): LocalMissionProgress {
    const data = this.loadMissionData();
    if (!data) throw new Error("Mission data not found");

    const mission = data.missions.find((m) => m.id === missionId);
    if (!mission) throw new Error("Mission not found");

    if (mission.status !== "available") {
      throw new Error("Mission is not available to start");
    }

    // Create mission progress
    const missionProgress: LocalMissionProgress = {
      missionId,
      playerId,
      progress: 0,
      completed: false,
      rewards: mission.rewards,
      startedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    // Update mission status and set as active
    const updatedMissions = data.missions.map((m) =>
      m.id === missionId ? { ...m, status: "active" as const } : m
    );

    const updatedData: LocalMissionData = {
      ...data,
      missions: updatedMissions,
      activeMission: { ...mission, status: "active" },
      missionProgress: {
        ...data.missionProgress,
        [missionId]: missionProgress,
      },
      lastSyncTimestamp: new Date().toISOString(),
    };

    this.saveMissionData(updatedData);
    return missionProgress;
  }

  /**
   * Update mission progress
   */
  updateMissionProgress(
    playerId: string,
    missionId: string,
    progress: number
  ): LocalMissionProgress {
    const data = this.loadMissionData();
    if (!data) throw new Error("Mission data not found");

    const mission = data.missions.find((m) => m.id === missionId);
    if (!mission) throw new Error("Mission not found");

    const existingProgress = data.missionProgress[missionId];
    if (!existingProgress) throw new Error("Mission progress not found");

    const newProgress = Math.min(progress, mission.maxProgress);
    const isCompleted = newProgress >= mission.maxProgress;

    const updatedProgress: LocalMissionProgress = {
      ...existingProgress,
      progress: newProgress,
      completed: isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : existingProgress.completedAt,
      lastUpdated: new Date().toISOString(),
    };

    // Update mission status
    const updatedMissions = data.missions.map((m) =>
      m.id === missionId
        ? {
            ...m,
            progress: newProgress,
            status: isCompleted ? ("completed" as const) : ("active" as const),
          }
        : m
    );

    const updatedData: LocalMissionData = {
      ...data,
      missions: updatedMissions,
      activeMission: isCompleted ? null : data.activeMission,
      completedMissions: isCompleted
        ? [...data.completedMissions, missionId]
        : data.completedMissions,
      missionProgress: {
        ...data.missionProgress,
        [missionId]: updatedProgress,
      },
      lastSyncTimestamp: new Date().toISOString(),
    };

    this.saveMissionData(updatedData);
    return updatedProgress;
  }

  /**
   * Complete a mission and award rewards
   */
  completeMission(playerId: string, missionId: string): LocalMissionProgress {
    const data = this.loadMissionData();
    if (!data) throw new Error("Mission data not found");

    const mission = data.missions.find((m) => m.id === missionId);
    if (!mission) throw new Error("Mission not found");

    return this.updateMissionProgress(playerId, missionId, mission.maxProgress);
  }

  /**
   * Get player's mission progress
   */
  getPlayerMissions(playerId: string): LocalMissionProgress[] {
    const data = this.loadMissionData();
    if (!data) return [];

    return Object.values(data.missionProgress).filter(
      (progress) => progress.playerId === playerId
    );
  }

  /**
   * Get active mission for a player
   */
  getActiveMission(playerId: string): Mission | null {
    const data = this.loadMissionData();
    if (!data) return null;

    return data.activeMission;
  }

  /**
   * Reset all mission data (for testing or new player)
   */
  resetMissions(playerId: string): LocalMissionData {
    const initialData: LocalMissionData = {
      missions: this.initializeMissions(playerId),
      activeMission: null,
      completedMissions: [],
      missionProgress: {},
      lastSyncTimestamp: new Date().toISOString(),
    };

    this.saveMissionData(initialData);
    return initialData;
  }

  /**
   * Create backup of mission data
   */
  createBackup(): void {
    const data = this.loadMissionData();
    if (data) {
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(data));
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(): LocalMissionData | null {
    try {
      const backupData = localStorage.getItem(this.BACKUP_KEY);
      if (backupData) {
        const data = JSON.parse(backupData) as LocalMissionData;
        this.saveMissionData(data);
        return data;
      }
    } catch (error) {}
    return null;
  }

  // Private methods

  private loadMissionData(): LocalMissionData | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {return null;
    }
  }

  private saveMissionData(data: LocalMissionData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {}
  }

  private initializeMissions(playerId: string): Mission[] {
    return PREDEFINED_MISSIONS.map((mission) => ({
      ...mission,
      progress: 0,
      status: mission.id === "mining_001" ? "available" : "locked", // First mission is available
    }));
  }

  private mergeMissions(existingMissions: Mission[]): Mission[] {
    const existingIds = new Set(existingMissions.map((m) => m.id));
    const newMissions = PREDEFINED_MISSIONS.filter((m) => !existingIds.has(m.id));

    return [
      ...existingMissions,
      ...newMissions.map((mission) => ({
        ...mission,
        progress: 0,
        status: "locked" as const,
      })),
    ];
  }

  private createFallbackData(playerId: string): LocalMissionData {
    return {
      missions: this.initializeMissions(playerId),
      activeMission: null,
      completedMissions: [],
      missionProgress: {},
      lastSyncTimestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const localMissionService = new LocalMissionService();
