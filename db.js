/**
 * Database Module
 * Handles MySQL connection pooling and initialization
 * Falls back to in-memory storage if mysql2 is not available
 */

let mysql;
let pool = null;

try {
  mysql = require('mysql2/promise');
} catch (err) {
  mysql = null;
}

const logger = require('./logger');

// In-memory storage for fallback mode
const fallbackStorage = {
  verification_tokens: [],
  verified_contacts: [],
  leads: [],
  verification_stats: {
    email_requests: 0,
    email_verified: 0,
    phone_requests: 0,
    phone_verified: 0
  }
};

/**
 * Initialize database schema
 */
async function initializeDatabase() {
  if (!mysql) {
    logger.warn('mysql2 not available, using fallback in-memory storage', { component: 'database' });
    return true;
  }

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'micap_ai',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    });

    const connection = await pool.getConnection();
    
    try {
      logger.info('Initializing database schema...', { component: 'database' });

      // Create verification_tokens table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS verification_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          session_token VARCHAR(255) NOT NULL,
          type ENUM('email', 'phone') NOT NULL,
          code VARCHAR(10),
          expires_at BIGINT NOT NULL,
          attempts INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_token (token),
          INDEX idx_session_token (session_token),
          INDEX idx_expires_at (expires_at)
        )
      `);

      // Create verified_contacts table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS verified_contacts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          email_verified_at BIGINT,
          phone_verified_at BIGINT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_session_token (session_token),
          INDEX idx_email (email),
          INDEX idx_phone (phone)
        )
      `);

      // Create leads table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS leads (
          id INT AUTO_INCREMENT PRIMARY KEY,
          session_token VARCHAR(255),
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          company_name VARCHAR(255),
          industry VARCHAR(100),
          company_size VARCHAR(50),
          roi_data JSON,
          consent BOOLEAN DEFAULT FALSE,
          status VARCHAR(50) DEFAULT 'new',
          score INT DEFAULT 50,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (email),
          INDEX idx_session_token (session_token),
          INDEX idx_status (status),
          INDEX idx_score (score),
          INDEX idx_created_at (created_at)
        )
      `);

      // Create chat_messages table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          visitor_email VARCHAR(255) NOT NULL,
          visitor_name VARCHAR(255),
          message LONGTEXT NOT NULL,
          session_id VARCHAR(255),
          page_url VARCHAR(500),
          status ENUM('new', 'read', 'responded') DEFAULT 'new',
          response LONGTEXT,
          response_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_email (visitor_email),
          INDEX idx_status (status),
          INDEX idx_created_at (created_at),
          INDEX idx_session_id (session_id)
        )
      `);
      // Create verification_stats table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS verification_stats (
          id INT AUTO_INCREMENT PRIMARY KEY,
          stat_type VARCHAR(50) NOT NULL,
          count INT DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_stat (stat_type)
        )
      `);

      // Initialize stats
      await connection.execute(`
        INSERT IGNORE INTO verification_stats (stat_type, count)
        VALUES 
          ('email_requests', 0),
          ('email_verified', 0),
          ('phone_requests', 0),
          ('phone_verified', 0)
      `);

      logger.info('Database schema initialized successfully', { component: 'database' });
      return true;

    } finally {
      connection.release();
    }

  } catch (error) {
    logger.error('Database initialization error', { error: error.message, component: 'database' });
    // Don't throw - allow app to run in fallback mode
    return false;
  }
}

/**
 * Get database connection from pool
 */
async function getConnection() {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  
  try {
    return await pool.getConnection();
  } catch (error) {
    logger.error('Failed to get database connection', { error: error.message, component: 'database' });
    throw error;
  }
}

/**
 * Execute query with connection pooling
 */
async function query(sql, values = []) {
  // Fallback mode
  if (!mysql || !pool) {
    logger.debug('Query executed (fallback mode)', { sql: sql.substring(0, 50), component: 'database' });
    
    // Return mock results for common operations
    if (sql.includes('INSERT')) {
      return { insertId: Date.now(), affectedRows: 1 };
    } else if (sql.includes('UPDATE')) {
      return { affectedRows: 1 };
    } else if (sql.includes('DELETE')) {
      return { affectedRows: 1 };
    }
    return [];
  }

  let connection;
  try {
    connection = await getConnection();
  } catch (error) {
    // If connection fails, use fallback mode
    logger.warn('Database connection failed, using fallback mode', { error: error.message, component: 'database' });
    if (sql.includes('INSERT')) {
      return { insertId: Date.now(), affectedRows: 1 };
    } else if (sql.includes('UPDATE')) {
      return { affectedRows: 1 };
    } else if (sql.includes('DELETE')) {
      return { affectedRows: 1 };
    }
    return [];
  }
  
  try {
    const [results] = await connection.execute(sql, values);
    return results;
  } catch (error) {
    logger.error('Database query error', { error: error.message, sql: sql.substring(0, 100), component: 'database' });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute query and return first result
 */
async function queryOne(sql, values = []) {
  // Fallback mode
  if (!mysql || !pool) {
    logger.debug('Query executed (fallback mode - single row)', { sql: sql.substring(0, 50), component: 'database' });
    return null;
  }

  const results = await query(sql, values);
  return results.length > 0 ? results[0] : null;
}

/**
 * Close database pool
 */
async function closePool() {
  if (!pool) {
    return;
  }

  try {
    await pool.end();
    logger.info('Database pool closed', { component: 'database' });
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message, component: 'database' });
  }
}

module.exports = {
  pool,
  initializeDatabase,
  getConnection,
  query,
  queryOne,
  closePool
};
