// src/modules/health-demo/health-demo.service.js

const ApiError = require('../../utils/ApiError.js');
const { generateSecureToken, sha256 } = require('../../utils/crypto.js');
const healthDemoRepository = require('./health-demo.repository.js');

// Simple in-memory token store for demo purposes
// In production, this would use JWT or a proper session store
const demoTokenStore = new Map();

// Demo credentials (hardcoded for testing)
const DEMO_EMAIL = 'demo@pulseops.app';
const DEMO_PASSWORD = 'DemoPassword123!';

// ============================================================
// RESPONSE MAPPING
// ============================================================

/**
 * ---------------------------------------------------------------------
 * RESPONSE MAPPING
 * ---------------------------------------------------------------------
 * Never expose the raw Mongoose document.
 */
function toItemResponse(item) {
  return {
    id: item._id || item.id,
    name: item.name,
    description: item.description,
    sku: item.sku,
    price: item.price,
    quantity: item.quantity,
    status: item.status,
    metadata: item.metadata || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ============================================================
// AUTHENTICATION (Demo Only)
// ============================================================

/**
 * Demo login endpoint.
 *
 * Returns a token that can be used to authenticate subsequent requests.
 *
 * Response format:
 *   {
 *     data: {
 *       accessToken: "..."
 *     }
 *   }
 *
 * This matches the default LOGIN_FLOW tokenPath: "data.accessToken"
 */
async function login({ email, password }) {
  // Validate credentials
  if (!email || email.trim() === '') {
    throw ApiError.badRequest('Email is required.', 'EMAIL_REQUIRED');
  }

  if (!password || password.trim() === '') {
    throw ApiError.badRequest('Password is required.', 'PASSWORD_REQUIRED');
  }

  // Check credentials (hardcoded for demo)
  if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
    throw ApiError.unauthorized('Invalid credentials.', 'INVALID_CREDENTIALS');
  }

  // Generate a token
  const token = generateSecureToken(32);
  const tokenHash = sha256(token);

  // Store the token with expiry (1 hour)
  demoTokenStore.set(tokenHash, {
    email,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  return {
    accessToken: token,
  };
}

/**
 * Validates a demo token.
 *
 * @param {string} token - The token to validate
 * @returns {Object|null} - The token data if valid, null otherwise
 */
function validateToken(token) {
  if (!token) return null;

  const tokenHash = sha256(token);
  const tokenData = demoTokenStore.get(tokenHash);

  if (!tokenData) return null;

  // Check expiry
  if (tokenData.expiresAt && tokenData.expiresAt.getTime() < Date.now()) {
    demoTokenStore.delete(tokenHash);
    return null;
  }

  return tokenData;
}

/**
 * Checks if a request is authenticated with a valid demo token.
 *
 * @param {string} authorizationHeader - The Authorization header value
 * @returns {Object|null} - The token data if valid, null otherwise
 */
function authenticateDemoRequest(authorizationHeader) {
  if (!authorizationHeader) return null;

  // Support both "Bearer <token>" and just "<token>" (for flexibility)
  let token = authorizationHeader;
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  return validateToken(token);
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

/**
 * ---------------------------------------------------------------------
 * CREATE ITEM
 * ---------------------------------------------------------------------
 * Every item is scoped to the authenticated user, exactly like a real
 * PulseOps CRUD resource, but written to the isolated HealthDemoItem
 * collection — never a business collection.
 */
async function createItem(userId, payload) {
  const item = await healthDemoRepository.createItem({
    userId,
    ...payload,
  });

  return toItemResponse(item);
}

async function getItems(userId, query) {
  const {
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder,
  } = query;

  const filter = {
    userId,
  };

  if (status) {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      {
        name: {
          $regex: search,
          $options: 'i',
        },
      },
      {
        sku: {
          $regex: search,
          $options: 'i',
        },
      },
    ];
  }

  const sort = {
    [sortBy]: sortOrder === 'asc' ? 1 : -1,
  };

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    healthDemoRepository.findItems(filter, {
      skip,
      limit,
      sort,
    }),
    healthDemoRepository.countItems(filter),
  ]);

  return {
    items: items.map(toItemResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getItem(userId, itemId) {
  const item = await healthDemoRepository.findByIdAndUser(itemId, userId);

  if (!item) {
    throw ApiError.notFound(
      'Health demo item not found.',
      'HEALTH_DEMO_ITEM_NOT_FOUND'
    );
  }

  return toItemResponse(item);
}

async function replaceItem(userId, itemId, payload) {
  const item = await healthDemoRepository.findByIdAndUser(itemId, userId);

  if (!item) {
    throw ApiError.notFound(
      'Health demo item not found.',
      'HEALTH_DEMO_ITEM_NOT_FOUND'
    );
  }

  const updatedItem = await healthDemoRepository.updateItem(itemId, payload);

  return toItemResponse(updatedItem);
}

async function updateItem(userId, itemId, payload) {
  const item = await healthDemoRepository.findByIdAndUser(itemId, userId);

  if (!item) {
    throw ApiError.notFound(
      'Health demo item not found.',
      'HEALTH_DEMO_ITEM_NOT_FOUND'
    );
  }

  const updatedItem = await healthDemoRepository.updateItem(itemId, payload);

  return toItemResponse(updatedItem);
}

async function deleteItem(userId, itemId) {
  const item = await healthDemoRepository.findByIdAndUser(itemId, userId);

  if (!item) {
    throw ApiError.notFound(
      'Health demo item not found.',
      'HEALTH_DEMO_ITEM_NOT_FOUND'
    );
  }

  await healthDemoRepository.deleteItem(itemId);
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // CRUD
  createItem,
  getItems,
  getItem,
  replaceItem,
  updateItem,
  deleteItem,
  // Authentication (Demo)
  login,
  validateToken,
  authenticateDemoRequest,
};