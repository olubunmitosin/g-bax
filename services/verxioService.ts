import { PublicKey } from '@solana/web3.js';

export interface VerxioConfig {
  apiKey?: string; // Optional - Verxio doesn't require API key
  environment: 'development' | 'production';
  baseUrl?: string;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  multiplier: number;
  benefits: string[];
  color: string;
  icon: string;
}

export interface PlayerLoyalty {
  playerId: string;
  currentTier: LoyaltyTier;
  points: number;
  totalPointsEarned: number;
  guildId?: string;
  guildRank?: string;
  reputation: number;
  achievements: string[];
  lastActivity: Date;
}

export interface Guild {
  id: string;
  name: string;
  description: string;
  type: 'mining' | 'exploration' | 'crafting' | 'combat' | 'mixed';
  memberCount: number;
  totalReputation: number;
  level: number;
  benefits: GuildBenefit[];
  requirements: GuildRequirement[];
  createdAt: Date;
}

export interface GuildBenefit {
  type: 'experience_boost' | 'resource_bonus' | 'crafting_speed' | 'mining_efficiency';
  value: number;
  description: string;
}

export interface GuildRequirement {
  type: 'level' | 'reputation' | 'achievement';
  value: number | string;
  description: string;
}

export interface GuildMember {
  playerId: string;
  playerName: string;
  rank: 'member' | 'officer' | 'leader';
  joinedAt: Date;
  contribution: number;
  lastActive: Date;
}

export class VerxioService {
  private config: VerxioConfig;
  private baseUrl: string;

  // Predefined loyalty tiers
  private static readonly LOYALTY_TIERS: LoyaltyTier[] = [
    {
      id: 'novice',
      name: 'Novice Explorer',
      minPoints: 0,
      maxPoints: 999,
      multiplier: 1.0,
      benefits: ['Basic mining access', 'Standard rewards'],
      color: '#6B7280',
      icon: '🌟',
    },
    {
      id: 'apprentice',
      name: 'Apprentice Miner',
      minPoints: 1000,
      maxPoints: 4999,
      multiplier: 1.1,
      benefits: ['10% bonus XP', 'Access to rare resources', 'Guild eligibility'],
      color: '#10B981',
      icon: '⭐',
    },
    {
      id: 'journeyman',
      name: 'Journeyman Crafter',
      minPoints: 5000,
      maxPoints: 14999,
      multiplier: 1.25,
      benefits: ['25% bonus XP', 'Advanced crafting recipes', 'Guild officer eligibility'],
      color: '#3B82F6',
      icon: '🌟',
    },
    {
      id: 'expert',
      name: 'Expert Navigator',
      minPoints: 15000,
      maxPoints: 39999,
      multiplier: 1.5,
      benefits: ['50% bonus XP', 'Legendary item access', 'Guild leadership eligibility'],
      color: '#8B5CF6',
      icon: '💫',
    },
    {
      id: 'master',
      name: 'Master Explorer',
      minPoints: 40000,
      maxPoints: 99999,
      multiplier: 2.0,
      benefits: ['100% bonus XP', 'Exclusive missions', 'Cross-guild privileges'],
      color: '#F59E0B',
      icon: '⭐',
    },
    {
      id: 'legend',
      name: 'Legendary Pioneer',
      minPoints: 100000,
      maxPoints: Infinity,
      multiplier: 3.0,
      benefits: ['200% bonus XP', 'Universe shaping privileges', 'Immortal status'],
      color: '#EF4444',
      icon: '🌟',
    },
  ];

  constructor(config: VerxioConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.verxio.com/v1';
  }

  // Initialize Verxio connection
  async initialize(): Promise<boolean> {
    try {
      // In a real implementation, this would validate API key and setup connection

      // Sync guild member counts on initialization to fix any inconsistencies
      await this.syncAllGuildMemberCounts();

      return true;
    } catch (error) {
      return false;
    }
  }

  // Get player loyalty information
  async getPlayerLoyalty(playerPublicKey: PublicKey): Promise<PlayerLoyalty | null> {
    try {
      // Check if player exists in local storage (for demo purposes)
      const playerId = playerPublicKey.toString();
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

      if (savedLoyalty) {
        const loyalty = JSON.parse(savedLoyalty);
        // Always recalculate current tier based on points to ensure consistency
        loyalty.currentTier = this.getTierByPoints(loyalty.points);
        // Ensure lastActivity is a Date object
        loyalty.lastActivity = new Date(loyalty.lastActivity);
        return loyalty;
      }

      // Create new player with 0 points - all points must be earned
      const newLoyalty: PlayerLoyalty = {
        playerId: playerId,
        currentTier: this.getTierByPoints(0), // Start at Novice with 0 points
        points: 0,
        totalPointsEarned: 0,
        reputation: 0,
        achievements: [],
        lastActivity: new Date(),
      };

      // Save to local storage
      localStorage.setItem(`verxio_loyalty_${playerId}`, JSON.stringify(newLoyalty));
      return newLoyalty;
    } catch (error) {
      return null;
    }
  }

  // Award loyalty points
  async awardPoints(
    playerPublicKey: PublicKey,
    points: number,
    reason: string
  ): Promise<boolean> {
    try {
      const playerId = playerPublicKey.toString();
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

      if (!savedLoyalty) {
        return false;
      }

      const loyalty = JSON.parse(savedLoyalty);

      // Update points
      loyalty.points += points;
      loyalty.totalPointsEarned += points;
      loyalty.lastActivity = new Date();

      // Update tier based on new points
      loyalty.currentTier = this.getTierByPoints(loyalty.points);

      // Save updated loyalty data
      localStorage.setItem(`verxio_loyalty_${playerId}`, JSON.stringify(loyalty));

      return true;
    } catch (error) {
      return false;
    }
  }

  // Get available guilds
  async getAvailableGuilds(): Promise<Guild[]> {
    try {
      // Load guilds from localStorage or return empty array for new installations
      const savedGuilds = localStorage.getItem('verxio_guilds');

      if (savedGuilds) {
        const guilds = JSON.parse(savedGuilds);
        // Convert createdAt strings back to Date objects and sync member counts
        const syncedGuilds = await Promise.all(guilds.map(async (guild: any) => {
          const actualMembers = await this.getGuildMembers(guild.id);
          return {
            ...guild,
            memberCount: actualMembers.length, // Sync with actual member count
            createdAt: new Date(guild.createdAt),
          };
        }));

        // Save the synced guild data back to localStorage
        localStorage.setItem('verxio_guilds', JSON.stringify(syncedGuilds));
        return syncedGuilds;
      }

      // Initialize with realistic starter guilds that have no members yet
      const initialGuilds: Guild[] = [
        {
          id: 'miners_collective',
          name: 'Miners Collective',
          description: 'A growing community of space miners sharing techniques and resources',
          type: 'mining',
          memberCount: 0, // Start with 0 members
          totalReputation: 0, // Start with 0 reputation
          level: 1, // Start at level 1
          benefits: [
            { type: 'mining_efficiency', value: 1.1, description: '10% faster mining' },
          ],
          requirements: [
            { type: 'level', value: 2, description: 'Minimum level 2' },
          ],
          createdAt: new Date(),
        },
        {
          id: 'void_explorers',
          name: 'Void Explorers',
          description: 'Brave explorers venturing into uncharted space territories',
          type: 'exploration',
          memberCount: 0,
          totalReputation: 0,
          level: 1,
          benefits: [
            { type: 'experience_boost', value: 1.1, description: '10% bonus XP' },
          ],
          requirements: [
            { type: 'level', value: 2, description: 'Minimum level 2' },
          ],
          createdAt: new Date(),
        },
        {
          id: 'stellar_crafters',
          name: 'Stellar Crafters',
          description: 'Artisans dedicated to perfecting the craft of space equipment',
          type: 'crafting',
          memberCount: 0,
          totalReputation: 0,
          level: 1,
          benefits: [
            { type: 'crafting_speed', value: 1.1, description: '10% faster crafting' },
          ],
          requirements: [
            { type: 'level', value: 2, description: 'Minimum level 2' },
          ],
          createdAt: new Date(),
        },
      ];

      // Save initial guilds to localStorage
      localStorage.setItem('verxio_guilds', JSON.stringify(initialGuilds));
      return initialGuilds;
    } catch (error) {
      return [];
    }
  }

  // Check if player meets guild requirements
  checkGuildRequirements(playerPublicKey: PublicKey, guild: Guild): { canJoin: boolean; failedRequirements: string[] } {
    const playerId = playerPublicKey.toString();
    const failedRequirements: string[] = [];

    // Get player loyalty data
    const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);
    if (!savedLoyalty) {
      failedRequirements.push('Player loyalty data not found');
      return { canJoin: false, failedRequirements };
    }

    const loyalty = JSON.parse(savedLoyalty);

    // Check each requirement
    for (const requirement of guild.requirements) {
      switch (requirement.type) {
        case 'level':
          // Get player level from experience
          const playerLevel = Math.floor(loyalty.points / 1000) + 1; // Simple level calculation
          if (playerLevel < (requirement.value as number)) {
            failedRequirements.push(`Requires level ${requirement.value}, you are level ${playerLevel}`);
          }
          break;
        case 'reputation':
          if (loyalty.reputation < (requirement.value as number)) {
            failedRequirements.push(`Requires ${requirement.value} reputation, you have ${loyalty.reputation}`);
          }
          break;
        case 'achievement':
          // Check if player has specific achievement
          if (!loyalty.achievements.includes(requirement.value as string)) {
            failedRequirements.push(`Requires achievement: ${requirement.description}`);
          }
          break;
      }
    }

    return { canJoin: failedRequirements.length === 0, failedRequirements };
  }

  // Join a guild
  async joinGuild(playerPublicKey: PublicKey, guildId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const playerId = playerPublicKey.toString();

      // Check if player is already in a guild
      const existingMembership = localStorage.getItem(`verxio_guild_member_${playerId}`);
      if (existingMembership) {
        return { success: false, error: 'You are already a member of a guild. Leave your current guild first.' };
      }

      // Load current guilds
      const savedGuilds = localStorage.getItem('verxio_guilds');
      if (!savedGuilds) {
        return { success: false, error: 'No guilds available' };
      }

      const guilds = JSON.parse(savedGuilds);
      const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

      if (guildIndex === -1) {
        return { success: false, error: 'Guild not found' };
      }

      const guild = guilds[guildIndex];

      // Check guild requirements
      const requirementCheck = this.checkGuildRequirements(playerPublicKey, guild);
      if (!requirementCheck.canJoin) {
        return {
          success: false,
          error: `Requirements not met: ${requirementCheck.failedRequirements.join(', ')}`
        };
      }

      // Check if this is the first member (should become leader)
      const actualMembers = await this.getGuildMembers(guildId);
      const isFirstMember = actualMembers.length === 0;
      const memberRank = isFirstMember ? 'leader' : 'member';

      // Update guild member count
      guilds[guildIndex].memberCount = actualMembers.length + 1; // +1 for the new member

      // Add some initial reputation to the guild (realistic small amount)
      guilds[guildIndex].totalReputation += 10;

      // Save updated guilds
      localStorage.setItem('verxio_guilds', JSON.stringify(guilds));

      // Save guild membership for the player
      const playerGuildData = {
        playerId,
        guildId,
        rank: memberRank,
        joinedAt: new Date(),
        contribution: 0,
        lastActive: new Date(), // Track activity
      };

      localStorage.setItem(`verxio_guild_member_${playerId}`, JSON.stringify(playerGuildData));

      // Update player loyalty with guild info
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);
      if (savedLoyalty) {
        const loyalty = JSON.parse(savedLoyalty);
        loyalty.guildId = guildId;
        loyalty.guildRank = memberRank;
        localStorage.setItem(`verxio_loyalty_${playerId}`, JSON.stringify(loyalty));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to join guild' };
    }
  }

  // Leave a guild
  async leaveGuild(playerPublicKey: PublicKey): Promise<{ success: boolean; error?: string }> {
    try {
      const playerId = playerPublicKey.toString();

      // Check if player is in a guild
      const existingMembership = localStorage.getItem(`verxio_guild_member_${playerId}`);
      if (!existingMembership) {
        return { success: false, error: 'You are not a member of any guild' };
      }

      const membershipData = JSON.parse(existingMembership);
      const guildId = membershipData.guildId;

      // Load current guilds and update member count
      const savedGuilds = localStorage.getItem('verxio_guilds');
      if (savedGuilds) {
        const guilds = JSON.parse(savedGuilds);
        const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

        if (guildIndex !== -1) {
          // Update member count by counting actual remaining members
          const actualMembers = await this.getGuildMembers(guildId);
          guilds[guildIndex].memberCount = Math.max(0, actualMembers.length - 1); // -1 for the leaving member

          // Remove some reputation (small amount)
          guilds[guildIndex].totalReputation = Math.max(0, guilds[guildIndex].totalReputation - 5);

          localStorage.setItem('verxio_guilds', JSON.stringify(guilds));
        }
      }

      // Remove player guild membership
      localStorage.removeItem(`verxio_guild_member_${playerId}`);

      // Update player loyalty to remove guild info
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);
      if (savedLoyalty) {
        const loyalty = JSON.parse(savedLoyalty);
        delete loyalty.guildId;
        delete loyalty.guildRank;
        localStorage.setItem(`verxio_loyalty_${playerId}`, JSON.stringify(loyalty));
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Failed to leave guild' };
    }
  }

  // Get guild members
  async getGuildMembers(guildId: string): Promise<GuildMember[]> {
    try {
      const members: GuildMember[] = [];

      // Scan localStorage for all guild members of this guild
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('verxio_guild_member_')) {
          const memberData = localStorage.getItem(key);
          if (memberData) {
            const member = JSON.parse(memberData);
            if (member.guildId === guildId) {
              // Get player name from their loyalty data
              const playerId = member.playerId;
              const playerLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);
              let playerName = `Explorer ${playerId.slice(0, 6)}`;

              if (playerLoyalty) {
                const loyalty = JSON.parse(playerLoyalty);
                // Create a more readable name based on player ID
                playerName = `Explorer ${playerId.slice(0, 8)}`;
              }

              members.push({
                playerId: member.playerId,
                playerName,
                rank: member.rank || 'member',
                joinedAt: new Date(member.joinedAt),
                contribution: member.contribution || 0,
                lastActive: new Date(member.joinedAt), // Use join date as last active for now
              });
            }
          }
        }
      }

      return members;
    } catch (error) {
      return [];
    }
  }

  // Update player reputation
  async updateReputation(
    playerPublicKey: PublicKey,
    change: number,
    reason: string
  ): Promise<boolean> {
    try {
      const playerId = playerPublicKey.toString();
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

      if (!savedLoyalty) {
        return false;
      }

      const loyalty = JSON.parse(savedLoyalty);

      // Update reputation
      loyalty.reputation = Math.max(0, loyalty.reputation + change);
      loyalty.lastActivity = new Date();

      // Save updated loyalty data
      localStorage.setItem(`verxio_loyalty_${playerId}`, JSON.stringify(loyalty));

      return true;
    } catch (error) {
      return false;
    }
  }

  // Get loyalty tier by points
  getTierByPoints(points: number): LoyaltyTier {
    // Find the appropriate tier for the given points
    for (let i = VerxioService.LOYALTY_TIERS.length - 1; i >= 0; i--) {
      const tier = VerxioService.LOYALTY_TIERS[i];
      if (points >= tier.minPoints) {
        return tier;
      }
    }
    // Fallback to first tier if no match found
    return VerxioService.LOYALTY_TIERS[0];
  }

  // Get all loyalty tiers
  getAllTiers(): LoyaltyTier[] {
    return [...VerxioService.LOYALTY_TIERS];
  }

  // Calculate points needed for next tier
  getPointsToNextTier(currentPoints: number): { needed: number; nextTier: LoyaltyTier | null } {
    const currentTier = this.getTierByPoints(currentPoints);
    const currentIndex = VerxioService.LOYALTY_TIERS.findIndex(tier => tier.id === currentTier.id);

    // Check if already at max tier
    if (currentIndex === -1 || currentIndex === VerxioService.LOYALTY_TIERS.length - 1) {
      return { needed: 0, nextTier: null };
    }

    const nextTier = VerxioService.LOYALTY_TIERS[currentIndex + 1];
    const needed = nextTier.minPoints - currentPoints;

    return { needed: Math.max(0, needed), nextTier };
  }

  // Get multiplier for current tier
  getMultiplierForPoints(points: number): number {
    return this.getTierByPoints(points).multiplier;
  }

  // Utility function to sync all guild member counts with actual membership data
  async syncAllGuildMemberCounts(): Promise<void> {
    try {
      const savedGuilds = localStorage.getItem('verxio_guilds');
      if (!savedGuilds) return;

      const guilds = JSON.parse(savedGuilds);
      let hasChanges = false;

      for (let i = 0; i < guilds.length; i++) {
        const actualMembers = await this.getGuildMembers(guilds[i].id);
        if (guilds[i].memberCount !== actualMembers.length) {
          guilds[i].memberCount = actualMembers.length;
          hasChanges = true;
        }

        // Also check and update guild leadership
        await this.checkAndUpdateGuildLeadership(guilds[i].id);
      }

      if (hasChanges) {
        localStorage.setItem('verxio_guilds', JSON.stringify(guilds));
      }
    } catch (error) {
      console.error('Failed to sync guild member counts:', error);
    }
  }

  // Check and update guild leadership based on activity
  async checkAndUpdateGuildLeadership(guildId: string): Promise<void> {
    try {
      const members = await this.getGuildMembers(guildId);
      if (members.length === 0) return;

      const currentLeader = members.find(member => member.rank === 'leader');
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));

      // If no leader exists, promote the most active member
      if (!currentLeader) {
        await this.promoteNewLeader(guildId, members);
        return;
      }

      // Check if current leader is inactive for more than 3 days
      const leaderLastActive = new Date(currentLeader.lastActive);
      if (leaderLastActive < threeDaysAgo) {
        // Find the most active member (excluding current leader)
        const activeCandidates = members
          .filter(member => member.playerId !== currentLeader.playerId)
          .filter(member => new Date(member.lastActive) > threeDaysAgo)
          .sort((a, b) => {
            // Sort by activity (most recent first), then by contribution
            const aActivity = new Date(a.lastActive).getTime();
            const bActivity = new Date(b.lastActive).getTime();
            if (aActivity !== bActivity) {
              return bActivity - aActivity;
            }
            return b.contribution - a.contribution;
          });

        if (activeCandidates.length > 0) {
          // Demote current leader and promote new one
          await this.transferLeadership(guildId, currentLeader.playerId, activeCandidates[0].playerId);
        }
      }
    } catch (error) {
      console.error('Failed to check guild leadership:', error);
    }
  }

  // Promote a new leader from available members
  private async promoteNewLeader(guildId: string, members: GuildMember[]): Promise<void> {
    if (members.length === 0) return;

    // Find the best candidate (most active and highest contribution)
    const candidate = members
      .sort((a, b) => {
        const aActivity = new Date(a.lastActive).getTime();
        const bActivity = new Date(b.lastActive).getTime();
        if (aActivity !== bActivity) {
          return bActivity - aActivity;
        }
        return b.contribution - a.contribution;
      })[0];

    await this.updateMemberRank(candidate.playerId, 'leader');
  }

  // Transfer leadership from one member to another
  private async transferLeadership(guildId: string, oldLeaderId: string, newLeaderId: string): Promise<void> {
    // Demote old leader to member
    await this.updateMemberRank(oldLeaderId, 'member');

    // Promote new leader
    await this.updateMemberRank(newLeaderId, 'leader');
  }

  // Update a member's rank
  private async updateMemberRank(playerId: string, newRank: 'member' | 'officer' | 'leader'): Promise<void> {
    try {
      // Update guild membership data
      const membershipKey = `verxio_guild_member_${playerId}`;
      const membershipData = localStorage.getItem(membershipKey);

      if (membershipData) {
        const membership = JSON.parse(membershipData);
        membership.rank = newRank;
        localStorage.setItem(membershipKey, JSON.stringify(membership));
      }

      // Update player loyalty data
      const loyaltyKey = `verxio_loyalty_${playerId}`;
      const loyaltyData = localStorage.getItem(loyaltyKey);

      if (loyaltyData) {
        const loyalty = JSON.parse(loyaltyData);
        loyalty.guildRank = newRank;
        localStorage.setItem(loyaltyKey, JSON.stringify(loyalty));
      }
    } catch (error) {
      console.error('Failed to update member rank:', error);
    }
  }

  // Update guild reputation and member contribution
  async updateGuildContribution(
    playerPublicKey: PublicKey,
    guildId: string,
    contribution: number,
    reason: string
  ): Promise<boolean> {
    try {
      const playerId = playerPublicKey.toString();

      // Update guild total reputation
      const savedGuilds = localStorage.getItem('verxio_guilds');
      if (savedGuilds) {
        const guilds = JSON.parse(savedGuilds);
        const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

        if (guildIndex !== -1) {
          guilds[guildIndex].totalReputation += contribution;

          // Level up guild if it reaches certain reputation thresholds
          const newLevel = Math.floor(guilds[guildIndex].totalReputation / 1000) + 1;
          if (newLevel > guilds[guildIndex].level) {
            guilds[guildIndex].level = newLevel;
          }

          localStorage.setItem('verxio_guilds', JSON.stringify(guilds));
        }
      }

      // Update player's guild contribution and activity
      const memberData = localStorage.getItem(`verxio_guild_member_${playerId}`);
      if (memberData) {
        const member = JSON.parse(memberData);
        member.contribution += contribution;
        member.lastActive = new Date(); // Update activity timestamp
        localStorage.setItem(`verxio_guild_member_${playerId}`, JSON.stringify(member));
      }

      // Check if leadership needs to be updated after this activity
      await this.checkAndUpdateGuildLeadership(guildId);

      return true;
    } catch (error) {
      return false;
    }
  }

  // Update member activity (called when player performs any action)
  async updateMemberActivity(playerPublicKey: PublicKey): Promise<void> {
    try {
      const playerId = playerPublicKey.toString();

      // Update guild membership activity
      const membershipData = localStorage.getItem(`verxio_guild_member_${playerId}`);
      if (membershipData) {
        const membership = JSON.parse(membershipData);
        membership.lastActive = new Date();
        localStorage.setItem(`verxio_guild_member_${playerId}`, JSON.stringify(membership));

        // Check if leadership needs to be updated
        if (membership.guildId) {
          await this.checkAndUpdateGuildLeadership(membership.guildId);
        }
      }
    } catch (error) {
      console.error('Failed to update member activity:', error);
    }
  }
}
