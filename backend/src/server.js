const app = require('./app');
const env = require('./config/env');
const logger = require('./lib/logger');
const db = require('./lib/db');

const {
  startScheduler,
} = require('./modules/scheduler/scheduler.service');

let server;

async function start() {
  // Fail fast if the database is unreachable rather than accepting traffic
  // and erroring on every request.
  await db.connect();
  logger.info('✅ Database connected');

  server = app.listen(env.PORT, () => {
    logger.info(`🚀 ${env.APP_NAME} auth service running on port ${env.PORT} [${env.NODE_ENV}]`);
    startScheduler();
  });
}

// --- Process-level safety nets ---
// WHY: an uncaught exception or unhandled rejection left unmanaged can
// crash the process mid-request (or worse, leave it in a corrupted state
// that keeps serving requests incorrectly). We log with full context and
// shut down cleanly so the process manager (PM2/Docker/k8s) restarts us
// into a known-good state.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.stack || reason}`);
  gracefulShutdown(1);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
  gracefulShutdown(1);
});

process.on('SIGTERM', () => gracefulShutdown(0));
process.on('SIGINT', () => gracefulShutdown(0));

async function gracefulShutdown(code) {
  logger.info('Shutting down gracefully...');
  try {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await db.disconnect();
  } catch (err) {
    logger.error(`Error during shutdown: ${err.message}`);
  } finally {
    process.exit(code);
  }
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.stack || err.message}`);
  process.exit(1);
});
