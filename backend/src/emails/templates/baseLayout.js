const env = require('../../config/env');

/** Shared wrapper so every transactional email looks consistent. */
function baseLayout({ title, bodyHtml, preheader = '' }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#111827;padding:20px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:bold;">${env.APP_NAME}</span>
        </td></tr>
        <tr><td style="padding:32px;color:#111827;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;">
          This is an automated message from ${env.APP_NAME}. If you didn't expect this email, you can safely ignore it.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

module.exports = baseLayout;
