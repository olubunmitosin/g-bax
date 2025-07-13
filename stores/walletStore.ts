import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PublicKey } from '@solana/web3.js';

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
  devtools(
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
      setWalletConnected: (publicKey, walletName) =>
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

      setSolBalance: (balance) => set({ solBalance: balance }),
      
      setLoadingBalance: (loading) => set({ isLoadingBalance: loading }),
      
      setHoneycombProfile: (profile) => set({ honeycombProfile: profile }),
      
      setLoadingProfile: (loading) => set({ isLoadingProfile: loading }),
    }),
    {
      name: 'g-bax-wallet-store',
    }
  )
);
