/**
 * Verification Database Helpers
 * Query functions for verification tokens and verified contacts
 */

const { query, queryOne } = require('./db');
const logger = require('./logger');

/**
 * Create email verification token
 */
async function createEmailToken(token, email, sessionToken, expiresAt) {
  try {
    const result = await query(
      'INSERT INTO verification_tokens (token, email, session_token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [token, email, sessionToken, 'email', expiresAt]
    );
    logger.info('Email token created', { email, component: 'db-verification' });
    return result;
  } catch (error) {
    logger.error('Failed to create email token', { error: error.message, email, component: 'db-verification' });
    throw error;
  }
}

/**
 * Get email verification token
 */
async function getEmailToken(token) {
  try {
    const result = await queryOne(
      'SELECT * FROM verification_tokens WHERE token = ? AND type = ?',
      [token, 'email']
    );
    return result;
  } catch (error) {
    logger.error('Failed to get email token', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Delete email verification token
 */
async function deleteEmailToken(token) {
  try {
    const result = await query(
      'DELETE FROM verification_tokens WHERE token = ? AND type = ?',
      [token, 'email']
    );
    logger.info('Email token deleted', { component: 'db-verification' });
    return result;
  } catch (error) {
    logger.error('Failed to delete email token', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Create phone verification code
 */
async function createPhoneCode(phone, code, sessionToken, expiresAt) {
  try {
    const result = await query(
      'INSERT INTO verification_tokens (phone, code, session_token, type, expires_at) VALUES (?, ?, ?, ?, ?)',
      [phone, code, sessionToken, 'phone', expiresAt]
    );
    logger.info('Phone code created', { phone: phone.substring(0, 5) + '***', component: 'db-verification' });
    return result;
  } catch (error) {
    logger.error('Failed to create phone code', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Get phone verification code
 */
async function getPhoneCode(phone) {
  try {
    const result = await queryOne(
      'SELECT * FROM verification_tokens WHERE phone = ? AND type = ?',
      [phone, 'phone']
    );
    return result;
  } catch (error) {
    logger.error('Failed to get phone code', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Update phone verification attempts
 */
async function updatePhoneAttempts(phone, attempts) {
  try {
    const result = await query(
      'UPDATE verification_tokens SET attempts = ? WHERE phone = ? AND type = ?',
      [attempts, phone, 'phone']
    );
    return result;
  } catch (error) {
    logger.error('Failed to update phone attempts', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Delete phone verification code
 */
async function deletePhoneCode(phone) {
  try {
    const result = await query(
      'DELETE FROM verification_tokens WHERE phone = ? AND type = ?',
      [phone, 'phone']
    );
    logger.info('Phone code deleted', { component: 'db-verification' });
    return result;
  } catch (error) {
    logger.error('Failed to delete phone code', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Create or update verified contact
 */
async function createOrUpdateVerifiedContact(sessionToken, email, phone, emailVerifiedAt, phoneVerifiedAt) {
  try {
    const existing = await queryOne(
      'SELECT * FROM verified_contacts WHERE session_token = ?',
      [sessionToken]
    );

    if (existing) {
      const result = await query(
        'UPDATE verified_contacts SET email = ?, phone = ?, email_verified_at = ?, phone_verified_at = ? WHERE session_token = ?',
        [email || existing.email, phone || existing.phone, emailVerifiedAt || existing.email_verified_at, phoneVerifiedAt || existing.phone_verified_at, sessionToken]
      );
      logger.info('Verified contact updated', { sessionToken: sessionToken.substring(0, 10) + '...', component: 'db-verification' });
      return result;
    } else {
      const result = await query(
        'INSERT INTO verified_contacts (session_token, email, phone, email_verified_at, phone_verified_at) VALUES (?, ?, ?, ?, ?)',
        [sessionToken, email, phone, emailVerifiedAt, phoneVerifiedAt]
      );
      logger.info('Verified contact created', { sessionToken: sessionToken.substring(0, 10) + '...', component: 'db-verification' });
      return result;
    }
  } catch (error) {
    logger.error('Failed to create/update verified contact', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Get verified contact
 */
async function getVerifiedContact(sessionToken) {
  try {
    const result = await queryOne(
      'SELECT * FROM verified_contacts WHERE session_token = ?',
      [sessionToken]
    );
    return result;
  } catch (error) {
    logger.error('Failed to get verified contact', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Increment verification stat
 */
async function incrementStat(statType) {
  try {
    const result = await query(
      'UPDATE verification_stats SET count = count + 1 WHERE stat_type = ?',
      [statType]
    );
    return result;
  } catch (error) {
    logger.error('Failed to increment stat', { error: error.message, statType, component: 'db-verification' });
    throw error;
  }
}

/**
 * Get verification stats
 */
async function getVerificationStats() {
  try {
    const results = await query('SELECT stat_type, count FROM verification_stats');
    const stats = {
      emailRequests: 0,
      emailVerified: 0,
      phoneRequests: 0,
      phoneVerified: 0,
      lastReset: Date.now()
    };

    results.forEach(row => {
      if (row.stat_type === 'email_requests') stats.emailRequests = row.count;
      if (row.stat_type === 'email_verified') stats.emailVerified = row.count;
      if (row.stat_type === 'phone_requests') stats.phoneRequests = row.count;
      if (row.stat_type === 'phone_verified') stats.phoneVerified = row.count;
    });

    return stats;
  } catch (error) {
    logger.error('Failed to get verification stats', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

/**
 * Clean up expired tokens
 */
async function cleanupExpiredTokens() {
  try {
    const now = Date.now();
    const result = await query(
      'DELETE FROM verification_tokens WHERE expires_at < ?',
      [now]
    );
    logger.info('Expired tokens cleaned up', { count: result.affectedRows, component: 'db-verification' });
    return result;
  } catch (error) {
    logger.error('Failed to cleanup expired tokens', { error: error.message, component: 'db-verification' });
    throw error;
  }
}

module.exports = {
  createEmailToken,
  getEmailToken,
  deleteEmailToken,
  createPhoneCode,
  getPhoneCode,
  updatePhoneAttempts,
  deletePhoneCode,
  createOrUpdateVerifiedContact,
  getVerifiedContact,
  incrementStat,
  getVerificationStats,
  cleanupExpiredTokens
};
