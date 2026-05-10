import nodemailer from 'nodemailer';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

async function createTransporter() {
  const { token } = await oauth2Client.getAccessToken();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken: token,
    },
  });
}

export async function sendTicketEmail({ to, buyerName, tickets, saleId, pdfAttachments }) {
  const ticketCount = tickets.length;
  const plural = ticketCount > 1 ? 'entradas' : 'entrada';

  const qrImagesHtml = tickets
    .map(
      (t) => `
      <div style="display:inline-block;margin:8px;text-align:center;border:1px solid #eee;border-radius:8px;padding:12px;">
        <img src="${t.qrDataUrl}" width="160" height="160" alt="QR Entrada ${t.ticketNumber}" style="display:block;"/>
        <p style="margin:6px 0 0;font-size:11px;color:#888;">Entrada ${t.ticketNumber} de ${ticketCount}</p>
      </div>
    `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
  <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <h1 style="color:#111;font-size:24px;margin:0 0 4px;">¡Tu ${plural} ${ticketCount > 1 ? 'están' : 'está'} lista!</h1>
    <p style="color:#555;font-size:15px;margin:0 0 24px;">Hola <strong>${buyerName}</strong>, confirmamos tu compra de <strong>${ticketCount} ${plural}</strong>.</p>

    <div style="background:#f5f5f5;border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
      ${qrImagesHtml}
    </div>

    <div style="background:#fffbea;border:1px solid #f0d060;border-radius:8px;padding:14px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:#7a6000;">
        <strong>Instrucciones:</strong> Presentá cada código QR en la entrada del evento.
        Cada QR es de un solo uso y es personal e intransferible.
        También encontrás los PDFs adjuntos como respaldo.
      </p>
    </div>

    <p style="color:#aaa;font-size:11px;text-align:center;margin:0;">
      ID de compra: ${saleId.slice(0, 8).toUpperCase()}
    </p>
  </div>
</body>
</html>`;

  const transporter = await createTransporter();
  await transporter.sendMail({
    from: `"Sistema de Entradas" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Tus ${plural} (${ticketCount}) — ${buyerName}`,
    html,
    attachments: pdfAttachments.map((pdf, i) => ({
      filename: `entrada-${i + 1}.pdf`,
      content: pdf,
    })),
  });
}
