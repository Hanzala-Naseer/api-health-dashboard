// src/modules/authentication/providers/hmac.provider.js

const crypto = require('node:crypto');

const BaseAuthenticationProvider = require('./base.provider');
const { AUTH_TYPES } = require('../../../config/constants');

/**
 * HMAC Authentication Provider.
 *
 * Generic HMAC-SHA256 request signing. Every provider's exact convention
 * differs (which fields get signed, in what order, which headers they go
 * in), so this is configurable rather than hardcoded to one vendor.
 *
 * Configuration:
 *   auth.type = 'HMAC'
 *   auth.hmacSecret = 'shared-secret'                 // required
 *   auth.hmacSignatureHeader = 'X-Signature'           // default 'X-Signature'
 *   auth.hmacTimestampHeader = 'X-Timestamp'           // default 'X-Timestamp', set '' to omit
 *   auth.hmacNonceHeader = 'X-Nonce'                   // default '', omitted unless set
 *   auth.hmacFormat = 'hex' | 'base64'                 // default 'hex'
 *   auth.hmacSignedFields = ['timestamp','method','path','body']  // order = concatenation order
 *
 * The string-to-sign is the configured fields concatenated in order
 * (e.g. timestamp + method + path + body), HMAC-SHA256'd with the secret,
 * then placed in hmacSignatureHeader. This matches the "timestamp + nonce
 * + signature, hash the body" pattern most HMAC-signed APIs use.
 */
class HmacAuthenticationProvider extends BaseAuthenticationProvider {
  getAuthType() {
    return AUTH_TYPES.HMAC;
  }

  supports(endpoint) {
    return endpoint?.auth?.type === this.getAuthType();
  }

  async getAuthenticationHeaders(endpoint, context) {
    const auth = endpoint?.auth || {};
    const secret = auth.hmacSecret;

    if (!secret || secret.trim() === '') {
      throw new Error('HMAC authentication requires an hmacSecret');
    }

    const format = auth.hmacFormat === 'base64' ? 'base64' : 'hex';
    const signatureHeader = auth.hmacSignatureHeader || 'X-Signature';
    const timestampHeader = auth.hmacTimestampHeader === '' ? null : auth.hmacTimestampHeader || 'X-Timestamp';
    const nonceHeader = auth.hmacNonceHeader || null;

    const fields = Array.isArray(auth.hmacSignedFields) && auth.hmacSignedFields.length > 0
      ? auth.hmacSignedFields
      : ['timestamp', 'method', 'path', 'body'];

    const values = {
      timestamp: String(Date.now()),
      nonce: crypto.randomUUID(),
      method: String(endpoint.method || 'GET').toUpperCase(),
      path: this._extractPath(endpoint.url),
      body: this._stringifyBody(endpoint),
    };

    const stringToSign = fields.map((field) => values[field] ?? '').join('');

     // ✅ ADD DEBUG LOGGING
  console.log('=== HMAC PROVIDER DEBUG ===');
  console.log('Fields:', fields);
  console.log('Timestamp:', values.timestamp);
  console.log('Method:', values.method);
  console.log('Path:', values.path);
  console.log('Body:', JSON.stringify(values.body));
  console.log('String to Sign:', stringToSign);
  console.log('String to Sign Length:', stringToSign.length);
  console.log('String to Sign (hex):', Buffer.from(stringToSign).toString('hex'));

    const signature = crypto.createHmac('sha256', secret).update(stringToSign).digest(format);

    const headers = {
      [signatureHeader]: signature,
    };

    if (timestampHeader) {
      headers[timestampHeader] = values.timestamp;
    }

    if (nonceHeader) {
      headers[nonceHeader] = values.nonce;
    }

    return headers;
  }

  /** Pulls just the path+query off a full URL so the signed string doesn't depend on scheme/host. */
  _extractPath(url) {
    try {
      const parsed = new URL(url);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      return url || '';
    }
  }

  _stringifyBody(endpoint) {
    if (endpoint.body == null) {
      return '';
    }
    return typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body);
  }

  validateConfiguration(endpoint) {
    const auth = endpoint?.auth || {};
    return Boolean(auth.hmacSecret && auth.hmacSecret.trim().length > 0);
  }
}

module.exports = new HmacAuthenticationProvider();
