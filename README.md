# Sistema de Entradas QR

Sistema de venta y validación de entradas con códigos QR únicos y de un solo uso.

## Estructura

```
ticket-system/
├── backend/     → Node.js + Express + PostgreSQL
└── frontend/    → React + Vite (PWA mobile-first)
```

---

## ⚡ Setup local (desarrollo)

### 1. Base de datos — Supabase (gratis)

1. Crear cuenta en [supabase.com](https://supabase.com)
2. Nuevo proyecto → esperar que inicialize
3. Ir a **Settings → Database → Connection string → URI** y copiar la URL
4. En el SQL Editor de Supabase, ejecutar el script de migración (o usar `npm run db:migrate`)

### 2. Email — Resend (gratis)

1. Crear cuenta en [resend.com](https://resend.com)
2. Crear API Key
3. Agregar y verificar tu dominio (o usar el dominio de prueba de Resend)

### 3. Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales
npm install
npm run db:migrate   # Crea las tablas en Supabase
npm run dev          # Corre en http://localhost:3001
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# En desarrollo no hace falta editar .env (el proxy de Vite apunta al backend local)
npm install
npm run dev          # Corre en http://localhost:5173
```

---

## 🚀 Deploy en producción

### Backend → Railway

1. Crear cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo (solo la carpeta `backend/`)
3. Agregar las variables de entorno del `.env.example`
4. Railway provee la URL del servidor — copiarla para el frontend

### Frontend → Vercel / Netlify

1. En `frontend/.env`, setear `VITE_API_URL=https://tu-backend.railway.app`
2. Deploy en [vercel.com](https://vercel.com) o [netlify.com](https://netlify.com)
3. La URL del frontend es la que vas a compartir con vendedores y scanners

---

## 🔐 Roles y acceso

El sistema tiene una **sola contraseña** configurada en `APP_PASSWORD`. Al ingresar, el usuario elige su rol:

| Rol | Puede hacer |
|-----|------------|
| **Vendedor** | Registrar ventas, generar y enviar entradas |
| **Scanner** | Escanear QR con la cámara del celular |
| **Admin** | Ver estadísticas y listado de ventas |

---

## 🔒 Seguridad del QR

Cada entrada tiene un UUID v4 único firmado con **HMAC-SHA256** usando la clave `QR_SECRET`. Al escanear:

1. Se verifica la firma criptográfica (evita QRs falsificados)
2. Se busca el token en la BD con `SELECT FOR UPDATE` (transacción atómica)
3. Si está `valid` → se marca `used` y se aprueba
4. Si está `used` → se rechaza aunque dos scanners lleguen al mismo tiempo

---

## 📱 Uso como PWA

En el celular, abrir la URL en Chrome/Safari y seleccionar **"Agregar a pantalla de inicio"**. Se instala como una app nativa sin pasar por el store.
