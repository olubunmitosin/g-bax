#!/usr/bin/env node

/**
 * Simple test script to verify the backend server functionality
 */

const { PublicKey } = require('@solana/web3.js');

// Test configuration
const BASE_URL = 'http://localhost:3001';
const TEST_PLAYER_KEY = 'AEK7sg9oUEcD8RW1BeATv85TQyienpT6wKCXkmghm1H5'; // From .env

async function makeRequest(url, options = {}) {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

async function testHealthCheck() {
  console.log('Testing health check endpoint...');
  const result = await makeRequest(`${BASE_URL}/health`);

  if (result.error) {
    console.log('Health check failed:', result.error);
    return false;
  }

  console.log('Health check passed:', result.data.message);
  return true;
}

async function testHoneycombHealth() {
  console.log('Testing Honeycomb health endpoint...');
  const result = await makeRequest(`${BASE_URL}/api/honeycomb/health`);

  if (result.error) {
    console.log('Honeycomb health check failed:', result.error);
    return false;
  }

  console.log('Honeycomb health check passed');
  console.log('Network info:', result.data.networkInfo);
  return true;
}

async function testCreateProfile() {
  console.log('Testing profile creation endpoint...');

  const profileData = {
    player: TEST_PLAYER_KEY,
    profileData: {
      name: 'Test Player',
      avatar: 'https://example.com/avatar.jpg',
      metadata: {
        bio: 'Test player for backend verification',
        testFlag: true
      }
    }
  };

  const result = await makeRequest(`${BASE_URL}/api/create-profile`, {
    method: 'POST',
    body: JSON.stringify(profileData)
  });

  if (result.error) {
    console.log('Profile creation failed:', result.error);
    return false;
  }

  if (result.status === 201) {
    console.log('Profile creation successful');
    return true;
  } else {
    console.log('Profile creation returned status:', result.status);
    console.log('Response:', result.data);
    return false;
  }
}

async function testGetProfile() {
  console.log('Testing profile retrieval endpoint...');

  const result = await makeRequest(`${BASE_URL}/api/profile/${TEST_PLAYER_KEY}`);

  if (result.error) {
    console.log('Profile retrieval failed:', result.error);
    return false;
  }

  if (result.status === 200) {
    console.log('Profile retrieval successful');
    console.log('Profile name:', result.data.profile?.name);
    return true;
  } else if (result.status === 404) {
    console.log('Profile not found (expected for new setup)');
    return true;
  } else {
    console.log('Profile retrieval returned status:', result.status);
    return false;
  }
}

async function runTests() {
  console.log('Starting G-Bax Backend API Tests\n');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Honeycomb Health', fn: testHoneycombHealth },
    { name: 'Profile Creation', fn: testCreateProfile },
    { name: 'Profile Retrieval', fn: testGetProfile }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) passed++;
    } catch (error) {
      console.log(`${test.name} threw error:`, error.message);
    }
    console.log(''); // Empty line for readability
  }

  console.log(`Test Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('All tests passed! Backend is working correctly.');
    process.exit(0);
  } else {
    console.log('Some tests failed. Check the server logs for details.');
    process.exit(1);
  }
}

// Check if server is running
async function checkServerRunning() {
  console.log('Checking if server is running...');
  const result = await makeRequest(`${BASE_URL}/health`);

  if (result.error) {
    console.log('Server is not running. Please start the server first:');
    console.log('   cd backend && npm start');
    process.exit(1);
  }

  console.log('Server is running\n');
}

// Main execution
async function main() {
  await checkServerRunning();
  await runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { runTests };
