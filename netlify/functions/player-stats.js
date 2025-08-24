// Import the HoneycombController
const HoneycombController = require('../../backend/controllers/HoneycombController.js');

// Initialize the controller
let honeycombController;

const initController = () => {
  if (!honeycombController) {
    honeycombController = new HoneycombController();
  }
  return honeycombController;
};

exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Initialize controller
    const controller = initController();

    let responseData = null;
    let statusCode = 200;

    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        responseData = data;
        return res;
      },
    };

    if (event.httpMethod === 'GET') {
      // Handle GET request for getting player stats
      // Extract player from query parameters (from redirect)
      let player = event.queryStringParameters?.player;
      
      // Fallback: extract from path if query param doesn't work
      if (!player && event.path) {
        const pathParts = event.path.split('/');
        // Path should be /api/player-stats/PLAYER_ADDRESS
        if (pathParts.length >= 4 && pathParts[2] === 'player-stats') {
          player = pathParts[3];
        }
      }

      if (!player) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Player address is required',
            debug: {
              path: event.path,
              pathParts: event.path?.split('/'),
              queryParams: event.queryStringParameters,
            }
          }),
        };
      }

      const req = {
        params: { player },
        method: 'GET',
      };

      await controller.getPlayerStats(req, res);

    } else if (event.httpMethod === 'PUT') {
      // Handle PUT request for updating player stats
      const body = JSON.parse(event.body || '{}');

      const req = {
        body,
        method: 'PUT',
      };

      await controller.updatePlayerStats(req, res);

    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error('Player stats function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: error.message || 'Internal server error',
      }),
    };
  }
};
