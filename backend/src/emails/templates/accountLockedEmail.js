const baseLayout = require('./baseLayout');
const env = require('../../config/env');

function accountLockedEmail({ firstName, lockDurationMinutes, ipAddress }) {
  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>Your ${env.APP_NAME} account has been temporarily locked after too many failed sign-in attempts${
    ipAddress ? ` (most recent attempt from IP ${ipAddress})` : ''
  }.</p>
    <p>Your account will automatically unlock in <strong>${lockDurationMinutes} minutes</strong>. You don't need to do anything.</p>
    <p style="color:#b91c1c;font-weight:bold;">If this wasn't you, someone may be trying to access your account. Consider resetting your password once it unlocks.</p>
  `;

  return {
    subject: `Your ${env.APP_NAME} account was temporarily locked`,
    html: baseLayout({ title: 'Account Locked', bodyHtml, preheader: 'Too many failed sign-in attempts' }),
    text: `Your ${env.APP_NAME} account was locked after too many failed sign-in attempts. It will unlock automatically in ${lockDurationMinutes} minutes.`,
  };
}

module.exports = accountLockedEmail;
