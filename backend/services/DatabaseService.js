const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');

// Import Netlify Neon for production
let neon;
try {
  const netlifyNeon = require('@netlify/neon');
  neon = netlifyNeon.neon;
} catch (error) {
  // Fallback if @netlify/neon is not available
  console.log('Netlify Neon package not available, using standard pg');
}

class DatabaseService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';
    this.isNetlify = process.env.NETLIFY === 'true';
    this.db = null;
    this.pool = null;
    this.sql = null; // Netlify Neon SQL function
    this.initialized = false;
  }

  /**
   * Initialize the database connection
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      if (this.isProduction) {
        if (this.isNetlify && neon) {
          // Use Netlify Neon for Netlify deployment
          await this.initializeNetlifyNeon();
        } else {
          // Use standard PostgreSQL for other production environments
          await this.initializePostgreSQL();
        }
      } else {
        // Use SQLite for local development
        await this.initializeSQLite();
      }

      // Run migrations
      await this.runMigrations();
      this.initialized = true;
      console.log(`Database initialized successfully (${this.isNetlify && neon ? 'Netlify Neon' : this.isProduction ? 'PostgreSQL' : 'SQLite'})`);
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Initialize Netlify Neon connection
   */
  async initializeNetlifyNeon() {
    // Netlify Neon automatically uses NETLIFY_DATABASE_URL environment variable
    this.sql = neon();

    // Test connection with a simple query
    await this.sql`SELECT NOW()`;
  }

  /**
   * Initialize PostgreSQL connection for production
   */
  async initializePostgreSQL() {
    const connectionString = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL, NEON_DATABASE_URL, or NETLIFY_DATABASE_URL environment variable is required for production');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    const client = await this.pool.connect();
    await client.query('SELECT NOW()');
    client.release();
  }

  /**
   * Initialize SQLite connection for development
   */
  async initializeSQLite() {
    const dbPath = path.join(__dirname, '../data/game.db');

    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        throw new Error(`Failed to open SQLite database: ${err.message}`);
      }
    });

    // Enable foreign keys
    await this.runSQLiteQuery('PRAGMA foreign_keys = ON');
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    const migrations = [
      this.createPlayerStatsTable(),
      this.createPlayerActivitiesTable(),
    ];

    for (const migration of migrations) {
      await migration;
    }
  }

  /**
   * Create player_stats table
   */
  async createPlayerStatsTable() {
    const sqliteQuery = `
      CREATE TABLE IF NOT EXISTS player_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_address VARCHAR(44) UNIQUE NOT NULL,
        credits INTEGER DEFAULT 1000,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        reputation INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const postgresQuery = `
      CREATE TABLE IF NOT EXISTS player_stats (
        id SERIAL PRIMARY KEY,
        player_address VARCHAR(44) UNIQUE NOT NULL,
        credits INTEGER DEFAULT 1000,
        level INTEGER DEFAULT 1,
        experience INTEGER DEFAULT 0,
        reputation INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    if (this.isProduction) {
      await this.runPostgreSQLQuery(postgresQuery);
    } else {
      await this.runSQLiteQuery(sqliteQuery);
    }
  }

  /**
   * Create player_activities table
   */
  async createPlayerActivitiesTable() {
    const sqliteQuery = `
      CREATE TABLE IF NOT EXISTS player_activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_address VARCHAR(44) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_address) REFERENCES player_stats(player_address)
      )
    `;

    const postgresQuery = `
      CREATE TABLE IF NOT EXISTS player_activities (
        id SERIAL PRIMARY KEY,
        player_address VARCHAR(44) NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (player_address) REFERENCES player_stats(player_address)
      )
    `;

    if (this.isProduction) {
      await this.runPostgreSQLQuery(postgresQuery);
    } else {
      await this.runSQLiteQuery(sqliteQuery);
    }
  }

  /**
   * Execute SQLite query
   */
  runSQLiteQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Execute SQLite select query
   */
  getSQLiteQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Execute SQLite select all query
   */
  getAllSQLiteQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Execute PostgreSQL query (supports both Netlify Neon and standard PostgreSQL)
   */
  async runPostgreSQLQuery(query, params = []) {
    if (this.sql) {
      // Use Netlify Neon
      if (params.length === 0) {
        return await this.sql([query]);
      } else {
        // Convert parameterized query for Neon template literal format
        return await this.executeNeonQuery(query, params);
      }
    } else {
      // Use standard PostgreSQL
      const client = await this.pool.connect();
      try {
        const result = await client.query(query, params);
        return result;
      } finally {
        client.release();
      }
    }
  }

  /**
   * Execute Neon query with parameters
   */
  async executeNeonQuery(query, params) {
    // Convert $1, $2, etc. to template literal format
    let neonQuery = query;
    const values = [];

    for (let i = 0; i < params.length; i++) {
      neonQuery = neonQuery.replace(`$${i + 1}`, `\${values[${i}]}`);
      values.push(params[i]);
    }

    // Use Function constructor to create a template literal function
    const queryFunction = new Function('sql', 'values', `return sql\`${neonQuery}\``);
    return await queryFunction(this.sql, values);
  }

  /**
   * Get player stats by address
   */
  async getPlayerStats(playerAddress) {
    await this.initialize();

    const query = 'SELECT * FROM player_stats WHERE player_address = ?';
    const postgresQuery = 'SELECT * FROM player_stats WHERE player_address = $1';

    if (this.isProduction) {
      const result = await this.runPostgreSQLQuery(postgresQuery, [playerAddress]);
      // Handle both Netlify Neon (array) and standard PostgreSQL (result.rows) responses
      const rows = Array.isArray(result) ? result : result.rows;
      return rows[0] || null;
    } else {
      return await this.getSQLiteQuery(query, [playerAddress]);
    }
  }

  /**
   * Create or update player stats
   */
  async upsertPlayerStats(playerAddress, stats) {
    await this.initialize();

    const { credits, level, experience, reputation } = stats;

    if (this.isProduction) {
      const query = `
        INSERT INTO player_stats (player_address, credits, level, experience, reputation, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (player_address) 
        DO UPDATE SET 
          credits = $2,
          level = $3,
          experience = $4,
          reputation = $5,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
      `;
      const result = await this.runPostgreSQLQuery(query, [playerAddress, credits, level, experience, reputation]);
      // Handle both Netlify Neon (array) and standard PostgreSQL (result.rows) responses
      const rows = Array.isArray(result) ? result : result.rows;
      return rows[0];
    } else {
      // SQLite doesn't have UPSERT in older versions, so we'll use INSERT OR REPLACE
      const query = `
        INSERT OR REPLACE INTO player_stats (player_address, credits, level, experience, reputation, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      await this.runSQLiteQuery(query, [playerAddress, credits, level, experience, reputation]);
      return await this.getPlayerStats(playerAddress);
    }
  }

  /**
   * Get all player stats for leaderboard
   */
  async getAllPlayerStats() {
    await this.initialize();

    const query = 'SELECT * FROM player_stats ORDER BY experience DESC, level DESC, credits DESC';

    if (this.isProduction) {
      const result = await this.runPostgreSQLQuery(query);
      // Handle both Netlify Neon (array) and standard PostgreSQL (result.rows) responses
      return Array.isArray(result) ? result : result.rows;
    } else {
      return await this.getAllSQLiteQuery(query);
    }
  }

  /**
   * Log player activity
   */
  async logPlayerActivity(playerAddress, activityType, amount, description = null) {
    await this.initialize();

    if (this.isProduction) {
      const query = `
        INSERT INTO player_activities (player_address, activity_type, amount, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await this.runPostgreSQLQuery(query, [playerAddress, activityType, amount, description]);
      // Handle both Netlify Neon (array) and standard PostgreSQL (result.rows) responses
      const rows = Array.isArray(result) ? result : result.rows;
      return rows[0];
    } else {
      const query = `
        INSERT INTO player_activities (player_address, activity_type, amount, description)
        VALUES (?, ?, ?, ?)
      `;
      await this.runSQLiteQuery(query, [playerAddress, activityType, amount, description]);
    }
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.pool) {
      await this.pool.end();
    }
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();
