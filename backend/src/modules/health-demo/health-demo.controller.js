// src/modules/health-demo/health-demo.controller.js

const asyncHandler = require('../../utils/asyncHandler.js');
const ApiResponse = require('../../utils/ApiResponse.js');
const ApiError = require('../../utils/ApiError.js');

const healthDemoService = require('./health-demo.service.js');

/**
 * WHY controllers stay this thin:
 * Same rationale as endpoint.controller.js — receive the already-validated
 * request, call the service, return a standardized HTTP response. Business
 * rules and database access live in the service/repository layers.
 */

// ============================================================
// AUTHENTICATION (Demo)
// ============================================================

/**
 * Demo login endpoint.
 *
 * POST /health-demo/login
 *
 * Body:
 *   { "email": "demo@pulseops.app", "password": "DemoPassword123!" }
 *
 * Response:
 *   {
 *     "success": true,
 *     "statusCode": 200,
 *     "message": "Login successful.",
 *     "data": {
 *       "accessToken": "..."
 *     }
 *   }
 *
 * This matches the default LOGIN_FLOW tokenPath: "data.accessToken"
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await healthDemoService.login({ email, password });

  return new ApiResponse(
    200,
    'Login successful.',
    result
  ).send(res);
});

/**
 * Demo authentication middleware.
 *
 * Validates the Authorization header and attaches the user info to req.user.
 *
 * This is a simplified version of the main authenticate middleware,
 * specifically for the demo endpoints.
 *
 * FIX: Uses a valid MongoDB ObjectId format for the demo user ID.
 * '000000000000000000000001' is a 24-character hex string that MongoDB
 * accepts as a valid ObjectId.
 */
const authenticateDemo = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw ApiError.unauthorized(
      'Authentication required. Please login first.',
      'NO_TOKEN'
    );
  }

  const tokenData = healthDemoService.authenticateDemoRequest(authHeader);

  if (!tokenData) {
    throw ApiError.unauthorized(
      'Invalid or expired token. Please login again.',
      'INVALID_TOKEN'
    );
  }

  // Attach user info to the request
  // Use a valid MongoDB ObjectId format (24-character hex string)
  // This ensures all database operations work correctly
  req.user = {
    id: '000000000000000000000001', // Valid ObjectId format
    email: tokenData.email,
  };

  next();
});

// ============================================================
// CRUD
// ============================================================

const createItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.createItem(req.user.id, req.body);

  return new ApiResponse(
    201,
    'Health demo item created successfully.',
    { item }
  ).send(res);
});

const getItems = asyncHandler(async (req, res) => {
  const result = await healthDemoService.getItems(
    req.user.id,
    req.query
  );

  return new ApiResponse(
    200,
    'Health demo items retrieved successfully.',
    result
  ).send(res);
});

const getItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.getItem(
    req.user.id,
    req.params.id
  );

  return new ApiResponse(
    200,
    'Health demo item retrieved successfully.',
    { item }
  ).send(res);
});

const replaceItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.replaceItem(
    req.user.id,
    req.params.id,
    req.body
  );

  return new ApiResponse(
    200,
    'Health demo item updated successfully.',
    { item }
  ).send(res);
});

const updateItem = asyncHandler(async (req, res) => {
  const item = await healthDemoService.updateItem(
    req.user.id,
    req.params.id,
    req.body
  );

  return new ApiResponse(
    200,
    'Health demo item updated successfully.',
    { item }
  ).send(res);
});

const deleteItem = asyncHandler(async (req, res) => {
  await healthDemoService.deleteItem(
    req.user.id,
    req.params.id
  );

  return new ApiResponse(
    200,
    'Health demo item deleted successfully.'
  ).send(res);
});


const staticBearer =asyncHandler (async(req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Authorization header missing.'
        });
    }

    if (authHeader !== 'Bearer pulseops-secret-token') {
        return res.status(401).json({
            success: false,
            message: 'Invalid bearer token.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Bearer authentication successful.'
    });
});


// src/modules/health-demo/health-demo.controller.js

/**
 * Demo API Key (Header) endpoint.
 * 
 * GET /health-demo/api-key-header
 * 
 * Expects: X-API-Key: pulseops-api-key
 * 
 * Returns:
 * - 200 if API key matches
 * - 401 if API key is missing or invalid
 */
const apiKeyHeader = asyncHandler(async (req, res) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key missing in headers.'
        });
    }

    // The expected API key
    const expectedApiKey = 'pulseops-api-key';

    if (apiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key.'
        });
    }

    return res.status(200).json({
        success: true,
        message: 'API key authentication successful.'
    });
});


// src/modules/health-demo/health-demo.controller.js

/**
 * Demo API Key (Query Parameter) test endpoint.
 * 
 * GET /health-demo/api-key-query?api_key=YOUR_KEY
 * 
 * Expects: ?api_key=pulseops-api-key
 * 
 * Returns:
 * - 200 if API key matches
 * - 401 if API key is missing, empty, or invalid
 */
const apiKeyQuery = asyncHandler(async (req, res) => {
    // Get the API key from query parameters
    const apiKey = req.query.api_key;

    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key missing in query parameters.'
        });
    }

    if (apiKey.trim() === '') {
        return res.status(401).json({
            success: false,
            message: 'API key cannot be empty.'
        });
    }

    // The expected API key
    const expectedApiKey = 'pulseops-api-key';

    if (apiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid API key.',
            received: apiKey,
            expected: expectedApiKey
        });
    }

    return res.status(200).json({
        success: true,
        message: 'API key authentication successful (query parameter).'
    });
});


// src/modules/health-demo/health-demo.controller.js

/**
 * Demo Basic Authentication test endpoint.
 * 
 * GET /health-demo/basic
 * 
 * Expects: Authorization: Basic <base64(username:password)>
 * 
 * Valid credentials:
 *   Username: demo
 *   Password: password123
 * 
 * Returns:
 * - 200 if credentials are valid
 * - 401 if credentials are missing or invalid
 */
const basicAuth = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Authorization header missing.'
        });
    }

    // Check if it's a Basic auth header
    if (!authHeader.startsWith('Basic ')) {
        return res.status(401).json({
            success: false,
            message: 'Invalid authorization type. Expected Basic.'
        });
    }

    // Decode the base64 credentials
    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Expected credentials
    const expectedUsername = 'demo';
    const expectedPassword = 'password123';

    if (username !== expectedUsername) {
        return res.status(401).json({
            success: false,
            message: 'Invalid username.',
            received: username,
            expected: expectedUsername
        });
    }

    if (password !== expectedPassword) {
        return res.status(401).json({
            success: false,
            message: 'Invalid password.',
            received: password,
            expected: expectedPassword
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Basic authentication successful.',
        user: { username }
    });
});


// src/modules/health-demo/health-demo.controller.js

const crypto = require('crypto');

/**
 * Demo HMAC Authentication test endpoint.
 * 
 * GET /health-demo/hmac
 * 
 * Expects:
 * - X-Signature: <HMAC signature>
 * - X-Timestamp: <timestamp>
 * - X-Nonce: <nonce> (optional)
 * 
 * Validates the HMAC signature using the secret key.
 * 
 * Returns:
 * - 200 if HMAC signature is valid
 * - 401 if signature is missing or invalid
 */
// src/modules/health-demo/health-demo.controller.js

// src/modules/health-demo/health-demo.controller.js

// src/modules/health-demo/health-demo.controller.js

// src/modules/health-demo/health-demo.controller.js

// src/modules/health-demo/health-demo.controller.js

const hmacAuth = asyncHandler(async (req, res) => {
    const signature = req.headers['x-signature'];
    const timestamp = req.headers['x-timestamp'];
    const nonce = req.headers['x-nonce'] || '';

    if (!signature) {
        return res.status(401).json({
            success: false,
            message: 'X-Signature header missing.'
        });
    }

    if (!timestamp) {
        return res.status(401).json({
            success: false,
            message: 'X-Timestamp header missing.'
        });
    }

    const secret = 'hmac-secret-key';
    const method = req.method.toUpperCase();
    const path = req.originalUrl;
    const body = ''; // For GET requests

    // ✅ MATCH THE PROVIDER'S EXACT FORMAT
    // Fields: timestamp, nonce, method, path
    const stringToSign = `${timestamp}${nonce}${method}${path}`;
    
    console.log('=== HMAC SIGNATURE DEBUG ===');
    console.log('Timestamp:', timestamp);
    console.log('Nonce:', nonce);
    console.log('Method:', method);
    console.log('Path:', path);
    console.log('String to Sign:', stringToSign);
    console.log('Received Signature:', signature);
    
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(stringToSign)
        .digest('hex');
    
    console.log('Expected Signature:', expectedSignature);
    console.log('Match:', signature === expectedSignature);

    if (signature !== expectedSignature) {
        return res.status(401).json({
            success: false,
            message: 'Invalid HMAC signature.',
            received: signature,
            expected: expectedSignature,
            stringToSign: stringToSign
        });
    }

    return res.status(200).json({
        success: true,
        message: 'HMAC authentication successful.'
    });
});



const oauthToken = asyncHandler((req, res) => {

    console.log(req.body);

  const { grant_type, client_id, client_secret } = req.body;

  if (
    grant_type !== 'client_credentials' ||
    client_id !== 'demo-client' ||
    client_secret !== 'demo-secret'
  ) {
    return res.status(401).json({
      error: 'invalid_client'
    });
  }

  return res.status(200).json({
    access_token: 'demo-oauth-token',
    token_type: 'Bearer',
    expires_in: 3600
  });
});

const oauthResource = asyncHandler((req, res) => {
  const auth = req.headers.authorization;

  if (auth !== 'Bearer demo-oauth-token') {
    return res.status(401).json({
      error: 'invalid_token'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'OAuth2 resource accessed successfully.'
  });
});
// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Authentication
  login,
  authenticateDemo,
  // CRUD
  createItem,
  getItems,
  getItem,
  replaceItem,
  updateItem,
  deleteItem,
  staticBearer,
  apiKeyHeader,
  apiKeyQuery,
  basicAuth,
  hmacAuth,
  oauthToken,
  oauthResource
};