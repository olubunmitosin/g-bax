'use client';

import React, { useState, useEffect } from 'react';
import { Chip } from '@heroui/chip';
import { useGameStore } from '@/stores/gameStore';

export function SaveStatus() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const { player } = useGameStore();

  // Show save indicator when player exists (simplified)
  useEffect(() => {
    if (player) {
      setLastSaved(new Date());
      setShowSaved(true);

      // Hide the indicator after 3 seconds
      const timer = setTimeout(() => setShowSaved(false), 3000);

      return () => clearTimeout(timer);
    }
  }, [player?.experience, player?.credits]); // Track changes that indicate progress

  // Check for existing save on mount
  useEffect(() => {
    const saved = localStorage.getItem('g-bax-game-storage');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.state?.lastSaved) {
          setLastSaved(new Date(data.state.lastSaved));
        }
      } catch (error) {
        // Ignore parsing errors
      }
    }
  }, []);

  if (!player) return null;

  return (
    <div className="w-full">
      {showSaved && (
        <Chip
          color="success"
          variant="flat"
          className="animate-in slide-in-from-left-2 duration-300 shadow-lg"
        >
          ✅ Progress Saved
        </Chip>
      )}
      {lastSaved && !showSaved && (
        <Chip
          color="default"
          variant="flat"
          size="sm"
          className="opacity-70 shadow-md"
        >
          Last saved: {lastSaved.toLocaleTimeString()}
        </Chip>
      )}
    </div>
  );
}
