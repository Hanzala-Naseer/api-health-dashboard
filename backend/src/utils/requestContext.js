const { UAParser } = require('ua-parser-js');

/**
 * WHY: Device tracking, login history, session records, and security-event
 * logging ALL need the same three things: IP, User-Agent, and parsed device
 * info. Extracting this in one place guarantees consistency (e.g. correct
 * handling of X-Forwarded-For behind a proxy/load balancer) instead of every
 * feature re-implementing it slightly differently.
 */
function getRequestContext(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : req.socket?.remoteAddress || req.ip || null;

  const userAgentRaw = req.headers['user-agent'] || '';
  const parser = new UAParser(userAgentRaw);
  const ua = parser.getResult();

  return {
    ipAddress,
    userAgent: userAgentRaw,
    deviceType: ua.device.type || 'desktop', // mobile | tablet | desktop | unknown
    deviceName: [ua.device.vendor, ua.device.model].filter(Boolean).join(' ') || null,
    osName: ua.os.name || null,
    osVersion: ua.os.version || null,
    browserName: ua.browser.name || null,
    browserVersion: ua.browser.version || null,
    // Client-supplied device fingerprint (e.g. generated on the frontend and
    // sent as a header) — optional, used to recognize "known" devices for
    // new-device login alerts.
    deviceId: req.headers['x-device-id'] || null,
  };
}

module.exports = { getRequestContext };
