/**
 * Email and Phone Verification System
 * Ensures users verify their contact before accessing the ROI calculator
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// In-memory storage for verification tokens and verified contacts
const verificationTokens = new Map();
const verifiedContacts = new Map();

// Configuration
const CONFIG = {
  EMAIL: {
    TOKEN_EXPIRY_MINUTES: 30,
    MAX_RESEND_ATTEMPTS: 3,
    RESEND_COOLDOWN_MINUTES: 2,
  },
  PHONE: {
    TOKEN_EXPIRY_MINUTES: 15,
    CODE_LENGTH: 6,
    MAX_ATTEMPTS: 3,
    RESEND_COOLDOWN_MINUTES: 1,
  },
  VERIFICATION: {
    SESSION_DURATION_DAYS: 30,
  },
};

/**
 * Generate a secure token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a 6-digit verification code
 */
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Create email verification request
 */
function createEmailVerification(email) {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalizedEmail)) {
    return {
      success: false,
      error: 'Invalid email format',
    };
  }
  
  // Check if already verified
  if (verifiedContacts.has(`email:${normalizedEmail}`)) {
    return {
      success: false,
      error: 'This email is already verified',
      alreadyVerified: true,
    };
  }
  
  // Check for existing pending verification
  const existingToken = Array.from(verificationTokens.entries()).find(
    ([_, data]) => data.type === 'email' && data.email === normalizedEmail && !data.verified
  );
  
  if (existingToken) {
    const [tokenId, tokenData] = existingToken;
    if (Date.now() - tokenData.createdAt < CONFIG.EMAIL.RESEND_COOLDOWN_MINUTES * 60000) {
      return {
        success: false,
        error: `Please wait ${CONFIG.EMAIL.RESEND_COOLDOWN_MINUTES} minute(s) before requesting a new code`,
        retryAfter: CONFIG.EMAIL.RESEND_COOLDOWN_MINUTES * 60,
      };
    }
  }
  
  // Generate new token
  const token = generateToken();
  const tokenId = generateToken(16);
  
  verificationTokens.set(tokenId, {
    type: 'email',
    email: normalizedEmail,
    token,
    code: null,
    verified: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + CONFIG.EMAIL.TOKEN_EXPIRY_MINUTES * 60000,
    attempts: 0,
    resendCount: 0,
  });
  
  return {
    success: true,
    tokenId,
    email: normalizedEmail,
    expiresIn: CONFIG.EMAIL.TOKEN_EXPIRY_MINUTES * 60,
    message: `Verification email sent to ${normalizedEmail}`,
  };
}

/**
 * Create phone verification request
 */
function createPhoneVerification(phoneNumber) {
  // Validate phone format (basic validation)
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  const normalizedPhone = phoneNumber.replace(/\D/g, '');
  
  if (!phoneRegex.test(phoneNumber) || normalizedPhone.length < 10) {
    return {
      success: false,
      error: 'Invalid phone number format',
    };
  }
  
  // Check if already verified
  if (verifiedContacts.has(`phone:${normalizedPhone}`)) {
    return {
      success: false,
      error: 'This phone number is already verified',
      alreadyVerified: true,
    };
  }
  
  // Check for existing pending verification
  const existingToken = Array.from(verificationTokens.entries()).find(
    ([_, data]) => data.type === 'phone' && data.phone === normalizedPhone && !data.verified
  );
  
  if (existingToken) {
    const [tokenId, tokenData] = existingToken;
    if (Date.now() - tokenData.createdAt < CONFIG.PHONE.RESEND_COOLDOWN_MINUTES * 60000) {
      return {
        success: false,
        error: `Please wait ${CONFIG.PHONE.RESEND_COOLDOWN_MINUTES} minute(s) before requesting a new code`,
        retryAfter: CONFIG.PHONE.RESEND_COOLDOWN_MINUTES * 60,
      };
    }
  }
  
  // Generate verification code
  const code = generateVerificationCode();
  const tokenId = generateToken(16);
  
  verificationTokens.set(tokenId, {
    type: 'phone',
    phone: normalizedPhone,
    code,
    token: null,
    verified: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + CONFIG.PHONE.TOKEN_EXPIRY_MINUTES * 60000,
    attempts: 0,
    resendCount: 0,
  });
  
  return {
    success: true,
    tokenId,
    phone: normalizedPhone,
    expiresIn: CONFIG.PHONE.TOKEN_EXPIRY_MINUTES * 60,
    message: `Verification code sent to ${normalizedPhone}`,
    // SMS sent via Firebase Phone Authentication
    // For testing, return the code
    testCode: process.env.NODE_ENV === 'development' ? code : undefined,
  };
}

/**
 * Verify email token
 */
function verifyEmailToken(tokenId, token) {
  const tokenData = verificationTokens.get(tokenId);
  
  if (!tokenData) {
    return {
      success: false,
      error: 'Invalid verification token',
    };
  }
  
  if (tokenData.type !== 'email') {
    return {
      success: false,
      error: 'Invalid token type',
    };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    verificationTokens.delete(tokenId);
    return {
      success: false,
      error: 'Verification token expired',
      expired: true,
    };
  }
  
  if (tokenData.token !== token) {
    tokenData.attempts++;
    if (tokenData.attempts >= 3) {
      verificationTokens.delete(tokenId);
      return {
        success: false,
        error: 'Too many failed attempts. Please request a new verification code.',
      };
    }
    return {
      success: false,
      error: 'Invalid verification code',
      attemptsRemaining: 3 - tokenData.attempts,
    };
  }
  
  // Mark as verified
  const email = tokenData.email;
  const sessionToken = generateToken();
  
  verifiedContacts.set(`email:${email}`, {
    type: 'email',
    contact: email,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + CONFIG.VERIFICATION.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
    sessionToken,
  });
  
  verificationTokens.delete(tokenId);
  
  return {
    success: true,
    email,
    sessionToken,
    message: 'Email verified successfully',
  };
}

/**
 * Verify phone code
 */
function verifyPhoneCode(tokenId, code) {
  const tokenData = verificationTokens.get(tokenId);
  
  if (!tokenData) {
    return {
      success: false,
      error: 'Invalid verification token',
    };
  }
  
  if (tokenData.type !== 'phone') {
    return {
      success: false,
      error: 'Invalid token type',
    };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    verificationTokens.delete(tokenId);
    return {
      success: false,
      error: 'Verification code expired',
      expired: true,
    };
  }
  
  if (tokenData.code !== code) {
    tokenData.attempts++;
    if (tokenData.attempts >= CONFIG.PHONE.MAX_ATTEMPTS) {
      verificationTokens.delete(tokenId);
      return {
        success: false,
        error: 'Too many failed attempts. Please request a new verification code.',
      };
    }
    return {
      success: false,
      error: 'Invalid verification code',
      attemptsRemaining: CONFIG.PHONE.MAX_ATTEMPTS - tokenData.attempts,
    };
  }
  
  // Mark as verified
  const phone = tokenData.phone;
  const sessionToken = generateToken();
  
  verifiedContacts.set(`phone:${phone}`, {
    type: 'phone',
    contact: phone,
    verifiedAt: Date.now(),
    expiresAt: Date.now() + CONFIG.VERIFICATION.SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000,
    sessionToken,
  });
  
  verificationTokens.delete(tokenId);
  
  return {
    success: true,
    phone,
    sessionToken,
    message: 'Phone verified successfully',
  };
}

/**
 * Check if session token is valid
 */
function validateSessionToken(sessionToken) {
  for (const [key, data] of verifiedContacts.entries()) {
    if (data.sessionToken === sessionToken) {
      if (Date.now() > data.expiresAt) {
        verifiedContacts.delete(key);
        return {
          valid: false,
          error: 'Session expired',
        };
      }
      return {
        valid: true,
        contact: data.contact,
        type: data.type,
      };
    }
  }
  
  return {
    valid: false,
    error: 'Invalid session token',
  };
}

/**
 * Resend verification code
 */
function resendVerificationCode(tokenId) {
  const tokenData = verificationTokens.get(tokenId);
  
  if (!tokenData) {
    return {
      success: false,
      error: 'Invalid verification token',
    };
  }
  
  if (Date.now() > tokenData.expiresAt) {
    verificationTokens.delete(tokenId);
    return {
      success: false,
      error: 'Verification token expired',
      expired: true,
    };
  }
  
  if (tokenData.resendCount >= CONFIG.EMAIL.MAX_RESEND_ATTEMPTS) {
    return {
      success: false,
      error: 'Maximum resend attempts reached',
    };
  }
  
  // Generate new code/token
  if (tokenData.type === 'email') {
    tokenData.token = generateToken();
  } else {
    tokenData.code = generateVerificationCode();
  }
  
  tokenData.resendCount++;
  tokenData.createdAt = Date.now();
  tokenData.expiresAt = Date.now() + (
    tokenData.type === 'email' 
      ? CONFIG.EMAIL.TOKEN_EXPIRY_MINUTES * 60000
      : CONFIG.PHONE.TOKEN_EXPIRY_MINUTES * 60000
  );
  tokenData.attempts = 0;
  
  return {
    success: true,
    message: `New verification code sent to ${tokenData.email || tokenData.phone}`,
    expiresIn: tokenData.type === 'email' 
      ? CONFIG.EMAIL.TOKEN_EXPIRY_MINUTES * 60
      : CONFIG.PHONE.TOKEN_EXPIRY_MINUTES * 60,
    testCode: process.env.NODE_ENV === 'development' && tokenData.type === 'phone' 
      ? tokenData.code 
      : undefined,
  };
}

/**
 * Get verification statistics
 */
function getVerificationStats() {
  const stats = {
    totalVerified: verifiedContacts.size,
    totalPending: verificationTokens.size,
    verifiedByType: { email: 0, phone: 0 },
    pendingByType: { email: 0, phone: 0 },
  };
  
  for (const data of verifiedContacts.values()) {
    stats.verifiedByType[data.type]++;
  }
  
  for (const data of verificationTokens.values()) {
    stats.pendingByType[data.type]++;
  }
  
  return stats;
}

module.exports = {
  createEmailVerification,
  createPhoneVerification,
  verifyEmailToken,
  verifyPhoneCode,
  validateSessionToken,
  resendVerificationCode,
  getVerificationStats,
  CONFIG,
};
