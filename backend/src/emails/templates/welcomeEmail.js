const baseLayout = require('./baseLayout');
const env = require('../../config/env');

function welcomeEmail({ firstName }) {
  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>Your email is verified and your ${env.APP_NAME} account is ready to go. Welcome aboard!</p>
    <p style="margin-top:24px;">
      <a href="${env.CLIENT_URL}/login" style="background:#111827;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Log in to ${env.APP_NAME}</a>
    </p>
  `;

  return {
    subject: `Welcome to ${env.APP_NAME}!`,
    html: baseLayout({ title: 'Welcome', bodyHtml, preheader: 'Your account is ready.' }),
    text: `Hi ${firstName || 'there'}, your ${env.APP_NAME} account is verified and ready to go. Log in at ${env.CLIENT_URL}/login`,
  };
}

module.exports = welcomeEmail;
