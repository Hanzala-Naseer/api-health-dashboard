const os = require('node:os');

const logger = require('../../lib/logger');
const env = require('../../config/env');

const endpointRepository = require('../endpoint/endpoint.repository');
const monitoringService = require('../monitoring/monitoring.service');

// Identifies this process when claiming endpoints, so leases from a crashed
// server are easy to tell apart from a live one in logs/DB.
const WORKER_ID = `${os.hostname()}:${process.pid}`;

let scheduler = null;
let isRunning = false;

// Snapshot of the most recently completed tick, exposed via getStatus()
// for the /health/scheduler endpoint. No history is kept — this is meant
// to answer "is it alive and doing something reasonable", not to be a
// full metrics store.
const lastRun = {
  startedAt: null,
  durationMs: null,
  processed: 0,
  skipped: 0,
  failed: 0,
  retries: 0,
};

// Checks currently in flight on this server, across all batches in the
// current tick.
let activeWorkers = 0;

/**
 * Determines whether endpoint should be checked.
 *
 * frequency stored in seconds.
 */
function shouldRunEndpoint(endpoint) {
  if (!endpoint.lastCheckedAt) {
    return true;
  }

  const now = Date.now();
  const lastChecked = new Date(endpoint.lastCheckedAt).getTime();
  const frequencyMs = endpoint.frequency * 1000;

  return now - lastChecked >= frequencyMs;
}

/**
 * Runs `worker` over `items` with at most `limit` running concurrently.
 * Plain Promise pool — no need for a library for something this small.
 */
async function runWithConcurrencyLimit(items, limit, worker) {
  const executing = new Set();

  for (const item of items) {
    const task = worker(item).finally(() => executing.delete(task));
    executing.add(task);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.all(executing);
}

/**
 * Claims and checks a single endpoint. If another server already claimed
 * it this cycle, it's counted as skipped rather than processed.
 */
async function processEndpoint(endpoint, runMetrics) {
  const claimed = await endpointRepository.claimEndpoint(
    endpoint._id,
    WORKER_ID,
    env.SCHEDULER_LEASE_DURATION_MS
  );

  if (!claimed) {
    runMetrics.skipped += 1;
    return;
  }

  activeWorkers += 1;

  try {
    const healthCheck = await monitoringService.checkEndpoint({
      endpointId: endpoint._id,
      userId: endpoint.userId,
    });

    runMetrics.processed += 1;
    runMetrics.retries += healthCheck.retryCount || 0;

    if (healthCheck.status === 'UP') {
      logger.info(`Health check successful → ${endpoint.name}`);
    } else {
      runMetrics.failed += 1;
      logger.warn(`Health check failed → ${endpoint.name} (${healthCheck.status})`);
    }
  } catch (error) {
    runMetrics.failed += 1;
    logger.error(`Health check execution error → ${endpoint.name}: ${error.message}`);
  } finally {
    activeWorkers -= 1;

    // Release immediately rather than waiting for the lease to expire, so
    // a fast-checking endpoint isn't blocked from its next due check.
    await endpointRepository.releaseEndpointLease(endpoint._id, WORKER_ID);
  }
}

/**
 * Filters a batch down to due endpoints and runs them with bounded
 * concurrency.
 */
async function processBatch(batch, runMetrics) {
  const dueEndpoints = batch.filter(shouldRunEndpoint);
  runMetrics.skipped += batch.length - dueEndpoints.length;

  await runWithConcurrencyLimit(
    dueEndpoints,
    env.SCHEDULER_CONCURRENCY_LIMIT,
    (endpoint) => processEndpoint(endpoint, runMetrics)
  );
}

/**
 * One scheduler cycle: streams monitoring-enabled endpoints in batches
 * (never loading the full collection into memory), claims each due
 * endpoint, and checks it with bounded concurrency.
 */
async function runSchedulerTick() {
  if (isRunning) {
    logger.warn('Previous scheduler cycle still running. Skipping this tick.');
    return;
  }

  isRunning = true;
  const tickStartedAt = new Date();
  const tickStart = Date.now();

  const runMetrics = { processed: 0, skipped: 0, failed: 0, retries: 0 };

  try {
    logger.info(`[Scheduler] Tick - ${tickStartedAt.toISOString()}`);

    const cursor = endpointRepository.getMonitoringEnabledEndpointsCursor();
    let batch = [];

    for await (const endpoint of cursor) {
      batch.push(endpoint);

      if (batch.length >= env.SCHEDULER_BATCH_SIZE) {
        await processBatch(batch, runMetrics);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await processBatch(batch, runMetrics);
    }

    logger.info(
      `[Scheduler] Tick finished — processed ${runMetrics.processed}, skipped ${runMetrics.skipped}, failed ${runMetrics.failed}, retries ${runMetrics.retries}`
    );
  } catch (error) {
    logger.error('Scheduler execution failed');
    logger.error(error);
  } finally {
    lastRun.startedAt = tickStartedAt;
    lastRun.durationMs = Date.now() - tickStart;
    lastRun.processed = runMetrics.processed;
    lastRun.skipped = runMetrics.skipped;
    lastRun.failed = runMetrics.failed;
    lastRun.retries = runMetrics.retries;

    isRunning = false;
  }
}

/**
 * Starts background monitoring scheduler.
 */
function startScheduler() {
  if (scheduler) {
    logger.warn('Monitoring scheduler is already running.');
    return;
  }

  logger.info(`Starting monitoring scheduler (worker: ${WORKER_ID})...`);

  scheduler = setInterval(runSchedulerTick, env.SCHEDULER_INTERVAL_MS);
}

/**
 * Stops the scheduler. Waits for any tick already in progress to finish
 * its currently running checks instead of cutting them off mid-request,
 * so this is safe to call during graceful shutdown.
 */
async function stopScheduler() {
  if (!scheduler) {
    return;
  }

  clearInterval(scheduler);
  scheduler = null;

  while (isRunning) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  logger.info('Monitoring scheduler stopped.');
}

/**
 * Snapshot of scheduler state for the /health/scheduler endpoint.
 */
function getStatus() {
  return {
    running: scheduler !== null,
    tickInProgress: isRunning,
    workerId: WORKER_ID,
    activeWorkers,
    lastRun: { ...lastRun },
    config: {
      intervalMs: env.SCHEDULER_INTERVAL_MS,
      batchSize: env.SCHEDULER_BATCH_SIZE,
      concurrencyLimit: env.SCHEDULER_CONCURRENCY_LIMIT,
      retryCount: env.SCHEDULER_RETRY_COUNT,
      retryBaseDelayMs: env.SCHEDULER_RETRY_BASE_DELAY_MS,
      leaseDurationMs: env.SCHEDULER_LEASE_DURATION_MS,
    },
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  getStatus,
};
