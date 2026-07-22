const env = require('../../config/env');

function baseLayout({
  title,
  bodyHtml,
  preheader = '',
}) {

  return `
<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>${title}</title>

</head>


<body
  style="
    margin:0;
    padding:32px;
    background:#0f172a;
    font-family:Arial,Helvetica,sans-serif;
  "
>

<span
  style="
    display:none;
    max-height:0;
    overflow:hidden;
  "
>
${preheader}
</span>


<table
  width="100%"
  cellpadding="0"
  cellspacing="0"
>

<tr>

<td align="center">


<table
  width="620"
  cellpadding="0"
  cellspacing="0"
  style="
    background:#ffffff;
    border-radius:16px;
    overflow:hidden;
    box-shadow:0 10px 30px rgba(0,0,0,.18);
  "
>


<tr>

<td
  style="
    background:#2563eb;
    padding:28px 40px;
  "
>

<div
  style="
    color:white;
    font-size:28px;
    font-weight:700;
  "
>
PulseOps
</div>

<div
  style="
    color:#dbeafe;
    margin-top:6px;
    font-size:14px;
  "
>
API Monitoring & Incident Alerts
</div>

</td>

</tr>



<tr>

<td
  style="
    padding:40px;
    color:#1f2937;
    font-size:15px;
    line-height:1.8;
  "
>

${bodyHtml}

</td>

</tr>



<tr>

<td
  style="
    padding:24px 40px;
    background:#f8fafc;
    border-top:1px solid #e5e7eb;
    color:#6b7280;
    font-size:13px;
  "
>

This is an automated notification from
<strong>PulseOps</strong>.

<br><br>

If you weren't expecting this email,
you can safely ignore it.

</td>

</tr>

</table>

</td>

</tr>

</table>

</body>

</html>

`;

}

module.exports = baseLayout;