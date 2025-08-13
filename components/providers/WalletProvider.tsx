"use client";

import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

// Import our wallet setup hook
import { useWalletSetup } from "@/hooks/useWalletSetup";

// Component to initialize wallet setup
function WalletSetupHandler() {
  useWalletSetup();

  return null;
}

interface SolanaWalletProviderProps {
  children: React.ReactNode;
}

export default function SolanaWalletProvider({
  children,
}: SolanaWalletProviderProps) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Testnet;

  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    [],
  );

  // Error handler to suppress wallet detection warnings
  const onError = (error: any) => {
    // Suppress specific wallet detection warnings
    if (
      error?.message?.includes("solflare-detect-metamask") ||
      error?.message?.includes("Unknown response id")
    ) {
      return; // Silently ignore these warnings
    }
    // Silently handle other wallet errors in production
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider autoConnect wallets={wallets} onError={onError}>
        <WalletModalProvider>
          <WalletSetupHandler />
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
