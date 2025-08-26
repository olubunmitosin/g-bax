const { Pool } = require('pg');
const path = require('path');

// Conditionally import sqlite3 only when needed (local development)
let sqlite3;
try {
  if (process.env.NODE_ENV !== 'production' && !process.env.NETLIFY) {
    sqlite3 = require('sqlite3').verbose();
  }
} catch (error) {
  // sqlite3 not available, will use PostgreSQL/Neon instead
}

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
   * Check and fix database permissions
   */
  async checkDatabasePermissions() {
    if (this.isProduction) return; // Only needed for SQLite

    const dbPath = path.join(__dirname, '../data/game.db');
    const fs = require('fs');

    try {
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath);
        console.log(`Database file permissions: ${stats.mode.toString(8)}`);

        // Check if file is writable
        try {
          fs.accessSync(dbPath, fs.constants.W_OK);
          console.log('Database file is writable');
        } catch (error) {
          console.warn('Database file is not writable, attempting to fix...');
          fs.chmodSync(dbPath, 0o644);
          console.log('Database file permissions updated');
        }
      }
    } catch (error) {
      console.warn('Could not check database permissions:', error.message);
    }
  }

  /**
   * Initialize the database connection
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check permissions first for SQLite
      await this.checkDatabasePermissions();

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
    if (!sqlite3) {
      throw new Error('SQLite3 is not available. Use PostgreSQL/Neon for production.');
    }

    const dbPath = path.join(__dirname, '../data/game.db');

    // Ensure data directory exists with proper permissions
    const fs = require('fs');
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
    }

    // Check if database file exists and set proper permissions
    if (fs.existsSync(dbPath)) {
      try {
        // Set read/write permissions for the database file
        fs.chmodSync(dbPath, 0o644);
      } catch (error) {
        console.warn('Could not set database file permissions:', error.message);
      }
    }

    // Open database with read/write mode
    this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
      if (err) {
        throw new Error(`Failed to open SQLite database: ${err.message}`);
      }
    });

    // Enable foreign keys and WAL mode for better concurrency
    await this.runSQLiteQuery('PRAGMA foreign_keys = ON');
    await this.runSQLiteQuery('PRAGMA journal_mode = WAL');
    await this.runSQLiteQuery('PRAGMA synchronous = NORMAL');
  }

  /**
   * Run database migrations
   */
  async runMigrations() {
    await this.createPlayerStatsTable();
    await this.createPlayerActivitiesTable();
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
   * Execute SQLite query with automatic retry on permission errors
   */
  async runSQLiteQuery(query, params = []) {
    try {
      return await new Promise((resolve, reject) => {
        this.db.run(query, params, function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ lastID: this.lastID, changes: this.changes });
          }
        });
      });
    } catch (error) {
      // Check if it's a readonly database error
      if (error.message && error.message.includes('SQLITE_READONLY')) {
        console.warn('SQLite readonly error detected, attempting to recreate database...');
        await this.recreateSQLiteDatabase();

        // Retry the query
        return await new Promise((resolve, reject) => {
          this.db.run(query, params, function (err) {
            if (err) {
              reject(err);
            } else {
              resolve({ lastID: this.lastID, changes: this.changes });
            }
          });
        });
      }
      throw error;
    }
  }

  /**
   * Execute SQLite select query
   */
  async getSQLiteQuery(query, params = []) {
    try {
      return await new Promise((resolve, reject) => {
        this.db.get(query, params, (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        });
      });
    } catch (error) {
      // Check if it's a readonly database error
      if (error.message && error.message.includes('SQLITE_READONLY')) {
        console.warn('SQLite readonly error detected, attempting to recreate database...');
        await this.recreateSQLiteDatabase();

        // Retry the query
        return await new Promise((resolve, reject) => {
          this.db.get(query, params, (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          });
        });
      }
      throw error;
    }
  }

  /**
   * Execute SQLite select all query
   */
  async getAllSQLiteQuery(query, params = []) {
    try {
      return await new Promise((resolve, reject) => {
        this.db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (error) {
      // Check if it's a readonly database error
      if (error.message && error.message.includes('SQLITE_READONLY')) {
        console.warn('SQLite readonly error detected, attempting to recreate database...');
        await this.recreateSQLiteDatabase();

        // Retry the query
        return await new Promise((resolve, reject) => {
          this.db.all(query, params, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          });
        });
      }
      throw error;
    }
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
   * Recreate SQLite database (for fixing permission issues)
   */
  async recreateSQLiteDatabase() {
    if (this.isProduction) return;

    const dbPath = path.join(__dirname, '../data/game.db');
    const fs = require('fs');

    try {
      console.log('Recreating SQLite database...');

      // Close existing connection
      if (this.db) {
        this.db.close();
        this.db = null;
      }

      // Remove existing database file
      if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Removed existing database file');
      }

      // Remove WAL and SHM files if they exist
      const walPath = dbPath + '-wal';
      const shmPath = dbPath + '-shm';
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

      // Reinitialize
      this.initialized = false;
      await this.initializeSQLite();
      await this.runMigrations();
      this.initialized = true;

      console.log('SQLite database recreated successfully');
    } catch (error) {
      console.error('Failed to recreate SQLite database:', error);
      throw error;
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
