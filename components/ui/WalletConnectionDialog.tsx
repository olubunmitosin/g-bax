"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

interface WalletConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  action?: string;
}

export default function WalletConnectionDialog({
  isOpen,
  onClose,
  title = "Wallet Required",
  message = "You need to connect your wallet to perform this action.",
  action = "mining",
}: WalletConnectionDialogProps) {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  const handleConnectWallet = () => {
    setVisible(true);
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  // Auto-close if wallet gets connected
  React.useEffect(() => {
    if (connected && isOpen) {
      onClose();
    }
  }, [connected, isOpen, onClose]);

  return (
    <Modal
      backdrop="blur"
      isOpen={isOpen}
      placement="center"
      size="md"
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-xl font-bold text-center">{title}</h3>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Main message */}
            <div className="text-center">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-lg text-default-600 mb-2">{message}</p>
              <p className="text-sm text-default-500">
                Connect your Solana wallet to start {action} and track your
                progress on-chain.
              </p>
            </div>

            {/* Benefits card */}
            <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <CardBody className="space-y-3">
                <h4 className="font-semibold text-center text-purple-500">
                  Why Connect Your Wallet?
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Track your progress on the Solana blockchain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Earn on-chain achievements and traits</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Participate in missions and guild activities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Own your game assets and progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>Access exclusive rewards and content</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Security note */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 text-lg">🛡️</span>
                <div className="text-sm">
                  <p className="font-medium text-blue-700 mb-1">
                    Secure & Safe
                  </p>
                  <p className="text-blue-800">
                    We only request wallet connection for signing transactions.
                    Your private keys never leave your wallet.
                  </p>
                </div>
              </div>
            </div>

            {/* Supported wallets */}
            <div className="text-center">
              <p className="text-xs text-default-500 mb-2">
                Supported Wallets:
              </p>
              <div className="flex justify-center gap-3">
                <div className="text-xs bg-default-100 rounded px-2 py-1">
                  Phantom
                </div>
                <div className="text-xs bg-default-100 rounded px-2 py-1">
                  Solflare
                </div>
                <div className="text-xs bg-default-100 rounded px-2 py-1">
                  Torus
                </div>
                <div className="text-xs bg-default-100 rounded px-2 py-1">
                  Ledger
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex justify-center gap-3">
          <Button
            aria-label="Close wallet connection dialog"
            className="min-w-[120px]"
            variant="light"
            onPress={handleClose}
          >
            Maybe Later
          </Button>
          <Button
            aria-label={
              connecting
                ? "Connecting to Solana wallet"
                : "Connect Solana wallet to continue"
            }
            className="min-w-[120px]"
            color="primary"
            isLoading={connecting}
            size="lg"
            onPress={handleConnectWallet}
          >
            {connecting ? "Connecting..." : "Connect Wallet"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
