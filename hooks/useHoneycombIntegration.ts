'use client';

import { useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useHoneycombStore } from '@/stores/honeycombStore';
import { useGameStore } from '@/stores/gameStore';
import { PREDEFINED_MISSIONS, getAvailableMissions } from '@/data/missions';
import { PREDEFINED_TRAITS, getAvailableTraits } from '@/data/traits';

/**
 * Custom hook to integrate Honeycomb Protocol with wallet and game state
 */
export function useHoneycombIntegration() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  
  const {
    honeycombService,
    isConnected: honeycombConnected,
    isInitializing,
    initializeHoneycomb,
    connectPlayer,
    loadAvailableMissions,
    playerProfile,
    playerMissions,
    playerTraits,
    playerLevel,
    checkConnection,
  } = useHoneycombStore();

  const {
    player,
    missions,
    setMissions,
    setPlayer,
  } = useGameStore();

  // Initialize Honeycomb when connection is available
  useEffect(() => {
    if (connection && !honeycombService && !isInitializing) {
      const rpcUrl = connection.rpcEndpoint;
      const environment = rpcUrl.includes('devnet') ? 'devnet' : 'mainnet-beta';
      
      initializeHoneycomb(rpcUrl, environment);
    }
  }, [connection, honeycombService, isInitializing, initializeHoneycomb]);

  // Connect player when wallet is connected and Honeycomb is ready
  useEffect(() => {
    if (connected && publicKey && honeycombConnected && honeycombService) {
      connectPlayer(publicKey);
    }
  }, [connected, publicKey, honeycombConnected, honeycombService, connectPlayer]);

  // Sync Honeycomb player profile with game store
  useEffect(() => {
    if (playerProfile && publicKey) {
      const gamePlayer = {
        id: publicKey.toString(),
        name: playerProfile.name || 'Space Explorer',
        level: playerLevel,
        experience: playerProfile.experience || 0,
        position: [0, 0, 0] as [number, number, number],
        credits: playerProfile.credits || 1000,
      };
      
      setPlayer(gamePlayer);
    }
  }, [playerProfile, playerLevel, publicKey, setPlayer]);

  // Sync available missions with game store
  useEffect(() => {
    if (honeycombConnected && player) {
      // Get completed mission IDs from player missions
      const completedMissionIds = playerMissions
        .filter(m => m.completed)
        .map(m => m.missionId);

      // Get available missions based on player level and completed missions
      const availableMissions = getAvailableMissions(player.level, completedMissionIds);
      
      // Convert to game store format and merge with predefined missions
      const gameMissions = PREDEFINED_MISSIONS.map(mission => {
        const playerMission = playerMissions.find(pm => pm.missionId === mission.id);
        const isAvailable = availableMissions.some(am => am.id === mission.id);
        
        return {
          ...mission,
          status: playerMission?.completed ? 'completed' : 
                  playerMission ? 'active' : 
                  isAvailable ? 'available' : 'locked',
          progress: playerMission?.progress || 0,
        } as const;
      });

      setMissions(gameMissions);
    }
  }, [honeycombConnected, player, playerMissions, setMissions]);

  // Periodic connection check
  useEffect(() => {
    if (honeycombService) {
      const interval = setInterval(() => {
        checkConnection();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(interval);
    }
  }, [honeycombService, checkConnection]);

  // Mission management functions
  const startMission = async (missionId: string) => {
    if (!publicKey || !honeycombService) {
      throw new Error('Wallet not connected or Honeycomb not initialized');
    }

    try {
      await useHoneycombStore.getState().startMission(publicKey, missionId);
      
      // Update game store
      const updatedMissions = missions.map(mission =>
        mission.id === missionId 
          ? { ...mission, status: 'active' as const }
          : mission
      );
      setMissions(updatedMissions);
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const updateMissionProgress = async (missionId: string, progress: number) => {
    if (!publicKey || !honeycombService) {
      throw new Error('Wallet not connected or Honeycomb not initialized');
    }

    try {
      await useHoneycombStore.getState().updateMissionProgress(publicKey, missionId, progress);
      
      // Update game store
      const updatedMissions = missions.map(mission =>
        mission.id === missionId 
          ? { 
              ...mission, 
              progress,
              status: progress >= mission.maxProgress ? 'completed' as const : 'active' as const
            }
          : mission
      );
      setMissions(updatedMissions);
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const assignTrait = async (traitId: string) => {
    if (!publicKey || !honeycombService) {
      throw new Error('Wallet not connected or Honeycomb not initialized');
    }

    const traitDefinition = PREDEFINED_TRAITS.find(t => t.id === traitId);
    if (!traitDefinition) {
      throw new Error('Trait not found');
    }

    try {
      await useHoneycombStore.getState().assignTrait(publicKey, {
        name: traitDefinition.name,
        category: traitDefinition.category,
        effects: traitDefinition.baseEffects,
        level: 1,
      });
      
      return true;
    } catch (error) {
      throw error;
    }
  };

  const upgradeTrait = async (traitId: string, newLevel: number) => {
    if (!publicKey || !honeycombService) {
      throw new Error('Wallet not connected or Honeycomb not initialized');
    }

    try {
      await useHoneycombStore.getState().upgradeTrait(publicKey, traitId, newLevel);
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Get available traits for current player
  const getPlayerAvailableTraits = () => {
    if (!player) return [];
    
    const completedMissionIds = playerMissions
      .filter(m => m.completed)
      .map(m => m.missionId);
    
    const playerTraitIds = playerTraits.map(t => t.traitId);
    
    return getAvailableTraits(player.level, completedMissionIds, playerTraitIds);
  };

  // Check if player can start a specific mission
  const canStartMission = (missionId: string) => {
    if (!player) return false;
    
    const mission = missions.find(m => m.id === missionId);
    return mission?.status === 'available';
  };

  // Get player's active mission
  const getActiveMission = () => {
    return missions.find(m => m.status === 'active') || null;
  };

  return {
    // Connection state
    isConnected: honeycombConnected,
    isInitializing,
    
    // Player data
    playerProfile,
    playerLevel,
    playerMissions,
    playerTraits,
    
    // Mission functions
    startMission,
    updateMissionProgress,
    canStartMission,
    getActiveMission,
    
    // Trait functions
    assignTrait,
    upgradeTrait,
    getPlayerAvailableTraits,
    
    // Utility
    honeycombService,
  };
}
