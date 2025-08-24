import { PublicKey } from "@solana/web3.js";

export interface BackendHoneycombConfig {
  backendUrl: string;
}

export interface BackendProfileData {
  name: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface BackendProfile {
  id: string | number;
  address: string;
  profileAddress?: string;
  projectAddress?: string;
  profileTreeAddress?: string;
  name: string;
  bio: string;
  pfp: string;
  experience: number;
  level: number;
  credits: number;
  reputation: number;
  source: string;
  createdAt: string;
  lastUpdated: string;
  transactionSignature?: string;
  metadata?: Record<string, any>;
}

export interface BackendResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  profile?: T;
  error?: string;
}

export class BackendHoneycombService {
  private config: BackendHoneycombConfig;

  constructor(config: BackendHoneycombConfig) {
    this.config = config;
  }

  /**
   * Makes an HTTP request to the backend API
   */
  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<BackendResponse<T>> {
    try {
      const url = `${this.config.backendUrl}${endpoint}`;

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('Backend API request failed:', error);
      throw error;
    }
  }

  /**
   * Creates a player profile using the backend API
   */
  async createPlayerProfile(
    player: PublicKey,
    profileData: BackendProfileData
  ): Promise<BackendProfile> {
    try {
      console.log('Creating profile via backend for player:', player.toString());

      const response = await this.makeRequest<BackendProfile>('/api/create-profile', {
        method: 'POST',
        body: JSON.stringify({
          player: player.toString(),
          profileData,
        }),
      });

      if (response.success && response.profile) {
        console.log('Profile created successfully via backend');
        return response.profile;
      } else {
        throw new Error(response.message || 'Failed to create profile');
      }
    } catch (error) {
      console.error('Backend profile creation failed:', error);
      throw new Error(`Failed to create player profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets a player profile using the backend API
   */
  async getPlayerProfile(player: PublicKey): Promise<BackendProfile | null> {
    try {
      console.log('Fetching profile via backend for player:', player.toString());

      const response = await this.makeRequest<BackendProfile>(`/api/profile/${player.toString()}`);

      if (response.success && response.profile) {
        console.log('Profile found via backend');
        return response.profile;
      } else {
        console.log('Profile not found via backend');
        return null;
      }
    } catch (error) {
      console.error('Backend profile fetch failed:', error);
      return null;
    }
  }

  /**
   * Updates a player profile via backend API
   * @param player - Player's public key
   * @param accessToken - Authentication token for the update
   * @param profileData - Profile information to update
   * @returns Promise<BackendProfile | null>
   */
  async updatePlayerProfile(
    player: PublicKey,
    accessToken: string,
    profileData: {
      name?: string;
      bio?: string;
      avatar?: string;
      pfp?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<BackendProfile | null> {
    try {
      const response = await this.makeRequest<BackendProfile>('/api/update-profile', {
        method: 'PUT',
        body: JSON.stringify({
          player: player.toString(),
          accessToken,
          profileData,
        }),
      });

      if (response.success && response.profile) {
        return response.profile;
      } else {
        console.log('Profile update failed via backend');
        return null;
      }
    } catch (error) {
      console.error('Failed to update player profile:', error);
      return null;
    }
  }

  /**
   * Gets all users in the project for leaderboard
   * @returns Promise<BackendProfile[]>
   */
  async getAllUsers(): Promise<BackendProfile[]> {
    try {
      const response = await this.makeRequest<any>('/api/users/all');

      if (response.success && (response as any).users) {
        return (response as any).users;
      } else {
        console.log('No users found via backend');
        return [];
      }
    } catch (error) {
      console.error('Backend users fetch failed:', error);
      return [];
    }
  }

  /**
   * Updates player game stats (credits, level, experience, reputation)
   * @param player - Player's public key
   * @param stats - Stats to update
   * @returns Promise<any>
   */
  async updatePlayerStats(
    player: PublicKey,
    stats: {
      credits?: number;
      level?: number;
      experience?: number;
      reputation?: number;
    }
  ): Promise<any> {
    try {
      const response = await this.makeRequest<any>('/api/player-stats', {
        method: 'PUT',
        body: JSON.stringify({
          player: player.toString(),
          stats,
        }),
      });

      if (response.success) {
        return (response as any).stats;
      } else {
        console.log('Failed to update player stats via backend');
        return null;
      }
    } catch (error) {
      console.error('Backend stats update failed:', error);
      return null;
    }
  }

  /**
   * Gets player game stats only (without blockchain profile data)
   * @param player - Player's public key
   * @returns Promise<any>
   */
  async getPlayerStats(player: PublicKey): Promise<any> {
    try {
      const response = await this.makeRequest<any>(`/api/player-stats/${player.toString()}`);

      if (response.success && (response as any).stats) {
        return (response as any).stats;
      } else {
        console.log('Player stats not found via backend');
        return null;
      }
    } catch (error) {
      console.error('Backend stats fetch failed:', error);
      return null;
    }
  }

  /**
   * Checks if the backend service is healthy
   */
  async isBackendHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health');
      return response.success || false;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Checks if Honeycomb service is healthy via backend
   */
  async isHoneycombHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/honeycomb/health');
      return response.success || false;
    } catch (error) {
      console.error('Backend Honeycomb health check failed:', error);
      return false;
    }
  }

  /**
   * Gets backend and Honeycomb service status
   */
  async getServiceStatus(): Promise<{
    backendHealthy: boolean;
    honeycombHealthy: boolean;
    networkInfo?: any;
  }> {
    try {
      const [backendHealthy, honeycombResponse] = await Promise.all([
        this.isBackendHealthy(),
        this.makeRequest('/api/honeycomb/health').catch(() => ({ success: false }))
      ]);

      return {
        backendHealthy,
        honeycombHealthy: honeycombResponse.success || false,
        // networkInfo: honeycombResponse.data?.networkInfo,
      };
    } catch (error) {
      console.error('Service status check failed:', error);
      return {
        backendHealthy: false,
        honeycombHealthy: false,
      };
    }
  }

  /**
   * Migrates a local profile to the backend
   */
  async migrateLocalProfile(
    player: PublicKey,
    localProfile: any
  ): Promise<BackendProfile | null> {
    try {
      console.log('Migrating local profile to backend for player:', player.toString());

      // Check if profile already exists on backend
      const existingProfile = await this.getPlayerProfile(player);
      if (existingProfile) {
        console.log('Profile already exists on backend, skipping migration');
        return existingProfile;
      }

      // Create new profile on backend using local data
      const profileData: BackendProfileData = {
        name: localProfile.name || `Explorer ${player.toString().slice(0, 8)}`,
        avatar: localProfile.avatar || localProfile.pfp,
        metadata: {
          bio: localProfile.bio || "Space explorer in the G-Bax universe",
          experience: localProfile.experience || 0,
          level: localProfile.level || 1,
          credits: localProfile.credits || 100,
          migratedFrom: "localStorage",
          originalCreatedAt: localProfile.createdAt,
          ...localProfile.metadata,
        },
      };

      const newProfile = await this.createPlayerProfile(player, profileData);
      console.log('Local profile migrated to backend successfully');

      return newProfile;
    } catch (error) {
      console.error('Local profile migration failed:', error);
      return null;
    }
  }

  /**
   * Gets the backend URL for debugging
   */
  getBackendUrl(): string {
    return this.config.backendUrl;
  }
}

// Detect the appropriate backend URL based on environment
const getBackendUrl = (): string => {
  // If explicitly set, use that
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }

  // If running in browser and on Netlify (or any deployed site), use current origin
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('netlify.app') || hostname !== 'localhost') {
      return window.location.origin;
    }
  }

  // Default to localhost for development
  return 'http://localhost:3001';
};

// Create and export a default instance
export const backendHoneycombService = new BackendHoneycombService({
  backendUrl: getBackendUrl(),
});

export default backendHoneycombService;
