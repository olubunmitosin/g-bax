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
        // Update current tier based on points
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
        // Convert createdAt strings back to Date objects
        return guilds.map((guild: any) => ({
          ...guild,
          createdAt: new Date(guild.createdAt),
        }));
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

  // Join a guild
  async joinGuild(playerPublicKey: PublicKey, guildId: string): Promise<boolean> {
    try {
      const playerId = playerPublicKey.toString();

      // Load current guilds
      const savedGuilds = localStorage.getItem('verxio_guilds');
      if (!savedGuilds) {
        return false;
      }

      const guilds = JSON.parse(savedGuilds);
      const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

      if (guildIndex === -1) {
        return false;
      }

      // Update guild member count
      guilds[guildIndex].memberCount += 1;

      // Add some initial reputation to the guild (realistic small amount)
      guilds[guildIndex].totalReputation += 10;

      // Save updated guilds
      localStorage.setItem('verxio_guilds', JSON.stringify(guilds));

      // Also save guild membership for the player
      const playerGuildData = {
        playerId,
        guildId,
        rank: 'member',
        joinedAt: new Date(),
        contribution: 0,
      };

      localStorage.setItem(`verxio_guild_member_${playerId}`, JSON.stringify(playerGuildData));

      return true;
    } catch (error) {
      return false;
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
    return VerxioService.LOYALTY_TIERS.find(tier =>
      points >= tier.minPoints && points <= tier.maxPoints
    ) || VerxioService.LOYALTY_TIERS[0];
  }

  // Get all loyalty tiers
  getAllTiers(): LoyaltyTier[] {
    return [...VerxioService.LOYALTY_TIERS];
  }

  // Calculate points needed for next tier
  getPointsToNextTier(currentPoints: number): { needed: number; nextTier: LoyaltyTier | null } {
    const currentTier = this.getTierByPoints(currentPoints);
    const currentIndex = VerxioService.LOYALTY_TIERS.findIndex(tier => tier.id === currentTier.id);

    if (currentIndex === VerxioService.LOYALTY_TIERS.length - 1) {
      return { needed: 0, nextTier: null }; // Already at max tier
    }

    const nextTier = VerxioService.LOYALTY_TIERS[currentIndex + 1];
    const needed = nextTier.minPoints - currentPoints;

    return { needed: Math.max(0, needed), nextTier };
  }

  // Get multiplier for current tier
  getMultiplierForPoints(points: number): number {
    return this.getTierByPoints(points).multiplier;
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

      // Update player's guild contribution
      const memberData = localStorage.getItem(`verxio_guild_member_${playerId}`);
      if (memberData) {
        const member = JSON.parse(memberData);
        member.contribution += contribution;
        localStorage.setItem(`verxio_guild_member_${playerId}`, JSON.stringify(member));
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
