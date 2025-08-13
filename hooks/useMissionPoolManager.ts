"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useLocalMissionIntegration } from "@/hooks/useLocalMissionIntegration";

/**
 * Hook to manage local mission system initialization
 * Replaces Honeycomb mission pool manager with local functionality
 */
export function useMissionPoolManager() {
  const { publicKey, connected } = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null,
  );

  const {
    isInitialized,
    isReady,
    error,
  } = useLocalMissionIntegration();

  // Check if mission system needs to be initialized
  const needsInitialization = connected && !isInitialized;

  // Initialize local mission system
  const initializeMissionSystem = async () => {
    if (!publicKey || isInitializing) {
      return false;
    }

    setIsInitializing(true);
    setInitializationError(null);

    try {
      // Local mission system initializes automatically through useLocalMissionIntegration
      // This is just for compatibility with existing code
      return true;
    } catch (error) {
      setInitializationError(
        error instanceof Error ? error.message : "Unknown error",
      );
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-initialize when conditions are met
  useEffect(() => {
    if (needsInitialization && !isInitializing) {
      // Local system initializes automatically, but we can trigger it manually if needed
      const timer = setTimeout(() => {
        initializeMissionSystem();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [needsInitialization, isInitializing]);

  // Get current status
  const getStatus = () => {
    return {
      isInitialized,
      poolAddress: "local-storage", // Indicate local storage system
      missionsCount: 0, // This would be populated by the local mission service
      needsInitialization,
      isInitializing,
      error: initializationError || error,
      canInitialize: connected && publicKey && !isInitializing,
    };
  };

  return {
    // Status
    isInitializing,
    needsInitialization,
    error: initializationError || error,
    status: getStatus(),

    // Actions
    initializeMissionSystem,

    // Data
    missionPool: "local-storage", // Compatibility
    isMissionSystemInitialized: isInitialized,
  };
}
