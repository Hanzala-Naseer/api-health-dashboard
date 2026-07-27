// src/modules/authentication/helpers/cookieJar.js

/**
 * Cookie Jar — minimal Set-Cookie tracking for multi-step login flows.
 *
 * WHY: Session-based auth (login -> receive session cookie -> use it on
 * every request) is extremely common. This intentionally only tracks
 * name=value pairs — it ignores cookie attributes (Path, Domain, Expires,
 * HttpOnly, Secure, SameSite) because for a monitoring check hitting one
 * fixed URL, those attributes don't change the outcome; a full RFC 6265
 * cookie jar would be a lot of complexity for no practical benefit here.
 */
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  /**
   * Reads any Set-Cookie headers off a response and stores them.
   * Axios normalizes 'set-cookie' to an array of raw header strings
   * (one per cookie) when present.
   */
  applyResponseHeaders(headers) {
    const setCookie = headers?.['set-cookie'];

    if (!setCookie) {
      return;
    }

    const rawCookies = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const rawCookie of rawCookies) {
      const [pair] = rawCookie.split(';'); // drop attributes, keep name=value
      const eqIndex = pair.indexOf('=');

      if (eqIndex === -1) {
        continue;
      }

      const name = pair.slice(0, eqIndex).trim();
      const value = pair.slice(eqIndex + 1).trim();

      if (name) {
        this.cookies.set(name, value);
      }
    }
  }

  get(name) {
    return this.cookies.get(name) ?? null;
  }

  /** Returns a "name=value; name2=value2" Cookie header, or null if empty. */
  toHeader() {
    if (this.cookies.size === 0) {
      return null;
    }

    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}

module.exports = { CookieJar };
