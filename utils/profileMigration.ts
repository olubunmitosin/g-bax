import { PublicKey } from "@solana/web3.js";
import { backendHoneycombService, BackendProfile } from "../services/backendHoneycombService";

export interface MigrationResult {
  success: boolean;
  profile?: BackendProfile;
  error?: string;
  source: 'backend' | 'localStorage' | 'created';
}

export class ProfileMigrationManager {
  /**
   * Gets a player profile, trying backend first, then localStorage, then creating new
   */
  static async getOrCreateProfile(
    player: PublicKey,
    defaultProfileData?: {
      name?: string;
      avatar?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<MigrationResult> {
    try {
      const playerKey = player.toString();
      const backendProfile = await backendHoneycombService.getPlayerProfile(player);

      if (backendProfile) {
        return {
          success: true,
          profile: backendProfile,
          source: 'backend'
        };
      }

      const localProfile = this.getLocalProfile(playerKey);

      if (localProfile) {
        console.log('Profile found in localStorage, migrating to backend...');
        // Try to migrate to backend
        const migratedProfile = await backendHoneycombService.migrateLocalProfile(player, localProfile);

        if (migratedProfile) {
          // Clear localStorage after successful migration
          this.clearLocalProfile(playerKey);
          console.log('Profile migrated successfully');

          return {
            success: true,
            profile: migratedProfile,
            source: 'backend'
          };
        } else {
          console.log('Migration failed, using localStorage profile');
          return {
            success: true,
            profile: this.formatLocalProfile(localProfile),
            source: 'localStorage'
          };
        }
      }

      // Step 3: Create new profile
      console.log('Creating new profile...');
      const profileData = {
        name: defaultProfileData?.name || `Explorer ${playerKey.slice(0, 8)}`,
        avatar: defaultProfileData?.avatar,
        metadata: {
          bio: "Space explorer in the G-Bax universe",
          ...defaultProfileData?.metadata,
        },
      };

      const newProfile = await backendHoneycombService.createPlayerProfile(player, profileData);

      console.log('New profile created successfully');
      return {
        success: true,
        profile: newProfile,
        source: 'created'
      };

    } catch (error) {
      console.error('Profile migration failed:', error);

      // Fallback: create local profile
      const fallbackProfile = this.createFallbackProfile(player, defaultProfileData);

      return {
        success: false,
        profile: fallbackProfile,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'localStorage'
      };
    }
  }

  /**
   * Gets profile from localStorage
   */
  private static getLocalProfile(playerKey: string): any | null {
    try {
      const blockchainKey = `honeycomb-profile-${playerKey}`;
      const stored = localStorage.getItem(blockchainKey);

      if (stored) {
        return JSON.parse(stored);
      }

      return null;
    } catch (error) {
      console.error('Failed to get local profile:', error);
      return null;
    }
  }

  /**
   * Clears profile from localStorage
   */
  private static clearLocalProfile(playerKey: string): void {
    try {
      const blockchainKey = `honeycomb-profile-${playerKey}`;
      localStorage.removeItem(blockchainKey);
      console.log('Local profile cleared');
    } catch (error) {
      console.error('Failed to clear local profile:', error);
    }
  }

  /**
   * Formats localStorage profile to match backend format
   */
  private static formatLocalProfile(localProfile: any): BackendProfile {
    return {
      id: localProfile.id || localProfile.address,
      address: localProfile.address,
      profileAddress: localProfile.profileAddress,
      projectAddress: localProfile.projectAddress,
      profileTreeAddress: localProfile.profileTreeAddress,
      name: localProfile.name,
      bio: localProfile.bio || "Space explorer in the G-Bax universe",
      pfp: localProfile.pfp || localProfile.avatar || "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
      experience: localProfile.experience || 0,
      level: localProfile.level || 1,
      credits: localProfile.credits || 100,
      source: "localStorage",
      createdAt: localProfile.createdAt || new Date().toISOString(),
      lastUpdated: localProfile.lastUpdated || new Date().toISOString(),
      transactionSignature: localProfile.transactionSignature,
      metadata: localProfile.metadata,
    };
  }

  /**
   * Creates a fallback profile when all else fails
   */
  private static createFallbackProfile(
    player: PublicKey,
    defaultProfileData?: any
  ): BackendProfile {
    const playerKey = player.toString();

    const fallbackProfile: BackendProfile = {
      id: playerKey,
      address: playerKey,
      name: defaultProfileData?.name || `Explorer ${playerKey.slice(0, 8)}`,
      bio: defaultProfileData?.metadata?.bio || "Space explorer in the G-Bax universe",
      pfp: defaultProfileData?.avatar || "https://lh3.googleusercontent.com/-Jsm7S8BHy4nOzrw2f5AryUgp9Fym2buUOkkxgNplGCddTkiKBXPLRytTMXBXwGcHuRr06EvJStmkHj-9JeTfmHsnT0prHg5Mhg",
      experience: 0,
      level: 1,
      credits: 100,
      source: "fallback",
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      metadata: defaultProfileData?.metadata,
    };

    // Save fallback to localStorage
    try {
      const blockchainKey = `honeycomb-profile-${playerKey}`;
      localStorage.setItem(blockchainKey, JSON.stringify(fallbackProfile));
    } catch (error) {
      console.error('Failed to save fallback profile:', error);
    }

    return fallbackProfile;
  }

  /**
   * Checks backend service status
   */
  static async checkBackendStatus(): Promise<{
    available: boolean;
    backendHealthy: boolean;
    honeycombHealthy: boolean;
    networkInfo?: any;
  }> {
    try {
      const status = await backendHoneycombService.getServiceStatus();

      return {
        available: true,
        ...status,
      };
    } catch (error) {
      console.error('Backend status check failed:', error);

      return {
        available: false,
        backendHealthy: false,
        honeycombHealthy: false,
      };
    }
  }

  /**
   * Forces migration of all localStorage profiles to backend
   */
  static async migrateAllLocalProfiles(): Promise<{
    migrated: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      migrated: 0,
      failed: 0,
      errors: [] as string[],
    };

    try {
      // Find all localStorage profile keys
      const keys = Object.keys(localStorage);
      const profileKeys = keys.filter(key => key.startsWith('honeycomb-profile-'));

      console.log(`Found ${profileKeys.length} local profiles to migrate`);

      for (const key of profileKeys) {
        try {
          const playerKey = key.replace('honeycomb-profile-', '');
          const player = new PublicKey(playerKey);
          const localProfile = JSON.parse(localStorage.getItem(key) || '{}');

          const migratedProfile = await backendHoneycombService.migrateLocalProfile(player, localProfile);

          if (migratedProfile) {
            localStorage.removeItem(key);
            results.migrated++;
            console.log(`Migrated profile for ${playerKey.slice(0, 8)}...`);
          } else {
            results.failed++;
            results.errors.push(`Failed to migrate profile for ${playerKey.slice(0, 8)}...`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Error migrating ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log(`Migration complete: ${results.migrated} migrated, ${results.failed} failed`);
    } catch (error) {
      console.error('Bulk migration failed:', error);
      results.errors.push(`Bulk migration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return results;
  }
}

export default ProfileMigrationManager;
