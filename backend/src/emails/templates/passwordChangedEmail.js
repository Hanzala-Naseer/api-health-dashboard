const baseLayout = require('./baseLayout');
const env = require('../../config/env');

function passwordChangedEmail({ firstName, ipAddress }) {
  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>Your ${env.APP_NAME} password was just changed${ipAddress ? ` from IP address ${ipAddress}` : ''}.</p>
    <p>For your security, you've been signed out of all other devices — you'll need to log in
    again anywhere else you were signed in.</p>
    <p style="color:#b91c1c;font-weight:bold;">If you didn't make this change, contact support immediately.</p>
  `;

  return {
    subject: `Your ${env.APP_NAME} password was changed`,
    html: baseLayout({ title: 'Password Changed', bodyHtml, preheader: 'Your password was just changed' }),
    text: `Your ${env.APP_NAME} password was just changed. If this wasn't you, contact support immediately.`,
  };
}

module.exports = passwordChangedEmail;
