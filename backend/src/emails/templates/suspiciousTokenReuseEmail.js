const baseLayout = require('./baseLayout');
const env = require('../../config/env');

/**
 * Sent when a refresh token that was already rotated out gets replayed —
 * the strongest signal available that a refresh token was stolen (e.g.
 * exfiltrated from storage, intercepted) and is being used by someone other
 * than the legitimate holder of the current, rotated token.
 */
function suspiciousTokenReuseEmail({ firstName, ipAddress }) {
  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>We detected an attempt to reuse an old, already-replaced sign-in token on your
    ${env.APP_NAME} account${ipAddress ? ` from IP address ${ipAddress}` : ''}.</p>
    <p>As a precaution, <strong>we've signed you out of all devices</strong>. Please log in
    again and change your password if you don't recognize this activity.</p>
  `;

  return {
    subject: `Security alert: you've been signed out of all ${env.APP_NAME} devices`,
    html: baseLayout({
      title: 'Security Alert',
      bodyHtml,
      preheader: 'Suspicious activity detected — you were signed out everywhere.',
    }),
    text: `Suspicious activity was detected on your ${env.APP_NAME} account and you've been signed out of all devices as a precaution. If this wasn't expected, please change your password immediately.`,
  };
}

module.exports = suspiciousTokenReuseEmail;
