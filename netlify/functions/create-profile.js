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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Initialize controller
    const controller = initController();

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Create mock request/response objects
    const req = {
      body,
      method: 'POST',
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
    await controller.createProfile(req, res);

    return {
      statusCode,
      headers,
      body: JSON.stringify(responseData),
    };
  } catch (error) {
    console.error('Create profile error:', error);
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
