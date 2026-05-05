import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken, generateQRDataURL, generateQRBuffer } from '../services/qrService.js';
import { generateTicketPDF } from '../services/pdfService.js';
import { sendTicketEmail } from '../services/emailService.js';

const router = Router();

// POST /api/sales — crear venta y generar tickets
router.post('/', requireAuth, async (req, res) => {
  if (!['seller', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sin permiso' });
  }

  const { buyerName, buyerEmail, sellerName, quantity } = req.body;

  if (!buyerName?.trim() || !buyerEmail?.trim() || !sellerName?.trim()) {
    return res.status(400).json({ error: 'Faltan datos del comprador o vendedor' });
  }
  if (!quantity || quantity < 1 || quantity > 20) {
    return res.status(400).json({ error: 'Cantidad inválida (1-20)' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(buyerEmail)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Crear la venta
    const saleResult = await client.query(
      `INSERT INTO sales (buyer_name, buyer_email, seller_name, quantity)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [buyerName.trim(), buyerEmail.trim().toLowerCase(), sellerName.trim(), quantity]
    );
    const sale = saleResult.rows[0];

    // Generar tickets
    const ticketData = [];
    for (let i = 1; i <= quantity; i++) {
      const token = uuidv4();
      const signature = signToken(token);
      const result = await client.query(
        `INSERT INTO tickets (sale_id, ticket_number, qr_token, qr_signature)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [sale.id, i, token, signature]
      );
      ticketData.push(result.rows[0]);
    }

    await client.query('COMMIT');

    // Generar QR images y PDFs (fuera de la transacción)
    const ticketsWithQR = await Promise.all(
      ticketData.map(async (t) => {
        const qrDataUrl = await generateQRDataURL(t.qr_token, t.qr_signature);
        const qrBuffer = await generateQRBuffer(t.qr_token, t.qr_signature);
        const pdf = await generateTicketPDF(
          { ...t, ticket_number: t.ticket_number },
          sale,
          qrBuffer
        );
        return { ...t, qrDataUrl, qrBuffer, pdf, ticketNumber: t.ticket_number };
      })
    );

    // Enviar email
    try {
      await sendTicketEmail({
        to: sale.buyer_email,
        buyerName: sale.buyer_name,
        tickets: ticketsWithQR,
        saleId: sale.id,
        pdfAttachments: ticketsWithQR.map((t) => t.pdf),
      });
    } catch (emailErr) {
      // El mail falló pero la venta ya está confirmada
      console.error('Email error:', emailErr.message);
      return res.status(201).json({
        sale,
        tickets: ticketData,
        warning: 'Venta creada pero el email falló. Reenvialo manualmente.',
      });
    }

    res.status(201).json({ sale, tickets: ticketData });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Sale error:', err);
    res.status(500).json({ error: 'Error al procesar la venta' });
  } finally {
    client.release();
  }
});

// GET /api/sales — listar ventas (admin)
router.get('/', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  const { rows } = await pool.query(
    `SELECT s.*, 
      COUNT(t.id) as total_tickets,
      COUNT(t.id) FILTER (WHERE t.status = 'used') as used_tickets
     FROM sales s
     LEFT JOIN tickets t ON t.sale_id = s.id
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT 200`
  );
  res.json(rows);
});

export default router;
