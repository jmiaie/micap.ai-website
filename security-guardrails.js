// Security Guardrails for Gemini API
// Prevents abuse, limits free tier usage, and protects against bot attacks

const logger = require('./logger');

// In-memory tracking for rate limiting and cost monitoring
const apiUsageTracker = {
  userRequests: {},      // userId -> { count, lastReset, totalCost }
  ipRequests: {},        // IP -> { count, lastReset }
  dailySpend: 0,
  dailyResetTime: Date.now()
};

const GUARDRAILS = {
  maxRequestsPerUserPerDay: 2,        // 2 requests per verified user per day
  maxRequestsPerIPPerHour: 10,        // 10 requests per IP per hour
  maxInputTokens: 500,                // Prevent prompt injection
  maxOutputTokens: 1000,              // Cap response size
  costPerRequest: 0.001,              // ~$0.001 per request
  dailySpendCap: 5,                   // $5/day max spend
  requestTimeoutMs: 30000,            // 30 second timeout
  allowedIndustries: [
    'Technology', 'Finance', 'Healthcare', 'Retail',
    'Manufacturing', 'Education', 'Government', 'Energy',
    'Telecommunications', 'Media', 'Real Estate', 'Hospitality'
  ]
};

// Suspicious patterns to block (prompt injection prevention)
const SUSPICIOUS_PATTERNS = [
  /ignore previous/i,
  /system prompt/i,
  /jailbreak/i,
  /execute code/i,
  /sql injection/i,
  /script.*tag/i,
  /eval\(/i,
  /function.*return/i,
  /process\.env/i,
  /require\(/i,
  /import /i
];

// Reset daily spend counter at midnight
function resetDailySpendIfNeeded() {
  const now = Date.now();
  const hoursSinceReset = (now - apiUsageTracker.dailyResetTime) / (1000 * 60 * 60);
  if (hoursSinceReset >= 24) {
    apiUsageTracker.dailySpend = 0;
    apiUsageTracker.dailyResetTime = now;
    logger.info('Daily spend counter reset', { component: 'security-guardrails' });
  }
}

// Get user IP address
function getUserIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress || 'unknown';
}

// Validate input fields
function validateInput(companyName, industry, companySize, painPoints) {
  const errors = [];

  if (!companyName || companyName.length > 200) {
    errors.push('Company name must be 1-200 characters');
  }

  if (!industry || !GUARDRAILS.allowedIndustries.includes(industry)) {
    errors.push(`Industry must be one of: ${GUARDRAILS.allowedIndustries.join(', ')}`);
  }

  if (!companySize || companySize.length > 100) {
    errors.push('Company size must be 1-100 characters');
  }

  if (!painPoints || painPoints.length > 500) {
    errors.push('Pain points must be 1-500 characters');
  }

  // Check for suspicious patterns
  const allInput = `${companyName} ${industry} ${companySize} ${painPoints}`.toLowerCase();
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(allInput)) {
      errors.push('Input contains suspicious patterns');
      break;
    }
  }

  return errors;
}

// Validate API response
function validateUseCases(useCases) {
  if (!Array.isArray(useCases) || useCases.length !== 3) {
    throw new Error('Response must contain exactly 3 use cases');
  }

  useCases.forEach((useCase, index) => {
    if (!useCase.title || useCase.title.length > 100) {
      throw new Error(`Use case ${index + 1}: Invalid title`);
    }
    if (!useCase.description || useCase.description.length > 500) {
      throw new Error(`Use case ${index + 1}: Invalid description`);
    }
    if (typeof useCase.annualSavings !== 'number' || useCase.annualSavings < 0 || useCase.annualSavings > 10_000_000) {
      throw new Error(`Use case ${index + 1}: Annual savings out of bounds (0-$10M)`);
    }
    if (typeof useCase.roi !== 'number' || useCase.roi < 0 || useCase.roi > 1000) {
      throw new Error(`Use case ${index + 1}: ROI out of bounds (0-1000%)`);
    }
    if (!useCase.timeline || useCase.timeline.length > 50) {
      throw new Error(`Use case ${index + 1}: Invalid timeline`);
    }
  });

  return useCases;
}

module.exports = {
  apiUsageTracker,
  GUARDRAILS,
  resetDailySpendIfNeeded,
  getUserIP,
  validateInput,
  validateUseCases
};
