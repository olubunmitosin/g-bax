"use client";

import { useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWalletStore } from "@/stores/walletStore";

/**
 * Custom hook to sync Solana wallet state with our Zustand store
 */
export function useWalletSync() {
  const { publicKey, wallet, connected } = useWallet();
  const { connection } = useConnection();

  const {
    setWalletConnected,
    setWalletDisconnected,
    setSolBalance,
    setLoadingBalance,
    isConnected,
  } = useWalletStore();

  // Sync wallet connection state
  useEffect(() => {
    if (connected && publicKey && wallet) {
      setWalletConnected(publicKey, wallet.adapter.name);
    } else {
      setWalletDisconnected();
    }
  }, [connected, publicKey, wallet, setWalletConnected, setWalletDisconnected]);

  // Fetch SOL balance when wallet is connected
  useEffect(() => {
    if (!publicKey || !connection || !isConnected) return;

    const fetchBalance = async () => {
      try {
        setLoadingBalance(true);
        const balance = await connection.getBalance(publicKey);

        setSolBalance(balance / LAMPORTS_PER_SOL);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        setSolBalance(0);
      } finally {
        setLoadingBalance(false);
      }
    };

    fetchBalance();

    // Set up interval to refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);

    return () => clearInterval(interval);
  }, [publicKey, connection, isConnected, setSolBalance, setLoadingBalance]);

  return {
    isConnected,
    publicKey,
    walletName: wallet?.adapter.name || null,
  };
}
