const baseLayout = require('./baseLayout');
const env = require('../../config/env');

function passwordResetEmail({ firstName, rawToken, expiryMinutes = env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES }) {
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;

  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>We received a request to reset your ${env.APP_NAME} password. Click the button below
    to choose a new one. This link expires in <strong>${expiryMinutes} minutes</strong>.</p>
    <p style="margin:24px 0;">
      <a href="${resetUrl}" style="background:#111827;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset your password</a>
    </p>
    <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
  `;

  return {
    subject: `Reset your ${env.APP_NAME} password`,
    html: baseLayout({ title: 'Reset Password', bodyHtml, preheader: 'Reset your password' }),
    text: `Reset your ${env.APP_NAME} password: ${resetUrl} (expires in ${expiryMinutes} minutes)`,
  };
}

module.exports = passwordResetEmail;
