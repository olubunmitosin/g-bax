/**
 * Example of using Netlify Neon integration for database operations
 * This demonstrates the simplified approach using @netlify/neon package
 */

// Example 1: Direct Netlify Neon usage (in Netlify Functions)
const { neon } = require('@netlify/neon');

async function directNeonExample() {
  // Automatically uses NETLIFY_DATABASE_URL environment variable
  const sql = neon();
  
  // Simple query
  const users = await sql`SELECT * FROM player_stats ORDER BY experience DESC LIMIT 10`;
  console.log('Top 10 players:', users);
  
  // Parameterized query
  const playerAddress = 'SOME_PLAYER_ADDRESS';
  const playerStats = await sql`
    SELECT * FROM player_stats 
    WHERE player_address = ${playerAddress}
  `;
  console.log('Player stats:', playerStats[0]);
  
  // Insert/Update with parameters
  const newStats = {
    address: 'NEW_PLAYER_ADDRESS',
    credits: 1500,
    level: 3,
    experience: 750,
    reputation: 200
  };
  
  const result = await sql`
    INSERT INTO player_stats (player_address, credits, level, experience, reputation)
    VALUES (${newStats.address}, ${newStats.credits}, ${newStats.level}, ${newStats.experience}, ${newStats.reputation})
    ON CONFLICT (player_address) 
    DO UPDATE SET 
      credits = ${newStats.credits},
      level = ${newStats.level},
      experience = ${newStats.experience},
      reputation = ${newStats.reputation},
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  
  console.log('Updated player:', result[0]);
}

// Example 2: Using our DatabaseService (automatically detects and uses Netlify Neon)
const DatabaseService = require('../services/DatabaseService');

async function databaseServiceExample() {
  // Initialize database (automatically uses Netlify Neon if available)
  await DatabaseService.initialize();
  
  // Get player stats
  const stats = await DatabaseService.getPlayerStats('PLAYER_ADDRESS');
  console.log('Player stats via DatabaseService:', stats);
  
  // Update player stats
  const updatedStats = await DatabaseService.upsertPlayerStats('PLAYER_ADDRESS', {
    credits: 2000,
    level: 5,
    experience: 1250,
    reputation: 350
  });
  console.log('Updated stats:', updatedStats);
  
  // Get all players for leaderboard
  const allPlayers = await DatabaseService.getAllPlayerStats();
  console.log(`All players (${allPlayers.length}):`, allPlayers);
  
  // Log activity
  await DatabaseService.logPlayerActivity(
    'PLAYER_ADDRESS',
    'credits_gained',
    500,
    'Completed mission: Asteroid Mining'
  );
}

// Example 3: Netlify Function using Neon
exports.netlifyFunctionExample = async (event, context) => {
  const sql = neon(); // Uses NETLIFY_DATABASE_URL automatically
  
  try {
    if (event.httpMethod === 'GET') {
      // Get leaderboard
      const leaderboard = await sql`
        SELECT player_address, credits, level, experience, reputation,
               ROW_NUMBER() OVER (ORDER BY experience DESC) as rank
        FROM player_stats 
        ORDER BY experience DESC 
        LIMIT 50
      `;
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          leaderboard
        })
      };
    }
    
    if (event.httpMethod === 'POST') {
      const { playerAddress, stats } = JSON.parse(event.body);
      
      // Update player stats
      const result = await sql`
        INSERT INTO player_stats (player_address, credits, level, experience, reputation)
        VALUES (${playerAddress}, ${stats.credits}, ${stats.level}, ${stats.experience}, ${stats.reputation})
        ON CONFLICT (player_address) 
        DO UPDATE SET 
          credits = ${stats.credits},
          level = ${stats.level},
          experience = ${stats.experience},
          reputation = ${stats.reputation},
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          player: result[0]
        })
      };
    }
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};

// Benefits of Netlify Neon integration:
// 1. Automatic connection management - no need to handle connection pools
// 2. Environment variable auto-detection (NETLIFY_DATABASE_URL)
// 3. Template literal syntax for safe parameterized queries
// 4. Optimized for serverless/edge environments
// 5. Built-in connection pooling and caching
// 6. Seamless integration with Netlify's infrastructure

module.exports = {
  directNeonExample,
  databaseServiceExample
};
