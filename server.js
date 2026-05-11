/**
 * Micap AI - Main Server File (Refactored)
 * Routes are now organized into separate modules for better maintainability
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// Initialize Sentry for error monitoring (MUST be first)
const Sentry = require('@sentry/node');
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    debug: process.env.SENTRY_DEBUG === 'true',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({
        request: true,
        serverName: true,
        transaction: true,
        user: true,
        ip: true,
      }),
    ],
    ignoreErrors: [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'Non-Error promise rejection detected',
    ],
  });
  logger.info('✅ Sentry initialized for error monitoring', { component: 'sentry' });
} else {
  logger.warn('⚠️  Sentry DSN not provided. Error monitoring disabled.', { component: 'sentry' });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Add Sentry request handler FIRST (before other middleware)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Import route modules (database-backed versions)
const { registerVerificationRoutes } = require('./routes/verification-db');
const { registerUseCaseRoutes } = require('./routes/useCases');
const { registerLeadRoutes } = require('./routes/leads-db');
const { registerChatRoutes } = require('./routes/chat-messages');

// Initialize database and register routes
const { initializeDatabase } = require('./db');

logger.info('Initializing database...', { component: 'startup' });
initializeDatabase().then(() => {
  logger.info('Database initialized successfully', { component: 'startup' });
  logger.info('Registering database-backed route modules...', { component: 'startup' });
  registerVerificationRoutes(app);
  registerUseCaseRoutes(app);
  registerLeadRoutes(app);
  registerChatRoutes(app);
}).catch((error) => {
  logger.error('Database initialization failed', { error: error.message, component: 'startup' });
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }
  process.exit(1);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  logger.info('Health check', { component: 'health' });
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add Sentry error handler BEFORE other error handlers
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Route all requests to index.html for SPA support (must be last)
app.get('*', (req, res) => {
  // If the request is for an HTML file, serve it
  const filePath = path.join(__dirname, req.path);
  if (req.path.endsWith('.html') || req.path === '/') {
    res.sendFile(path.join(__dirname, req.path === '/' ? 'index.html' : req.path));
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server started successfully`, { port: PORT, environment: process.env.NODE_ENV || 'development', component: 'startup' });
  logger.info(`AI Endpoints: POST /api/generate-use-cases`, { component: 'startup' });
  logger.info(`Lead Capture Endpoints: POST /api/leads/store, GET /api/leads`, { component: 'startup' });
  logger.info(`Verification Endpoints available`, { component: 'startup' });
  if (process.env.SENTRY_DSN) {
    logger.info(`Sentry error monitoring active`, { component: 'startup' });
  }
});

// Graceful shutdown with Sentry flush
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server', { component: 'shutdown' });
  server.close(async () => {
    logger.info('HTTP server closed', { component: 'shutdown' });
    if (process.env.SENTRY_DSN) {
      await Sentry.close(2000);
      logger.info('Sentry flushed', { component: 'shutdown' });
    }
    process.exit(0);
  });
});

module.exports = app;
