import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ScannerPage() {
  const { auth, logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const startScanner = async () => {
    setResult(null);
    setError('');
    setProcessing(false);
    setScanning(true);
  };

  useEffect(() => {
    if (!scanning) return;

    const qrScanner = new Html5Qrcode('qr-reader');
    html5QrRef.current = qrScanner;

    qrScanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await qrScanner.stop().catch(() => {});
          setScanning(false);
          setProcessing(true);
          try {
            const data = await api.scanTicket(decodedText, auth.token);
            setResult(data);
          } catch (err) {
            setResult({ valid: false, reason: err.message });
          } finally {
            setProcessing(false);
          }
        },
        () => {}
      )
      .catch(() => {
        setScanning(false);
        setError('No se pudo acceder a la cámara. Verificá los permisos.');
      });

    return () => {
      qrScanner.stop().catch(() => {});
    };
  }, [scanning]);

  // Auto-volver a la cámara después de 2 segundos
  useEffect(() => {
    if (!result) return;
    const timer = setTimeout(() => startScanner(), 2000);
    return () => clearTimeout(timer);
  }, [result]);

  // Pantalla de resultado: ocupa todo
  if (result) return <ResultScreen result={result} />;

  // Pantalla de procesando: ocupa todo
  if (processing) return (
    <div style={s.fullScreen('#0f0f1a')}>
      <div style={s.spinner} />
      <p style={{ color: '#9ca3af', fontSize: 18, marginTop: 20 }}>Validando...</p>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.headerTitle}>Scanner</h1>
        <button onClick={logout} style={s.logoutBtn}>Salir</button>
      </div>

      <div style={s.content}>

        {!scanning && !error && (
          <div style={s.idle}>
            <div style={s.idleIcon}>🎟️</div>
            <p style={s.idleText}>Listo para escanear</p>
            <button onClick={startScanner} style={s.scanBtn}>Iniciar cámara</button>
          </div>
        )}

        {scanning && (
          <div style={s.scannerWrap}>
            <div id="qr-reader" style={s.qrReader} ref={scannerRef} />
            <p style={s.scanHint}>Apuntá la cámara al código QR</p>
            <button onClick={async () => {
              await html5QrRef.current?.stop().catch(() => {});
              setScanning(false);
            }} style={s.cancelBtn}>
              Cancelar
            </button>
          </div>
        )}

        {error && (
          <div style={s.errorCard}>
            <p style={s.errorMsg}>{error}</p>
            <button onClick={() => { setError(''); startScanner(); }} style={s.scanBtn}>
              Reintentar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

function ResultScreen({ result }) {
  const isValid = result.valid;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => Math.max(0, p - 5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={s.fullScreen(isValid ? '#052e16' : '#450a0a')}>
      <div style={{ fontSize: 130, fontWeight: 900, lineHeight: 1, color: isValid ? '#4ade80' : '#f87171' }}>
        {isValid ? '✓' : '✗'}
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0', color: isValid ? '#4ade80' : '#f87171', letterSpacing: 1 }}>
        {isValid ? 'VÁLIDA' : 'INVÁLIDA'}
      </h2>
      {isValid ? (
        <>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '4px 0' }}>{result.ticket?.buyerName}</p>
          <p style={{ fontSize: 15, color: '#86efac', margin: 0 }}>
            Entrada {result.ticket?.ticketNumber} de {result.ticket?.totalTickets}
          </p>
        </>
      ) : (
        <p style={{ fontSize: 17, color: '#fca5a5', margin: 0, textAlign: 'center', padding: '0 32px' }}>{result.reason}</p>
      )}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: isValid ? '#4ade80' : '#f87171', transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}

const s = {
  fullScreen: (bg) => ({ width: '100vw', height: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', gap: 8 }),
  wrap: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' },
  header: { background: '#1a0533', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: '#fff' },
  logoutBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  content: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 },
  idle: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  idleIcon: { fontSize: 64 },
  idleText: { color: '#9ca3af', fontSize: 16 },
  scanBtn: { padding: '14px 32px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 600, cursor: 'pointer', minWidth: 200 },
  scannerWrap: { width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  qrReader: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  scanHint: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  cancelBtn: { padding: '10px 24px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  processingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 },
  processingText: { color: '#9ca3af', fontSize: 16 },
  spinner: { width: 48, height: 48, border: '4px solid #374151', borderTop: '4px solid #6d28d9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  errorCard: { textAlign: 'center' },
  errorMsg: { color: '#f87171', fontSize: 15, marginBottom: 16 },
};
