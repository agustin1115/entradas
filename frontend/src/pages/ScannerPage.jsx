import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api } from '../lib/api.js';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ScannerPage() {
  const { auth, logout } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { valid, ticket?, reason? }
  const [error, setError] = useState('');
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);

  const startScanner = async () => {
    setResult(null);
    setError('');
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
          // Pausar scanner mientras procesamos
          await qrScanner.stop().catch(() => {});
          setScanning(false);
          handleScan(decodedText);
        },
        () => {} // silence errors
      )
      .catch((err) => {
        setScanning(false);
        setError('No se pudo acceder a la cámara. Verificá los permisos.');
      });

    return () => {
      qrScanner.stop().catch(() => {});
    };
  }, [scanning]);

  const handleScan = async (qrContent) => {
    try {
      const data = await api.scanTicket(qrContent, auth.token);
      setResult(data);
    } catch (err) {
      setResult({ valid: false, reason: err.message });
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <h1 style={s.headerTitle}>📷 Scanner</h1>
        <button onClick={logout} style={s.logoutBtn}>Salir</button>
      </div>

      <div style={s.content}>
        {!scanning && !result && (
          <div style={s.idle}>
            <div style={s.idleIcon}>🎟️</div>
            <p style={s.idleText}>Listo para escanear</p>
            <button onClick={startScanner} style={s.scanBtn}>
              Iniciar cámara
            </button>
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

        {result && (
          <ResultCard
            result={result}
            onNext={() => { setResult(null); startScanner(); }}
          />
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

function ResultCard({ result, onNext }) {
  const isValid = result.valid;
  return (
    <div style={{ ...s.resultCard, background: isValid ? '#f0fdf4' : '#fef2f2', borderColor: isValid ? '#86efac' : '#fca5a5' }}>
      <div style={s.resultIcon}>{isValid ? '✅' : '❌'}</div>
      <h2 style={{ ...s.resultTitle, color: isValid ? '#15803d' : '#dc2626' }}>
        {isValid ? 'ENTRADA VÁLIDA' : 'ENTRADA INVÁLIDA'}
      </h2>
      {isValid ? (
        <>
          <p style={s.resultName}>{result.ticket.buyerName}</p>
          <p style={s.resultSub}>
            Entrada {result.ticket.ticketNumber} de {result.ticket.totalTickets}
          </p>
        </>
      ) : (
        <p style={s.resultReason}>{result.reason}</p>
      )}
      <button onClick={onNext} style={{ ...s.scanBtn, marginTop: 20, background: isValid ? '#16a34a' : '#dc2626' }}>
        Escanear siguiente
      </button>
    </div>
  );
}

const s = {
  wrap: { minHeight: '100vh', background: '#0f0f1a', display: 'flex', flexDirection: 'column' },
  header: { background: '#1a0533', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: '#fff' },
  logoutBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  content: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  idle: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  idleIcon: { fontSize: 64 },
  idleText: { color: '#9ca3af', fontSize: 16 },
  scanBtn: { padding: '14px 32px', background: '#6d28d9', color: '#fff', border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 600, cursor: 'pointer', minWidth: 200 },
  scannerWrap: { width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 },
  qrReader: { width: '100%', borderRadius: 16, overflow: 'hidden' },
  scanHint: { color: '#9ca3af', fontSize: 14, textAlign: 'center' },
  cancelBtn: { padding: '10px 24px', background: 'transparent', color: '#9ca3af', border: '1px solid #374151', borderRadius: 10, cursor: 'pointer', fontSize: 14 },
  resultCard: { width: '100%', maxWidth: 360, borderRadius: 16, padding: 28, border: '2px solid', textAlign: 'center' },
  resultIcon: { fontSize: 56, marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: 800, margin: '0 0 12px', letterSpacing: 0.5 },
  resultName: { fontSize: 20, fontWeight: 700, color: '#111', margin: '0 0 4px' },
  resultSub: { fontSize: 14, color: '#6b7280', margin: 0 },
  resultReason: { fontSize: 16, color: '#dc2626', margin: 0, fontWeight: 500 },
  errorCard: { textAlign: 'center' },
  errorMsg: { color: '#f87171', fontSize: 15, marginBottom: 16 },
};
