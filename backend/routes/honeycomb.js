const express = require('express');

module.exports = (honeycombController) => {
  const router = express.Router();

  /**
   * POST /api/create-profile
   * Creates a new player profile using Honeycomb Protocol
   * 
   * Body:
   * {
   *   player: string (PublicKey),
   *   profileData: {
   *     name: string,
   *     avatar?: string,
   *     metadata?: object
   *   },
   *   playerKeypair?: Keypair
   * }
   */
  router.post('/create-profile', async (req, res) => {
    await honeycombController.createProfile(req, res);
  });

  /**
   * PUT /api/update-profile
   * Updates a player profile using Honeycomb Protocol
   *
   * Body:
   * {
   *   player: string (PublicKey),
   *   accessToken: string,
   *   profileData: {
   *     name?: string,
   *     bio?: string,
   *     avatar?: string,
   *     pfp?: string,
   *     metadata?: object
   *   }
   * }
   */
  router.put('/update-profile', async (req, res) => {
    await honeycombController.updateProfile(req, res);
  });

  /**
   * GET /api/users/all
   * Gets all users in the project for leaderboard
   */
  router.get('/users/all', async (req, res) => {
    await honeycombController.getAllUsers(req, res);
  });

  /**
   * GET /api/profile/:player
   * Gets player profile information
   *
   * Params:
   * - player: string (PublicKey)
   */
  router.get('/profile/:player', async (req, res) => {
    await honeycombController.getProfile(req, res);
  });

  /**
   * GET /api/honeycomb/health
   * Checks Honeycomb service health and connection status
   */
  router.get('/honeycomb/health', async (req, res) => {
    await honeycombController.healthCheck(req, res);
  });

  /**
   * POST /api/update-experience
   * Updates player experience (placeholder for future implementation)
   */
  router.post('/update-experience', async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Experience update endpoint not yet implemented'
    });
  });

  /**
   * GET /api/player-stats/:player
   * Gets comprehensive player statistics (placeholder for future implementation)
   */
  router.get('/player-stats/:player', async (req, res) => {
    res.status(501).json({
      success: false,
      message: 'Player stats endpoint not yet implemented'
    });
  });

  return router;
};
