"use client";

import { useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

import { useLoadingStore } from "@/stores/loadingStore";
import { useHoneycombStore } from "@/stores/honeycombStore";
import { useVerxioStore } from "@/stores/verxioStore";
import { useGameStore } from "@/stores/gameStore";

/**
 * Hook to manage the complete initialization flow and loading states
 */
export function useInitializationFlow() {
  const { connected, publicKey } = useWallet();

  const {
    setWalletChecking,
    setWalletConnected,
    setHoneycombInitializing,
    setHoneycombReady,
    setVerxioInitializing,
    setVerxioReady,
    setPlayerDataLoading,
    setPlayerDataReady,
    setLoyaltyDataLoading,
    setLoyaltyDataReady,
    completeInitialization,
    isInitializing,
    initializationComplete,
  } = useLoadingStore();

  const {
    honeycombService,
    isConnected: honeycombConnected,
    isInitializing: honeycombInitializing,
  } = useHoneycombStore();

  const {
    verxioService,
    isConnected: verxioConnected,
    isInitializing: verxioInitializing,
    playerLoyalty,
  } = useVerxioStore();

  const { player } = useGameStore();

  // Track wallet connection state
  useEffect(() => {
    setWalletChecking(true);

    const timer = setTimeout(() => {
      setWalletConnected(connected);
    }, 500); // Small delay to show the checking state

    return () => clearTimeout(timer);
  }, [connected, setWalletChecking, setWalletConnected]);

  // Track Honeycomb initialization
  useEffect(() => {
    if (honeycombInitializing) {
      setHoneycombInitializing(true);
    } else if (honeycombService) {
      setHoneycombReady(honeycombConnected);
    }
  }, [
    honeycombInitializing,
    honeycombService,
    honeycombConnected,
    setHoneycombInitializing,
    setHoneycombReady,
  ]);

  // Track Verxio initialization
  useEffect(() => {
    if (verxioInitializing) {
      setVerxioInitializing(true);
    } else if (verxioService) {
      setVerxioReady(verxioConnected);
    }
  }, [
    verxioInitializing,
    verxioService,
    verxioConnected,
    setVerxioInitializing,
    setVerxioReady,
  ]);

  // Track player data loading
  useEffect(() => {
    if (connected && publicKey) {
      setPlayerDataLoading(true);

      // Check if player data is ready
      const checkPlayerData = () => {
        if (player && player.id === publicKey.toString()) {
          setPlayerDataReady(true);
        }
      };

      // Check immediately and then with a delay
      checkPlayerData();
      const timer = setTimeout(checkPlayerData, 1000);

      return () => clearTimeout(timer);
    } else {
      setPlayerDataReady(!connected); // Ready if not connected (no player needed)
    }
  }, [connected, publicKey, player, setPlayerDataLoading, setPlayerDataReady]);

  // Track loyalty data loading
  useEffect(() => {
    if (connected && publicKey && verxioConnected) {
      setLoyaltyDataLoading(true);

      // Check if loyalty data is ready
      const checkLoyaltyData = () => {
        // Loyalty data is ready if we have it or if we're not connected
        setLoyaltyDataReady(true); // Always mark as ready since loyalty is optional
      };

      // Check with a delay to allow for loading
      const timer = setTimeout(checkLoyaltyData, 1500);

      return () => clearTimeout(timer);
    } else {
      setLoyaltyDataReady(!connected);
    }
  }, [
    connected,
    publicKey,
    verxioConnected,
    playerLoyalty,
    setLoyaltyDataLoading,
    setLoyaltyDataReady,
  ]);

  // Check if all initializations are complete
  const checkInitializationComplete = useCallback(() => {
    const loadingState = useLoadingStore.getState();

    // Define what constitutes "ready" state
    const walletReady =
      loadingState.walletConnected || !loadingState.walletChecking;
    const honeycombReady = loadingState.honeycombReady || !connected;
    const verxioReady = loadingState.verxioReady || !connected;
    const playerReady = loadingState.playerDataReady;
    const loyaltyReady = loadingState.loyaltyDataReady;

    const allReady =
      walletReady &&
      honeycombReady &&
      verxioReady &&
      playerReady &&
      loyaltyReady;

    if (allReady && !loadingState.initializationComplete) {
      // Add a small delay before completing to ensure smooth UX
      setTimeout(() => {
        completeInitialization();
      }, 500);
    }
  }, [connected, completeInitialization]);

  // Disabled to prevent concurrent state changes that cause blinking
  // useEffect(() => {
  //   if (isInitializing && !initializationComplete) {
  //     checkInitializationComplete();
  //   }
  // }, [
  //   isInitializing,
  //   initializationComplete,
  //   connected,
  //   honeycombConnected,
  //   verxioConnected,
  //   player,
  //   playerLoyalty,
  //   checkInitializationComplete,
  // ]);

  // Auto-complete initialization after maximum wait time (fallback)
  useEffect(() => {
    if (isInitializing) {
      const maxWaitTimer = setTimeout(() => {
        if (!initializationComplete) {
          completeInitialization();
        }
      }, 20000); // 20-second maximum wait

      return () => clearTimeout(maxWaitTimer);
    }
  }, [isInitializing, initializationComplete, completeInitialization]);

  // Auto-complete for users who don't connect wallet (after shorter delay)
  useEffect(() => {
    if (isInitializing && !connected) {
      // Set all states as ready for non-wallet users with progressive delays
      const timer1 = setTimeout(() => {
        setHoneycombReady(true);
      }, 500);

      const timer2 = setTimeout(() => {
        setVerxioReady(true);
      }, 1000);

      const timer3 = setTimeout(() => {
        setPlayerDataReady(true);
      }, 1500);

      const timer4 = setTimeout(() => {
        setLoyaltyDataReady(true);
      }, 2000);

      const noWalletTimer = setTimeout(() => {
        if (!initializationComplete) {
          completeInitialization();
        }
      }, 3000); // 3 seconds for non-wallet users

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(noWalletTimer);
      };
    }
  }, [
    isInitializing,
    initializationComplete,
    connected,
    completeInitialization,
    setHoneycombReady,
    setVerxioReady,
    setPlayerDataReady,
    setLoyaltyDataReady,
  ]);

  return {
    isInitializing,
    initializationComplete,
  };
}
