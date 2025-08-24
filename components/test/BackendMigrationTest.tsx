"use client";

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { backendHoneycombService, BackendProfile } from '../../services/backendHoneycombService';
import ProfileMigrationManager, { MigrationResult } from '../../utils/profileMigration';

export default function BackendMigrationTest() {
  const { publicKey, connected } = useWallet();
  const [profile, setProfile] = useState<BackendProfile | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check backend status on component mount
  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const status = await ProfileMigrationManager.checkBackendStatus();
      setBackendStatus(status);
    } catch (error) {
      console.error('Failed to check backend status:', error);
      setBackendStatus({ available: false, backendHealthy: false, honeycombHealthy: false });
    }
  };

  const testProfileMigration = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🧪 Testing profile migration for:', publicKey.toString());

      const result = await ProfileMigrationManager.getOrCreateProfile(publicKey, {
        name: 'Test Player',
        avatar: 'https://example.com/avatar.jpg',
        metadata: {
          bio: 'Test player for backend migration',
          testFlag: true,
        },
      });

      setMigrationResult(result);
      setProfile(result.profile || null);

      if (result.success) {
        console.log('✅ Migration test successful');
      } else {
        console.log('⚠️ Migration test completed with issues');
      }
    } catch (error) {
      console.error('❌ Migration test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testDirectBackendCall = async () => {
    if (!publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔗 Testing direct backend call for:', publicKey.toString());

      const existingProfile = await backendHoneycombService.getPlayerProfile(publicKey);

      if (existingProfile) {
        setProfile(existingProfile);
        console.log('✅ Found existing profile on backend');
      } else {
        console.log('📝 Creating new profile on backend');
        const newProfile = await backendHoneycombService.createPlayerProfile(publicKey, {
          name: 'Direct Backend Test Player',
          avatar: 'https://example.com/direct-avatar.jpg',
          metadata: {
            bio: 'Created directly via backend API',
            directTest: true,
          },
        });
        setProfile(newProfile);
        console.log('✅ Created new profile on backend');
      }
    } catch (error) {
      console.error('❌ Direct backend test failed:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearLocalStorage = () => {
    if (!publicKey) return;

    try {
      const playerKey = publicKey.toString();
      const blockchainKey = `honeycomb-profile-${playerKey}`;
      localStorage.removeItem(blockchainKey);
      console.log('🗑️ Cleared localStorage profile');
      setProfile(null);
      setMigrationResult(null);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  const getStatusColor = (healthy: boolean) => healthy ? 'success' : 'danger';
  const getSourceColor = (source: string) => {
    switch (source) {
      case 'backend': return 'success';
      case 'localStorage': return 'warning';
      case 'created': return 'primary';
      case 'fallback': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Backend Migration Test</h2>
        </CardHeader>
        <CardBody className="space-y-4">
          {/* Backend Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Backend Status</h3>
            {backendStatus ? (
              <div className="flex gap-2 flex-wrap">
                <Chip color={getStatusColor(backendStatus.available)} variant="flat">
                  Backend: {backendStatus.available ? 'Available' : 'Unavailable'}
                </Chip>
                <Chip color={getStatusColor(backendStatus.backendHealthy)} variant="flat">
                  API: {backendStatus.backendHealthy ? 'Healthy' : 'Unhealthy'}
                </Chip>
                <Chip color={getStatusColor(backendStatus.honeycombHealthy)} variant="flat">
                  Honeycomb: {backendStatus.honeycombHealthy ? 'Healthy' : 'Unhealthy'}
                </Chip>
              </div>
            ) : (
              <Chip color="warning" variant="flat">Checking...</Chip>
            )}
          </div>

          {/* Wallet Status */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Wallet Status</h3>
            <Chip color={connected ? 'success' : 'danger'} variant="flat">
              {connected ? `Connected: ${publicKey?.toString().slice(0, 8)}...` : 'Not Connected'}
            </Chip>
          </div>

          {/* Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button
              color="primary"
              onClick={testProfileMigration}
              isLoading={loading}
              isDisabled={!connected || !backendStatus?.available}
            >
              Test Migration
            </Button>
            <Button
              color="secondary"
              onClick={testDirectBackendCall}
              isLoading={loading}
              isDisabled={!connected || !backendStatus?.available}
            >
              Test Direct Backend
            </Button>
            <Button
              color="warning"
              variant="flat"
              onClick={clearLocalStorage}
              isDisabled={!connected}
            >
              Clear Local Storage
            </Button>
            <Button
              color="default"
              variant="flat"
              onClick={checkBackendStatus}
            >
              Refresh Status
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="border-danger">
              <CardBody>
                <p className="text-danger">Error: {error}</p>
              </CardBody>
            </Card>
          )}

          {/* Migration Result */}
          {migrationResult && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Migration Result</h3>
              </CardHeader>
              <CardBody className="space-y-2">
                <div className="flex gap-2">
                  <Chip color={migrationResult.success ? 'success' : 'danger'} variant="flat">
                    {migrationResult.success ? 'Success' : 'Failed'}
                  </Chip>
                  <Chip color={getSourceColor(migrationResult.source)} variant="flat">
                    Source: {migrationResult.source}
                  </Chip>
                </div>
                {migrationResult.error && (
                  <p className="text-danger text-sm">Error: {migrationResult.error}</p>
                )}
              </CardBody>
            </Card>
          )}

          {/* Profile Display */}
          {profile && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Profile Data</h3>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Name:</strong> {profile.name}</p>
                    <p><strong>Bio:</strong> {profile.bio}</p>
                    <p><strong>Level:</strong> {profile.level}</p>
                    <p><strong>Experience:</strong> {profile.experience}</p>
                    <p><strong>Credits:</strong> {profile.credits}</p>
                    <p><strong>ID:</strong> {profile.id}</p>
                  </div>
                  <div>
                    <p><strong>Source:</strong> {profile.source}</p>
                    <p><strong>Created:</strong> {new Date(profile.createdAt).toLocaleString()}</p>
                    <p><strong>Updated:</strong> {new Date(profile.lastUpdated).toLocaleString()}</p>
                    <p><strong>Address:</strong> {profile.address.slice(0, 8)}...</p>
                    {profile.profileAddress && (
                      <p><strong>Profile Address:</strong> {profile.profileAddress.slice(0, 8)}...</p>
                    )}
                    {profile.transactionSignature && (
                      <p><strong>Transaction:</strong> {profile.transactionSignature.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>

                {/* Blockchain Details */}
                {(profile.profileAddress || profile.projectAddress || profile.profileTreeAddress) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded">
                    <p className="font-semibold text-blue-800 mb-2">Blockchain Details:</p>
                    <div className="text-sm space-y-1">
                      {profile.projectAddress && (
                        <p><strong>Project:</strong> <span className="font-mono">{profile.projectAddress}</span></p>
                      )}
                      {profile.profileTreeAddress && (
                        <p><strong>Profile Tree:</strong> <span className="font-mono">{profile.profileTreeAddress}</span></p>
                      )}
                      {profile.profileAddress && (
                        <p><strong>Profile:</strong> <span className="font-mono">{profile.profileAddress}</span></p>
                      )}
                    </div>
                  </div>
                )}
                {profile.metadata && (
                  <div className="mt-4">
                    <p><strong>Metadata:</strong></p>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(profile.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
