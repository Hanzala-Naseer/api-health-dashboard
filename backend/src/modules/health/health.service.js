const os = require('node:os');
const { performance } = require('node:perf_hooks');
const { mongoose } = require('../../lib/db');

/**
 * FEATURE 4: Health Endpoints
 *
 * All checks here are strictly read-only diagnostics. None of them create,
 * update, or delete any PulseOps business data — they only report on the
 * current state of the process/database so customers have safe,
 * production-style endpoints to configure monitoring against.
 */

const MONGOOSE_READY_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Overall aggregate health — combines database + system into one response,
 * mirroring what a real production `/health` endpoint typically returns.
 */
async function getOverallHealth() {
  const [database, system] = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkSystem()),
  ]);

  const status = database.status === 'UP' ? 'UP' : 'DEGRADED';

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database,
    system,
  };
}

/**
 * Pings the database connection to confirm connectivity. Never issues a
 * write — `admin().ping()` is a pure connectivity check.
 */
async function checkDatabase() {
  const start = performance.now();
  const readyState = mongoose.connection.readyState;

  try {
    if (readyState !== 1) {
      return {
        status: 'DOWN',
        state: MONGOOSE_READY_STATES[readyState] || 'unknown',
        responseTime: null,
      };
    }

    await mongoose.connection.db.admin().ping();

    return {
      status: 'UP',
      state: MONGOOSE_READY_STATES[readyState] || 'unknown',
      responseTime: Math.round(performance.now() - start),
    };
  } catch (error) {
    return {
      status: 'DOWN',
      state: MONGOOSE_READY_STATES[readyState] || 'unknown',
      responseTime: null,
      errorMessage: error.message,
    };
  }
}

/**
 * Confirms the authentication pipeline is functioning. By the time this
 * runs, the `authenticate` middleware has already verified the JWT and
 * looked up an active session/user — this simply reflects that back in a
 * structured shape so customers can monitor "is auth still working".
 */
function checkAuth(user) {
  return {
    status: 'UP',
    userId: user?.id || null,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Basic process/system diagnostics — memory, uptime, platform. Read-only.
 */
function checkSystem() {
  const memoryUsage = process.memoryUsage();

  return {
    status: 'UP',
    nodeVersion: process.version,
    platform: os.platform(),
    uptimeSeconds: Math.round(process.uptime()),
    memory: {
      rss: memoryUsage.rss,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
    },
    loadAverage: os.loadavg(),
  };
}

module.exports = {
  getOverallHealth,
  checkDatabase,
  checkAuth,
  checkSystem,
};
