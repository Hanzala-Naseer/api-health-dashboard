const winston = require('winston');
const env = require('../config/env');

/**
 * WHY a real logger instead of console.log:
 * - Structured (JSON in prod) logs are queryable in log aggregators (ELK, Datadog, CloudWatch).
 * - Log levels let us silence debug noise in production without code changes.
 * - Every other module (audit, security events, error handler) depends on this.
 */
const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${ts} [${level}]: ${stack || message}${metaStr}`;
  })
);

const prodFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = logger;
