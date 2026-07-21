const baseLayout = require('./baseLayout');
const env = require('../../config/env');

function otpEmail({ firstName, otp, purposeLabel = 'verify your email', expiryMinutes = env.OTP_EXPIRY_MINUTES }) {
  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>Use the code below to ${purposeLabel}. This code expires in <strong>${expiryMinutes} minutes</strong>.</p>
    <div style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;font-size:32px;letter-spacing:8px;font-weight:bold;background:#f3f4f6;padding:16px 24px;border-radius:8px;color:#111827;">${otp}</span>
    </div>
    <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email — your account is still secure.</p>
  `;

  return {
    subject: `Your ${env.APP_NAME} verification code`,
    html: baseLayout({ title: 'Verification Code', bodyHtml, preheader: `Your code is ${otp}` }),
    text: `Your ${env.APP_NAME} verification code is ${otp}. It expires in ${expiryMinutes} minutes.`,
  };
}

module.exports = otpEmail;
