// src/modules/authentication/index.js

/**
 * Authentication Module — V1.5
 *
 * Barrel export for all authentication-related components.
 *
 * Usage:
 *   const authService = require('./authentication');
 *   const headers = await authService.getAuthenticationHeaders(endpoint);
 */

const authenticationService = require('./authentication.service');

// Export the main service as the default
module.exports = authenticationService;

// Also export individual components for testing/advanced usage
module.exports.AuthenticationService = require('./authentication.service');
module.exports.TokenExtractor = require('./helpers/tokenExtractor');

module.exports.Providers = {
  NoneProvider: require('./providers/none.provider'),
  StaticBearerProvider: require('./providers/staticBearer.provider'),
  ApiKeyProvider: require('./providers/apiKey.provider'),
  BasicProvider: require('./providers/basic.provider'),
  LoginFlowProvider: require('./providers/loginFlow.provider'),
};