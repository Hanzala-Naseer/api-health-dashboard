const mongoose = require('mongoose');
const env = require('../config/env');
const logger = require('./logger');

/**
 * WHY a singleton connection:
 * Every `mongoose.connect()` call opens its own connection pool. In dev,
 * hot reload (nodemon) can trigger dozens of connect calls and exhaust
 * MongoDB's connection limit. In prod, only one connection should be
 * established per process. We guard with a module-level flag so repeated
 * `require('./db')` calls (and repeated `connect()` calls) are no-ops once
 * connected — mirroring the same global-singleton pattern the old
 * `lib/prisma.js` used.
 */

mongoose.set('strictQuery', true);

let isConnected = false;

mongoose.connection.on('connected', () => logger.info('[mongoose] connection established'));
mongoose.connection.on('error', (err) => logger.error(`[mongoose:error] ${err.message}`));
mongoose.connection.on('disconnected', () => logger.warn('[mongoose] connection lost'));

if (env.NODE_ENV === 'development') {
  mongoose.set('debug', (collectionName, method, query, doc) => {
    logger.debug(`[mongoose:query] ${collectionName}.${method} ${JSON.stringify(query)}`);
  });
}

/** Fail fast if MongoDB is unreachable rather than accepting traffic and erroring on every request. */
async function connect() {
  if (isConnected) return mongoose.connection;

  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
  });

  isConnected = true;
  return mongoose.connection;
}

async function disconnect() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
}

module.exports = { mongoose, connect, disconnect };
