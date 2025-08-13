import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { PublicKey } from "@solana/web3.js";

// Wallet state types
export interface WalletState {
  // Connection state
  isConnected: boolean;
  publicKey: PublicKey | null;
  walletName: string | null;

  // Balance and transactions
  solBalance: number;
  isLoadingBalance: boolean;

  // Honeycomb Protocol state
  honeycombProfile: any | null; // Will be typed properly when we integrate Honeycomb
  isLoadingProfile: boolean;

  // Actions
  setWalletConnected: (publicKey: PublicKey, walletName: string) => void;
  setWalletDisconnected: () => void;
  setSolBalance: (balance: number) => void;
  setLoadingBalance: (loading: boolean) => void;
  setHoneycombProfile: (profile: any) => void;
  setLoadingProfile: (loading: boolean) => void;
}

export const useWalletStore = create<WalletState>()(
  devtools<WalletState>(
    (set) => ({
      // Initial state
      isConnected: false,
      publicKey: null,
      walletName: null,
      solBalance: 0,
      isLoadingBalance: false,
      honeycombProfile: null,
      isLoadingProfile: false,

      // Actions
      setWalletConnected: (publicKey: PublicKey, walletName: string) =>
        set({
          isConnected: true,
          publicKey,
          walletName,
        }),

      setWalletDisconnected: () =>
        set({
          isConnected: false,
          publicKey: null,
          walletName: null,
          solBalance: 0,
          honeycombProfile: null,
        }),

      setSolBalance: (balance: number) => set({ solBalance: balance }),

      setLoadingBalance: (loading: boolean) => set({ isLoadingBalance: loading }),

      setHoneycombProfile: (profile: any) => set({ honeycombProfile: profile }),

      setLoadingProfile: (loading: boolean) => set({ isLoadingProfile: loading }),
    }),
    {
      name: "g-bax-wallet-store",
    },
  ),
);
