const baseLayout = require('./baseLayout');

function alertDownEmail({
  endpointName,
  errorType,
  errorMessage,
  detectedAt,
}) {

  const bodyHtml = `

    <h2 style="margin-top:0;color:#dc2626;">
      🚨 Endpoint Down
    </h2>

    <p>
      PulseOps detected that one of your monitored endpoints is currently unavailable.
    </p>

    <div
      style="
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:8px;
        padding:18px;
        margin:24px 0;
      "
    >

      <table
        width="100%"
        cellpadding="6"
        cellspacing="0"
      >

        <tr>
          <td><strong>Endpoint</strong></td>
          <td>${endpointName}</td>
        </tr>

        <tr>
          <td><strong>Status</strong></td>
          <td style="color:#dc2626;font-weight:bold;">
            DOWN
          </td>
        </tr>

        <tr>
          <td><strong>Error Type</strong></td>
          <td>${errorType || 'UNKNOWN'}</td>
        </tr>

        <tr>
          <td><strong>Reason</strong></td>
          <td>${errorMessage || 'Endpoint unreachable'}</td>
        </tr>

        <tr>
          <td><strong>Detected At</strong></td>
          <td>${detectedAt}</td>
        </tr>

      </table>

    </div>

    <p>
      Please investigate the issue to restore availability as soon as possible.
    </p>

  `;

  return {

    subject: `🚨 ${endpointName} is DOWN`,

    html: baseLayout({

      title: 'Endpoint Down',

      preheader: `${endpointName} is currently unavailable.`,

      bodyHtml,

    }),

    text:
`${endpointName} is DOWN

Status: DOWN
Error Type: ${errorType || 'UNKNOWN'}
Reason: ${errorMessage || 'Endpoint unreachable'}
Detected: ${detectedAt}`

  };

}

module.exports = alertDownEmail;