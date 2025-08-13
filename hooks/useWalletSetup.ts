"use client";

import { useEffect, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWalletStore } from "@/stores/walletStore";
import { useHoneycombStore } from "@/stores/honeycombStore";
import { useVerxioStore } from "@/stores/verxioStore";
import { useLoadingStore } from "@/stores/loadingStore";
import { useGameStore } from "@/stores/gameStore";

export function useWalletSetup() {
  const { publicKey, wallet, connected } = useWallet();
  const contextWallet = useWallet();
  const { connection } = useConnection();

  const {
    setWalletConnected,
    setWalletDisconnected,
    setSolBalance,
    setLoadingBalance,
  } = useWalletStore();

  const { honeycombService, initializeHoneycomb, setupUserAccount } =
    useHoneycombStore();

  const {
    verxioService,
    isConnected: verxioConnected,
    isInitializing: verxioInitializing,
    initializeVerxio,
    loadPlayerLoyalty,
  } = useVerxioStore();

  const {
    setHoneycombInitializing,
    setVerxioInitializing,
    setPlayerDataLoading,
    setLoyaltyDataLoading,
  } = useLoadingStore();

  const { setPlayer } = useGameStore();

  // Store the last connected publicKey to a clear flag on disconnect
  const lastPublicKeyRef = useRef<any>(null);
  // Track if Honeycomb initialization has been attempted to prevent duplicates
  const honeycombInitAttemptedRef = useRef<boolean>(false);
  // Track if Verxio initialization has been attempted to prevent duplicates
  const verxioInitAttemptedRef = useRef<boolean>(false);

  const getSetupKey = (publicKey: any) =>
    `wallet_setup_${publicKey.toString()}`;

  const isSetupCompleted = (publicKey: any) => {
    return localStorage.getItem(getSetupKey(publicKey)) === "true";
  };

  const markSetupCompleted = (publicKey: any) => {
    localStorage.setItem(getSetupKey(publicKey), "true");
  };

  const clearSetupFlag = (publicKey: any) => {
    localStorage.removeItem(getSetupKey(publicKey));
  };

  const clearAllSetupFlags = () => {
    // Clear all wallet setup flags from localStorage
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith("wallet_setup_")) {
        localStorage.removeItem(key);
      }
    });
  };

  const initializeHoneycombService = useCallback(async () => {
    if (!honeycombService && connection && !honeycombInitAttemptedRef.current) {
      try {
        honeycombInitAttemptedRef.current = true;
        setHoneycombInitializing(true);
        const rpcUrl =
          process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
          "https://rpc.test.honeycombprotocol.com";
        const environment = "honeynet";

        await initializeHoneycomb(rpcUrl, environment);
      } catch (error) {
        // Reset the flag on error so it can be retried
        honeycombInitAttemptedRef.current = false;
      }
    } else if (honeycombService) {
      //
    } else if (honeycombInitAttemptedRef.current) {
      //
    }
  }, [
    honeycombService,
    connection,
    initializeHoneycomb,
    setHoneycombInitializing,
  ]);

  const initializeVerxioService = useCallback(async () => {
    if (
      !verxioService &&
      !verxioInitializing &&
      !verxioInitAttemptedRef.current
    ) {
      try {verxioInitAttemptedRef.current = true;
        setVerxioInitializing(true);
        const environment =
          process.env.NODE_ENV === "production" ? "production" : "development";

        await initializeVerxio(
          undefined,
          environment as "development" | "production",
        );
      } catch (error) {
        // Reset the flag on error so it can be retried
        verxioInitAttemptedRef.current = false;
      }
    }
  }, [
    verxioService,
    verxioInitializing,
    initializeVerxio,
    setVerxioInitializing,
  ]);

  const handleWalletConnection = useCallback(async () => {
    if (!connected || !publicKey || !wallet) return;

    if (isSetupCompleted(publicKey)) return;

    // Store the publicKey for later use in disconnect
    lastPublicKeyRef.current = publicKey;

    try {
      setWalletConnected(publicKey, wallet.adapter.name);

      try {
        setLoadingBalance(true);
        const balance = await connection.getBalance(publicKey);

        setSolBalance(balance / LAMPORTS_PER_SOL);
      } catch (error) {
        setSolBalance(0);
      } finally {
        setLoadingBalance(false);
      }

      await initializeHoneycombService();
      await initializeVerxioService();

      if (honeycombService) {
        try {
          setPlayerDataLoading(true);
          await setupUserAccount(publicKey, contextWallet);
        } catch (error: any) {
          // Silent error handling
        }
      }

      // Load Verxio loyalty data after services are initialized
      // Wait a bit for Verxio service to be ready, then try to load loyalty data
      setTimeout(async () => {
        try {
          setLoyaltyDataLoading(true);
          const {
            verxioService: currentVerxioService,
            isConnected: currentVerxioConnected,
          } = useVerxioStore.getState();

          if (currentVerxioService && currentVerxioConnected) {
            await loadPlayerLoyalty(publicKey);
          }
        } catch (error: any) {
          // Silent error handling
        }
      }, 1000);

      if (honeycombService) {
        const playerProfile =
          await honeycombService.getPlayerProfile(publicKey);

        // Create a game player object
        const gamePlayer = {
          ...playerProfile,
          position: [0, 0, 0] as [number, number, number],
        };

        setPlayer(gamePlayer);
      }

      markSetupCompleted(publicKey);
    } catch (error) {
      // Silent error handling
    }
  }, [
    connected,
    publicKey,
    wallet,
    connection,
    honeycombService,
    setWalletConnected,
    setSolBalance,
    setLoadingBalance,
    initializeHoneycombService,
    initializeVerxioService,
    loadPlayerLoyalty,
    setPlayerDataLoading,
    setLoyaltyDataLoading,
  ]);

  const handleWalletDisconnection = useCallback(() => {
    if (lastPublicKeyRef.current) {
      clearSetupFlag(lastPublicKeyRef.current);
      lastPublicKeyRef.current = null;
    } else {
      // If we don't have the publicKey (e.g., after refresh), clear all setup flags
      clearAllSetupFlags();
    }
    // Reset initialization flags on disconnect
    honeycombInitAttemptedRef.current = false;
    verxioInitAttemptedRef.current = false;
    setWalletDisconnected();
    setPlayer(null);
  }, [setWalletDisconnected, setPlayer]);

  useEffect(() => {
    if (connected && publicKey && wallet) {
      handleWalletConnection();
    } else if (!connected) {
      handleWalletDisconnection();
    }
  }, [
    connected,
    publicKey,
    wallet,
    handleWalletConnection,
    handleWalletDisconnection,
  ]);

  return {
    isConnected: connected,
    publicKey,
    wallet,
  };
}
