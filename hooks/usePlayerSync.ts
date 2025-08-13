"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useGameStore } from "@/stores/gameStore";
import { useWalletStore } from "@/stores/walletStore";

/**
 * Custom hook to sync wallet connection with player creation
 */
export function usePlayerSync() {
  const { publicKey, connected } = useWallet();
  const { player, setPlayer } = useGameStore();
  const { solBalance } = useWalletStore();

  // Clear player when wallet is disconnected
  useEffect(() => {
    if (!connected && player) {
      setPlayer(null);
    }
  }, [connected, player]);

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
