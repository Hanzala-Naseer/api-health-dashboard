const baseLayout = require('./baseLayout');

function alertRecoveryEmail({
  endpointName,
  recoveredAt,
}) {

  const bodyHtml = `

    <h2 style="margin-top:0;color:#16a34a;">
      ✅ Endpoint Recovered
    </h2>

    <p>
      Great news! PulseOps has detected that your monitored endpoint is responding normally again.
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
          <td style="color:#16a34a;font-weight:bold;">
            UP
          </td>
        </tr>

        <tr>
          <td><strong>Recovered At</strong></td>
          <td>${recoveredAt}</td>
        </tr>

        <tr>
          <td><strong>Monitoring</strong></td>
          <td>Active</td>
        </tr>

      </table>

    </div>

    <div
      style="
        background:#ecfdf5;
        border-left:4px solid #16a34a;
        padding:16px;
        margin:24px 0;
        border-radius:6px;
      "
    >
      <strong style="color:#166534;">
        ✔ Service Restored
      </strong>

      <p style="margin:10px 0 0;">
        Your endpoint is healthy again and PulseOps will continue monitoring it automatically.
      </p>
    </div>

    <p>
      No further action is required unless the service becomes unavailable again.
    </p>

  `;

  return {

    subject: `✅ ${endpointName} recovered`,

    html: baseLayout({

      title: 'Endpoint Recovered',

      preheader: `${endpointName} is back online.`,

      bodyHtml,

    }),

    text:
`${endpointName} has recovered

Status: UP
Recovered At: ${recoveredAt}

PulseOps has resumed monitoring this endpoint.`

  };

}

module.exports = alertRecoveryEmail;