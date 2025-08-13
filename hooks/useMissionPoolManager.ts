"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";

import { useHoneycombStore } from "@/stores/honeycombStore";

/**
 * Hook to manage Honeycomb mission pool initialization and setup
 */
export function useMissionPoolManager() {
  const { publicKey, connected } = useWallet();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const {
    honeycombService,
    isConnected: honeycombConnected,
    missionPool,
    isMissionSystemInitialized,
    createMissionPool,
    initializePredefinedMissions,
    getMissionPoolStatus,
  } = useHoneycombStore();

  // Check if mission pool needs to be initialized
  const needsInitialization = 
    connected && 
    honeycombConnected && 
    honeycombService && 
    !isMissionSystemInitialized;

  // Initialize mission pool and missions
  const initializeMissionSystem = async (contextWallet?: any) => {
    if (!publicKey || !honeycombService || isInitializing) {
      return false;
    }

    setIsInitializing(true);
    setInitializationError(null);

    try {
      console.log("Starting mission system initialization...");

      // Step 1: Create mission pool if it doesn't exist
      if (!missionPool) {
        console.log("Creating mission pool...");

        // Use a proper character model address - the service will handle validation
        // and use the actual character model address from the initialized system
        await createMissionPool(
          publicKey,
          "placeholder", // Service will use actual character model address
          contextWallet
        );
      }

      // Step 2: Initialize predefined missions
      console.log("Initializing predefined missions...");

      // Use a proper resource address - the service will handle validation
      // and use actual resource addresses from the initialized system
      await initializePredefinedMissions(
        publicKey,
        "placeholder", // Service will use actual resource addresses
        contextWallet
      );

      console.log("Mission system initialization completed successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize mission system:", error);
      setInitializationError(error instanceof Error ? error.message : "Unknown error");
      return false;
    } finally {
      setIsInitializing(false);
    }
  };

  // Auto-initialize when conditions are met
  useEffect(() => {
    if (needsInitialization && !isInitializing) {
      // Auto-initialize with a delay to ensure wallet is fully connected
      const timer = setTimeout(() => {
        initializeMissionSystem();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [needsInitialization, isInitializing]);

  // Get current status
  const getStatus = () => {
    const poolStatus = getMissionPoolStatus();
    return {
      ...poolStatus,
      needsInitialization,
      isInitializing,
      error: initializationError,
      canInitialize: connected && honeycombConnected && publicKey && !isInitializing,
    };
  };

  return {
    // Status
    isInitializing,
    needsInitialization,
    error: initializationError,
    status: getStatus(),

    // Actions
    initializeMissionSystem,
    
    // Data
    missionPool,
    isMissionSystemInitialized,
  };
}
