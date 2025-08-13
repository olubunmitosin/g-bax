"use client";

import React, { useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { useWallet } from "@solana/wallet-adapter-react";

import { usePlayerSync } from "@/hooks/usePlayerSync";
import { useGameStore, resetGameStore } from "@/stores/gameStore";
import { useVerxioStore, resetVerxioStore } from "@/stores/verxioStore";
import {
  useHoneycombStore,
  resetHoneycombStore,
} from "@/stores/honeycombStore";


export default function SettingsPage() {
  const { player } = usePlayerSync();
  const { connected, publicKey, wallet } = useWallet();
  const contextWallet = useWallet();
  const { playerProfile, updateUserAccount } = useHoneycombStore();
  const {
    isOpen: isResetModalOpen,
    onOpen: onResetModalOpen,
    onClose: onResetModalClose,
  } = useDisclosure();
  const {
    isOpen: isExportSuccessModalOpen,
    onOpen: onExportSuccessModalOpen,
    onClose: onExportSuccessModalClose,
  } = useDisclosure();
  const {
    isOpen: isExportErrorModalOpen,
    onOpen: onExportErrorModalOpen,
    onClose: onExportErrorModalClose,
  } = useDisclosure();
  const {
    isOpen: isProfileModalOpen,
    onOpen: onProfileModalOpen,
    onClose: onProfileModalClose,
  } = useDisclosure();
  const {
    isOpen: isWalletWarningOpen,
    onOpen: onWalletWarningOpen,
    onClose: onWalletWarningClose,
  } = useDisclosure();
  const {
    isOpen: isProfileSuccessOpen,
    onOpen: onProfileSuccessOpen,
    onClose: onProfileSuccessClose,
  } = useDisclosure();
  const {
    isOpen: isProfileErrorOpen,
    onOpen: onProfileErrorOpen,
    onClose: onProfileErrorClose,
  } = useDisclosure();
  const {
    isOpen: isResetErrorOpen,
    onOpen: onResetErrorOpen,
    onClose: onResetErrorClose,
  } = useDisclosure();
  const [exportedFileName, setExportedFileName] = useState("");
  const [profileErrorMessage, setProfileErrorMessage] = useState("");

  // Profile update state
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    pfp: "",
    username: "",
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Available avatar options
  const avatarOptions = [
    {
      id: "default",
      url: "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
      name: "Default Explorer",
    },
    {
      id: "astronaut",
      url: "https://api.dicebear.com/7.x/avataaars/svg?seed=astronaut&backgroundColor=b6e3f4&clothesColor=262e33&topType=shortHairShortFlat&accessoriesType=blank&hairColor=auburn&facialHairType=blank&clothesType=hoodie&eyeType=default&eyebrowType=default&mouthType=default&skinColor=light",
      name: "Astronaut",
    },
    {
      id: "pilot",
      url: "https://api.dicebear.com/7.x/avataaars/svg?seed=pilot&backgroundColor=c0aede&clothesColor=3c4f5c&topType=shortHairShortCurly&accessoriesType=sunglasses&hairColor=black&facialHairType=blank&clothesType=blazerShirt&eyeType=default&eyebrowType=default&mouthType=smile&skinColor=tanned",
      name: "Space Pilot",
    },
    {
      id: "commander",
      url: "https://api.dicebear.com/7.x/avataaars/svg?seed=commander&backgroundColor=ffdfbf&clothesColor=929598&topType=shortHairShortWaved&accessoriesType=blank&hairColor=brown&facialHairType=moustacheFancy&clothesType=blazerSweater&eyeType=default&eyebrowType=default&mouthType=serious&skinColor=pale",
      name: "Commander",
    },
  ];

  // Game settings state (only functional settings)
  const [gameSettings, setGameSettings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("g-bax-game-settings");

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

  // Initialize a profile form with current data
  React.useEffect(() => {
    if (playerProfile) {
      setProfileForm({
        name: playerProfile.name || "",
        bio: playerProfile.bio || "",
        pfp: playerProfile.pfp || avatarOptions[0].url,
        username: playerProfile.username || "",
      });
    } else if (player) {
      setProfileForm({
        name: player.name || "",
        bio: "Space explorer in the G-Bax universe",
        pfp: avatarOptions[0].url,
        username: playerProfile.username || "",
      });
    }
  }, [playerProfile, player]);

  const handleGameSettingChange = (key: string, value: any) => {
    const newSettings = { ...gameSettings, [key]: value };

    setGameSettings(newSettings);
    // Save to localStorage
    localStorage.setItem("g-bax-game-settings", JSON.stringify(newSettings));
  };

  const handleProfileUpdate = async () => {
    if (!connected || !publicKey) {
      onWalletWarningOpen();

      return;
    }

    if (!profileForm.name.trim()) {
      setProfileErrorMessage(
        "Name is required. Please enter a valid name for your profile.",
      );
      onProfileErrorOpen();

      return;
    }

    setIsUpdatingProfile(true);
    try {
      await updateUserAccount(
        publicKey,
        {
          name: profileForm.name.trim(),
          bio: profileForm.bio.trim() || "Space explorer in the G-Bax universe",
          pfp: profileForm.pfp || avatarOptions[0].url,
          username: profileForm.name.trim().toLowerCase() || "username",
        },
        contextWallet,
      );

      // Force a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));

      onProfileModalClose();
      onProfileSuccessOpen();
    } catch (error: any) {
      setProfileErrorMessage(
        error.message || "Failed to update profile. Please try again.",
      );
      onProfileErrorOpen();
    } finally {
      setIsUpdatingProfile(false);
    }
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

        if (
          key &&
          (key.startsWith("g-bax-") ||
            key.startsWith("verxio_") ||
            key.startsWith("honeycomb_"))
        ) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));

      // Clear all Zustand persist storage (double-check)
      localStorage.removeItem("g-bax-game-storage");
      localStorage.removeItem("g-bax-verxio-storage");
      localStorage.removeItem("g-bax-honeycomb-storage");
      localStorage.removeItem("g-bax-game-progress");

      // Clear any session storage as well
      sessionStorage.clear();

      // Close modal and refresh the page to ensure clean state
      onResetModalClose();
      setTimeout(() => {
        window.location.reload();
      }, 100);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      onResetErrorOpen();
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

        if (
          key &&
          (key.startsWith("g-bax-") ||
            key.startsWith("verxio_") ||
            key.startsWith("honeycomb_"))
        ) {
          try {
            localStorageData[key] = JSON.parse(localStorage.getItem(key) || "");
          } catch {
            localStorageData[key] = localStorage.getItem(key);
          }
        }
      }

      const exportData = {
        version: "1.0.0",
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
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const filename = `g-bax-complete-data-${player.id.slice(0, 8)}-${new Date().toISOString().split("T")[0]}.json`;
      const link = document.createElement("a");

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

        {/* Profile Settings */}
        {connected && (
          <Card className="mb-6">
            <CardHeader>
              <h3 className="text-xl font-bold">Profile Settings</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <p className="text-sm text-default-600">
                  Update your player profile information stored on the Honeycomb
                  Protocol blockchain.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-default-200">
                      <img
                        alt="Profile Avatar"
                        className="w-full h-full object-cover"
                        src={
                          playerProfile?.pfp ||
                          profileForm.pfp ||
                          avatarOptions[0].url
                        }
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            avatarOptions[0].url;
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-grow">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Name:</span>
                        <span className="ml-2 text-default-600">
                          {playerProfile?.name || player?.name || "Not set"}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Bio:</span>
                        <span className="ml-2 text-default-600">
                          {playerProfile?.bio ||
                            "Space explorer in the G-Bax universe"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    color="primary"
                    variant="flat"
                    onPress={onProfileModalOpen}
                  >
                    Edit Profile
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

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
                    <p className="text-sm text-default-600">
                      Display notifications for mining, crafting, and mission
                      progress
                    </p>
                  </div>
                  <Switch
                    isSelected={gameSettings.showNotifications}
                    onValueChange={(value) =>
                      handleGameSettingChange("showNotifications", value)
                    }
                    aria-label="Toggle notifications for mining, crafting, and mission progress"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Auto-Save Progress</span>
                    <p className="text-sm text-default-600">
                      Automatically save your game progress every 30 seconds
                    </p>
                  </div>
                  <Switch
                    isSelected={gameSettings.autoSave}
                    onValueChange={(value) =>
                      handleGameSettingChange("autoSave", value)
                    }
                    aria-label="Toggle automatic saving of game progress every 30 seconds"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Theme</h4>
              <p className="text-sm text-default-600 mb-4">
                G-Bax uses a permanent dark theme optimized for space exploration.
              </p>
              <div className="bg-default-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">
                    Dark theme is permanently enabled for the best gaming experience
                  </span>
                  <div className="text-primary font-medium">🌙 Dark Mode</div>
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
                  Export your game data for backup or transfer to another
                  device.
                </p>
                <Button
                  color="primary"
                  isDisabled={!player}
                  onPress={handleExportData}
                >
                  {!player ? "Connect Wallet First" : "Export Game Data"}
                </Button>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Reset Progress</h4>
                <p className="text-sm text-default-600 mb-4">
                  Permanently delete all game progress and start fresh. This
                  action cannot be undone.
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
                  <div>
                    <strong>Blockchain:</strong> Solana
                  </div>
                  <div>
                    <strong>Protocols:</strong> Honeycomb, Verxio
                  </div>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Reset Progress Confirmation Modal */}
      <Modal
        backdrop="blur"
        isOpen={isResetModalOpen}
        size="md"
        onClose={onResetModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">⚠️ Reset All Progress</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Are you sure you want to reset all progress? This action will
                permanently delete:
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
            <Button color="default" variant="light" onPress={onResetModalClose}>
              Cancel
            </Button>
            <Button color="danger" onPress={handleResetProgress}>
              Yes, Reset Everything
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Success Modal */}
      <Modal
        backdrop="blur"
        isOpen={isExportSuccessModalOpen}
        size="md"
        onClose={onExportSuccessModalClose}
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
            <Button color="success" onPress={onExportSuccessModalClose}>
              Great!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Export Error Modal */}
      <Modal
        backdrop="blur"
        isOpen={isExportErrorModalOpen}
        size="md"
        onClose={onExportErrorModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">❌ Export Failed</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Sorry, we couldn&#39;t export your game data. This might be due
                to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-default-500 ml-4">
                <li>Browser security restrictions</li>
                <li>Insufficient storage space</li>
                <li>Temporary network issues</li>
              </ul>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-warning-700 text-sm">
                  💡 <strong>Try:</strong> Refreshing the page and attempting
                  the export again.
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

      {/* Profile Update Modal */}
      <Modal
        backdrop="blur"
        isOpen={isProfileModalOpen}
        size="lg"
        onClose={onProfileModalClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span>Update Profile</span>
            <p className="text-sm text-default-500 font-normal">
              Update your player profile information on the blockchain
            </p>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              {/* Name Input */}
              <Input
                isRequired
                description="Your display name in the G-Bax universe"
                label="Player Name"
                maxLength={50}
                placeholder="Enter your player name"
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />

              {/* Bio Input */}
              <Textarea
                description="A short description about your space exploration journey"
                label="Bio"
                maxLength={200}
                maxRows={5}
                minRows={3}
                placeholder="Tell other players about yourself..."
                value={profileForm.bio}
                onChange={(e) =>
                  setProfileForm((prev) => ({ ...prev, bio: e.target.value }))
                }
              />

              {/* Avatar Selection */}
              <div>
                <label
                  className="text-sm font-medium mb-3 block"
                  htmlFor="Profile Avatar"
                >
                  Profile Avatar
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {avatarOptions.map((avatar) => (
                    <div
                      key={avatar.id}
                      className={`relative cursor-pointer rounded-lg border-2 p-2 transition-all ${profileForm.pfp === avatar.url
                        ? "border-primary bg-primary/10"
                        : "border-default-200 hover:border-default-300"
                        }`}
                      onClick={() =>
                        setProfileForm((prev) => ({ ...prev, pfp: avatar.url }))
                      }
                    >
                      <div className="aspect-square rounded-md overflow-hidden bg-default-100">
                        <img
                          alt={avatar.name}
                          className="w-full h-full object-cover"
                          src={avatar.url}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              avatarOptions[0].url;
                          }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1 text-default-600">
                        {avatar.name}
                      </p>
                      {profileForm.pfp === avatar.url && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <svg
                            className="w-2 h-2 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              clipRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              fillRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-default-500 mt-2">
                  Choose an avatar that represents your space explorer identity
                </p>
              </div>

              {/* Preview */}
              <div className="bg-default-50 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Preview</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-default-200">
                    <img
                      alt="Preview"
                      className="w-full h-full object-cover"
                      src={profileForm.pfp || avatarOptions[0].url}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          avatarOptions[0].url;
                      }}
                    />
                  </div>
                  <div>
                    <p className="font-medium">
                      {profileForm.name || "Player Name"}
                    </p>
                    <p className="text-sm text-default-600">
                      {profileForm.bio ||
                        "Space explorer in the G-Bax universe"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              isDisabled={isUpdatingProfile}
              variant="light"
              onPress={onProfileModalClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              isDisabled={!profileForm.name.trim()}
              isLoading={isUpdatingProfile}
              onPress={handleProfileUpdate}
            >
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Wallet Warning Modal */}
      <Modal
        backdrop="blur"
        isOpen={isWalletWarningOpen}
        size="md"
        onClose={onWalletWarningClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-warning">⚠️ Wallet Required</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                You need to connect your wallet to update your profile
                information.
              </p>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-warning-700 text-sm">
                  💡 <strong>How to connect:</strong> Click the "Connect Wallet"
                  button in the top navigation bar and select your preferred
                  Solana wallet.
                </p>
              </div>
              <div className="text-sm text-default-500">
                <p className="font-medium mb-2">
                  Connecting your wallet allows you to:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Update your profile on the blockchain</li>
                  <li>Save progress permanently</li>
                  <li>Access loyalty rewards</li>
                  <li>Join guilds and compete</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="warning" onPress={onWalletWarningClose}>
              Got it!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Profile Success Modal */}
      <Modal
        backdrop="blur"
        isOpen={isProfileSuccessOpen}
        size="md"
        onClose={onProfileSuccessClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-success">✅ Profile Updated</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                Your profile has been successfully updated on the blockchain!
              </p>
              <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                <p className="text-success-700 text-sm">
                  <strong>Success!</strong> Your new profile information is
                  now stored permanently on the Solana blockchain via Honeycomb
                  Protocol.
                </p>
              </div>
              <div className="text-sm text-default-500">
                <p className="font-medium mb-2">
                  Your updated profile includes:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    Display name: <strong>{profileForm.name}</strong>
                  </li>
                  <li>
                    Bio:{" "}
                    <strong>
                      {profileForm.bio ||
                        "Space explorer in the G-Bax universe"}
                    </strong>
                  </li>
                  <li>
                    Avatar: <strong>Updated</strong>
                  </li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="success" onPress={onProfileSuccessClose}>
              Awesome!
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Profile Error Modal */}
      <Modal
        backdrop="blur"
        isOpen={isProfileErrorOpen}
        size="md"
        onClose={onProfileErrorClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">❌ Update Failed</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                We couldn't update your profile. Here's what happened:
              </p>
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-3">
                <p className="text-danger-700 text-sm font-medium">
                  {profileErrorMessage}
                </p>
              </div>
              <div className="text-sm text-default-500">
                <p className="font-medium mb-2">Common solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Make sure your wallet is connected</li>
                  <li>Ensure you have enough SOL for transaction fees</li>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page and attempting again</li>
                </ul>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="light"
              onPress={onProfileErrorClose}
            >
              Close
            </Button>
            <Button
              color="primary"
              onPress={() => {
                onProfileErrorClose();
                onProfileModalOpen();
              }}
            >
              Try Again
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reset Error Modal */}
      <Modal
        backdrop="blur"
        isOpen={isResetErrorOpen}
        size="md"
        onClose={onResetErrorClose}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <span className="text-danger">❌ Reset Failed</span>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-default-600">
                We couldn't reset your progress. This might be due to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-default-500 ml-4">
                <li>Browser security restrictions</li>
                <li>Local storage access issues</li>
                <li>Temporary system errors</li>
              </ul>
              <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
                <p className="text-warning-700 text-sm">
                  💡 <strong>Try:</strong> Refreshing the page and attempting
                  the reset again, or manually clear your browser data for this
                  site.
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onResetErrorClose}>
              Close
            </Button>
            <Button
              color="danger"
              onPress={() => {
                onResetErrorClose();
                onResetModalOpen();
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
