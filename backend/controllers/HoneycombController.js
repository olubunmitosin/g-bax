const { Honeycomb } = require('@honeycomb-protocol/hive-control');
const createEdgeClient = require('@honeycomb-protocol/edge-client').default;
const { sendTransactionForTests } = require('@honeycomb-protocol/edge-client/client/helpers');
const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const web3 = require('@solana/web3.js');

class HoneycombController {
  constructor() {
    this.config = {
      rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://rpc.test.honeycombprotocol.com',
      environment: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'honeynet',
      projectAddress: process.env.NEXT_PUBLIC_HONEYCOMB_PROJECT_ADDRESS,
      edgeApiUrl: process.env.NEXT_PUBLIC_HONEYCOMB_EDGE_API_URL || 'https://edge.test.honeycombprotocol.com'
    };

    // Initialize admin public key from environment
    this.adminPublicKey = new PublicKey(
      process.env.NEXT_PUBLIC_AUTHORITY_PUBLIC_KEY ||
      process.env.AUTORITY_PUBLIC_KEY || ''
    );

    // Initialize signer keypair from secret key
    this.signer = null;
    try {
      const secretKeyEnv = process.env.NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY;

      if (secretKeyEnv) {
        // Load from environment variable (JSON array format)
        const secretKeyData = JSON.parse(secretKeyEnv);
        this.signer = Keypair.fromSecretKey(Uint8Array.from(secretKeyData));
        console.log('Admin signer initialized successfully');
      } else {
        console.warn('No admin private key found. Transaction signing will not be available.');
        console.warn('Please set NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY in your environment.');
      }
    } catch (error) {
      console.error('Failed to initialize admin signer:', error.message);
      this.signer = null;
    }

    this.connection = new Connection(this.config.rpcUrl, 'confirmed');
    this.edgeClient = createEdgeClient(this.config.edgeApiUrl, true);
    this.honeycomb = new Honeycomb(this.connection);

    // Cache for profiles
    this.profileCache = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Helper method to sign and send transactions using Honeycomb
   */
  async signAndSendTransaction(txResponse, additionalSigners = []) {
    try {
      if (!this.signer) {
        throw new Error('No signer available. Please configure NEXT_PUBLIC_HONEYCOMB_ADMIN_PRIVATE_KEY.');
      }

      if (!txResponse) {
        throw new Error('Transaction response is required');
      }

      // Prepare signers array
      const signers = [this.signer, ...additionalSigners];

      const response = await sendTransactionForTests(
        this.edgeClient,
        {
          transaction: txResponse.transaction,
          blockhash: txResponse.blockhash,
          lastValidBlockHeight: txResponse.lastValidBlockHeight,
        },
        signers,
        {
          skipPreflight: true,
          commitment: "finalized",
        }
      );

      if (response.status !== "Success") {
        console.log("Error signing: ", response);
        return null;
      }

      return response;

    } catch (error) {
      console.error('Transaction signing/sending failed:', error);
      throw error;
    }
  }

  /**
   * Formats a profile response from Honeycomb data or creates a fallback
   */
  formatProfileResponse(user, profile, playerKey, profileData, transactionSignature = null) {
    const defaultPfp = "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg";

    if (user && profile) {
      // Format from Honeycomb data
      return {
        id: user.id,
        address: user?.address || playerKey,
        profileAddress: profile.address,
        projectAddress: profile.project,
        profileTreeAddress: profile.tree_id,
        name: profile.info.name || profileData?.name || `Explorer ${playerKey.slice(0, 8)}`,
        bio: profile.info.bio || profileData?.metadata?.bio || "Space explorer in the G-Bax universe",
        pfp: profile.info.pfp || profileData?.avatar || defaultPfp,
        experience: parseInt(profile.platformData?.xp) || 0,
        level: 1,
        credits: profile.credits || 1000,
        source: transactionSignature ? "honeycomb-backend" : "honeycomb",
        createdAt: profile.createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        transactionSignature,
        metadata: profileData?.metadata,
      };
    } else {
      return null;
    }
  }

  /**
   * Fetches user profile from Honeycomb
   */
  async fetchUserProfile(playerKey) {
    try {
      const honeycombResponse = await this.edgeClient.findUsers({
        wallets: [playerKey],
        includeProjectProfiles: [this.config.projectAddress],
      });

      const user = honeycombResponse.user && honeycombResponse.user.length > 0
        ? honeycombResponse.user[0]
        : null;
      const profile = user?.profiles?.[0] || null;

      return { user, profile };
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      return { user: null, profile: null };
    }
  }

  /**
   * Validates input parameters for profile creation
   */
  validateProfileData(profileData) {
    if (!profileData) {
      throw new Error('Profile data is required');
    }

    if (!profileData.name || typeof profileData.name !== 'string') {
      throw new Error('Profile name is required and must be a string');
    }

    if (profileData.name.length < 1 || profileData.name.length > 50) {
      throw new Error('Profile name must be between 1 and 50 characters');
    }

    if (profileData.avatar && typeof profileData.avatar !== 'string') {
      throw new Error('Avatar must be a string URL');
    }

    if (profileData.metadata && typeof profileData.metadata !== 'object') {
      throw new Error('Metadata must be an object');
    }
  }

  /**
   * Validates player public key
   */
  validatePlayer(player) {
    if (!player) {
      throw new Error('Player public key is required');
    }

    try {
      // Convert string to PublicKey if needed
      if (typeof player === 'string') {
        return new PublicKey(player);
      }
      return player;
    } catch (error) {
      throw new Error('Invalid player public key format');
    }
  }

  /**
   * Creates a player profile using Honeycomb Protocol
   */
  async createProfile(req, res) {
    try {
      const { player, profileData } = req.body;

      // Validate inputs
      const validatedPlayer = this.validatePlayer(player);
      this.validateProfileData(profileData);

      // Try to create profile using Honeycomb edge client
      let honeycombProfile = null;

      // Create user with profile transaction
      const txResponse = await this.edgeClient.createNewUserWithProfileTransaction({
        project: this.config.projectAddress,
        wallet: validatedPlayer,
        payer: this.adminPublicKey.toString(),
        profileIdentity: "main",
        userInfo: {
          name: profileData.name,
          bio: profileData.metadata?.bio || "Space explorer in the G-Bax universe",
          pfp: profileData.avatar || "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
        },
      });

      // Sign and send the transaction
      const transactionResult = await this.signAndSendTransaction(txResponse.createNewUserWithProfileTransaction);
      if (transactionResult?.signature) {
        // Fetch the newly created user
        const { user, profile } = await this.fetchUserProfile(validatedPlayer);
        honeycombProfile = this.formatProfileResponse(
          user,
          profile,
          validatedPlayer.toString(),
          profileData,
          transactionResult.signature
        );

        res.status(201).json({
          success: true,
          message: 'Profile created successfully',
          profile: honeycombProfile
        });

      } else {
        res.status(500).json({
          success: false,
          message: 'Transaction failed'
        });
      }

    } catch (error) {
      console.error('Profile creation failed:', error);

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create profile',
      });
    }
  }

  /**
   * Gets player profile information
   */
  async getProfile(req, res) {
    try {
      const { player } = req.params;
      const validatedPlayer = this.validatePlayer(player);

      // Fetch from Honeycomb API
      const { user, profile } = await this.fetchUserProfile(validatedPlayer);

      if (user && profile) {
        const formattedProfile = this.formatProfileResponse(
          user,
          profile,
          validatedPlayer.toString()
        );

        res.status(200).json({
          success: true,
          message: 'Profile found',
          profile: formattedProfile
        });
        return;
      }

      res.status(404).json({
        success: false,
        message: 'Profile not found'
      });

    } catch (error) {
      console.error('Profile fetch failed:', error);

      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Checks Honeycomb service health
   */
  async healthCheck(_req, res) {
    try {
      const isConnected = await this.connection.getSlot() > 0;
      const networkInfo = {
        cluster: this.config.environment,
        slot: await this.connection.getSlot(),
      };

      res.status(200).json({
        success: true,
        message: 'Honeycomb service is healthy',
        isConnected,
        networkInfo,
        config: {
          environment: this.config.environment,
          projectAddress: this.config.projectAddress,
          hasEdgeClient: !!this.edgeClient
        }
      });

    } catch (error) {
      console.error('Health check failed:', error);

      res.status(503).json({
        success: false,
        message: 'Honeycomb service is unhealthy',
        error: error.message
      });
    }
  }
}

module.exports = HoneycombController;
