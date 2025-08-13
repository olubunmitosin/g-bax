"use client";

import React from "react";

import SiteLoader from "@/components/ui/SiteLoader";
import { useInitializationFlow } from "@/hooks/useInitializationFlow";

interface InitializationProviderProps {
  children: React.ReactNode;
}

export function InitializationProvider({
  children,
}: InitializationProviderProps) {
  const { isInitializing } = useInitializationFlow();

  return (
    <>
      {isInitializing && <SiteLoader />}
      {children}
    </>
  );
}
