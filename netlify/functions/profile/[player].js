// Import the HoneycombController
const HoneycombController = require('../../../backend/controllers/HoneycombController.js');

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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Initialize controller
    const controller = initController();

    // Extract player from path
    const pathSegments = event.path.split('/');
    const player = pathSegments[pathSegments.length - 1];

    if (!player) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Player address is required',
        }),
      };
    }

    // Create mock request/response objects
    const req = {
      params: { player },
      method: 'GET',
    };

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

    // Call the controller method
    await controller.getProfile(req, res);

    return {
      statusCode,
      headers,
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error('Get profile error:', error);
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
