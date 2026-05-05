import crypto from 'crypto';
import QRCode from 'qrcode';

export function signToken(token) {
  return crypto
    .createHmac('sha256', process.env.QR_SECRET)
    .update(token)
    .digest('hex');
}

export function verifyToken(token, signature) {
  const expected = signToken(token);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function generateQRDataURL(token, signature) {
  // El contenido del QR es token:firma para verificación offline también
  const content = `${token}:${signature}`;
  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 300,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export async function generateQRBuffer(token, signature) {
  const content = `${token}:${signature}`;
  return QRCode.toBuffer(content, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
  });
}
