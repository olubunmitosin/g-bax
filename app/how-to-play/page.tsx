'use client';

import React, { useState } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Tabs, Tab } from '@heroui/tabs';
import { Accordion, AccordionItem } from '@heroui/accordion';

export default function HowToPlayPage() {
  const [selectedTab, setSelectedTab] = useState('getting-started');

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            How to Play G-Bax
          </h1>
          <p className="text-xl text-default-600 max-w-3xl mx-auto">
            Master the cosmos with this comprehensive guide to space exploration, mining, crafting, and blockchain progression
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs
          selectedKey={selectedTab}
          onSelectionChange={(key) => setSelectedTab(key as string)}
          className="w-full"
          variant="bordered"
        >
          <Tab key="getting-started" title="Getting Started">
            <div className="space-y-6 mt-6">
              {/* Wallet Connection */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Step 1: Connect Your Wallet
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-default-600">
                    G-Bax is a blockchain-powered game that requires a Solana wallet to play and track your progress on-chain.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Supported Wallets:</h3>
                      <ul className="space-y-2">
                        <li className="flex items-center gap-2">
                          <Chip size="sm" color="primary">Phantom</Chip>
                          <span className="text-sm">Most popular Solana wallet</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Chip size="sm" color="secondary">Solflare</Chip>
                          <span className="text-sm">Feature-rich wallet</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Chip size="sm" color="success">Backpack</Chip>
                          <span className="text-sm">Gaming-focused wallet</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">What You Need:</h3>
                      <ul className="space-y-1 text-sm text-default-600">
                        <li>• A Solana wallet extension installed</li>
                        <li>• Small amount of SOL for transactions</li>
                        <li>• Wallet connected to Solana mainnet</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <p className="text-warning-700 text-sm">
                      <strong>Tip:</strong> If you don't have a wallet yet, download Phantom from phantom.app - it's beginner-friendly and secure.
                    </p>
                  </div>
                </CardBody>
              </Card>

              {/* First Steps */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Step 2: Your First Actions
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">Select an Object</h3>
                      <p className="text-sm text-default-600">
                        Click on asteroids or resource nodes in the 3D space to select them
                      </p>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">Start Mining</h3>
                      <p className="text-sm text-default-600">
                        Click "Start Mining" to begin extracting resources from the selected object
                      </p>
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="font-semibold">Check Inventory</h3>
                      <p className="text-sm text-default-600">
                        View your collected resources in the Inventory tab
                      </p>
                    </div>
                  </div>

                  <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                    <p className="text-success-700 text-sm">
                      <strong>Congratulations!</strong> Once you complete your first mining operation, you'll start earning experience and loyalty points automatically.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="mining" title="Mining & Resources">
            <div className="space-y-6 mt-6">
              {/* Mining Basics */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    ⛏️ Mining System
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-default-600">
                    Mining is the core activity in G-Bax. Extract valuable resources from space objects to progress and craft items.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Mineable Objects</h3>

                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Chip size="sm" color="warning">Asteroids</Chip>
                          <div className="text-sm">
                            <p className="font-medium">Quick & Easy</p>
                            <p className="text-default-600">~4 seconds, basic resources</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Chip size="sm" color="secondary">Resource Nodes</Chip>
                          <div className="text-sm">
                            <p className="font-medium">Slower but Valuable</p>
                            <p className="text-default-600">~7.5 seconds, higher yields</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">Resource Types</h3>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Chip size="sm" color="warning">Energy</Chip>
                          <span className="text-sm">Powers advanced crafting</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Chip size="sm" color="secondary">Crystal</Chip>
                          <span className="text-sm">High-value trading material</span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Chip size="sm" color="default">Metal</Chip>
                          <span className="text-sm">Essential for construction</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Resource Rarities */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Resource Rarities
                  </h2>
                </CardHeader>
                <CardBody>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center space-y-2">
                      <Chip color="default" variant="flat">Common</Chip>
                      <p className="text-sm text-default-600">Most frequent drops</p>
                      <p className="text-xs">1-10 quantity</p>
                    </div>

                    <div className="text-center space-y-2">
                      <Chip color="primary" variant="flat">Rare</Chip>
                      <p className="text-sm text-default-600">Better quality</p>
                      <p className="text-xs">1-5 quantity</p>
                    </div>

                    <div className="text-center space-y-2">
                      <Chip color="secondary" variant="flat">Epic</Chip>
                      <p className="text-sm text-default-600">High value</p>
                      <p className="text-xs">1-3 quantity</p>
                    </div>

                    <div className="text-center space-y-2">
                      <Chip color="warning" variant="flat">Legendary</Chip>
                      <p className="text-sm text-default-600">Extremely rare</p>
                      <p className="text-xs">1 quantity</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="progression" title="Progression & Loyalty">
            <div className="space-y-6 mt-6">
              {/* Experience System */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Experience & Leveling
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-default-600">
                    Gain experience through mining, crafting, and completing missions to unlock new capabilities.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h3 className="font-semibold">Experience Sources</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex justify-between">
                          <span>Mining completion</span>
                          <Chip size="sm" color="success">25 XP</Chip>
                        </li>
                        <li className="flex justify-between">
                          <span>Crafting items</span>
                          <Chip size="sm" color="success">50+ XP</Chip>
                        </li>
                        <li className="flex justify-between">
                          <span>Mission completion</span>
                          <Chip size="sm" color="success">100+ XP</Chip>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold">Level Benefits</h3>
                      <ul className="space-y-1 text-sm text-default-600">
                        <li>• Increased mining efficiency</li>
                        <li>• Access to advanced crafting</li>
                        <li>• Higher loyalty point multipliers</li>
                        <li>• Unlock new mission types</li>
                      </ul>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Loyalty System */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    ⭐ Verxio Loyalty System
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-default-600">
                    Earn loyalty points through gameplay activities and climb through loyalty tiers for better rewards.
                  </p>

                  <Accordion>
                    <AccordionItem key="earning" title="Earning Loyalty Points">
                      <div className="space-y-3">
                        <p className="text-sm text-default-600">
                          Loyalty points are automatically awarded for various activities:
                        </p>
                        <ul className="space-y-2 text-sm">
                          <li>• <strong>Mining:</strong> Base points + experience earned</li>
                          <li>• <strong>Crafting:</strong> Points based on item rarity</li>
                          <li>• <strong>Daily Login:</strong> Bonus points for consistency</li>
                          <li>• <strong>Achievements:</strong> Special milestone rewards</li>
                        </ul>
                      </div>
                    </AccordionItem>

                    <AccordionItem key="tiers" title="Loyalty Tiers">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Chip color="default">Novice Explorer</Chip>
                          <p className="text-xs text-default-600">0-999 points • 1.0x multiplier</p>
                        </div>
                        <div className="space-y-2">
                          <Chip color="primary">Veteran Explorer</Chip>
                          <p className="text-xs text-default-600">1,000-4,999 points • 1.2x multiplier</p>
                        </div>
                        <div className="space-y-2">
                          <Chip color="secondary">Elite Explorer</Chip>
                          <p className="text-xs text-default-600">5,000-14,999 points • 1.5x multiplier</p>
                        </div>
                        <div className="space-y-2">
                          <Chip color="warning">Legendary Explorer</Chip>
                          <p className="text-xs text-default-600">15,000+ points • 2.0x multiplier</p>
                        </div>
                      </div>
                    </AccordionItem>

                    <AccordionItem key="benefits" title="Tier Benefits">
                      <ul className="space-y-1 text-sm text-default-600">
                        <li>• <strong>Experience Multipliers:</strong> Higher tiers earn XP faster</li>
                        <li>• <strong>Exclusive Access:</strong> Special missions and areas</li>
                        <li>• <strong>Guild Bonuses:</strong> Enhanced guild benefits</li>
                        <li>• <strong>Trading Advantages:</strong> Better marketplace rates</li>
                      </ul>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="guilds" title="Guilds & Social">
            <div className="space-y-6 mt-6">
              {/* Guild System */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Guild System
                  </h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <p className="text-default-600">
                    Join or create guilds to collaborate with other players and unlock powerful group benefits.
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Guild Benefits</h3>
                      <ul className="space-y-2 text-sm">
                        <li>• Mining speed bonuses</li>
                        <li>• Crafting efficiency boosts</li>
                        <li>• Experience multipliers</li>
                        <li>• Resource yield increases</li>
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-semibold">How to Join</h3>
                      <ol className="space-y-2 text-sm">
                        <li>1. Visit the Guilds page</li>
                        <li>2. Browse available guilds</li>
                        <li>3. Check requirements and benefits</li>
                        <li>4. Apply to join or create your own</li>
                      </ol>
                    </div>
                  </div>

                  <div className="bg-info-50 border border-info-200 rounded-lg p-4">
                    <p className="text-info-700 text-sm">
                      <strong>Community:</strong> Guilds are more than just bonuses - they're communities where you can share strategies, coordinate activities, and build lasting friendships in the cosmos.
                    </p>
                  </div>
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="advanced" title="Advanced Tips">
            <div className="space-y-6 mt-6">
              {/* Strategy Tips */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Pro Strategies
                  </h2>
                </CardHeader>
                <CardBody>
                  <Accordion>
                    <AccordionItem key="efficiency" title="Mining Efficiency">
                      <div className="space-y-3">
                        <ul className="space-y-2 text-sm">
                          <li>• <strong>Target Resource Nodes:</strong> Higher yields but longer mining time</li>
                          <li>• <strong>Multiple Operations:</strong> You can mine up to 3 objects simultaneously</li>
                          <li>• <strong>Object Health:</strong> Focus on full-health objects for maximum resources</li>
                          <li>• <strong>Resource Types:</strong> Plan your mining based on crafting needs</li>
                        </ul>
                      </div>
                    </AccordionItem>

                    <AccordionItem key="progression" title="Optimal Progression">
                      <div className="space-y-3">
                        <ul className="space-y-2 text-sm">
                          <li>• <strong>Daily Consistency:</strong> Log in daily for loyalty bonuses</li>
                          <li>• <strong>Guild Early:</strong> Join a guild as soon as possible for bonuses</li>
                          <li>• <strong>Diversify Activities:</strong> Mix mining, crafting, and missions</li>
                          <li>• <strong>Save Rare Resources:</strong> Don't use legendary materials immediately</li>
                        </ul>
                      </div>
                    </AccordionItem>

                    <AccordionItem key="blockchain" title="Blockchain Features">
                      <div className="space-y-3">
                        <ul className="space-y-2 text-sm">
                          <li>• <strong>On-Chain Progress:</strong> Your achievements are permanently recorded</li>
                          <li>• <strong>True Ownership:</strong> Your items and progress belong to you</li>
                          <li>• <strong>Cross-Platform:</strong> Access your account from any device</li>
                          <li>• <strong>Verifiable:</strong> All progress is transparent and verifiable</li>
                        </ul>
                      </div>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>

              {/* Troubleshooting */}
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-bold">
                    Troubleshooting
                  </h2>
                </CardHeader>
                <CardBody>
                  <Accordion>
                    <AccordionItem key="wallet-issues" title="Wallet Connection Issues">
                      <div className="space-y-2 text-sm">
                        <p>• Refresh the page and try connecting again</p>
                        <p>• Make sure your wallet is unlocked</p>
                        <p>• Check that you're on the Solana mainnet</p>
                        <p>• Try a different browser or disable ad blockers</p>
                      </div>
                    </AccordionItem>

                    <AccordionItem key="mining-issues" title="Mining Not Working">
                      <div className="space-y-2 text-sm">
                        <p>• Ensure you've selected a mineable object (asteroid or resource node)</p>
                        <p>• Check that the object has health remaining</p>
                        <p>• You can only have 3 concurrent mining operations</p>
                        <p>• Wait for current operations to complete</p>
                      </div>
                    </AccordionItem>

                    <AccordionItem key="progress-issues" title="Progress Not Saving">
                      <div className="space-y-2 text-sm">
                        <p>• Your progress is automatically saved to blockchain</p>
                        <p>• Check your wallet connection status</p>
                        <p>• Ensure you have enough SOL for transaction fees</p>
                        <p>• Try refreshing the page to sync latest data</p>
                      </div>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>

        {/* Call to Action */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border-blue-500/20">
          <CardBody className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Ready to Explore the Cosmos?</h2>
            <p className="text-default-600">
              Start your journey as a space explorer and build your legacy in the blockchain universe!
            </p>
            <Button
              color="primary"
              size="lg"
              onPress={() => window.location.href = '/'}
            >
              Start Playing Now
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
