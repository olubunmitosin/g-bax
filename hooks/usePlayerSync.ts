'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '@/stores/gameStore';
import { useWalletStore } from '@/stores/walletStore';
import { PREDEFINED_MISSIONS } from '@/data/missions';

/**
 * Custom hook to sync wallet connection with player creation
 */
export function usePlayerSync() {
  const { publicKey, connected } = useWallet();
  const { player, setPlayer, missions, setMissions } = useGameStore();
  const { solBalance } = useWalletStore();

  // Create or update player when wallet is connected
  useEffect(() => {
    if (connected && publicKey && !player) {
      const newPlayer = {
        id: publicKey.toString(),
        name: `Explorer ${publicKey.toString().slice(0, 6)}`,
        level: 1,
        experience: 0,
        position: [0, 0, 0] as [number, number, number],
        credits: 1000, // Starting credits
      };

      setPlayer(newPlayer);

      // Initialize missions for new player if not already set
      if (missions.length === 0) {
        const initialMissions = PREDEFINED_MISSIONS.slice(0, 3).map(mission => ({
          ...mission,
          status: mission.id === 'mining_001' ? 'available' as const : 'locked' as const,
        }));
        setMissions(initialMissions);
      }
    }
  }, [connected, publicKey, player, setPlayer, missions, setMissions]);

  // Clear player when wallet is disconnected
  useEffect(() => {
    if (!connected && player) {
      setPlayer(null);
    }
  }, [connected, player, setPlayer]);

  // Update player credits based on SOL balance (optional)
  useEffect(() => {
    if (player && connected && solBalance > 0) {
      // Could implement SOL to credits conversion here
      // For now, just log the balance
    }
  }, [player, connected, solBalance]);

  return {
    player,
    isWalletConnected: connected,
    walletAddress: publicKey?.toString() || null,
  };
}
