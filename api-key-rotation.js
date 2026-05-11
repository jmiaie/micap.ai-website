/**
 * API Key Rotation Manager
 * Manages multiple Google Gemini API keys with automatic failover
 * Tracks key health, rate limits, and error patterns
 */

const logger = require('./logger');

class APIKeyRotationManager {
  constructor(apiKeys = []) {
    this.keys = apiKeys.map((key, index) => ({
      id: index,
      key: key,
      active: true,
      requestCount: 0,
      errorCount: 0,
      rateLimitHits: 0,
      lastError: null,
      lastErrorTime: null,
      successCount: 0,
      lastUsed: null,
      cooldownUntil: null,
      status: 'healthy' // healthy, degraded, rate-limited, error
    }));

    this.currentKeyIndex = 0;
    this.rotationLog = [];
    this.maxErrorsBeforeRotation = 3;
    this.maxRateLimitHitsBeforeRotation = 2;
    this.cooldownDurationMs = 60000; // 1 minute cooldown after rate limit
    this.logRotations = true;
  }

  /**
   * Get the next available API key
   * Automatically rotates if current key is unhealthy
   */
  getNextKey() {
    const startIndex = this.currentKeyIndex;
    let attempts = 0;

    while (attempts < this.keys.length) {
      const key = this.keys[this.currentKeyIndex];

      // Check if key is in cooldown
      if (key.cooldownUntil && Date.now() < key.cooldownUntil) {
        this._rotateToNextKey();
        attempts++;
        continue;
      }

      // Check if key is healthy
      if (key.active && key.status !== 'rate-limited') {
        return key;
      }

      this._rotateToNextKey();
      attempts++;
    }

    // If all keys are unhealthy, return the least problematic one
    return this._getLeastProblematicKey();
  }

  /**
   * Record a successful API call
   */
  recordSuccess(keyId) {
    const key = this.keys[keyId];
    if (!key) return;

    key.successCount++;
    key.requestCount++;
    key.lastUsed = new Date();
    key.errorCount = Math.max(0, key.errorCount - 1); // Reduce error count on success
    key.status = 'healthy';

    this._log(`✓ Key ${keyId} success (${key.successCount} total)`);
  }

  /**
   * Record an API error
   */
  recordError(keyId, error) {
    const key = this.keys[keyId];
    if (!key) return;

    key.errorCount++;
    key.requestCount++;
    key.lastError = error.message || String(error);
    key.lastErrorTime = new Date();
    key.lastUsed = new Date();

    // Determine error type
    if (error.message && error.message.includes('429')) {
      this._handleRateLimit(keyId);
    } else if (error.message && error.message.includes('403')) {
      key.status = 'error';
      this._log(`✗ Key ${keyId} forbidden (403) - may be revoked`);
    } else if (error.message && error.message.includes('401')) {
      key.status = 'error';
      this._log(`✗ Key ${keyId} unauthorized (401) - invalid key`);
    } else {
      key.status = 'degraded';
      this._log(`✗ Key ${keyId} error: ${error.message}`);
    }

    // Rotate if too many errors
    if (key.errorCount >= this.maxErrorsBeforeRotation) {
      this._log(`⚠ Key ${keyId} exceeded error threshold, rotating...`);
      this._rotateToNextKey();
    }
  }

  /**
   * Handle rate limit hit
   */
  _handleRateLimit(keyId) {
    const key = this.keys[keyId];
    key.rateLimitHits++;
    key.status = 'rate-limited';
    key.cooldownUntil = Date.now() + this.cooldownDurationMs;

    this._log(`⏱ Key ${keyId} rate limited (hit #${key.rateLimitHits})`);

    // Rotate to next key
    this._rotateToNextKey();

    // If key hits rate limit too many times, mark as degraded
    if (key.rateLimitHits >= this.maxRateLimitHitsBeforeRotation) {
      key.status = 'degraded';
      this._log(`⚠ Key ${keyId} hit rate limit ${key.rateLimitHits} times`);
    }
  }

  /**
   * Rotate to the next available key
   */
  _rotateToNextKey() {
    const previousIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;

    this._log(`🔄 Rotated from key ${previousIndex} to key ${this.currentKeyIndex}`);

    this.rotationLog.push({
      timestamp: new Date(),
      from: previousIndex,
      to: this.currentKeyIndex,
      reason: 'automatic_rotation'
    });
  }

  /**
   * Get the least problematic key (fallback)
   */
  _getLeastProblematicKey() {
    return this.keys.reduce((best, current) => {
      const currentScore = current.errorCount + current.rateLimitHits;
      const bestScore = best.errorCount + best.rateLimitHits;
      return currentScore < bestScore ? current : best;
    });
  }

  /**
   * Get health status of all keys
   */
  getHealthStatus() {
    return this.keys.map((key, index) => ({
      keyId: index,
      status: key.status,
      active: key.active,
      successCount: key.successCount,
      errorCount: key.errorCount,
      rateLimitHits: key.rateLimitHits,
      requestCount: key.requestCount,
      lastUsed: key.lastUsed,
      lastError: key.lastError,
      inCooldown: key.cooldownUntil && Date.now() < key.cooldownUntil,
      cooldownRemaining: key.cooldownUntil ? Math.max(0, key.cooldownUntil - Date.now()) : 0
    }));
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const totalRequests = this.keys.reduce((sum, k) => sum + k.requestCount, 0);
    const totalSuccesses = this.keys.reduce((sum, k) => sum + k.successCount, 0);
    const totalErrors = this.keys.reduce((sum, k) => sum + k.errorCount, 0);
    const healthyKeys = this.keys.filter(k => k.status === 'healthy').length;

    return {
      totalKeys: this.keys.length,
      healthyKeys,
      currentKeyIndex: this.currentKeyIndex,
      totalRequests,
      totalSuccesses,
      totalErrors,
      successRate: totalRequests > 0 ? Math.round((totalSuccesses / totalRequests) * 100) : 0,
      rotationCount: this.rotationLog.length,
      lastRotation: this.rotationLog.length > 0 ? this.rotationLog[this.rotationLog.length - 1].timestamp : null
    };
  }

  /**
   * Reset a key's error count (manual recovery)
   */
  resetKey(keyId) {
    const key = this.keys[keyId];
    if (!key) return;

    key.errorCount = 0;
    key.rateLimitHits = 0;
    key.status = 'healthy';
    key.cooldownUntil = null;

    this._log(`🔧 Key ${keyId} manually reset`);
  }

  /**
   * Disable a key temporarily
   */
  disableKey(keyId) {
    const key = this.keys[keyId];
    if (!key) return;

    key.active = false;
    this._log(`🚫 Key ${keyId} disabled`);
    this._rotateToNextKey();
  }

  /**
   * Enable a key
   */
  enableKey(keyId) {
    const key = this.keys[keyId];
    if (!key) return;

    key.active = true;
    this._log(`✅ Key ${keyId} enabled`);
  }

  /**
   * Internal logging
   */
  _log(message) {
    if (this.logRotations) {
      logger.info(message, { component: 'api-key-rotation' });
    }
  }

  /**
   * Get rotation history
   */
  getRotationHistory(limit = 20) {
    return this.rotationLog.slice(-limit);
  }
}

module.exports = APIKeyRotationManager;
