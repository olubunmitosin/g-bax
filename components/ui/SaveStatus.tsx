"use client";

import React, { useState, useEffect } from "react";
import { Chip } from "@heroui/chip";

import { useGameStore } from "@/stores/gameStore";

export function SaveStatus() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { player } = useGameStore();

  // Set client-side flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show save indicator when player exists (simplified)
  useEffect(() => {
    if (player && isClient) {
      setLastSaved(new Date());
      setShowSaved(true);

      // Hide the indicator after 3 seconds
      const timer = setTimeout(() => setShowSaved(false), 3000);

      return () => clearTimeout(timer);
    }
  }, [player?.experience, player?.credits, isClient]); // Track changes that indicate progress

  // Check for existing save on mount (only on client)
  useEffect(() => {
    if (!isClient) return;

    const saved = localStorage.getItem("g-bax-game-storage");

    if (saved) {
      try {
        const data = JSON.parse(saved);

        if (data.state?.lastSaved) {
          setLastSaved(new Date(data.state.lastSaved));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }, [isClient]);

  if (!player) return null;

  return (
    <div className="w-full">
      {showSaved && (
        <Chip
          className="animate-in slide-in-from-left-2 duration-300 shadow-lg"
          color="success"
          variant="flat"
        >
          ✅ Progress Saved
        </Chip>
      )}
      {lastSaved && !showSaved && (
        <Chip
          className="opacity-70 shadow-md"
          color="default"
          size="sm"
          variant="flat"
        >
          Last saved: {lastSaved.toLocaleTimeString()}
        </Chip>
      )}
    </div>
  );
}
