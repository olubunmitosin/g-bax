"use client";

import React, { useEffect, useState } from "react";
import { Progress } from "@heroui/progress";
import { Card, CardBody } from "@heroui/card";

import { useLoadingStore } from "@/stores/loadingStore";

export default function SiteLoader() {
  const { initializationComplete, totalSteps, completedSteps, currentStep } =
    useLoadingStore();

  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  // Calculate progress percentage
  const progressPercentage = (completedSteps / totalSteps) * 100;

  // Handle fade out animation when initialization is complete
  useEffect(() => {
    if (initializationComplete && !fadeOut) {
      // Start to fade out after a brief delay to show "Ready" state
      const timer = setTimeout(() => {
        setFadeOut(true);
        // Hide completely after fade animation
        setTimeout(() => {
          setIsVisible(false);
        }, 500); // Match the CSS transition duration
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [initializationComplete, fadeOut]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background/95 to-background/90 backdrop-blur-sm transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-success/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Main Loader Content */}
      <Card className="w-full max-w-md mx-4 bg-background/80 backdrop-blur-md border border-default-200/50 shadow-2xl">
        <CardBody className="p-8">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              G-BAX
            </div>
            <p className="text-default-600 text-sm">Space Exploration Game</p>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Outer rotating ring */}
              <div className="w-16 h-16 border-4 border-default-200 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin" />
              </div>

              {/* Inner pulsing dot */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-default-600">Progress</span>
              <span className="text-default-600">
                {completedSteps}/{totalSteps}
              </span>
            </div>
            <Progress
              className="w-full"
              classNames={{
                track: "bg-default-200/50",
                indicator: "bg-gradient-to-r from-primary to-secondary",
              }}
              color="primary"
              size="md"
              value={progressPercentage}
              aria-label={`Initialization progress: ${completedSteps} of ${totalSteps} steps completed`}
            />
          </div>

          {/* Current Step */}
          <div className="text-center">
            <p className="text-sm text-default-500 mb-2">Current Step</p>
            <p className="text-default-700 font-medium min-h-[1.25rem]">
              {currentStep}
            </p>
          </div>

          {/* Loading Steps Indicator */}
          <div className="mt-6 space-y-2">
            <div className="grid grid-cols-6 gap-1">
              {Array.from({ length: totalSteps }).map((_, index) => (
                <div
                  key={index}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index < completedSteps
                      ? "bg-gradient-to-r from-primary to-secondary"
                      : index === completedSteps
                        ? "bg-primary/50 animate-pulse"
                        : "bg-default-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Completion Message */}
          {initializationComplete && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 text-success-600 text-sm font-medium">
                <div className="w-4 h-4 bg-success-500 rounded-full flex items-center justify-center">
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
                Initialization Complete
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Bottom Text */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <p className="text-xs text-default-400 text-center">
          Powered by Solana • Honeycomb Protocol • Verxio
        </p>
      </div>
    </div>
  );
}
