"use client";

import React from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";

import { useWalletStore } from "@/stores/walletStore";
import { formatWalletAddress } from "@/utils/gameHelpers";

export default function WalletButton() {
  const { wallet, publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  // Get additional wallet data from our store
  const { solBalance, isLoadingBalance } = useWalletStore();

  const handleWalletAction = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  if (connecting) {
    return (
      <Button
        isLoading
        className="min-w-[140px]"
        color="primary"
        variant="solid"
        aria-label="Connecting to wallet"
      >
        Connecting...
      </Button>
    );
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Chip className="text-xs" color="success" variant="flat">
          {wallet?.adapter.name}
        </Chip>
        <div className="flex flex-col items-end">
          <Button
            aria-label={`Disconnect wallet ${formatWalletAddress(publicKey.toString())}`}
            className="min-w-[140px] h-8"
            color="danger"
            size="sm"
            variant="light"
            onPress={handleWalletAction}
          >
            {formatWalletAddress(publicKey.toString())}
          </Button>
          {!isLoadingBalance && (
            <span className="text-xs text-default-500">
              {solBalance.toFixed(3)} SOL
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Button
      aria-label="Connect Solana wallet"
      className="min-w-[140px]"
      color="primary"
      variant="solid"
      onPress={handleWalletAction}
    >
      Connect Wallet
    </Button>
  );
}
