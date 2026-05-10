import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ScannerPage() {
  const { auth, logout } = useAuth();
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState(null); // { valid, ticket?, reason? }
  const [error, setError] = useState('');
  const html5QrRef = useRef(null);
  const processingRef = useRef(false);

  const startCamera = async () => {
    setError('');
    setResult(null);
    processingRef.current = false;

    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
      html5QrRef.current = null;
    }

    const qr = new Html5Qrcode('qr-reader');
    html5QrRef.current = qr;

    try {
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (processingRef.current) return;
          processingRef.current = true;

          try {
            const data = await api.scanTicket(decodedText, auth.token);
            setResult(data);
          } catch (err) {
            setResult({ valid: false, reason: err.message });
          }
        },
        () => {}
      );
      setStarted(true);
    } catch (_) {
      setError('No se pudo acceder a la cámara. Verificá los permisos.');
    }
  };

  // Auto-reset after 2 seconds — camera keeps running throughout
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => {
      setResult(null);
      processingRef.current = false;
    }, 2000);
    return () => clearTimeout(timer);
  }, [result]);

  useEffect(() => {
    return () => {
      html5QrRef.current?.stop().catch(() => {});
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#1a0533', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Scanner</h1>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
          Salir
        </button>
      </div>

      {/* Contenedor principal — qr-reader SIEMPRE en el DOM para que html5-qrcode pueda inicializar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, position: 'relative' }}>

        {/* Pantalla inicial encima del div de cámara */}
        {!started && !error && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: '#0f0f1a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 64 }}>🎟️</div>
            <p style={{ color: '#9ca3af', fontSize: 16, margin: 0 }}>Listo para escanear</p>
            <button onClick={startCamera} style={btnStyle('#6d28d9')}>Iniciar cámara</button>
          </div>
        )}

        {/* Error de cámara */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: '#0f0f1a',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <p style={{ color: '#f87171', fontSize: 15 }}>{error}</p>
            <button onClick={startCamera} style={btnStyle('#6d28d9')}>Reintentar</button>
          </div>
        )}

        {/* div de cámara — siempre en el DOM */}
        <div id="qr-reader" style={{ width: '100%', maxWidth: 340, borderRadius: 16, overflow: 'hidden' }} />
        {started && (
          <p style={{ color: '#9ca3af', fontSize: 14, marginTop: 12 }}>Apuntá la cámara al código QR</p>
        )}
      </div>

      {/* Overlay de resultado — cubre toda la pantalla, la cámara sigue corriendo debajo */}
      {result && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: result.valid ? '#052e16ee' : '#450a0aee',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 10,
        }}>
          <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1, color: result.valid ? '#4ade80' : '#f87171' }}>
            {result.valid ? '✓' : '✗'}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, color: result.valid ? '#4ade80' : '#f87171' }}>
            {result.valid ? 'VÁLIDA' : 'INVÁLIDA'}
          </h2>
          {result.valid ? (
            <>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>{result.ticket?.buyerName}</p>
              <p style={{ fontSize: 14, color: '#86efac', margin: 0 }}>
                Entrada {result.ticket?.ticketNumber} de {result.ticket?.totalTickets}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 16, color: '#fca5a5', margin: 0, textAlign: 'center', padding: '0 24px' }}>{result.reason}</p>
          )}
        </div>
      )}
    </div>
  );
}

const btnStyle = (bg) => ({
  padding: '14px 32px', background: bg, color: '#fff',
  border: 'none', borderRadius: 12, fontSize: 17,
  fontWeight: 600, cursor: 'pointer', minWidth: 200,
});
