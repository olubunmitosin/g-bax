'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Switch } from '@heroui/switch';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@heroui/modal';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { useGameStore, resetGameStore } from '@/stores/gameStore';
import { useVerxioStore, resetVerxioStore } from '@/stores/verxioStore';
import { useHoneycombStore, resetHoneycombStore } from '@/stores/honeycombStore';
import { ThemeSwitch } from '@/components/theme-switch';

export default function SettingsPage() {
  const { player } = usePlayerSync();
  const { isOpen: isResetModalOpen, onOpen: onResetModalOpen, onClose: onResetModalClose } = useDisclosure();
  const { isOpen: isExportSuccessModalOpen, onOpen: onExportSuccessModalOpen, onClose: onExportSuccessModalClose } = useDisclosure();
  const { isOpen: isExportErrorModalOpen, onOpen: onExportErrorModalOpen, onClose: onExportErrorModalClose } = useDisclosure();
  const [exportedFileName, setExportedFileName] = useState('');

  // Game settings state (only functional settings)
  const [gameSettings, setGameSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('g-bax-game-settings');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch { }
      }
    }
    return {
      showNotifications: true,
      autoSave: true,
    };
  });

  const handleGameSettingChange = (key: string, value: any) => {
    const newSettings = { ...gameSettings, [key]: value };
    setGameSettings(newSettings);
    // Save to localStorage
    localStorage.setItem('g-bax-game-settings', JSON.stringify(newSettings));
  };

  const handleResetProgress = () => {
    try {
      // Reset all stores (these functions also clear their localStorage)
      resetGameStore();
      resetVerxioStore();
      resetHoneycombStore();

      // Clear any remaining localStorage data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('g-bax-') ||
          key.startsWith('verxio_') ||
          key.startsWith('honeycomb_')
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear all Zustand persist storage (double-check)
      localStorage.removeItem('g-bax-game-storage');
      localStorage.removeItem('g-bax-verxio-storage');
      localStorage.removeItem('g-bax-honeycomb-storage');
      localStorage.removeItem('g-bax-game-progress');

      // Clear any session storage as well
      sessionStorage.clear();

      // Close modal and refresh the page to ensure clean state
      onResetModalClose();
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      alert('Failed to reset progress. Please try again.');
    }
  };

  const handleExportData = () => {
    if (!player) return;

    try {
      // Get all game data from stores
      const gameState = useGameStore.getState();
      const verxioState = useVerxioStore.getState();
      const honeycombState = useHoneycombStore.getState();

      // Collect all localStorage data
      const localStorageData: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('g-bax-') ||
          key.startsWith('verxio_') ||
          key.startsWith('honeycomb_')
        )) {
          try {
            localStorageData[key] = JSON.parse(localStorage.getItem(key) || '');
          } catch {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        playerId: player.id,
        gameState: {
          player: gameState.player,
          inventory: gameState.inventory,
          missions: gameState.missions,
          activeMission: gameState.activeMission,
          currentScene: gameState.currentScene,
        },
        verxioState: {
          playerLoyalty: verxioState.playerLoyalty,
          playerGuild: verxioState.playerGuild,
          guildMembers: verxioState.guildMembers,
          availableGuilds: verxioState.availableGuilds,
        },
        honeycombState: {
          playerProfile: honeycombState.playerProfile,
          playerMissions: honeycombState.playerMissions,
          playerTraits: honeycombState.playerTraits,
          playerLevel: honeycombState.playerLevel,
        },
        localStorage: localStorageData,
        settings: {
          gameSettings,
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const filename = `g-bax-complete-data-${player.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.json`;
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

      // Store filename and show success modal
      setExportedFileName(filename);
      onExportSuccessModalOpen();
    } catch (error) {
      onExportErrorModalOpen();
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-4 py-8 pb-20 max-w-4xl">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Settings</h1>
          <p className="text-lg text-default-600">
            Customize your G-Bax experience and manage your game data
          </p>
        </div>

        {/* Game Settings */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-bold">Game Settings</h3>
          </CardHeader>
          <CardBody className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Gameplay Preferences</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Show Notifications</span>
                    <p className="text-sm text-default-600">Display notifications for mining, crafting, and mission progress</p>
                  </div>
                  <Switch
                    isSelected={gameSettings.showNotifications}
                    onValueChange={(value) => handleGameSettingChange('showNotifications', value)}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Auto-Save Progress</span>
                    <p className="text-sm text-default-600">Automatically save your game progress every 30 seconds</p>
                  </div>
                  <Switch
                    isSelected={gameSettings.autoSave}
                    onValueChange={(value) => handleGameSettingChange('autoSave', value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Theme</h4>
              <p className="text-sm text-default-600 mb-4">
                Choose your preferred color theme. Changes apply immediately across the entire application.
              </p>
              <div className="bg-default-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Toggle between light and dark theme</span>
                  <ThemeSwitch />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Data Management */}
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-xl font-bold">Data Management</h3>
          </CardHeader>
          <CardBody>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Backup & Export</h4>
                <p className="text-sm text-default-600 mb-4">
                  Export your game data for backup or transfer to another device.
                </p>
                <Button
                  color="primary"
                  onPress={handleExportData}
                  isDisabled={!player}
                >
                  {!player ? 'Connect Wallet First' : 'Export Game Data'}
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Reset Progress</h4>
                <p className="text-sm text-default-600 mb-4">
                  Permanently delete all game progress and start fresh. This action cannot be undone.
                </p>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={onResetModalOpen}
                >
                  Reset All Progress
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* About */}
        <Card className="mt-6">
          <CardHeader>
            <h3 className="text-xl font-bold">About G-Bax</h3>
          </CardHeader>
          <CardBody>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Game Information</h4>
                <div className="text-sm space-y-1">
                  <div><strong>Version:</strong> 1.0.0</div>
                  <div><strong>Build:</strong> Production</div>
                  <div><strong>Blockchain:</strong> Solana</div>
                  <div><strong>Protocols:</strong> Honeycomb, Verxio</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Support</h4>
                <div className="text-sm space-y-1">
                  <div>Need help? Check our documentation</div>
                  <div>Report bugs or suggest features</div>
                  <div>Join our community Discord</div>
                  <div>Follow us for updates</div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Reset Progress Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={onResetModalClose}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">⚠️ Reset All Progress</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Are you sure you want to reset all progress? This action will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-default-500 ml-4">
                <li>Player profile and experience</li>
                <li>All inventory items and resources</li>
                <li>Mission progress and achievements</li>
                <li>Loyalty points and guild membership</li>
                <li>Game settings and preferences</li>
              </ul>
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger-600 text-sm font-medium">
                  ⚠️ This action cannot be undone!
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onResetModalClose}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleResetProgress}
            >
              Yes, Reset Everything
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Success Modal */}
      <Modal
        isOpen={isExportSuccessModalOpen}
        onClose={onExportSuccessModalClose}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-success">✅ Export Successful</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Your game data has been successfully exported!
              </p>
              <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                <p className="text-success-700 text-sm">
                  <strong>File:</strong> {exportedFileName}
                </p>
                <p className="text-success-600 text-xs mt-1">
                  The file has been downloaded to your default downloads folder.
                </p>
              </div>
              <div className="text-sm text-default-500">
                <p className="font-medium mb-2">Your export includes:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Player profile and experience</li>
                  <li>Complete inventory and resources</li>
                  <li>Mission progress and achievements</li>
                  <li>Loyalty points and guild data</li>
                  <li>Game settings and preferences</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="success"
              onPress={onExportSuccessModalClose}
            >
              Great!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Error Modal */}
      <Modal
        isOpen={isExportErrorModalOpen}
        onClose={onExportErrorModalClose}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">❌ Export Failed</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Sorry, we couldn't export your game data. This might be due to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-default-500 ml-4">
                <li>Browser security restrictions</li>
                <li>Insufficient storage space</li>
                <li>Temporary network issues</li>
              </ul>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-warning-700 text-sm">
                  💡 <strong>Try:</strong> Refreshing the page and attempting the export again.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onExportErrorModalClose}
            >
              Close
            </Button>
            <Button
              color="primary"
              onPress={() => {
                onExportErrorModalClose();
                handleExportData();
              }}
            >
              Try Again
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
