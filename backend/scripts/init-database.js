#!/usr/bin/env node

/**
 * Database initialization script
 * This script initializes the database and creates the required tables
 */

require('dotenv').config();
const DatabaseService = require('../services/DatabaseService');

async function initializeDatabase() {
  console.log('🚀 Initializing G-Bax Database...\n');

  try {
    // Initialize the database service
    await DatabaseService.initialize();
    
    console.log('✅ Database initialized successfully!');
    console.log(`📊 Using: ${process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true' ? 'PostgreSQL (Production)' : 'SQLite (Development)'}`);
    
    // Test the database by creating a sample player
    const testPlayerAddress = 'TEST123456789';
    const testStats = {
      credits: 1500,
      level: 2,
      experience: 250,
      reputation: 100
    };

    console.log('\n🧪 Testing database operations...');
    
    // Create test player stats
    await DatabaseService.upsertPlayerStats(testPlayerAddress, testStats);
    console.log('✅ Created test player stats');
    
    // Retrieve test player stats
    const retrievedStats = await DatabaseService.getPlayerStats(testPlayerAddress);
    console.log('✅ Retrieved test player stats:', retrievedStats);
    
    // Log test activity
    await DatabaseService.logPlayerActivity(testPlayerAddress, 'credits_gained', 500, 'Test credit gain');
    console.log('✅ Logged test activity');
    
    // Get all player stats
    const allStats = await DatabaseService.getAllPlayerStats();
    console.log(`✅ Retrieved all player stats (${allStats.length} players)`);
    
    console.log('\n🎉 Database is ready for use!');
    console.log('\n📝 Available API endpoints:');
    console.log('  - PUT /api/player-stats - Update player stats');
    console.log('  - GET /api/player-stats/:player - Get player stats');
    console.log('  - GET /api/users/all - Get all users (with stats)');
    console.log('  - GET /api/profile/:player - Get complete profile');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await DatabaseService.close();
    process.exit(0);
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
