"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Code } from "@heroui/code";
import { Accordion, AccordionItem } from "@heroui/accordion";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount((prev) => prev + 1);

    // Add a small delay to show loading state
    setTimeout(() => {
      reset();
      setIsRetrying(false);
    }, 1000);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90">
        {/* Error-themed particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-danger/40 rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-1 h-1 bg-warning/50 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-danger/30 rounded-full animate-bounce" />
        <div className="absolute top-60 left-1/3 w-1 h-1 bg-warning/40 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-danger/25 rounded-full animate-ping delay-500" />

        {/* Large background elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-danger/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-warning/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-danger/3 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* Main Error Card */}
          <Card className="bg-background/80 backdrop-blur-md border border-danger-200/50 shadow-2xl mb-6">
            <CardHeader className="flex flex-col items-center pb-2">
              <Chip className="mb-4" color="danger" size="sm" variant="flat">
                SYSTEM ERROR
              </Chip>
            </CardHeader>
            <CardBody className="text-center space-y-8 px-8 pb-8">
              {/* Error Display */}
              <div className="space-y-4">
                <div className="relative">
                  <div className="text-6xl md:text-7xl font-bold text-danger animate-pulse mb-4">
                    ⚠️
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-danger via-warning to-danger bg-clip-text text-transparent">
                    System Malfunction
                  </h1>
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Houston, We Have a Problem
                  </h2>
                  <p className="text-lg text-default-600 max-w-2xl mx-auto">
                    Our space station encountered an unexpected error. Don't
                    worry, our engineers are on it!
                  </p>
                </div>
              </div>

              {/* Error Illustration */}
              <div className="flex justify-center items-center space-x-4 py-6">
                <div className="text-4xl animate-bounce">🛸</div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-danger rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-warning rounded-full animate-ping delay-200" />
                  <div className="w-2 h-2 bg-danger rounded-full animate-ping delay-400" />
                </div>
                <div className="text-4xl animate-pulse">💥</div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-warning rounded-full animate-ping delay-100" />
                  <div className="w-2 h-2 bg-danger rounded-full animate-ping delay-300" />
                  <div className="w-2 h-2 bg-warning rounded-full animate-ping delay-500" />
                </div>
                <div className="text-4xl animate-bounce delay-200">🔧</div>
              </div>

              <Divider className="my-6" />

              {/* Action Buttons */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    className="font-semibold"
                    color="primary"
                    isLoading={isRetrying}
                    size="lg"
                    startContent={
                      !isRetrying && (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                          />
                        </svg>
                      )
                    }
                    onPress={handleRetry}
                  >
                    {isRetrying ? "Rebooting Systems..." : "Try Again"}
                  </Button>

                  <Button
                    className="font-semibold"
                    size="lg"
                    startContent={
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                    }
                    variant="bordered"
                    onClick={handleReload}
                  >
                    Reload Page
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    as={Link}
                    className="text-default-600"
                    href="/"
                    size="sm"
                    variant="light"
                  >
                    Return Home
                  </Button>
                  <Button
                    as={Link}
                    className="text-default-600"
                    href="/profile"
                    size="sm"
                    variant="light"
                  >
                    View Profile
                  </Button>
                  <Button
                    as={Link}
                    className="text-default-600"
                    href="/missions"
                    size="sm"
                    variant="light"
                  >
                    Missions
                  </Button>
                </div>

                {retryCount > 0 && (
                  <div className="text-sm text-default-500">
                    Retry attempts: {retryCount}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Help Card */}
          <Card className="bg-background/60 backdrop-blur-sm border border-default-100/50">
            <CardBody className="text-center py-4">
              <p className="text-sm text-default-500">
                If the problem persists, try{" "}
                <button
                  className="text-primary hover:text-primary-600 transition-colors font-medium underline"
                  onClick={handleReload}
                >
                  reloading the page
                </button>{" "}
                or{" "}
                <Link
                  className="text-secondary hover:text-secondary-600 transition-colors font-medium underline"
                  href="/"
                >
                  return to the main hub
                </Link>{" "}
                to continue your space exploration.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-xs text-default-400 text-center">
          G-BAX Space Exploration • Error Recovery System
        </p>
      </div>
    </div>
  );
}
