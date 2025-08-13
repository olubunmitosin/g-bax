"use client";

import { useProgressSync } from "@/hooks/useProgressSync";

interface ProgressSyncProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component that handles automatic progress syncing
 */
export function ProgressSyncProvider({ children }: ProgressSyncProviderProps) {
  // Initialize progress sync
  useProgressSync();

  return <>{children}</>;
}
