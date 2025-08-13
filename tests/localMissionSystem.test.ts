/**
 * Test file for Local Mission System
 * Run this to verify the local mission system works correctly
 */

import { localMissionService } from "@/services/localMissionService";
import type { Mission } from "@/stores/gameStore";

// Mock localStorage for testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Replace global localStorage with mock
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('Local Mission System', () => {
  const testPlayerId = "test-player-123";
  
  beforeEach(() => {
    // Clear localStorage before each test
    mockLocalStorage.clear();
  });

  test('should initialize mission system correctly', () => {
    const missionData = localMissionService.initialize(testPlayerId);
    
    expect(missionData).toBeDefined();
    expect(missionData.missions).toBeInstanceOf(Array);
    expect(missionData.missions.length).toBeGreaterThan(0);
    expect(missionData.activeMission).toBeNull();
    expect(missionData.completedMissions).toEqual([]);
    expect(missionData.missionProgress).toEqual({});
  });

  test('should get available missions', () => {
    localMissionService.initialize(testPlayerId);
    const availableMissions = localMissionService.getAvailableMissions(testPlayerId, 1);
    
    expect(availableMissions).toBeInstanceOf(Array);
    expect(availableMissions.length).toBeGreaterThan(0);
    
    // First mission should be available
    const firstMission = availableMissions.find(m => m.id === "mining_001");
    expect(firstMission).toBeDefined();
    expect(firstMission?.status).toBe("available");
  });

  test('should start a mission successfully', () => {
    localMissionService.initialize(testPlayerId);
    
    const missionProgress = localMissionService.startMission(testPlayerId, "mining_001");
    
    expect(missionProgress).toBeDefined();
    expect(missionProgress.missionId).toBe("mining_001");
    expect(missionProgress.playerId).toBe(testPlayerId);
    expect(missionProgress.progress).toBe(0);
    expect(missionProgress.completed).toBe(false);
    expect(missionProgress.startedAt).toBeDefined();
  });

  test('should update mission progress', () => {
    localMissionService.initialize(testPlayerId);
    localMissionService.startMission(testPlayerId, "mining_001");
    
    const updatedProgress = localMissionService.updateMissionProgress(testPlayerId, "mining_001", 50);
    
    expect(updatedProgress.progress).toBe(50);
    expect(updatedProgress.completed).toBe(false);
    expect(updatedProgress.lastUpdated).toBeDefined();
  });

  test('should complete a mission', () => {
    localMissionService.initialize(testPlayerId);
    localMissionService.startMission(testPlayerId, "mining_001");
    
    const completedProgress = localMissionService.completeMission(testPlayerId, "mining_001");
    
    expect(completedProgress.completed).toBe(true);
    expect(completedProgress.progress).toBe(1); // maxProgress for mining_001
    expect(completedProgress.completedAt).toBeDefined();
  });

  test('should persist data across sessions', () => {
    // Initialize and start a mission
    localMissionService.initialize(testPlayerId);
    localMissionService.startMission(testPlayerId, "mining_001");
    localMissionService.updateMissionProgress(testPlayerId, "mining_001", 75);
    
    // Simulate new session by reinitializing
    const newSessionData = localMissionService.initialize(testPlayerId);
    
    expect(newSessionData.missionProgress["mining_001"]).toBeDefined();
    expect(newSessionData.missionProgress["mining_001"].progress).toBe(75);
  });

  test('should handle mission requirements correctly', () => {
    localMissionService.initialize(testPlayerId);
    
    // Level 1 player should not see level 2+ missions as available
    const level1Missions = localMissionService.getAvailableMissions(testPlayerId, 1);
    const level2Mission = level1Missions.find(m => m.id === "mining_002");
    
    expect(level2Mission).toBeUndefined();
    
    // Level 2 player should see level 2 missions if prerequisites are met
    // First complete the prerequisite
    localMissionService.startMission(testPlayerId, "mining_001");
    localMissionService.completeMission(testPlayerId, "mining_001");
    
    const level2Missions = localMissionService.getAvailableMissions(testPlayerId, 2);
    const level2MissionAvailable = level2Missions.find(m => m.id === "mining_002");
    
    expect(level2MissionAvailable).toBeDefined();
  });

  test('should create and restore backups', () => {
    localMissionService.initialize(testPlayerId);
    localMissionService.startMission(testPlayerId, "mining_001");
    localMissionService.updateMissionProgress(testPlayerId, "mining_001", 50);
    
    // Create backup
    localMissionService.createBackup();
    
    // Clear current data
    mockLocalStorage.clear();
    
    // Restore from backup
    const restoredData = localMissionService.restoreFromBackup();
    
    expect(restoredData).toBeDefined();
    expect(restoredData?.missionProgress["mining_001"]).toBeDefined();
    expect(restoredData?.missionProgress["mining_001"].progress).toBe(50);
  });

  test('should reset missions correctly', () => {
    localMissionService.initialize(testPlayerId);
    localMissionService.startMission(testPlayerId, "mining_001");
    localMissionService.updateMissionProgress(testPlayerId, "mining_001", 75);
    
    const resetData = localMissionService.resetMissions(testPlayerId);
    
    expect(resetData.activeMission).toBeNull();
    expect(resetData.completedMissions).toEqual([]);
    expect(resetData.missionProgress).toEqual({});
    expect(resetData.missions.length).toBeGreaterThan(0);
  });
});

// Manual test function for browser console
export function testLocalMissionSystem() {
  console.log("🧪 Testing Local Mission System...");
  
  const testPlayerId = "console-test-player";
  
  try {
    // Initialize
    console.log("1. Initializing mission system...");
    const missionData = localMissionService.initialize(testPlayerId);
    console.log("✅ Initialized with", missionData.missions.length, "missions");
    
    // Get available missions
    console.log("2. Getting available missions...");
    const availableMissions = localMissionService.getAvailableMissions(testPlayerId, 1);
    console.log("✅ Found", availableMissions.length, "available missions");
    
    // Start a mission
    console.log("3. Starting first mission...");
    const missionProgress = localMissionService.startMission(testPlayerId, "mining_001");
    console.log("✅ Started mission:", missionProgress);
    
    // Update progress
    console.log("4. Updating mission progress...");
    const updatedProgress = localMissionService.updateMissionProgress(testPlayerId, "mining_001", 50);
    console.log("✅ Updated progress:", updatedProgress);
    
    // Complete mission
    console.log("5. Completing mission...");
    const completedProgress = localMissionService.completeMission(testPlayerId, "mining_001");
    console.log("✅ Completed mission:", completedProgress);
    
    // Get player missions
    console.log("6. Getting player missions...");
    const playerMissions = localMissionService.getPlayerMissions(testPlayerId);
    console.log("✅ Player missions:", playerMissions);
    
    console.log("🎉 All tests passed! Local mission system is working correctly.");
    
    return {
      success: true,
      missionData,
      availableMissions,
      missionProgress,
      updatedProgress,
      completedProgress,
      playerMissions,
    };
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Export for browser console testing
if (typeof window !== 'undefined') {
  (window as any).testLocalMissionSystem = testLocalMissionSystem;
}
