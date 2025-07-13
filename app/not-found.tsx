'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@heroui/button';
import { Card, CardBody } from '@heroui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardBody className="text-center space-y-6 p-8">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
            <p className="text-default-600">
              The page you're looking for doesn't exist in this sector of space.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-4xl">🚀</div>
            <p className="text-sm text-default-500">
              Let's navigate you back to familiar territory.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              as={Link}
              href="/"
              color="primary"
              size="lg"
            >
              Return to Game
            </Button>
            
            <Button 
              as={Link}
              href="/how-to-play"
              variant="bordered"
              size="lg"
            >
              How to Play
            </Button>
          </div>
          
          <div className="pt-4 border-t border-divider">
            <p className="text-xs text-default-400">
              Lost in space? Check out our{' '}
              <Link href="/how-to-play" className="text-primary hover:underline">
                game guide
              </Link>{' '}
              or return to the{' '}
              <Link href="/" className="text-primary hover:underline">
                main game
              </Link>.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
