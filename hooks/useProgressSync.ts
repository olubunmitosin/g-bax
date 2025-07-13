'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useVerxioStore } from '@/stores/verxioStore';
import { useHoneycombStore } from '@/stores/honeycombStore';
import { useWallet } from '@solana/wallet-adapter-react';

/**
 * Hook to automatically sync game progress to localStorage and blockchain
 */
export function useProgressSync() {
  const { connected, publicKey } = useWallet();
  const gameState = useGameStore();
  const verxioState = useVerxioStore();
  const honeycombState = useHoneycombStore();

  const lastSaveRef = useRef<number>(0);
  const saveIntervalRef = useRef<NodeJS.Timeout>();

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    if (!gameState.player) return;

    const autoSave = () => {
      gameState.saveProgress();
    };

    // Save immediately when state changes (debounced)
    const now = Date.now();
    if (now - lastSaveRef.current > 5000) { // Debounce to 5 seconds
      lastSaveRef.current = now;
      autoSave();
    }

    // Set up interval for regular saves
    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
    }

    saveIntervalRef.current = setInterval(autoSave, 30000); // Every 30 seconds

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [
    gameState.player?.id, // Only track player ID to avoid infinite loops
    gameState.inventory.length,
    gameState.missions.length,
    gameState.activeMission?.id,
  ]);

  // Load progress on wallet connection (only once)
  useEffect(() => {
    if (connected && publicKey && !gameState.player) {

      // Try to load saved progress first
      const saved = localStorage.getItem('g-bax-game-progress');
      if (saved) {
        try {
          const gameData = JSON.parse(saved);
          if (gameData.player && gameData.player.id === publicKey.toString()) {
            gameState.setPlayer(gameData.player);
            gameState.setInventory(gameData.inventory || []);
            gameState.setMissions(gameData.missions || []);
            if (gameData.activeMission) {
              gameState.setActiveMission(gameData.activeMission);
            }
            return;
          }
        } catch (error) {
        }
      }

      // If no saved progress, create new player
      gameState.setPlayer({
        id: publicKey.toString(),
        name: `Explorer ${publicKey.toString().slice(0, 8)}`,
        level: 1,
        experience: 0,
        position: [0, 0, 0],
        credits: 1000,
      });
    }
  }, [connected, publicKey?.toString()]); // Only depend on connection state and wallet address

  // Save progress when wallet disconnects
  useEffect(() => {
    if (!connected && gameState.player) {
      gameState.saveProgress();
    }
  }, [connected, gameState]);

  // Save progress before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (gameState.player) {
        gameState.saveProgress();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameState]);

  // Sync with blockchain when connected (future enhancement)
  useEffect(() => {
    if (connected && publicKey && honeycombState.isConnected) {
      // TODO: Implement blockchain sync
    }
  }, [connected, publicKey, honeycombState.isConnected]);

  return {
    isConnected: connected,
    hasProgress: !!gameState.player,
    lastSaved: lastSaveRef.current,
    saveNow: () => {
      if (gameState.player) {
        gameState.saveProgress();
        lastSaveRef.current = Date.now();
      }
    },
    loadProgress: () => {
      // Manual load progress implementation
      const saved = localStorage.getItem('g-bax-game-progress');
      if (saved && connected && publicKey) {
        try {
          const gameData = JSON.parse(saved);
          if (gameData.player && gameData.player.id === publicKey.toString()) {
            gameState.setPlayer(gameData.player);
            gameState.setInventory(gameData.inventory || []);
            gameState.setMissions(gameData.missions || []);
            if (gameData.activeMission) {
              gameState.setActiveMission(gameData.activeMission);
            }
          }
        } catch (error) {
        }
      }
    },
    resetProgress: () => {
      gameState.reset();
      verxioState.reset();
      honeycombState.reset();

      // Clear localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('g-bax-') ||
          key.startsWith('verxio_') ||
          key.startsWith('honeycomb_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

    },
  };
}
