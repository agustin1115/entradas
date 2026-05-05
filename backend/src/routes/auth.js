import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Login con contraseña compartida
// El rol se determina según qué contraseña se ingresa
router.post('/login', (req, res) => {
  const { password, role } = req.body;

  if (!password || !role) {
    return res.status(400).json({ error: 'Faltan campos' });
  }

  const validRoles = ['seller', 'scanner', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  if (password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  const token = jwt.sign(
    { role, loginAt: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({ token, role });
});

export default router;
