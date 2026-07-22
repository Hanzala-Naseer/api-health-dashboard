const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const env = require('./config/env');
const logger = require('./lib/logger');
const { globalLimiter } = require('./middlewares/rateLimiter.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');

const authRoutes = require('./modules/auth/auth.routes');
const endpointRoutes=require("./modules/endpoint/endpoint.routes");
const monitoringRoutes=require("./modules/monitoring/monitoring.routes");
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');

const ApiResponse = require('./utils/ApiResponse');

const app = express();

// Trust the first proxy hop (load balancer/reverse proxy) so req.ip and
// X-Forwarded-For are honored correctly — required for accurate IP
// tracking/rate-limiting in production behind e.g. Nginx, Render, Railway.
app.set('trust proxy', 1);

// --- Security headers ---
app.use(helmet());

// --- CORS ---
// WHY credentials:true + explicit origin (not '*'): auth uses HTTP-only
// cookies for refresh tokens, which requires the browser to send
// credentials cross-origin — that's only allowed with a specific origin,
// never a wildcard.
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
  })
);

// --- Body / cookie parsing ---
app.use(express.json({ limit: '10kb' })); // cap body size — defends against large-payload DoS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// --- Request logging ---
app.use(
  morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http?.(msg.trim()) || logger.info(msg.trim()) },
  })
);

// --- Global rate limiting (per-route stricter limiters applied inside auth.routes.js) ---
app.use('/api', globalLimiter);

// --- Health check (unauthenticated, used by load balancers/uptime monitors) ---
app.get('/health', (req, res) => {
  return new ApiResponse(200, 'OK', { uptime: process.uptime(), timestamp: new Date().toISOString() }).send(res);
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/endpoints', endpointRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics',analyticsRoutes);

// --- 404 + centralized error handler (must be last) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
