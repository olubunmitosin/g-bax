import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface LoadingState {
  // Overall loading state
  isInitializing: boolean;
  initializationComplete: boolean;

  // Individual loading states
  walletChecking: boolean;
  walletConnected: boolean;
  honeycombInitializing: boolean;
  honeycombReady: boolean;
  verxioInitializing: boolean;
  verxioReady: boolean;
  playerDataLoading: boolean;
  playerDataReady: boolean;
  loyaltyDataLoading: boolean;
  loyaltyDataReady: boolean;

  // Progress tracking
  totalSteps: number;
  completedSteps: number;
  currentStep: string;

  // Actions
  setWalletChecking: (checking: boolean) => void;
  setWalletConnected: (connected: boolean) => void;
  setHoneycombInitializing: (initializing: boolean) => void;
  setHoneycombReady: (ready: boolean) => void;
  setVerxioInitializing: (initializing: boolean) => void;
  setVerxioReady: (ready: boolean) => void;
  setPlayerDataLoading: (loading: boolean) => void;
  setPlayerDataReady: (ready: boolean) => void;
  setLoyaltyDataLoading: (loading: boolean) => void;
  setLoyaltyDataReady: (ready: boolean) => void;
  setCurrentStep: (step: string) => void;
  completeInitialization: () => void;
  reset: () => void;

  calculateCompletedSteps(): number;
}

export const useLoadingStore = create<LoadingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isInitializing: true,
      initializationComplete: false,
      walletChecking: false,
      walletConnected: false,
      honeycombInitializing: false,
      honeycombReady: false,
      verxioInitializing: false,
      verxioReady: false,
      playerDataLoading: false,
      playerDataReady: false,
      loyaltyDataLoading: false,
      loyaltyDataReady: false,
      totalSteps: 6,
      completedSteps: 0,
      currentStep: "Initializing...",

      // Actions
      calculateCompletedSteps: () => {
        const state = get();
        let completed = 0;

        if (state.walletConnected || !state.walletChecking) completed++;
        if (state.honeycombReady) completed++;
        if (state.verxioReady) completed++;
        if (state.playerDataReady) completed++;
        if (state.loyaltyDataReady) completed++;
        if (state.initializationComplete) completed++;

        return completed;
      },
      setWalletChecking: (checking: boolean) => {
        set({ walletChecking: checking });
        if (checking) {
          set({ currentStep: "Checking wallet connection..." });
        }
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setWalletConnected: (connected: boolean) => {
        set({
          walletConnected: connected,
          walletChecking: false,
          currentStep: connected ? "Wallet connected" : "Wallet not connected",
        });
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setHoneycombInitializing: (initializing: boolean) => {
        set({ honeycombInitializing: initializing });
        if (initializing) {
          set({ currentStep: "Initializing Honeycomb Protocol..." });
        }
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setHoneycombReady: (ready: boolean) => {
        set({
          honeycombReady: ready,
          honeycombInitializing: false,
          currentStep: ready
            ? "Honeycomb Protocol ready"
            : "Honeycomb Protocol failed",
        });
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setVerxioInitializing: (initializing: boolean) => {
        set({ verxioInitializing: initializing });
        if (initializing) {
          set({ currentStep: "Initializing Verxio loyalty system..." });
        }
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setVerxioReady: (ready: boolean) => {
        set({
          verxioReady: ready,
          verxioInitializing: false,
          currentStep: ready
            ? "Verxio loyalty system ready"
            : "Verxio system ready",
        });
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setPlayerDataLoading: (loading: boolean) => {
        set({ playerDataLoading: loading });
        if (loading) {
          set({ currentStep: "Loading player data..." });
        }
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setPlayerDataReady: (ready: boolean) => {
        set({
          playerDataReady: ready,
          playerDataLoading: false,
          currentStep: ready ? "Player data loaded" : "Player data ready",
        });
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setLoyaltyDataLoading: (loading: boolean) => {
        set({ loyaltyDataLoading: loading });
        if (loading) {
          set({ currentStep: "Loading loyalty data..." });
        }
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setLoyaltyDataReady: (ready: boolean) => {
        set({
          loyaltyDataReady: ready,
          loyaltyDataLoading: false,
          currentStep: ready ? "Loyalty data loaded" : "Loyalty data ready",
        });
        // Update completed steps
        const completed = get().calculateCompletedSteps();

        set({ completedSteps: completed });
      },

      setCurrentStep: (step: string) => {
        set({ currentStep: step });
      },

      completeInitialization: () => {
        set({
          isInitializing: false,
          initializationComplete: true,
          currentStep: "Ready to explore!",
          completedSteps: get().totalSteps,
        });
      },

      reset: () => {
        set({
          isInitializing: true,
          initializationComplete: false,
          walletChecking: false,
          walletConnected: false,
          honeycombInitializing: false,
          honeycombReady: false,
          verxioInitializing: false,
          verxioReady: false,
          playerDataLoading: false,
          playerDataReady: false,
          loyaltyDataLoading: false,
          loyaltyDataReady: false,
          completedSteps: 0,
          currentStep: "Initializing...",
        });
      },
    }),
    {
      name: "g-bax-loading-store",
    },
  ),
);

// Export reset function for external use
export const resetLoadingStore = () => {
  useLoadingStore.getState().reset();
};
