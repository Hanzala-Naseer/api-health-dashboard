const baseLayout = require('./baseLayout');
const env = require('../../config/env');

function newDeviceLoginEmail({ firstName, deviceName, browserName, osName, ipAddress, loginTime }) {
  const deviceDescription = [browserName, osName].filter(Boolean).join(' on ') || deviceName || 'an unknown device';

  const bodyHtml = `
    <p>Hi ${firstName || 'there'},</p>
    <p>We noticed a new sign-in to your ${env.APP_NAME} account from a device we haven't seen before:</p>
    <table style="width:100%;margin:16px 0;font-size:14px;color:#374151;">
      <tr><td style="padding:4px 0;color:#6b7280;">Device</td><td style="padding:4px 0;text-align:right;">${deviceDescription}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">IP address</td><td style="padding:4px 0;text-align:right;">${ipAddress || 'Unknown'}</td></tr>
      <tr><td style="padding:4px 0;color:#6b7280;">Time</td><td style="padding:4px 0;text-align:right;">${loginTime}</td></tr>
    </table>
    <p>If this was you, no action is needed.</p>
    <p style="color:#b91c1c;font-weight:bold;">If you don't recognize this activity, change your password immediately and contact support.</p>
  `;

  return {
    subject: `New sign-in to your ${env.APP_NAME} account`,
    html: baseLayout({ title: 'New Device Login', bodyHtml, preheader: 'New sign-in detected on your account' }),
    text: `New sign-in detected from ${deviceDescription} (${ipAddress || 'unknown IP'}) at ${loginTime}. If this wasn't you, change your password immediately.`,
  };
}

module.exports = newDeviceLoginEmail;
