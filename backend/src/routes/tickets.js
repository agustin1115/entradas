import { Router } from 'express';
import pool from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { verifyToken } from '../services/qrService.js';

const router = Router();

// POST /api/tickets/scan — escanear y validar QR (transacción atómica)
router.post('/scan', requireAuth, async (req, res) => {
  if (!['scanner', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Sin permiso' });
  }

  const { qrContent } = req.body;
  if (!qrContent) {
    return res.status(400).json({ error: 'QR vacío' });
  }

  // El QR contiene "token:firma"
  const parts = qrContent.split(':');
  if (parts.length !== 2) {
    return res.status(400).json({ valid: false, reason: 'QR con formato inválido' });
  }
  const [token, signature] = parts;

  // Verificar firma HMAC
  let signatureValid = false;
  try {
    signatureValid = verifyToken(token, signature);
  } catch {
    return res.json({ valid: false, reason: 'Firma inválida' });
  }

  if (!signatureValid) {
    return res.json({ valid: false, reason: 'QR falsificado o corrupto' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // SELECT FOR UPDATE — bloquea la fila para evitar doble uso simultáneo
    const { rows } = await client.query(
      `SELECT t.*, s.buyer_name, s.buyer_email, s.quantity, t.ticket_number
       FROM tickets t
       JOIN sales s ON s.id = t.sale_id
       WHERE t.qr_token = $1
       FOR UPDATE`,
      [token]
    );

    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({ valid: false, reason: 'Entrada no encontrada' });
    }

    const ticket = rows[0];

    if (ticket.status === 'used') {
      await client.query('ROLLBACK');
      const usedAt = new Date(ticket.used_at).toLocaleString('es-AR');
      return res.json({
        valid: false,
        reason: `Ya usada el ${usedAt}`,
        ticket: { buyerName: ticket.buyer_name, ticketNumber: ticket.ticket_number },
      });
    }

    if (ticket.status === 'cancelled') {
      await client.query('ROLLBACK');
      return res.json({ valid: false, reason: 'Entrada cancelada' });
    }

    // Marcar como usada
    await client.query(
      `UPDATE tickets SET status = 'used', used_at = NOW(), used_by = $1 WHERE id = $2`,
      [req.user.role, ticket.id]
    );

    await client.query('COMMIT');

    res.json({
      valid: true,
      ticket: {
        buyerName: ticket.buyer_name,
        buyerEmail: ticket.buyer_email,
        ticketNumber: ticket.ticket_number,
        totalTickets: ticket.quantity,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Error al validar entrada' });
  } finally {
    client.release();
  }
});

// GET /api/tickets/stats — estadísticas generales
router.get('/stats', requireAuth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Sin permiso' });
  }
  const { rows } = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'valid') as valid,
      COUNT(*) FILTER (WHERE status = 'used') as used,
      COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
    FROM tickets
  `);
  res.json(rows[0]);
});

export default router;
