'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/90">
        {/* Floating particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-primary/30 rounded-full animate-pulse" />
        <div className="absolute top-40 right-32 w-1 h-1 bg-secondary/40 rounded-full animate-ping" />
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-success/20 rounded-full animate-bounce" />
        <div className="absolute top-60 left-1/3 w-1 h-1 bg-warning/30 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-20 right-20 w-2 h-2 bg-danger/20 rounded-full animate-ping delay-500" />

        {/* Large background elements */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-success/3 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Main Error Card */}
          <Card className="bg-background/80 backdrop-blur-md border border-default-200/50 shadow-2xl mb-6">
            <CardHeader className="flex flex-col items-center pb-2">
              <Chip
                color="danger"
                variant="flat"
                size="sm"
                className="mb-4"
              >
                ERROR
              </Chip>
            </CardHeader>
            <CardBody className="text-center space-y-8 px-8 pb-8">
              {/* 404 Display */}
              <div className="space-y-4">
                <div className="relative">
                  <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                    404
                  </h1>
                  <div className="absolute inset-0 text-8xl md:text-9xl font-bold text-primary/10 blur-sm">
                    404
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    Lost in Space
                  </h2>
                  <p className="text-lg text-default-600 max-w-md mx-auto">
                    The coordinates you're looking for don't exist in this sector of the galaxy.
                  </p>
                </div>
              </div>

              {/* Space Illustration */}
              <div className="flex justify-center items-center space-x-4 py-6">
                <div className="text-6xl animate-bounce">🚀</div>
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-secondary rounded-full animate-ping delay-200" />
                  <div className="w-2 h-2 bg-success rounded-full animate-ping delay-400" />
                </div>
                <div className="text-4xl animate-pulse">🌌</div>
              </div>

              <Divider className="my-6" />

              {/* Action Buttons */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    as={Link}
                    href="/"
                    color="primary"
                    size="lg"
                    className="font-semibold"
                    startContent={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    }
                  >
                    Return to Base
                  </Button>

                  <Button
                    as={Link}
                    href="/profile"
                    variant="bordered"
                    size="lg"
                    className="font-semibold"
                    startContent={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  >
                    View Profile
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <Button
                    as={Link}
                    href="/missions"
                    variant="light"
                    size="sm"
                    className="text-default-600"
                  >
                    Missions
                  </Button>
                  <Button
                    as={Link}
                    href="/inventory"
                    variant="light"
                    size="sm"
                    className="text-default-600"
                  >
                    Inventory
                  </Button>
                  <Button
                    as={Link}
                    href="/crafting"
                    variant="light"
                    size="sm"
                    className="text-default-600"
                  >
                    Crafting
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Help Card */}
          <Card className="bg-background/60 backdrop-blur-sm border border-default-100/50">
            <CardBody className="text-center py-4">
              <p className="text-sm text-default-500">
                Need assistance navigating the galaxy?{' '}
                <Link
                  href="/"
                  className="text-primary hover:text-primary-600 transition-colors font-medium"
                >
                  Return to the main hub
                </Link>{' '}
                or explore your{' '}
                <Link
                  href="/profile"
                  className="text-secondary hover:text-secondary-600 transition-colors font-medium"
                >
                  player profile
                </Link>{' '}
                to continue your space exploration journey.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <p className="text-xs text-default-400 text-center">
          G-BAX Space Exploration • Powered by Solana & Honeycomb Protocol
        </p>
      </div>
    </div>
  );
}
