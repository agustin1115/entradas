import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import salesRoutes from './routes/sales.js';
import ticketRoutes from './routes/tickets.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
}));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/tickets', ticketRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
