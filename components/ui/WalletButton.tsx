'use client';

import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { useWalletSync } from '@/hooks/useWalletSync';
import { useWalletStore } from '@/stores/walletStore';
import { formatWalletAddress } from '@/utils/gameHelpers';

export default function WalletButton() {
  const { wallet, publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  // Use our wallet sync hook to keep stores updated
  useWalletSync();

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
        color="primary"
        variant="solid"
        className="min-w-[140px]"
      >
        Connecting...
      </Button>
    );
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <Chip
          color="success"
          variant="flat"
          className="text-xs"
        >
          {wallet?.adapter.name}
        </Chip>
        <div className="flex flex-col items-end">
          <Button
            color="danger"
            variant="light"
            onPress={handleWalletAction}
            className="min-w-[140px] h-8"
            size="sm"
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
      color="primary"
      variant="solid"
      onPress={handleWalletAction}
      className="min-w-[140px]"
    >
      Connect Wallet
    </Button>
  );
}
