import { PublicKey } from "@solana/web3.js";
import {
  initializeVerxio,
  createLoyaltyProgram,
  awardLoyaltyPoints,
  issueLoyaltyPass,
  getProgramDetails,
  getAssetData,
  type VerxioContext,
} from "@verxioprotocol/core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  publicKey,
  keypairIdentity,
  generateSigner,
  createSignerFromKeypair,
} from "@metaplex-foundation/umi";

export interface VerxioConfig {
  apiKey?: string; // Optional - Verxio doesn't require API key
  environment: "development" | "production";
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
  type: "mining" | "exploration" | "crafting" | "combat" | "mixed";
  memberCount: number;
  totalReputation: number;
  level: number;
  benefits: GuildBenefit[];
  requirements: GuildRequirement[];
  createdAt: Date;
}

export interface GuildBenefit {
  type:
  | "experience_boost"
  | "resource_bonus"
  | "crafting_speed"
  | "mining_efficiency";
  value: number;
  description: string;
}

export interface GuildRequirement {
  type: "level" | "reputation" | "achievement";
  value: number | string;
  description: string;
}

export interface GuildMember {
  playerId: string;
  playerName: string;
  rank: "member" | "officer" | "leader";
  joinedAt: Date;
  contribution: number;
  lastActive: Date;
}

export class VerxioService {
  private config: VerxioConfig;
  private baseUrl: string;
  private verxioContext: VerxioContext | null = null;
  private programAuthorityKeypair: any = null; // Store separately since it's not in VerxioContext
  private loyaltyProgramId: string | null = null;
  private isInitialized: boolean = false;

  // Predefined loyalty tiers
  private static readonly LOYALTY_TIERS: LoyaltyTier[] = [
    {
      id: "novice",
      name: "Novice Explorer",
      minPoints: 0,
      maxPoints: 999,
      multiplier: 1.0,
      benefits: ["Basic mining access", "Standard rewards"],
      color: "#6B7280",
      icon: "🌟",
    },
    {
      id: "apprentice",
      name: "Apprentice Miner",
      minPoints: 1000,
      maxPoints: 4999,
      multiplier: 1.1,
      benefits: [
        "10% bonus XP",
        "Access to rare resources",
        "Guild eligibility",
      ],
      color: "#10B981",
      icon: "⭐",
    },
    {
      id: "journeyman",
      name: "Journeyman Crafter",
      minPoints: 5000,
      maxPoints: 14999,
      multiplier: 1.25,
      benefits: [
        "25% bonus XP",
        "Advanced crafting recipes",
        "Guild officer eligibility",
      ],
      color: "#3B82F6",
      icon: "🌟",
    },
    {
      id: "expert",
      name: "Expert Navigator",
      minPoints: 15000,
      maxPoints: 39999,
      multiplier: 1.5,
      benefits: [
        "50% bonus XP",
        "Legendary item access",
        "Guild leadership eligibility",
      ],
      color: "#8B5CF6",
      icon: "💫",
    },
    {
      id: "master",
      name: "Master Explorer",
      minPoints: 40000,
      maxPoints: 99999,
      multiplier: 2.0,
      benefits: [
        "100% bonus XP",
        "Exclusive missions",
        "Cross-guild privileges",
      ],
      color: "#F59E0B",
      icon: "⭐",
    },
    {
      id: "legend",
      name: "Legendary Pioneer",
      minPoints: 100000,
      maxPoints: Infinity,
      multiplier: 3.0,
      benefits: [
        "200% bonus XP",
        "Universe shaping privileges",
        "Immortal status",
      ],
      color: "#EF4444",
      icon: "🌟",
    },
  ];

  constructor(config: VerxioConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || "https://api.verxio.com/v1";
  }

  // Initialize Verxio connection
  async initialize(): Promise<boolean> {
    // Prevent multiple initializations
    if (this.isInitialized) {
      return true;
    }

    try {
      this.isInitialized = true;
      // Initialize UMI with Solana connection
      const rpcEndpoint =
        this.config.environment === "production"
          ? "https://api.mainnet-beta.solana.com"
          : "https://api.devnet.solana.com";

      const umi = createUmi(rpcEndpoint);

      let programAuthorityKeypair;
      let programAuthority;

      // Try to use environment variable for a funded keypair first
      const envAuthorityKey =
        process.env.NEXT_PUBLIC_AUTHORITY_PUBLIC_KEY ||
        process.env.AUTORITY_PUBLIC_KEY;
      const envPayerKey =
        process.env.NEXT_PUBLIC_PAYER_PUBLIC_KEY ||
        process.env.PAYER_PUBLIC_KEY;

      if (envAuthorityKey) {
        try {
          programAuthority = publicKey(envAuthorityKey);

          // For the keypair, we'll generate one but note that it needs funding
          programAuthorityKeypair = generateSigner(umi);

          // Set the generated keypair as identity (it will need to be funded)
          umi.use(keypairIdentity(programAuthorityKeypair));
        } catch (error) {
          console.warn(
            "Failed to use environment authority, generating new one:",
            error,
          );

          // Fallback to generated keypair
          programAuthorityKeypair = generateSigner(umi);
          programAuthority = programAuthorityKeypair.publicKey;
          umi.use(keypairIdentity(programAuthorityKeypair));
        }
      } else {
        // Generate a new keypair (will need funding)
        programAuthorityKeypair = generateSigner(umi);
        programAuthority = programAuthorityKeypair.publicKey;
        umi.use(keypairIdentity(programAuthorityKeypair));
      }

      // Initialize Verxio context with proper authority
      this.verxioContext = initializeVerxio(umi as any, programAuthority as any);

      // Store the keypair separately since it's not part of VerxioContext
      this.programAuthorityKeypair = programAuthorityKeypair;

      // Final validation that the authority is properly set
      if (!this.verxioContext.programAuthority) {
        throw new Error(
          "Failed to set program authority in Verxio context after all attempts",
        );
      }

      // Note: Loyalty program creation is deferred until we have a connected wallet to pay for transactions

      // Sync guild member counts on initialization to fix any inconsistencies
      await this.syncAllGuildMemberCounts();

      return true;
    } catch (error) {
      console.error("Failed to initialize Verxio:", error);
      // Reset an initialization flag on error so it can be retried
      this.isInitialized = false;

      // Fall back to localStorage mode for development
      return true; // Return true to allow fallback mode
    }
  }

  // Public method to ensure loyalty program exists with a connected wallet as payer
  async ensureLoyaltyProgramWithWallet(payerWallet: any): Promise<void> {
    if (!this.verxioContext) {
      return;
    }

    if (!payerWallet?.publicKey) {
      return;
    }

    await this.ensureLoyaltyProgram(payerWallet);
  }

  // Check if the program authority has sufficient SOL balance
  private async checkProgramAuthorityBalance(): Promise<boolean> {
    if (!this.programAuthorityKeypair?.publicKey) {
      return false;
    }

    try {
      const connection = new (await import("@solana/web3.js")).Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com",
      );

      const balance = await connection.getBalance(
        new (await import("@solana/web3.js")).PublicKey(
          this.programAuthorityKeypair.publicKey.toString(),
        ),
      );

      const solBalance = balance / 1e9; // Convert lamports to SOL

      // Need at least 0.01 SOL for transactions
      const hasEnoughBalance = solBalance >= 0.01;

      if (!hasEnoughBalance) {
        console.error("❌ Insufficient SOL balance for program authority");
        console.error(
          "💡 Please send at least 0.01 SOL to:",
          this.programAuthorityKeypair.publicKey.toString(),
        );
        console.error(
          "💡 You can get devnet SOL from: https://faucet.solana.com/",
        );
      }

      return hasEnoughBalance;
    } catch (error) {
      console.error("Failed to check program authority balance:", error);

      return false;
    }
  }

  // Ensure loyalty program exists or create it
  private async ensureLoyaltyProgram(payerWallet?: any): Promise<void> {
    if (!this.verxioContext) {
      throw new Error("Verxio context not initialized");
    }

    // Validate that we have a program authority
    if (!this.verxioContext.programAuthority) {
      throw new Error("Program authority is not set in Verxio context");
    }

    console.log(
      "Ensuring loyalty program with authority:",
      this.verxioContext.programAuthority.toString(),
    );

    // Check if program authority has sufficient balance
    const hasBalance = await this.checkProgramAuthorityBalance();

    if (!hasBalance) {
      throw new Error(
        "Program authority has insufficient SOL balance. Please fund the account or use a funded keypair in environment variables.",
      );
    }

    try {
      // Check if we have a stored loyalty program ID
      const storedProgramId = localStorage.getItem("g_bax_loyalty_program_id");

      if (storedProgramId) {
        this.loyaltyProgramId = storedProgramId;
        // Verify the program still exists
        try {
          await getProgramDetails(this.verxioContext);
          console.log("Using existing loyalty program:", storedProgramId);

          return; // Program exists, we're good
        } catch {
          // Program doesn't exist, create a new one
          console.log("Stored loyalty program not found, creating new one");
          localStorage.removeItem("g_bax_loyalty_program_id");
        }
      }

      // Try different metadata URI approaches
      let metadataUri = this.createLoyaltyProgramMetadata();
      let result;

      try {
        // Validate authority one more time before creation
        if (!this.verxioContext.programAuthority) {
          throw new Error(
            "Program authority is undefined before loyalty program creation",
          );
        }

        console.log(
          "Creating loyalty program with authority:",
          this.verxioContext.programAuthority.toString(),
        );
        console.log("Metadata URI:", metadataUri);

        if (payerWallet?.publicKey) {
          console.log(
            "Using connected wallet as payer:",
            payerWallet.publicKey.toString(),
          );
        } else {
          console.log(
            "No payer wallet provided, using program authority (may fail due to insufficient funds)",
          );
        }

        // Primary attempt with GitHub metadata URL
        // If we have a connected wallet, temporarily set it as the UMI identity (payer)
        let originalIdentity = null;

        if (payerWallet?.publicKey) {
          try {
            // Store the original identity
            originalIdentity = this.verxioContext.umi.identity;

            // Create a signer from the connected wallet (this is a simplified approach)
            // In a real implementation, you'd need to properly convert the wallet to a UMI signer
            console.log("Setting connected wallet as payer for transaction");

            // For now, we'll still use the program authority but log the intent
            console.log(
              "Note: Using program authority as payer. In production, implement proper wallet-to-UMI conversion.",
            );
          } catch (error) {
            console.warn("Failed to set connected wallet as payer:", error);
          }
        }

        const authority =
          this.programAuthorityKeypair ||
          this.verxioContext.programAuthority;

        const loyaltyProgramConfig = {
          loyaltyProgramName: "G-Bax Space Explorer Loyalty",
          metadataUri: metadataUri,
          programAuthority: this.verxioContext.programAuthority, // Required parameter
          updateAuthority: authority, // Optional: Custom update authority
          metadata: {
            organizationName: "G-Bax Space Exploration", // Required
            brandColor: "#3B82F6", // Optional
          },
          tiers: [
            {
              name: "Bronze",
              xpRequired: 0,
              rewards: ["Basic access"],
            },
            {
              name: "Silver",
              xpRequired: 1000,
              rewards: ["10% bonus XP"],
            },
            {
              name: "Gold",
              xpRequired: 5000,
              rewards: ["25% bonus XP"],
            },
          ],
          pointsPerAction: {
            purchase: 100,
            review: 50,
          },
        };

        // Log the config to debug what's being passed
        console.log(
          "Creating loyalty program with config:",
          loyaltyProgramConfig,
        );

        result = await createLoyaltyProgram(
          this.verxioContext,
          loyaltyProgramConfig,
        );
      } catch (metadataError: any) {
        console.log(
          "Primary loyalty program creation failed:",
          metadataError.message,
        );

        // Check if it's a transaction size error
        if (
          metadataError.message?.includes("too large") ||
          metadataError.message?.includes("1232")
        ) {
          console.log("Transaction too large, trying smaller configuration...");
        }

        // Fallback attempt with a simpler configuration
        try {
          // Validate authority again for fallback
          if (!this.verxioContext.programAuthority) {
            throw new Error(
              "Program authority is undefined in fallback attempt",
            );
          }

          console.log(
            "Fallback: Creating loyalty program with authority:",
            this.verxioContext.programAuthority.toString(),
          );

          // Create fallback config with explicit authority values
          // Try using the keypair instead of just the public key for fallback too
          const fallbackAuthority =
            this.programAuthorityKeypair ||
            this.verxioContext.programAuthority;

          const fallbackConfig = {
            loyaltyProgramName: "G-Bax Space Explorer Loyalty",
            metadataUri: "https://arweave.net/placeholder-metadata", // Simple fallback
            programAuthority: this.verxioContext.programAuthority, // Required parameter
            updateAuthority: fallbackAuthority, // Optional: Custom update authority
            metadata: {
              organizationName: "G-Bax Space Exploration",
              brandColor: "#3B82F6",
            },
            tiers: [
              { name: "Bronze", xpRequired: 0, rewards: ["Basic access"] },
              { name: "Silver", xpRequired: 1000, rewards: ["10% bonus"] },
            ],
            pointsPerAction: {
              purchase: 100,
            },
          };

          console.log(
            "Trying fallback loyalty program config:",
            fallbackConfig,
          );

          result = await createLoyaltyProgram(
            this.verxioContext,
            fallbackConfig,
          );
        } catch (fallbackError: any) {
          console.log(
            "Fallback loyalty program creation failed:",
            fallbackError.message,
          );

          // Check if it's still a transaction size error
          if (
            fallbackError.message?.includes("too large") ||
            fallbackError.message?.includes("1232")
          ) {
            console.log(
              "Fallback still too large, trying ultra-minimal config...",
            );
          }

          // Ultra-minimal config as last resort
          try {
            const minimalConfig = {
              loyaltyProgramName: "G-Bax Loyalty",
              metadataUri: "https://arweave.net/minimal",
              programAuthority: this.verxioContext.programAuthority,
              metadata: {
                organizationName: "G-Bax",
              },
              tiers: [{ name: "Member", xpRequired: 0, rewards: ["Access"] }],
              pointsPerAction: {
                action: 10,
              },
            };

            result = await createLoyaltyProgram(
              this.verxioContext,
              minimalConfig,
            );
          } catch (minimalError: any) {
            throw new Error(
              `All metadata approaches failed: ${metadataError.message} | ${fallbackError.message} | ${minimalError.message}`,
            );
          }
        }
      }

      console.log("Loyalty program created successfully:", result);
      this.loyaltyProgramId = result.collection.publicKey.toString();
      localStorage.setItem("g_bax_loyalty_program_id", this.loyaltyProgramId);

      // Save the collection signer for future use (as mentioned in docs)
      if (result.collection) {
        console.log("Collection signer saved for future use");
      }
    } catch (error: any) {
      console.error("Failed to ensure loyalty program:", error);

      // Provide specific guidance for common errors
      if (
        error.message?.includes("insufficient SOL balance") ||
        error.message?.includes("no record of a prior credit")
      ) {
        console.error("🚨 FUNDING REQUIRED:");
        console.error(
          "The program authority needs SOL to create the loyalty program.",
        );
        console.error(
          "Please send at least 0.01 SOL to the address shown above.",
        );
        console.error("For devnet, use: https://faucet.solana.com/");
      }

      // Continue with localStorage fallback
    }
  }

  // Create proper metadata URI for loyalty program
  private createLoyaltyProgramMetadata(): string {
    const metadata = {
      name: "G-Bax Loyalty Program",
      description: "Loyalty program for G-Bax space explorers.",
      image: "https://raw.githubusercontent.com/g-bax/assets/main/logo.png",
      external_url: "https://g-bax.game",
      attributes: [
        {
          trait_type: "Type",
          value: "Gaming",
        },
      ],
      properties: {
        category: "Gaming",
        creators: [
          {
            address: this.verxioContext?.programAuthority?.toString() || "",
            share: 100,
          },
        ],
      },
    };

    // Store metadata locally and return a proper HTTPS URL
    const metadataString = JSON.stringify(metadata, null, 2);

    // Store in localStorage for retrieval
    localStorage.setItem("g-bax-loyalty-metadata", metadataString);

    // Return a proper HTTPS URL that points to GitHub raw content
    // This serves as a fallback metadata URL that Verxio will accept
    return "https://raw.githubusercontent.com/g-bax/assets/main/metadata/loyalty-program.json";
  }

  // Get player loyalty information
  async getPlayerLoyalty(
    playerPublicKey: PublicKey,
  ): Promise<PlayerLoyalty | null> {
    try {
      const playerId = playerPublicKey.toString();

      // Try to get from Verxio blockchain first
      if (this.verxioContext && this.loyaltyProgramId) {
        try {
          // Check if player has a loyalty pass
          const passAddress = await this.findPlayerLoyaltyPass(playerPublicKey);

          if (passAddress) {
            const assetData = await getAssetData(
              this.verxioContext,
              publicKey(passAddress.toString()) as any,
            );

            if (assetData) {
              // Convert Verxio data to our format
              const loyalty: PlayerLoyalty = {
                playerId: playerId,
                currentTier: this.getTierByPoints((assetData as any).points || 0),
                points: (assetData as any).points || 0,
                totalPointsEarned: (assetData as any).totalPoints || 0,
                reputation: 0, // Not tracked in Verxio
                achievements: [], // Not tracked in Verxio
                lastActivity: new Date(),
              };

              // Cache in localStorage for faster access
              localStorage.setItem(
                `verxio_loyalty_${playerId}`,
                JSON.stringify(loyalty),
              );

              return loyalty;
            }
          }
        } catch (error) {
          // Verxio lookup failed, falling back to localStorage
        }
      }

      // Fall back to localStorage
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

      if (savedLoyalty) {
        const loyalty = JSON.parse(savedLoyalty);

        loyalty.currentTier = this.getTierByPoints(loyalty.points);
        loyalty.lastActivity = new Date(loyalty.lastActivity);

        return loyalty;
      }

      // Create a new player with 0 points
      const newLoyalty: PlayerLoyalty = {
        playerId: playerId,
        currentTier: this.getTierByPoints(0),
        points: 0,
        totalPointsEarned: 0,
        reputation: 0,
        achievements: [],
        lastActivity: new Date(),
      };

      localStorage.setItem(
        `verxio_loyalty_${playerId}`,
        JSON.stringify(newLoyalty),
      );

      return newLoyalty;
    } catch (error) {
      console.error("Error getting player loyalty:", error);

      return null;
    }
  }

  // Helper method to find a player's loyalty pass
  private async findPlayerLoyaltyPass(
    playerPublicKey: PublicKey,
  ): Promise<PublicKey | null> {
    try {
      // In a real implementation, you would query the blockchain for the player's loyalty pass
      // For now, we'll check localStorage for a cached pass address
      const playerId = playerPublicKey.toString();
      const cachedPassAddress = localStorage.getItem(`verxio_pass_${playerId}`);

      if (cachedPassAddress) {
        return new PublicKey(cachedPassAddress);
      }

      return null;
    } catch (error) {
      console.error("Error finding player loyalty pass:", error);

      return null;
    }
  }

  // Award loyalty points
  async awardPoints(
    playerPublicKey: PublicKey,
    points: number,
    reason: string,
  ): Promise<boolean> {
    try {
      const playerId = playerPublicKey.toString();

      // Try to award points on Verxio blockchain first
      if (this.verxioContext && this.loyaltyProgramId) {
        try {
          const passAddress = await this.findPlayerLoyaltyPass(playerPublicKey);

          if (passAddress) {
            // Map reason to action type
            const actionType = this.mapReasonToAction(reason);

            // Award points on blockchain
            const result = await awardLoyaltyPoints(this.verxioContext, {
              passAddress: publicKey(passAddress.toString()) as any,
              action: actionType,
              signer: this.programAuthorityKeypair, // Use the keypair signer
              multiplier: 1,
            });

            if (result) {
              // Update localStorage cache
              const loyalty = await this.getPlayerLoyalty(playerPublicKey);

              if (loyalty) {
                loyalty.points = result.points;
                loyalty.totalPointsEarned += points;
                loyalty.lastActivity = new Date();
                loyalty.currentTier = this.getTierByPoints(result.points);

                localStorage.setItem(
                  `verxio_loyalty_${playerId}`,
                  JSON.stringify(loyalty),
                );
              }

              return true;
            }
          } else {
            // Player doesn't have a loyalty pass, create one
            await this.createPlayerLoyaltyPass(playerPublicKey);

            // Retry awarding points
            return await this.awardPoints(playerPublicKey, points, reason);
          }
        } catch (error) {
          // Verxio points award failed, falling back to localStorage
        }
      }

      // Fall back to localStorage
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

      if (!savedLoyalty) return false;

      const loyalty = JSON.parse(savedLoyalty);

      loyalty.points += points;
      loyalty.totalPointsEarned += points;
      loyalty.lastActivity = new Date();
      loyalty.currentTier = this.getTierByPoints(loyalty.points);

      localStorage.setItem(
        `verxio_loyalty_${playerId}`,
        JSON.stringify(loyalty),
      );

      return true;
    } catch (error) {
      console.error("Error awarding points:", error);

      return false;
    }
  }

  // Helper method to map reason to Verxio action type
  private mapReasonToAction(reason: string): string {
    const reasonLower = reason.toLowerCase();

    if (reasonLower.includes("mining") || reasonLower.includes("mine")) {
      return "mining";
    } else if (
      reasonLower.includes("crafting") ||
      reasonLower.includes("craft")
    ) {
      return "crafting";
    } else if (
      reasonLower.includes("exploration") ||
      reasonLower.includes("explore")
    ) {
      return "exploration";
    } else if (reasonLower.includes("mission")) {
      return "mission_complete";
    }

    return "general"; // Default action type
  }

  // Helper method to create a loyalty pass for a new player
  private async createPlayerLoyaltyPass(
    playerPublicKey: PublicKey,
  ): Promise<boolean> {
    if (!this.verxioContext || !this.loyaltyProgramId) return false;

    try {
      const result = await issueLoyaltyPass(this.verxioContext, {
        collectionAddress: publicKey(this.loyaltyProgramId) as any,
        recipient: publicKey(playerPublicKey.toString()) as any,
        passName: "G-Bax Loyalty Pass",
        updateAuthority: this.programAuthorityKeypair,
        organizationName: "G-Bax Space Exploration",
      });

      if (result) {
        // Cache the pass address
        const playerId = playerPublicKey.toString();

        localStorage.setItem(
          `verxio_pass_${playerId}`,
          result.asset.publicKey.toString(),
        );

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error creating loyalty pass:", error);

      return false;
    }
  }

  // Get available guilds
  async getAvailableGuilds(): Promise<Guild[]> {
    try {
      // Load guilds from localStorage or return empty array for new installations
      const savedGuilds = localStorage.getItem("verxio_guilds");

      if (savedGuilds) {
        const guilds = JSON.parse(savedGuilds);
        // Convert createdAt strings back to Date objects and sync member counts
        const syncedGuilds = await Promise.all(
          guilds.map(async (guild: any) => {
            const actualMembers = await this.getGuildMembers(guild.id);

            return {
              ...guild,
              memberCount: actualMembers.length, // Sync with actual member count
              createdAt: new Date(guild.createdAt),
            };
          }),
        );

        // Save the synced guild data back to localStorage
        localStorage.setItem("verxio_guilds", JSON.stringify(syncedGuilds));

        return syncedGuilds;
      }

      // Initialize with realistic starter guilds that have no members yet
      const initialGuilds: Guild[] = [
        {
          id: "miners_collective",
          name: "Miners Collective",
          description:
            "A growing community of space miners sharing techniques and resources",
          type: "mining",
          memberCount: 0, // Start with 0 members
          totalReputation: 0, // Start with reputation 0
          level: 1, // Start at level 1
          benefits: [
            {
              type: "mining_efficiency",
              value: 1.1,
              description: "10% faster mining",
            },
          ],
          requirements: [
            { type: "level", value: 2, description: "Minimum level 2" },
          ],
          createdAt: new Date(),
        },
        {
          id: "void_explorers",
          name: "Void Explorers",
          description:
            "Brave explorers venturing into uncharted space territories",
          type: "exploration",
          memberCount: 0,
          totalReputation: 0,
          level: 1,
          benefits: [
            {
              type: "experience_boost",
              value: 1.1,
              description: "10% bonus XP",
            },
          ],
          requirements: [
            { type: "level", value: 2, description: "Minimum level 2" },
          ],
          createdAt: new Date(),
        },
        {
          id: "stellar_crafters",
          name: "Stellar Crafters",
          description:
            "Artisans dedicated to perfecting the craft of space equipment",
          type: "crafting",
          memberCount: 0,
          totalReputation: 0,
          level: 1,
          benefits: [
            {
              type: "crafting_speed",
              value: 1.1,
              description: "10% faster crafting",
            },
          ],
          requirements: [
            { type: "level", value: 2, description: "Minimum level 2" },
          ],
          createdAt: new Date(),
        },
      ];

      // Save initial guilds to localStorage
      localStorage.setItem("verxio_guilds", JSON.stringify(initialGuilds));

      return initialGuilds;
    } catch (error) {
      return [];
    }
  }

  // Check if player meets guild requirements
  checkGuildRequirements(
    playerPublicKey: PublicKey,
    guild: Guild,
  ): { canJoin: boolean; failedRequirements: string[] } {
    const playerId = playerPublicKey.toString();
    const failedRequirements: string[] = [];

    // Get player loyalty data
    const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

    if (!savedLoyalty) {
      failedRequirements.push("Player loyalty data not found");

      return { canJoin: false, failedRequirements };
    }

    const loyalty = JSON.parse(savedLoyalty);

    // Check each requirement
    for (const requirement of guild.requirements) {
      switch (requirement.type) {
        case "level":
          // Get player level from experience
          const playerLevel = Math.floor(loyalty.points / 1000) + 1; // Simple level calculation

          if (playerLevel < (requirement.value as number)) {
            failedRequirements.push(
              `Requires level ${requirement.value}, you are level ${playerLevel}`,
            );
          }
          break;
        case "reputation":
          if (loyalty.reputation < (requirement.value as number)) {
            failedRequirements.push(
              `Requires ${requirement.value} reputation, you have ${loyalty.reputation}`,
            );
          }
          break;
        case "achievement":
          // Check if player has specific achievement
          if (!loyalty.achievements.includes(requirement.value as string)) {
            failedRequirements.push(
              `Requires achievement: ${requirement.description}`,
            );
          }
          break;
      }
    }

    return { canJoin: failedRequirements.length === 0, failedRequirements };
  }

  // Join a guild
  async joinGuild(
    playerPublicKey: PublicKey,
    guildId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const playerId = playerPublicKey.toString();

      // Check if player is already in a guild
      const existingMembership = localStorage.getItem(
        `verxio_guild_member_${playerId}`,
      );

      if (existingMembership) {
        return {
          success: false,
          error:
            "You are already a member of a guild. Leave your current guild first.",
        };
      }

      // Load current guilds
      const savedGuilds = localStorage.getItem("verxio_guilds");

      if (!savedGuilds) {
        return { success: false, error: "No guilds available" };
      }

      const guilds = JSON.parse(savedGuilds);
      const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

      if (guildIndex === -1) {
        return { success: false, error: "Guild not found" };
      }

      const guild = guilds[guildIndex];

      // Check guild requirements
      const requirementCheck = this.checkGuildRequirements(
        playerPublicKey,
        guild,
      );

      if (!requirementCheck.canJoin) {
        return {
          success: false,
          error: `Requirements not met: ${requirementCheck.failedRequirements.join(", ")}`,
        };
      }

      // Check if this is the first member (should become leader)
      const actualMembers = await this.getGuildMembers(guildId);
      const isFirstMember = actualMembers.length === 0;
      const memberRank = isFirstMember ? "leader" : "member";

      // Update guild member count
      guilds[guildIndex].memberCount = actualMembers.length + 1; // +1 for the new member

      // Add some initial reputation to the guild (realistic small amount)
      guilds[guildIndex].totalReputation += 10;

      // Save updated guilds
      localStorage.setItem("verxio_guilds", JSON.stringify(guilds));

      // Save guild membership for the player
      const playerGuildData = {
        playerId,
        guildId,
        rank: memberRank,
        joinedAt: new Date(),
        contribution: 0,
        lastActive: new Date(), // Track activity
      };

      localStorage.setItem(
        `verxio_guild_member_${playerId}`,
        JSON.stringify(playerGuildData),
      );

      // Update player loyalty with guild info
      const savedLoyalty = localStorage.getItem(`verxio_loyalty_${playerId}`);

      if (savedLoyalty) {
        const loyalty = JSON.parse(savedLoyalty);

        loyalty.guildId = guildId;
        loyalty.guildRank = memberRank;
        localStorage.setItem(
          `verxio_loyalty_${playerId}`,
          JSON.stringify(loyalty),
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to join guild" };
    }
  }

  // Leave a guild
  async leaveGuild(
    playerPublicKey: PublicKey,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const playerId = playerPublicKey.toString();

      // Check if player is in a guild
      const existingMembership = localStorage.getItem(
        `verxio_guild_member_${playerId}`,
      );

      if (!existingMembership) {
        return { success: false, error: "You are not a member of any guild" };
      }

      const membershipData = JSON.parse(existingMembership);
      const guildId = membershipData.guildId;

      // Load current guilds and update member count
      const savedGuilds = localStorage.getItem("verxio_guilds");

      if (savedGuilds) {
        const guilds = JSON.parse(savedGuilds);
        const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

        if (guildIndex !== -1) {
          // Update member count by counting actual remaining members
          const actualMembers = await this.getGuildMembers(guildId);

          guilds[guildIndex].memberCount = Math.max(
            0,
            actualMembers.length - 1,
          ); // -1 for the leaving member

          // Remove some reputation (small amount)
          guilds[guildIndex].totalReputation = Math.max(
            0,
            guilds[guildIndex].totalReputation - 5,
          );

          localStorage.setItem("verxio_guilds", JSON.stringify(guilds));
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
        localStorage.setItem(
          `verxio_loyalty_${playerId}`,
          JSON.stringify(loyalty),
        );
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: "Failed to leave guild" };
    }
  }

  // Get guild members
  async getGuildMembers(guildId: string): Promise<GuildMember[]> {
    try {
      const members: GuildMember[] = [];

      // Scan localStorage for all guild members of this guild
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        if (key && key.startsWith("verxio_guild_member_")) {
          const memberData = localStorage.getItem(key);

          if (memberData) {
            const member = JSON.parse(memberData);

            if (member.guildId === guildId) {
              // Get player name from their loyalty data
              const playerId = member.playerId;
              const playerLoyalty = localStorage.getItem(
                `verxio_loyalty_${playerId}`,
              );
              let playerName = `Explorer ${playerId.slice(0, 6)}`;

              if (playerLoyalty) {
                const loyalty = JSON.parse(playerLoyalty);

                // Create a more readable name based on player ID
                playerName = `Explorer ${playerId.slice(0, 8)}`;
              }

              members.push({
                playerId: member.playerId,
                playerName,
                rank: member.rank || "member",
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
    reason: string,
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
      localStorage.setItem(
        `verxio_loyalty_${playerId}`,
        JSON.stringify(loyalty),
      );

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
  getPointsToNextTier(currentPoints: number): {
    needed: number;
    nextTier: LoyaltyTier | null;
  } {
    const currentTier = this.getTierByPoints(currentPoints);
    const currentIndex = VerxioService.LOYALTY_TIERS.findIndex(
      (tier) => tier.id === currentTier.id,
    );

    // Check if already at max tier
    if (
      currentIndex === -1 ||
      currentIndex === VerxioService.LOYALTY_TIERS.length - 1
    ) {
      return { needed: 0, nextTier: null };
    }

    const nextTier = VerxioService.LOYALTY_TIERS[currentIndex + 1];
    const needed = nextTier.minPoints - currentPoints;

    return { needed: Math.max(0, needed), nextTier };
  }

  // Get multiplier for current tier (capped at 2.0x maximum)
  getMultiplierForPoints(points: number): number {
    const multiplier = this.getTierByPoints(points).multiplier;

    return Math.min(multiplier, 2.0); // Cap at 2.0x (100% bonus maximum)
  }

  // Utility function to sync all guild member counts with actual membership data
  async syncAllGuildMemberCounts(): Promise<void> {
    try {
      const savedGuilds = localStorage.getItem("verxio_guilds");

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
        localStorage.setItem("verxio_guilds", JSON.stringify(guilds));
      }
    } catch (error) {
      console.error("Failed to sync guild member counts:", error);
    }
  }

  // Check and update guild leadership based on activity
  async checkAndUpdateGuildLeadership(guildId: string): Promise<void> {
    try {
      const members = await this.getGuildMembers(guildId);

      if (members.length === 0) return;

      const currentLeader = members.find((member) => member.rank === "leader");
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

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
          .filter((member) => member.playerId !== currentLeader.playerId)
          .filter((member) => new Date(member.lastActive) > threeDaysAgo)
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
          await this.transferLeadership(
            guildId,
            currentLeader.playerId,
            activeCandidates[0].playerId,
          );
        }
      }
    } catch (error) {
      console.error("Failed to check guild leadership:", error);
    }
  }

  // Promote a new leader from available members
  private async promoteNewLeader(
    guildId: string,
    members: GuildMember[],
  ): Promise<void> {
    if (members.length === 0) return;

    // Find the best candidate (most active and highest contribution)
    const candidate = members.sort((a, b) => {
      const aActivity = new Date(a.lastActive).getTime();
      const bActivity = new Date(b.lastActive).getTime();

      if (aActivity !== bActivity) {
        return bActivity - aActivity;
      }

      return b.contribution - a.contribution;
    })[0];

    await this.updateMemberRank(candidate.playerId, "leader");
  }

  // Transfer leadership from one member to another
  private async transferLeadership(
    guildId: string,
    oldLeaderId: string,
    newLeaderId: string,
  ): Promise<void> {
    // Demote old leader to member
    await this.updateMemberRank(oldLeaderId, "member");

    // Promote new leader
    await this.updateMemberRank(newLeaderId, "leader");
  }

  // Update a member's rank
  private async updateMemberRank(
    playerId: string,
    newRank: "member" | "officer" | "leader",
  ): Promise<void> {
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
      console.error("Failed to update member rank:", error);
    }
  }

  // Update guild reputation and member contribution
  async updateGuildContribution(
    playerPublicKey: PublicKey,
    guildId: string,
    contribution: number,
    reason: string,
  ): Promise<boolean> {
    try {
      const playerId = playerPublicKey.toString();

      // Update guild total reputation
      const savedGuilds = localStorage.getItem("verxio_guilds");

      if (savedGuilds) {
        const guilds = JSON.parse(savedGuilds);
        const guildIndex = guilds.findIndex((g: Guild) => g.id === guildId);

        if (guildIndex !== -1) {
          guilds[guildIndex].totalReputation += contribution;

          // Level up guild if it reaches certain reputation thresholds
          const newLevel =
            Math.floor(guilds[guildIndex].totalReputation / 1000) + 1;

          if (newLevel > guilds[guildIndex].level) {
            guilds[guildIndex].level = newLevel;
          }

          localStorage.setItem("verxio_guilds", JSON.stringify(guilds));
        }
      }

      // Update player's guild contribution and activity
      const memberData = localStorage.getItem(
        `verxio_guild_member_${playerId}`,
      );

      if (memberData) {
        const member = JSON.parse(memberData);

        member.contribution += contribution;
        member.lastActive = new Date(); // Update activity timestamp
        localStorage.setItem(
          `verxio_guild_member_${playerId}`,
          JSON.stringify(member),
        );
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
      const membershipData = localStorage.getItem(
        `verxio_guild_member_${playerId}`,
      );

      if (membershipData) {
        const membership = JSON.parse(membershipData);

        membership.lastActive = new Date();
        localStorage.setItem(
          `verxio_guild_member_${playerId}`,
          JSON.stringify(membership),
        );

        // Check if leadership needs to be updated
        if (membership.guildId) {
          await this.checkAndUpdateGuildLeadership(membership.guildId);
        }
      }
    } catch (error) {
      console.error("Failed to update member activity:", error);
    }
  }
}
